package middleware

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/observability"
)

// RequestLog는 요청 1건당 한 줄을 남긴다.
//
// 쿼리 문자열과 공개 공유 URL의 토큰은 남기지 않는다. 비밀번호 재설정
// 토큰과 공유 토큰이 로그에 기록되면 로그가 곧 접근 권한 유출 경로가 된다.
func RequestLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		wrapper := &responseWriterWrapper{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(wrapper, r)

		logger := observability.LoggerFromContext(r.Context())
		logger.LogAttrs(r.Context(), levelForStatus(wrapper.statusCode), "http request",
			slog.String("method", r.Method),
			slog.String("path", redactRequestPath(r.URL.Path)),
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
