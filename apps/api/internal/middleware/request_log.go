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
