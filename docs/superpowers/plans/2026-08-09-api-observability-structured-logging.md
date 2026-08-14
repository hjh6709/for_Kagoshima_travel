# API 관측성 — 구조화 로깅 + request ID 전파 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 장애 알림을 받은 뒤 **그 요청 하나를 끝까지 추적할 수 있게** 만든다.

**Architecture:** `log/slog`(Go 1.21+ 표준 라이브러리)로 JSON 구조화 로그를 내보내고, 모든 요청에 request ID를 붙여 컨텍스트로 전파한다. 요청 로그 · 패닉 로그 · 핸들러 내부 에러 로그 · Discord 알림 · **클라이언트에게 돌려주는 5xx 응답**이 전부 같은 request ID를 달고 나온다. 신규 의존성은 추가하지 않는다.

**Tech Stack:** Go 1.26 표준 라이브러리(`log/slog`, `context`, `net/http`), 기존 미들웨어 체인.

## Global Constraints

- **신규 Go 의존성을 추가하지 않는다.** `log/slog`는 표준 라이브러리다.
- DB 스키마 · 마이그레이션 · API 응답 스키마(에러 필드 추가 제외)는 바꾸지 않는다.
- **로그에 비밀을 남기지 않는다.** 비밀번호 · 토큰 · 인증코드 · 예약 메모는 절대 로그로 나가면 안 된다. 요청 본문은 통째로 찍지 않는다.
- 기존 동작(레이트 리밋, CORS, Discord 알림, 인증)은 **그대로 유지**한다. 이번 작업은 관측 계층만 더한다.
- `apps/api`를 건드리므로 매 태스크 끝에 다음을 통과시킨다:
  - `cd apps/api && go test ./... && go vet ./... && test -z "$(gofmt -l .)"`

## 왜 이 순서인가

관측성의 가치는 **연결**에서 나온다. 로그만 구조화하고 request ID가 없으면 "에러는 봤는데 어느 요청인지 모른다"가 되고, request ID만 있고 응답에 안 실리면 "사용자가 신고해도 찾을 수 없다"가 된다. 그래서 ID 생성 → 전파 → 각 소비처 연결 순으로 쌓는다.

## 범위 밖 (의도적)

- **메트릭(`/metrics`) · 분산 추적.** 수집기(Prometheus/Grafana 또는 SaaS)가 없으면 아무도 읽지 않는 엔드포인트가 된다. 인프라 결정과 함께 별도로 다룬다.
- **프론트엔드 에러 추적.** 별도 작업.

## 파일 구조

**신규**

| 파일 | 책임 |
| --- | --- |
| `apps/api/internal/observability/logger.go` | slog 로거 생성(환경별 핸들러·레벨). |
| `apps/api/internal/observability/logger_test.go` | 레벨·포맷 검증. |
| `apps/api/internal/observability/requestid.go` | request ID 생성과 컨텍스트 주입/조회. |
| `apps/api/internal/observability/requestid_test.go` | 생성·왕복·부재 시 동작 검증. |
| `apps/api/internal/middleware/request_context.go` | request ID 미들웨어. |
| `apps/api/internal/middleware/request_context_test.go` | 헤더 존중·생성·응답 반영 검증. |
| `apps/api/internal/middleware/request_log.go` | 요청 로깅 미들웨어. |
| `apps/api/internal/middleware/request_log_test.go` | 필드·상태·소요시간 검증. |

**수정**

| 파일 | 변경 |
| --- | --- |
| `apps/api/internal/middleware/discord_alert.go` | 패닉을 구조화 로그로 남기고 알림에 request ID 포함. |
| `apps/api/internal/server/server.go` | 미들웨어 체인 조립, 기동 로그를 slog로. |
| `apps/api/internal/handler/auth_handler.go` | `log.Printf` 7곳을 컨텍스트 로거로. |
| `apps/api/internal/httpjson/*.go` | 5xx 응답에 request ID 동봉. |
| `apps/api/cmd/api/main.go` | 로거 초기화, 기동·종료 로그. |
| `apps/api/internal/handler/openapi.json` | 에러 응답 스키마에 `requestId` 추가. |

---

### Task 1: 로거 생성

**Files:**
- Create: `apps/api/internal/observability/logger.go`
- Create: `apps/api/internal/observability/logger_test.go`

**Interfaces:**
- Consumes: 없음.
- Produces:
  ```go
  func NewLogger(w io.Writer) *slog.Logger
  ```
  `LOG_LEVEL`(`debug`/`info`/`warn`/`error`, 기본 `info`)과 `APP_ENV`를 읽는다. 프로덕션이면 JSON, 그 외에는 사람이 읽기 쉬운 text 핸들러.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/api/internal/observability/logger_test.go`:

```go
package observability

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"
)

