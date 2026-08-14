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
