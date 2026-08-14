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

// 경로는 사용자가 정하는 값이라 개행을 넣어 가짜 로그 줄을 만들려는 시도가 가능하다.
// slog 핸들러가 값을 이스케이프하므로 요청 1건은 반드시 로그 1줄로만 남아야 한다.
// 핸들러를 직접 만든 것으로 바꾸는 등 이 전제가 깨지면 이 테스트가 먼저 실패한다.
func TestRequestLogCannotBeForgedThroughPath(t *testing.T) {
	const forged = `{"level":"INFO","msg":"admin login"}`
	evilPath := "/api/trips\n" + forged + "\r\x1b[31m"

	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))

	handler := RequestLog(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	request := httptest.NewRequest(http.MethodGet, "/api/trips", nil)
	// url.Parse는 제어 문자를 거부하므로 파싱을 우회해 최악의 값을 직접 넣는다.
	request.URL.Path = evilPath
	request = request.WithContext(observability.WithLogger(request.Context(), logger))
	handler.ServeHTTP(httptest.NewRecorder(), request)

	if got := bytes.Count(buf.Bytes(), []byte("\n")); got != 1 {
		t.Errorf("log lines = %d, want 1 — 경로로 로그 줄을 위조할 수 있다: %q", got, buf.String())
	}

	entry := decodeLogEntry(t, &buf)
	if entry["path"] != evilPath {
		t.Errorf("path = %q, want the raw value %q (이스케이프는 저장 형식일 뿐 값은 보존돼야 한다)", entry["path"], evilPath)
	}
}