func TestNewLoggerWritesJSONInProduction(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("LOG_LEVEL", "info")

	var buf bytes.Buffer
	NewLogger(&buf).Info("hello", "key", "value")

	var entry map[string]any
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("production log must be JSON, got %q (err %v)", buf.String(), err)
	}
	if entry["msg"] != "hello" {
		t.Errorf("msg = %v, want hello", entry["msg"])
	}
	if entry["key"] != "value" {
		t.Errorf("key = %v, want value", entry["key"])
	}
}

func TestNewLoggerUsesTextOutsideProduction(t *testing.T) {
	t.Setenv("APP_ENV", "")

	var buf bytes.Buffer
	NewLogger(&buf).Info("hello")

	if json.Valid(bytes.TrimSpace(buf.Bytes())) {
		t.Errorf("non-production log should be text, got JSON: %q", buf.String())
	}
	if !strings.Contains(buf.String(), "hello") {
		t.Errorf("log must contain message, got %q", buf.String())
	}
}

func TestNewLoggerRespectsLogLevel(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("LOG_LEVEL", "warn")

	var buf bytes.Buffer
	logger := NewLogger(&buf)
	logger.Info("dropped")
	logger.Warn("kept")

	if strings.Contains(buf.String(), "dropped") {
		t.Errorf("info must be filtered at warn level, got %q", buf.String())
	}
	if !strings.Contains(buf.String(), "kept") {
		t.Errorf("warn must be emitted, got %q", buf.String())
	}
}

func TestNewLoggerDefaultsToInfoOnUnknownLevel(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("LOG_LEVEL", "chatty")

	var buf bytes.Buffer
	logger := NewLogger(&buf)
	logger.Debug("dropped")
	logger.Info("kept")

	if strings.Contains(buf.String(), "dropped") {
		t.Errorf("debug must be filtered at default level, got %q", buf.String())
	}
	if !strings.Contains(buf.String(), "kept") {
		t.Errorf("info must be emitted, got %q", buf.String())
	}
}
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `cd apps/api && go test ./internal/observability/`
Expected: FAIL — 패키지가 없어 빌드되지 않는다

- [ ] **Step 3: 로거를 만든다**

`apps/api/internal/observability/logger.go`:

```go
// Package observability는 로그와 요청 추적에 필요한 공용 도구를 모은다.
package observability

import (
	"io"
	"log/slog"
	"os"
	"strings"
)

// NewLogger는 환경에 맞는 구조화 로거를 만든다.
//
// 프로덕션은 JSON으로 남겨 journalctl/로그 수집기가 파싱할 수 있게 하고,
// 로컬에서는 사람이 읽기 쉬운 text로 남긴다.
func NewLogger(w io.Writer) *slog.Logger {
	options := &slog.HandlerOptions{Level: parseLevel(os.Getenv("LOG_LEVEL"))}
	if isProduction() {
		return slog.New(slog.NewJSONHandler(w, options))
	}
	return slog.New(slog.NewTextHandler(w, options))
}

func parseLevel(raw string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func isProduction() bool {
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = os.Getenv("ENV")
	}
	env = strings.ToLower(env)
	return env == "production" || env == "prod"
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `cd apps/api && go test ./internal/observability/`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋한다**

```bash
git add apps/api/internal/observability/logger.go apps/api/internal/observability/logger_test.go
git commit -m "feat(api): 환경별 구조화 로거 추가"
```

---

### Task 2: request ID 생성과 컨텍스트 전파

**Files:**
- Create: `apps/api/internal/observability/requestid.go`
- Create: `apps/api/internal/observability/requestid_test.go`

**Interfaces:**
- Consumes: Task 1의 패키지.
- Produces:
  ```go
  const RequestIDHeader = "X-Request-ID"

  func NewRequestID() string
  func WithRequestID(ctx context.Context, id string) context.Context
  func RequestIDFromContext(ctx context.Context) string          // 없으면 ""
  func LoggerFromContext(ctx context.Context) *slog.Logger        // 없으면 slog.Default()
  func WithLogger(ctx context.Context, logger *slog.Logger) context.Context
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/api/internal/observability/requestid_test.go`:

```go
package observability

import (
	"context"
	"log/slog"
	"testing"
)

func TestNewRequestIDIsUniqueAndNonEmpty(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 100; i++ {
		id := NewRequestID()
		if id == "" {
			t.Fatal("NewRequestID() returned empty string")
		}
		if seen[id] {
			t.Fatalf("NewRequestID() returned duplicate %q", id)
		}
		seen[id] = true
	}
}

func TestRequestIDRoundTripsThroughContext(t *testing.T) {
	ctx := WithRequestID(context.Background(), "req-123")

	if got := RequestIDFromContext(ctx); got != "req-123" {
		t.Errorf("RequestIDFromContext() = %q, want req-123", got)
	}
}

