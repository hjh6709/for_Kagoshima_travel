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
