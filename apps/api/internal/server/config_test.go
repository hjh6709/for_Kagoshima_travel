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
	t.Setenv("ALLOWED_ORIGINS", "https://kagoshima.hjh-dev.site")

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

func TestNewRejectsMissingOrUnsafeProductionOrigins(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("JWT_SECRET", strings.Repeat("s", 32))
	t.Setenv("DATABASE_URL", "postgres://unused")

	for _, origins := range []string{"", "*", "http://kagoshima.hjh-dev.site", "https://user@example.com", "https://kagoshima.hjh-dev.site/"} {
		t.Run(origins, func(t *testing.T) {
			t.Setenv("ALLOWED_ORIGINS", origins)
			if _, err := New(); err == nil || !strings.Contains(err.Error(), "ALLOWED_ORIGINS") {
				t.Fatalf("New() error = %v, want ALLOWED_ORIGINS validation error", err)
			}
		})
	}
}

func TestNewTreatsLegacyENVAsProduction(t *testing.T) {
	t.Setenv("APP_ENV", "")
	t.Setenv("ENV", "production")
	t.Setenv("JWT_SECRET", "")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("ALLOWED_ORIGINS", "https://kagoshima.hjh-dev.site")

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

func TestCORSRejectsCookieMutationFromUntrustedSiblingOrigin(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://kagoshima.hjh-dev.site")
	called := false
	handler := withCORS(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusNoContent)
	}))

	request := httptest.NewRequest(http.MethodPost, "https://api.hjh-dev.site/api/trips", strings.NewReader(`{"title":"공격 요청"}`))
	request.Header.Set("Origin", "https://evil.hjh-dev.site")
	request.Header.Set("Content-Type", "text/plain")
	request.AddCookie(&http.Cookie{Name: "map_planner_session", Value: "session-token"})
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusForbidden)
	}
	if called {
		t.Fatal("untrusted cookie mutation reached application handler")
	}
}

func TestCORSRejectsLoginMutationFromUntrustedSiblingOrigin(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://kagoshima.hjh-dev.site")
	called := false
	handler := withCORS(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	request := httptest.NewRequest(http.MethodPost, "https://api.hjh-dev.site/api/auth/login", strings.NewReader(`{"email":"victim@example.com"}`))
	request.Header.Set("Origin", "https://evil.hjh-dev.site")
	request.Header.Set("Content-Type", "text/plain")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusForbidden || called {
		t.Fatalf("untrusted login status = %d, called = %v", response.Code, called)
	}
}

func TestCORSAllowsTrustedCookieMutation(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://kagoshima.hjh-dev.site")
	called := false
	handler := withCORS(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusNoContent)
	}))

	request := httptest.NewRequest(http.MethodDelete, "https://api.hjh-dev.site/api/trips/trip-1", nil)
	request.Header.Set("Origin", "https://kagoshima.hjh-dev.site")
	request.AddCookie(&http.Cookie{Name: "map_planner_session", Value: "session-token"})
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusNoContent || !called {
		t.Fatalf("trusted cookie mutation status = %d, called = %v", response.Code, called)
	}
}

func TestCORSAllowsBearerClientWithoutOrigin(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://kagoshima.hjh-dev.site")
	called := false
	handler := withCORS(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusNoContent)
	}))

	request := httptest.NewRequest(http.MethodPatch, "https://api.hjh-dev.site/api/trips/trip-1", nil)
	request.Header.Set("Authorization", "Bearer native-app-token")
	request.AddCookie(&http.Cookie{Name: "map_planner_session", Value: "stale-cookie"})
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusNoContent || !called {
		t.Fatalf("bearer mutation status = %d, called = %v", response.Code, called)
	}
}