func TestRequestIDFromContextIsEmptyWhenAbsent(t *testing.T) {
	if got := RequestIDFromContext(context.Background()); got != "" {
		t.Errorf("RequestIDFromContext() = %q, want empty", got)
	}
}

func TestLoggerFromContextFallsBackToDefault(t *testing.T) {
	if LoggerFromContext(context.Background()) == nil {
		t.Fatal("LoggerFromContext() must never return nil")
	}
}

func TestLoggerRoundTripsThroughContext(t *testing.T) {
	logger := slog.Default().With("scope", "test")
	ctx := WithLogger(context.Background(), logger)

	if LoggerFromContext(ctx) != logger {
		t.Error("LoggerFromContext() did not return the stored logger")
	}
}
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `cd apps/api && go test ./internal/observability/ -run RequestID`
Expected: FAIL — `NewRequestID` 등이 정의되지 않아 빌드되지 않는다

- [ ] **Step 3: 구현한다**

`apps/api/internal/observability/requestid.go`:

```go
package observability

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log/slog"
)

// RequestIDHeader는 요청/응답 양쪽에서 쓰는 추적 헤더 이름이다.
const RequestIDHeader = "X-Request-ID"

type contextKey int

const (
	requestIDKey contextKey = iota
	loggerKey
)

// NewRequestID는 추적용 임의 ID를 만든다.
// 보안 토큰이 아니라 로그 상관관계용이므로 16바이트면 충분하다.
func NewRequestID() string {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		// 난수를 못 얻어도 요청 처리를 막지 않는다. 추적만 포기한다.
		return "unknown"
	}
	return hex.EncodeToString(buf)
}

func WithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, requestIDKey, id)
}

// RequestIDFromContext는 ID가 없으면 빈 문자열을 돌려준다.
func RequestIDFromContext(ctx context.Context) string {
	id, _ := ctx.Value(requestIDKey).(string)
	return id
}

func WithLogger(ctx context.Context, logger *slog.Logger) context.Context {
	return context.WithValue(ctx, loggerKey, logger)
}

// LoggerFromContext는 절대 nil을 돌려주지 않는다.
// 미들웨어를 거치지 않은 코드(테스트 등)도 그냥 로그를 쓸 수 있어야 한다.
func LoggerFromContext(ctx context.Context) *slog.Logger {
	if logger, ok := ctx.Value(loggerKey).(*slog.Logger); ok && logger != nil {
		return logger
	}
	return slog.Default()
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `cd apps/api && go test ./internal/observability/`
Expected: PASS (9 tests)

- [ ] **Step 5: 커밋한다**

```bash
git add apps/api/internal/observability/requestid.go apps/api/internal/observability/requestid_test.go
git commit -m "feat(api): request ID 생성과 컨텍스트 전파 추가"
```

---

### Task 3: request ID 미들웨어

**Files:**
- Create: `apps/api/internal/middleware/request_context.go`
- Create: `apps/api/internal/middleware/request_context_test.go`

**Interfaces:**
- Consumes: Task 2의 `observability` 함수들.
- Produces:
  ```go
  func RequestContext(logger *slog.Logger) func(http.Handler) http.Handler
  ```
  들어온 `X-Request-ID`를 존중하되 **길이를 제한하고 안전한 문자만 허용**한다(로그 오염 방지). 없거나 부적합하면 새로 만든다. 응답 헤더에도 같은 값을 싣고, request ID가 박힌 로거를 컨텍스트에 넣는다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/api/internal/middleware/request_context_test.go`:

