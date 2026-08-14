package middleware

import (
	"bytes"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/observability"
)

func TestDiscordAlertPanicRecovery(t *testing.T) {
	panicHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("테스트용 패닉 발생")
	})

	alertHandler := DiscordAlert(panicHandler)

	req := httptest.NewRequest("GET", "http://example.com/api/panic-test", nil)
	rec := httptest.NewRecorder()

	alertHandler.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("기대값 500 Internal Server Error, 결과값 %d", rec.Code)
	}
}

func TestDiscordAlertStatus500(t *testing.T) {
	errorHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	})

	alertHandler := DiscordAlert(errorHandler)

	req := httptest.NewRequest("POST", "http://example.com/api/error-test", nil)
	rec := httptest.NewRecorder()

	alertHandler.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("기대값 500, 결과값 %d", rec.Code)
	}
}

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
