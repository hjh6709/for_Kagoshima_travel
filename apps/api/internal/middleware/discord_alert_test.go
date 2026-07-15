package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
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