```go
package middleware

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/observability"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func TestRequestContextGeneratesIDWhenHeaderMissing(t *testing.T) {
	var seen string
	handler := RequestContext(testLogger())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = observability.RequestIDFromContext(r.Context())
	}))

	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/trips", nil))

	if seen == "" {
		t.Fatal("handler context must carry a request ID")
	}
	if got := recorder.Header().Get(observability.RequestIDHeader); got != seen {
		t.Errorf("response header = %q, want %q", got, seen)
	}
}

func TestRequestContextReusesIncomingHeader(t *testing.T) {
	var seen string
	handler := RequestContext(testLogger())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = observability.RequestIDFromContext(r.Context())
	}))

	request := httptest.NewRequest(http.MethodGet, "/api/trips", nil)
	request.Header.Set(observability.RequestIDHeader, "client-supplied-id")
	handler.ServeHTTP(httptest.NewRecorder(), request)

	if seen != "client-supplied-id" {
		t.Errorf("request ID = %q, want client-supplied-id", seen)
	}
}

func TestRequestContextRejectsUnsafeIncomingHeader(t *testing.T) {
	for name, raw := range map[string]string{
		"newline":  "abc\ndef",
		"too long": string(make([]byte, 200)),
		"space":    "has space",
	} {
		t.Run(name, func(t *testing.T) {
			var seen string
			handler := RequestContext(testLogger())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				seen = observability.RequestIDFromContext(r.Context())
			}))

			request := httptest.NewRequest(http.MethodGet, "/api/trips", nil)
			request.Header.Set(observability.RequestIDHeader, raw)
			handler.ServeHTTP(httptest.NewRecorder(), request)

			if seen == raw {
				t.Errorf("unsafe request ID %q must be replaced", raw)
			}
			if seen == "" {
				t.Error("a replacement request ID must still be generated")
			}
		})
	}
}

func TestRequestContextPutsLoggerInContext(t *testing.T) {
	handler := RequestContext(testLogger())(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if observability.LoggerFromContext(r.Context()) == nil {
			t.Error("context logger must be available to handlers")
		}
	}))

	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/api/trips", nil))
}
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `cd apps/api && go test ./internal/middleware/ -run RequestContext`
Expected: FAIL — `RequestContext`가 정의되지 않았다

- [ ] **Step 3: 미들웨어를 만든다**

`apps/api/internal/middleware/request_context.go`:

```go
package middleware

import (
	"log/slog"
	"net/http"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/observability"
)

const maxIncomingRequestIDLength = 64

// RequestContext는 모든 요청에 추적 ID를 붙이고, 그 ID가 박힌 로거를 컨텍스트에 넣는다.
// 체인의 가장 바깥(단, CORS 다음)에 두어야 레이트 리밋 거부까지 추적된다.
func RequestContext(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			requestID := sanitizeRequestID(r.Header.Get(observability.RequestIDHeader))
			if requestID == "" {
				requestID = observability.NewRequestID()
			}

			w.Header().Set(observability.RequestIDHeader, requestID)

			ctx := observability.WithRequestID(r.Context(), requestID)
			ctx = observability.WithLogger(ctx, logger.With("requestId", requestID))
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// sanitizeRequestID는 외부에서 받은 값을 그대로 믿지 않는다.
// 개행이 섞이면 로그가 위조되고, 너무 길면 로그가 오염된다.
func sanitizeRequestID(raw string) string {
	if raw == "" || len(raw) > maxIncomingRequestIDLength {
		return ""
	}
	for _, char := range raw {
		isAllowed := char == '-' || char == '_' ||
			(char >= '0' && char <= '9') ||
			(char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z')
		if !isAllowed {
			return ""
		}
	}
	return raw
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `cd apps/api && go test ./internal/middleware/`
Expected: PASS

- [ ] **Step 5: 커밋한다**

```bash
git add apps/api/internal/middleware/request_context.go apps/api/internal/middleware/request_context_test.go
git commit -m "feat(api): request ID 미들웨어 추가"
```

---

### Task 4: 요청 로깅 미들웨어

**Files:**
- Create: `apps/api/internal/middleware/request_log.go`
- Create: `apps/api/internal/middleware/request_log_test.go`

**Interfaces:**
- Consumes: Task 2·3.
- Produces:
  ```go
  func RequestLog(next http.Handler) http.Handler
  ```
  컨텍스트 로거로 요청 1건당 1줄을 남긴다. 5xx는 `Error`, 4xx는 `Warn`, 그 외는 `Info`.

> **주의:** 기존 `discord_alert.go`에 이미 `responseWriterWrapper`가 있다. 같은 패키지이므로 **새로 정의하지 말고 재사용**한다. 다만 응답 크기도 필요하므로 그 타입에 `bytesWritten` 필드와 `Write` 메서드를 더한다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/api/internal/middleware/request_log_test.go`:

```go
package middleware

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/observability"
)

func decodeLogEntry(t *testing.T, buf *bytes.Buffer) map[string]any {
	t.Helper()
	var entry map[string]any
	if err := json.Unmarshal(bytes.TrimSpace(buf.Bytes()), &entry); err != nil {
		t.Fatalf("log line is not JSON: %q (err %v)", buf.String(), err)
	}
	return entry
}

func serveWithLog(t *testing.T, status int, target string) map[string]any {
	t.Helper()
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil)).With("requestId", "req-1")

	handler := RequestLog(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(status)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))

	request := httptest.NewRequest(http.MethodGet, target, nil)
	request = request.WithContext(observability.WithLogger(request.Context(), logger))
	handler.ServeHTTP(httptest.NewRecorder(), request)

	return decodeLogEntry(t, &buf)
}

