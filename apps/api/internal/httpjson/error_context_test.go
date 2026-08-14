package httpjson

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/observability"
)

func TestWriteErrorWithContextIncludesRequestID(t *testing.T) {
	recorder := httptest.NewRecorder()
	ctx := observability.WithRequestID(context.Background(), "req-abc")

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

	WriteErrorWithContext(context.Background(), recorder, http.StatusBadRequest, "입력 오류")

	var body map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("response is not JSON: %v", err)
	}
	if _, exists := body["requestId"]; exists {
		t.Error("requestId must be omitted when there is nothing to trace")
	}
}
