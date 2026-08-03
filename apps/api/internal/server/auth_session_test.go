package server

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"testing"
)

func TestBrowserSessionUsesHttpOnlyCookieAndLogoutClearsIt(t *testing.T) {
	setServerTestEnv(t)

	srv := newTestServer(t)
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatalf("create cookie jar: %v", err)
	}
	client := &http.Client{Jar: jar}
	payload, err := json.Marshal(map[string]string{
		"email":    uniqueTestEmail(t, "cookie-session"),
		"password": "password123",
	})
	if err != nil {
		t.Fatalf("marshal register payload: %v", err)
	}

	registerResponse, err := client.Post(httpServer.URL+"/api/auth/register", "application/json", bytes.NewReader(payload))
	if err != nil {
		t.Fatalf("register with cookie client: %v", err)
	}
	registerResponse.Body.Close()
	if registerResponse.StatusCode != http.StatusCreated {
		t.Fatalf("register status = %d, want %d", registerResponse.StatusCode, http.StatusCreated)
	}
	setCookies := registerResponse.Cookies()
	if len(setCookies) != 1 || setCookies[0].Name != "map_planner_session" || !setCookies[0].HttpOnly {
		t.Fatalf("register did not issue expected HttpOnly session cookie: %#v", setCookies)
	}

	meResponse, err := client.Get(httpServer.URL + "/api/auth/me")
	if err != nil {
		t.Fatalf("get session with cookie: %v", err)
	}
	meResponse.Body.Close()
	if meResponse.StatusCode != http.StatusOK {
		t.Fatalf("cookie session status = %d, want %d", meResponse.StatusCode, http.StatusOK)
	}

	logoutResponse, err := client.Post(httpServer.URL+"/api/auth/logout", "application/json", nil)
	if err != nil {
		t.Fatalf("logout cookie session: %v", err)
	}
	logoutResponse.Body.Close()
	if logoutResponse.StatusCode != http.StatusNoContent {
		t.Fatalf("logout status = %d, want %d", logoutResponse.StatusCode, http.StatusNoContent)
	}

	afterLogout, err := client.Get(httpServer.URL + "/api/auth/me")
	if err != nil {
		t.Fatalf("get session after logout: %v", err)
	}
	afterLogout.Body.Close()
	if afterLogout.StatusCode != http.StatusUnauthorized {
		t.Fatalf("session after logout status = %d, want %d", afterLogout.StatusCode, http.StatusUnauthorized)
	}
}

func TestAuthMeReturnsCurrentUserForValidToken(t *testing.T) {
	setServerTestEnv(t)

	srv := newTestServer(t)
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

	srv := newTestServer(t)
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	me := getJSON(t, httpServer.URL+"/api/auth/me", "")
	if me.status != http.StatusUnauthorized {
		t.Fatalf("auth me without token status = %d, want %d", me.status, http.StatusUnauthorized)
	}
}

func TestPasswordChangeInvalidatesOldTokenAndReturnsReplacement(t *testing.T) {
	setServerTestEnv(t)

	srv := newTestServer(t)
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	email := uniqueTestEmail(t, "password-change")
	oldToken := registerUser(t, httpServer.URL, email)
	changed := doJSON(t, http.MethodPost, httpServer.URL+"/api/auth/change-password", oldToken, map[string]any{
		"currentPassword": "password123",
		"newPassword":     "changed-password-456",
	})
	if changed.status != http.StatusOK {
		t.Fatalf("change password status = %d, want %d, body = %#v", changed.status, http.StatusOK, changed.body)
	}
	newToken, ok := changed.body["accessToken"].(string)
	if !ok || newToken == "" || newToken == oldToken {
		t.Fatalf("replacement access token is invalid: %#v", changed.body["accessToken"])
	}

	if oldSession := getJSON(t, httpServer.URL+"/api/auth/me", oldToken); oldSession.status != http.StatusUnauthorized {
		t.Fatalf("old token status = %d, want %d", oldSession.status, http.StatusUnauthorized)
	}
	if newSession := getJSON(t, httpServer.URL+"/api/auth/me", newToken); newSession.status != http.StatusOK {
		t.Fatalf("new token status = %d, want %d", newSession.status, http.StatusOK)
	}
}

func TestDeleteAccountRequiresPasswordAndInvalidatesSession(t *testing.T) {
	setServerTestEnv(t)

	srv := newTestServer(t)
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	email := uniqueTestEmail(t, "delete-account")
	token := registerUser(t, httpServer.URL, email)
	wrongPassword := doJSON(t, http.MethodDelete, httpServer.URL+"/api/auth/account", token, map[string]any{
		"currentPassword": "wrong-password",
	})
	if wrongPassword.status != http.StatusBadRequest {
		t.Fatalf("wrong password status = %d, want %d", wrongPassword.status, http.StatusBadRequest)
	}

	deleted := doJSON(t, http.MethodDelete, httpServer.URL+"/api/auth/account", token, map[string]any{
		"currentPassword": "password123",
	})
	if deleted.status != http.StatusNoContent {
		t.Fatalf("delete account status = %d, want %d, body = %#v", deleted.status, http.StatusNoContent, deleted.body)
	}
	if session := getJSON(t, httpServer.URL+"/api/auth/me", token); session.status != http.StatusUnauthorized {
		t.Fatalf("deleted account token status = %d, want %d", session.status, http.StatusUnauthorized)
	}
}

func TestForgotPasswordInvalidatesExistingSessions(t *testing.T) {
	setServerTestEnv(t)

	srv := newTestServer(t)
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	email := uniqueTestEmail(t, "forgot-password")
	token := registerUser(t, httpServer.URL, email)
	reset := doJSON(t, http.MethodPost, httpServer.URL+"/api/auth/forgot-password", "", map[string]any{
		"email": email,
		"code":  "123456",
	})
	if reset.status != http.StatusOK {
		t.Fatalf("forgot password status = %d, want %d, body = %#v", reset.status, http.StatusOK, reset.body)
	}
	if session := getJSON(t, httpServer.URL+"/api/auth/me", token); session.status != http.StatusUnauthorized {
		t.Fatalf("pre-reset token status = %d, want %d", session.status, http.StatusUnauthorized)
	}
}