func TestRequestLogRecordsRequestShape(t *testing.T) {
	entry := serveWithLog(t, http.StatusOK, "/api/trips?secret=abc")

	if entry["method"] != http.MethodGet {
		t.Errorf("method = %v, want GET", entry["method"])
	}
	if entry["path"] != "/api/trips" {
		t.Errorf("path = %v, want /api/trips (query must be dropped)", entry["path"])
	}
	if entry["status"] != float64(http.StatusOK) {
		t.Errorf("status = %v, want 200", entry["status"])
	}
	if entry["requestId"] != "req-1" {
		t.Errorf("requestId = %v, want req-1", entry["requestId"])
	}
	if _, ok := entry["durationMs"]; !ok {
		t.Error("durationMs is required to spot slow requests")
	}
	if entry["level"] != "INFO" {
		t.Errorf("level = %v, want INFO", entry["level"])
	}
}

func TestRequestLogUsesErrorLevelForServerFailures(t *testing.T) {
	entry := serveWithLog(t, http.StatusInternalServerError, "/api/trips")

	if entry["level"] != "ERROR" {
		t.Errorf("level = %v, want ERROR for 500", entry["level"])
	}
}

func TestRequestLogUsesWarnLevelForClientFailures(t *testing.T) {
	entry := serveWithLog(t, http.StatusNotFound, "/api/trips")

	if entry["level"] != "WARN" {
		t.Errorf("level = %v, want WARN for 404", entry["level"])
	}
}

func TestRequestLogNeverRecordsQueryString(t *testing.T) {
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))

	handler := RequestLog(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	request := httptest.NewRequest(http.MethodGet, "/api/auth/reset?token=super-secret", nil)
	request = request.WithContext(observability.WithLogger(request.Context(), logger))
	handler.ServeHTTP(httptest.NewRecorder(), request)

	if bytes.Contains(buf.Bytes(), []byte("super-secret")) {
		t.Errorf("query string must never reach the log: %q", buf.String())
	}
}
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `cd apps/api && go test ./internal/middleware/ -run RequestLog`
Expected: FAIL — `RequestLog`가 정의되지 않았다

- [ ] **Step 3: `responseWriterWrapper`에 응답 크기를 더한다**

`apps/api/internal/middleware/discord_alert.go`의 타입 선언(13-21행)을 교체한다.

```go
type responseWriterWrapper struct {
	http.ResponseWriter
	statusCode   int
	bytesWritten int
}

func (w *responseWriterWrapper) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *responseWriterWrapper) Write(b []byte) (int, error) {
	n, err := w.ResponseWriter.Write(b)
	w.bytesWritten += n
	return n, err
}
```

- [ ] **Step 4: 미들웨어를 만든다**

`apps/api/internal/middleware/request_log.go`:

```go
package middleware

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/observability"
)

// RequestLog는 요청 1건당 한 줄을 남긴다.
//
// 경로만 남기고 쿼리 문자열은 버린다 — 비밀번호 재설정 토큰처럼 민감한 값이
// 쿼리에 실려 오는 경로가 있어서, 통째로 남기면 로그가 곧 유출 경로가 된다.
func RequestLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		wrapper := &responseWriterWrapper{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(wrapper, r)

		logger := observability.LoggerFromContext(r.Context())
		logger.LogAttrs(r.Context(), levelForStatus(wrapper.statusCode), "http request",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", wrapper.statusCode),
			slog.Int64("durationMs", time.Since(started).Milliseconds()),
			slog.Int("bytes", wrapper.bytesWritten),
			slog.String("ip", getIP(r)),
		)
	})
}

func levelForStatus(status int) slog.Level {
	switch {
	case status >= http.StatusInternalServerError:
		return slog.LevelError
	case status >= http.StatusBadRequest:
		return slog.LevelWarn
	default:
		return slog.LevelInfo
	}
}
```

> `getIP`는 `discord_alert.go`에 이미 있는 같은 패키지 함수다. 새로 만들지 않는다.

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `cd apps/api && go test ./internal/middleware/`
Expected: PASS

- [ ] **Step 6: 커밋한다**

```bash
git add apps/api/internal/middleware/request_log.go apps/api/internal/middleware/request_log_test.go apps/api/internal/middleware/discord_alert.go
git commit -m "feat(api): 요청 로깅 미들웨어 추가"
```

---

### Task 5: 패닉을 구조화 로그로 남기고 알림에 request ID 싣기

지금은 패닉이 나면 Discord로만 간다. 웹훅이 없거나 실패하면 **흔적이 아무 데도 남지 않는다.**

**Files:**
- Modify: `apps/api/internal/middleware/discord_alert.go`
- Modify: `apps/api/internal/middleware/discord_alert_test.go`

**Interfaces:**
- Consumes: Task 2.
- Produces: 없음(동작 보강).

- [ ] **Step 1: 실패하는 테스트를 추가한다**

`discord_alert_test.go` 끝에 덧붙인다.

