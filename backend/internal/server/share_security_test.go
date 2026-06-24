package server

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

type jsonResponse struct {
	status int
	body   map[string]any
}

func TestShareSecurityBoundaries(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("JWT_SECRET", "test-secret")

	srv := New()
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	ownerToken := registerUser(t, httpServer.URL, "owner@example.com")
	otherToken := registerUser(t, httpServer.URL, "other@example.com")

	tripID := createTrip(t, httpServer.URL, ownerToken, map[string]any{
		"title":     "가족 여행",
		"startDate": "2026-06-27",
		"endDate":   "2026-06-30",
		"travelers": []string{"아버지", "어머니"},
		"memo":      "작성자 내부 메모",
	})

	ownerShare := createShareLink(t, httpServer.URL, ownerToken, tripID)
	if ownerShare.status != http.StatusCreated {
		t.Fatalf("owner share status = %d, want %d", ownerShare.status, http.StatusCreated)
	}
	token, ok := ownerShare.body["token"].(string)
	if !ok || token == "" {
		t.Fatalf("owner share token is empty or not a string: %#v", ownerShare.body["token"])
	}

	otherShare := createShareLink(t, httpServer.URL, otherToken, tripID)
	if otherShare.status != http.StatusForbidden {
		t.Fatalf("other user share status = %d, want %d", otherShare.status, http.StatusForbidden)
	}

	shared := getJSON(t, httpServer.URL+"/api/share/"+token, "")
	if shared.status != http.StatusOK {
		t.Fatalf("valid share status = %d, want %d", shared.status, http.StatusOK)
	}
	trip, ok := shared.body["trip"].(map[string]any)
	if !ok {
		t.Fatalf("shared trip has unexpected shape: %#v", shared.body["trip"])
	}
	if _, exists := trip["memo"]; exists {
		t.Fatalf("public shared trip leaked memo: %#v", trip)
	}

	missing := getJSON(t, httpServer.URL+"/api/share/not-a-real-token", "")
	if missing.status != http.StatusNotFound {
		t.Fatalf("invalid token status = %d, want %d", missing.status, http.StatusNotFound)
	}
}

func registerUser(t *testing.T, baseURL, email string) string {
	t.Helper()

	res := doJSON(t, http.MethodPost, baseURL+"/api/auth/register", "", map[string]any{
		"email":    email,
		"password": "password123",
	})
	if res.status != http.StatusCreated {
		t.Fatalf("register %s status = %d, want %d, body = %#v", email, res.status, http.StatusCreated, res.body)
	}
	token, ok := res.body["accessToken"].(string)
	if !ok || token == "" {
		t.Fatalf("register %s accessToken is empty or not a string: %#v", email, res.body["accessToken"])
	}
	return token
}

func createTrip(t *testing.T, baseURL, token string, payload map[string]any) string {
	t.Helper()

	res := doJSON(t, http.MethodPost, baseURL+"/api/trips", token, payload)
	if res.status != http.StatusCreated {
		t.Fatalf("create trip status = %d, want %d, body = %#v", res.status, http.StatusCreated, res.body)
	}
	id, ok := res.body["id"].(string)
	if !ok || id == "" {
		t.Fatalf("create trip id is empty or not a string: %#v", res.body["id"])
	}
	return id
}

func createShareLink(t *testing.T, baseURL, token, tripID string) jsonResponse {
	t.Helper()
	return doJSON(t, http.MethodPost, baseURL+"/api/trips/"+tripID+"/share", token, nil)
}

func getJSON(t *testing.T, url, token string) jsonResponse {
	t.Helper()
	return doJSON(t, http.MethodGet, url, token, nil)
}

func doJSON(t *testing.T, method, url, token string, payload any) jsonResponse {
	t.Helper()

	var body bytes.Buffer
	if payload != nil {
		if err := json.NewEncoder(&body).Encode(payload); err != nil {
			t.Fatalf("encode request payload: %v", err)
		}
	}

	req, err := http.NewRequest(method, url, &body)
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("%s %s: %v", method, url, err)
	}
	defer resp.Body.Close()

	result := jsonResponse{
		status: resp.StatusCode,
		body:   map[string]any{},
	}
	if resp.Body != nil {
		if err := json.NewDecoder(resp.Body).Decode(&result.body); err != nil {
			t.Fatalf("decode response body for %s %s status %d: %v", method, url, resp.StatusCode, err)
		}
	}
	return result
}
