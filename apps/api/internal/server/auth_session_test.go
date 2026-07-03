package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAuthMeReturnsCurrentUserForValidToken(t *testing.T) {
	setServerTestEnv(t)

	srv := New()
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	email := uniqueTestEmail(t, "owner")
	token := registerUser(t, httpServer.URL, email)

	me := getJSON(t, httpServer.URL+"/api/auth/me", token)
	if me.status != http.StatusOK {
		t.Fatalf("auth me status = %d, want %d, body = %#v", me.status, http.StatusOK, me.body)
	}

	user, ok := me.body["user"].(map[string]any)
	if !ok {
		t.Fatalf("auth me user has unexpected shape: %#v", me.body["user"])
	}
	if user["email"] != email {
		t.Fatalf("auth me user email = %#v, want %q", user["email"], email)
	}
	if _, exists := me.body["accessToken"]; exists {
		t.Fatalf("auth me should not issue a new access token: %#v", me.body)
	}
}

func TestAuthMeRejectsMissingToken(t *testing.T) {
	setServerTestEnv(t)

	srv := New()
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	me := getJSON(t, httpServer.URL+"/api/auth/me", "")
	if me.status != http.StatusUnauthorized {
		t.Fatalf("auth me without token status = %d, want %d", me.status, http.StatusUnauthorized)
	}
}