```go
func TestDiscordAlertLogsPanicEvenWithoutWebhook(t *testing.T) {
	t.Setenv("DISCORD_WEBHOOK_URL", "")

	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil)).With("requestId", "req-panic")

	handler := DiscordAlert(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("boom")
	}))

	request := httptest.NewRequest(http.MethodGet, "/api/trips", nil)
	request = request.WithContext(observability.WithLogger(request.Context(), logger))
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500", recorder.Code)
	}
	if !bytes.Contains(buf.Bytes(), []byte("req-panic")) {
		t.Errorf("panic log must carry the request ID: %q", buf.String())
	}
	if !bytes.Contains(buf.Bytes(), []byte("boom")) {
		t.Errorf("panic log must carry the panic value: %q", buf.String())
	}
}
```

파일 상단 import에 `bytes` · `log/slog` · `observability`가 없으면 추가한다.

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `cd apps/api && go test ./internal/middleware/ -run DiscordAlertLogsPanic`
Expected: FAIL — 로그 버퍼가 비어 있다

- [ ] **Step 3: 패닉 처리에 구조화 로그를 더한다**

`discord_alert.go`의 `defer func() { if err := recover(); ... }` 블록을 교체한다.

```go
		defer func() {
			if err := recover(); err != nil {
				stack := debug.Stack()
				errMsg := fmt.Sprintf("%v", err)
				requestID := observability.RequestIDFromContext(r.Context())

				// 웹훅이 없거나 실패해도 흔적은 반드시 남긴다.
				observability.LoggerFromContext(r.Context()).Error("panic recovered",
					slog.String("panic", errMsg),
					slog.String("method", r.Method),
					slog.String("path", r.URL.Path),
					slog.String("stack", string(stack)),
				)

				sendDiscordAlert(webhookURL, r, errMsg, string(stack), requestID)

				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.WriteHeader(http.StatusInternalServerError)
				_, _ = w.Write([]byte(`{"error":"Internal Server Error"}`))
			}
		}()
```

500 응답 감지부도 request ID를 넘기도록 바꾼다.

```go
		if wrapper.statusCode == http.StatusInternalServerError {
			sendDiscordAlert(webhookURL, r, "Status 500 Internal Server Error", "API returned 500 Status Code",
				observability.RequestIDFromContext(r.Context()))
		}
```

- [ ] **Step 4: 알림에 request ID 필드를 넣는다**

`sendDiscordAlert` 시그니처와 필드를 바꾼다.

```go
func sendDiscordAlert(url string, r *http.Request, errMsg string, stack string, requestID string) {
```

`Fields` 슬라이스 첫 항목으로 추가한다.

```go
		Fields: []discordEmbedField{
			{Name: "Request ID", Value: requestID, Inline: true},
			{Name: "Method", Value: r.Method, Inline: true},
			{Name: "URL", Value: r.URL.Path, Inline: true},
			{Name: "Client IP", Value: getIP(r), Inline: true},
			{Name: "Stack Trace", Value: fmt.Sprintf("```go\n%s\n```", stack), Inline: false},
		},
```

> 이제 Discord 알림의 Request ID로 `journalctl`에서 그 요청의 로그 줄을 바로 찾을 수 있다. 이게 이번 작업의 핵심이다.

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `cd apps/api && go test ./internal/middleware/`
Expected: PASS. 기존 Discord 테스트가 `sendDiscordAlert` 인자 개수 때문에 깨지면 새 인자를 넘기도록 함께 고친다.

- [ ] **Step 6: 커밋한다**

```bash
git add apps/api/internal/middleware/discord_alert.go apps/api/internal/middleware/discord_alert_test.go
git commit -m "feat(api): 패닉을 구조화 로그로 남기고 알림에 request ID 포함"
```

---

### Task 6: 5xx 응답에 request ID 동봉

사용자가 "오류 났어요"라고 신고했을 때 **화면에 있는 ID로 서버 로그를 찾을 수 있어야** 추적이 완성된다.

**Files:**
- Modify: `apps/api/internal/httpjson/` (에러 응답 함수)
- Modify: `apps/api/internal/handler/openapi.json`

**Interfaces:**
- Consumes: Task 2.
- Produces:
  ```go
  func WriteErrorWithContext(ctx context.Context, w http.ResponseWriter, status int, message string)
  ```
  기존 `WriteError`는 그대로 두고(호출처가 많다), 5xx를 내는 곳에서 쓸 컨텍스트 인지 버전을 더한다.

현재 `WriteError`는 이렇게 되어 있다(확인 완료). 이 함수는 **그대로 둔다** — 호출처가 많고 4xx가 대부분이다.

