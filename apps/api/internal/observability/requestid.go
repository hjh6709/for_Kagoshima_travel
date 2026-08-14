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
