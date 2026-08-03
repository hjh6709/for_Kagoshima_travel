package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestNewRejectsUnsafeProductionConfiguration(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("JWT_SECRET", "")
	t.Setenv("DATABASE_URL", "")

	if _, err := New(); err == nil || !strings.Contains(err.Error(), "JWT_SECRET") {
		t.Fatalf("New() error = %v, want JWT_SECRET validation error", err)
	}

	t.Setenv("JWT_SECRET", strings.Repeat("s", 32))
	if _, err := New(); err == nil || !strings.Contains(err.Error(), "DATABASE_URL") {
		t.Fatalf("New() error = %v, want DATABASE_URL validation error", err)
	}

	t.Setenv("AUTH_TEST_BYPASS", "1")
	if _, err := New(); err == nil || !strings.Contains(err.Error(), "AUTH_TEST_BYPASS") {
		t.Fatalf("New() error = %v, want AUTH_TEST_BYPASS validation error", err)
	}
}

func TestNewTreatsLegacyENVAsProduction(t *testing.T) {
	t.Setenv("APP_ENV", "")
	t.Setenv("ENV", "production")
	t.Setenv("JWT_SECRET", "")
	t.Setenv("DATABASE_URL", "")

	if _, err := New(); err == nil || !strings.Contains(err.Error(), "JWT_SECRET") {
		t.Fatalf("New() error = %v, want production validation for ENV", err)
	}
}

func TestCORSAllowsOnlyConfiguredOriginsWithCredentials(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://kagoshima.hjh-dev.site, https://preview.example.com")
	handler := withCORS(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	allowedRequest := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	allowedRequest.Header.Set("Origin", "https://kagoshima.hjh-dev.site")
	allowedResponse := httptest.NewRecorder()
	handler.ServeHTTP(allowedResponse, allowedRequest)

	if got := allowedResponse.Header().Get("Access-Control-Allow-Origin"); got != "https://kagoshima.hjh-dev.site" {
		t.Fatalf("allowed origin = %q", got)
	}
	if got := allowedResponse.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
		t.Fatalf("allow credentials = %q, want true", got)
	}

	blockedRequest := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	blockedRequest.Header.Set("Origin", "https://attacker.example")
	blockedResponse := httptest.NewRecorder()
	handler.ServeHTTP(blockedResponse, blockedRequest)

	if got := blockedResponse.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("disallowed origin was reflected: %q", got)
	}
}