```go
func WriteError(w http.ResponseWriter, status int, message string) {
	Write(w, status, map[string]string{"error": message})
}
```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/api/internal/httpjson/error_context_test.go`:

```go
package httpjson

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/observability"
)

func TestWriteErrorWithContextIncludesRequestID(t *testing.T) {
	recorder := httptest.NewRecorder()
	ctx := observability.WithRequestID(t.Context(), "req-abc")

	WriteErrorWithContext(ctx, recorder, http.StatusInternalServerError, "서버 오류")

	var body map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("response is not JSON: %v", err)
	}
	if body["requestId"] != "req-abc" {
		t.Errorf("requestId = %v, want req-abc", body["requestId"])
	}
	if body["error"] != "서버 오류" {
		t.Errorf("error = %v, want 서버 오류", body["error"])
	}
}

func TestWriteErrorWithContextOmitsRequestIDWhenAbsent(t *testing.T) {
	recorder := httptest.NewRecorder()

	WriteErrorWithContext(t.Context(), recorder, http.StatusBadRequest, "입력 오류")

	var body map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("response is not JSON: %v", err)
	}
	if _, exists := body["requestId"]; exists {
		t.Error("requestId must be omitted when there is nothing to trace")
	}
}
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `cd apps/api && go test ./internal/httpjson/`
Expected: FAIL — `WriteErrorWithContext`가 정의되지 않았다

- [ ] **Step 3: 구현한다**

`apps/api/internal/httpjson/error_context.go`:

```go
package httpjson

import (
	"context"
	"net/http"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/observability"
)

type errorWithRequestID struct {
	Error     string `json:"error"`
	RequestID string `json:"requestId,omitempty"`
}

// WriteErrorWithContext는 에러 응답에 추적 ID를 함께 실어 준다.
// 사용자가 화면의 ID를 알려주면 서버 로그에서 그 요청을 바로 찾을 수 있다.
func WriteErrorWithContext(ctx context.Context, w http.ResponseWriter, status int, message string) {
	Write(w, status, errorWithRequestID{
		Error:     message,
		RequestID: observability.RequestIDFromContext(ctx),
	})
}
```

- [ ] **Step 4: 5xx를 내는 곳이 새 함수를 쓰게 한다**

Run: `cd apps/api && grep -rn "StatusInternalServerError" --include="*.go" internal/handler/ | grep -v _test`

찾은 각 지점에서 `WriteError(w, http.StatusInternalServerError, …)`를 `WriteErrorWithContext(r.Context(), w, http.StatusInternalServerError, …)`로 바꾼다. **4xx는 바꾸지 않는다** — 사용자 입력 문제라 추적 ID가 필요 없고, 응답 스키마를 넓히면 프론트가 다뤄야 할 형태만 늘어난다.

- [ ] **Step 5: OpenAPI 문서를 맞춘다**

에러 스키마 이름은 `Error`이고 362-367행에 있다(확인 완료). 아래로 교체한다.

```json
      "Error": {
        "type": "object",
        "properties": {
          "error": { "type": "string" },
          "requestId": {
            "type": "string",
            "description": "5xx 응답에만 실린다. 서버 로그에서 이 요청을 찾는 데 쓴다."
          }
        }
      }
```

Run: `cd apps/api && python3 -c "import json;json.load(open('internal/handler/openapi.json'));print('JSON 유효')" && go test ./internal/handler/`
Expected: JSON 유효 + PASS

- [ ] **Step 6: 커밋한다**

```bash
git add apps/api/internal/httpjson/ apps/api/internal/handler/
git commit -m "feat(api): 5xx 응답에 request ID를 실어 사용자 신고를 추적 가능하게"
```

---

### Task 7: 핸들러 로그를 컨텍스트 로거로 교체

`log.Printf` 7곳은 request ID가 없어 다른 로그와 연결되지 않는다.

**Files:**
- Modify: `apps/api/internal/handler/auth_handler.go`

- [ ] **Step 1: 대상을 확인한다**

Run: `cd apps/api && grep -n "log\.Printf" internal/handler/auth_handler.go`
Expected: 7개 (78, 146, 178, 212, 241, 244, 270행 부근)

- [ ] **Step 2: 전부 교체한다**

각 지점을 아래 형태로 바꾼다. `r`은 해당 핸들러의 `*http.Request` 파라미터다.

```go
// 이전
log.Printf("register user: %v", err)

// 이후
observability.LoggerFromContext(r.Context()).Error("register user failed", slog.Any("error", err))
```

메시지는 각 지점의 기존 문구를 그대로 옮긴다(`reset password` → `reset password failed` 식). import에서 `log`를 지우고 `log/slog`와 `observability`를 넣는다.

> **에러 값만 남기고 요청 본문·이메일·토큰은 로그에 넣지 않는다.** 계정 식별이 필요하면 `slog.String("userId", claims.UserID)`처럼 ID만 쓴다.

- [ ] **Step 3: 검증한다**

Run: `cd apps/api && go build ./... && go test ./... && go vet ./...`
Expected: 전부 PASS. `log` import가 남아 있으면 컴파일러가 잡아 준다.

- [ ] **Step 4: 커밋한다**

```bash
git add apps/api/internal/handler/auth_handler.go
git commit -m "refactor(api): 핸들러 로그를 request ID가 실린 컨텍스트 로거로 교체"
```

---

### Task 8: 조립 + 기동 로그 + 최종 검증

**Files:**
- Modify: `apps/api/internal/server/server.go`
- Modify: `apps/api/cmd/api/main.go`

- [ ] **Step 1: 미들웨어 체인을 조립한다**

`server.go`의 `Routes()`를 교체한다.

```go
// Routes는 미들웨어를 바깥에서 안쪽 순서로 감싼다.
//
//	CORS            — 프리플라이트를 가장 먼저 처리해야 한다
//	RequestContext  — 그다음. 이후 모든 계층이 request ID를 쓴다
//	RequestLog      — 레이트 리밋 거부(429)까지 기록하려면 그 바깥이어야 한다
//	rateLimiter     — 실제 차단
//	DiscordAlert    — 패닉 복구는 핸들러에 가장 가깝게
func (s *Server) Routes() http.Handler {
	return withCORS(
		middleware.RequestContext(s.logger)(
			middleware.RequestLog(
				s.rateLimiter.Limit(middleware.DiscordAlert(s.mux)),
			),
		),
	)
}
```

`Server` 구조체에 `logger *slog.Logger` 필드를 더하고, `New()`에서 채운다.

```go
	logger := observability.NewLogger(os.Stdout)
	slog.SetDefault(logger)
```

그리고 `s := &Server{...}` 리터럴에 `logger: logger,`를 넣는다.

- [ ] **Step 2: 기동 로그를 slog로 바꾼다**

`server.go`의 두 줄을 교체한다.

```go
		logger.Info("storage ready", slog.String("backend", "postgres"))
```

```go
		logger.Warn("storage ready", slog.String("backend", "in-memory"),
			slog.String("reason", "DATABASE_URL is not set"))
```

> in-memory는 프로덕션에서 **데이터가 사라진다**는 뜻이므로 `Info`가 아니라 `Warn`으로 남긴다.

`cmd/api/main.go`의 `log.Printf("api server listening on :%s", port)`도 바꾼다.

```go
	slog.Info("api server listening", slog.String("port", port))
```

`log.Fatal`은 그대로 둔다 — 기동 실패는 즉시 종료가 맞고, 로거가 아직 없을 수도 있다.

- [ ] **Step 3: 전체 검증**

Run: `cd apps/api && go build ./... && go test ./... && go test -race ./... && go vet ./... && test -z "$(gofmt -l .)"`
Expected: 전부 PASS

- [ ] **Step 4: 실제로 띄워서 로그를 눈으로 확인한다**

```bash
cd apps/api
DATABASE_URL= JWT_SECRET=dev-secret-for-local-verification-0123456789 \
APP_ENV=production LOG_LEVEL=info PORT=8080 go run ./cmd/api
```

다른 창에서:

```bash
curl -i -s http://localhost:8080/api/trips | head -20
curl -s -H 'X-Request-ID: my-trace-1' http://localhost:8080/healthz -o /dev/null -D -
```

확인할 것:
1. 서버 로그가 **JSON 한 줄**이고 `requestId` · `method` · `path` · `status` · `durationMs`가 있다
2. 401 응답 로그의 `level`이 `WARN`이다
3. 두 번째 요청의 응답 헤더 `X-Request-ID`가 **`my-trace-1`** 이고, 로그의 `requestId`도 같다
4. 쿼리 문자열이 로그에 없다

끝나면 `lsof -ti tcp:8080 | xargs -r kill -9`로 정리한다.

- [ ] **Step 5: 커밋한다**

```bash
git add apps/api/internal/server/server.go apps/api/cmd/api/main.go
git commit -m "feat(api): 관측성 미들웨어 조립과 기동 로그 구조화"
```

---

## 최종 확인

- [ ] `npm run check` 전체 통과
- [ ] `git push` 후 PR 생성 — 제목 `feat(api): 구조화 로깅과 request ID 추적 도입`
- [ ] PR 본문에 **"알림 → request ID → 로그" 추적 경로**와 범위 밖(메트릭·추적·프론트 에러 추적)을 명시
- [ ] `~/dev/docs/travel_app/troubleshooting/`에 운영 조회 방법을 문서로 남긴다 — `journalctl -u travel-api -o cat | jq 'select(.requestId=="…")'`
