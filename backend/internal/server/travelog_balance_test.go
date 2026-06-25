package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestTravelogBalanceOwnerAndShareAccess(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("JWT_SECRET", "test-secret")

	srv := New()
	httpServer := httptestServer(t, srv)

	ownerToken := registerUser(t, httpServer.URL, "travelog-owner@example.com")
	otherToken := registerUser(t, httpServer.URL, "travelog-other@example.com")

	tripID := createTrip(t, httpServer.URL, ownerToken, map[string]any{
		"title":     "가족 여행",
		"startDate": "2026-06-27",
		"endDate":   "2026-06-30",
		"travelers": []string{"아버지", "어머니"},
	})

	payload := map[string]any{
		"currency":  "jpy",
		"amount":    42000,
		"note":      "공항에서 충전 완료. 이 금액 기준으로 사용하면 됩니다.",
		"checkedAt": "2026-06-25T21:30:00+09:00",
	}

	ownerReplace := doJSON(t, http.MethodPut, httpServer.URL+"/api/trips/"+tripID+"/travelog-balance", ownerToken, payload)
	if ownerReplace.status != http.StatusOK {
		t.Fatalf("owner replace travelog balance status = %d, want %d, body = %#v", ownerReplace.status, http.StatusOK, ownerReplace.body)
	}
	if ownerReplace.body["currency"] != "JPY" {
		t.Fatalf("travelog balance currency = %#v, want JPY", ownerReplace.body["currency"])
	}
	if ownerReplace.body["amount"] != float64(42000) {
		t.Fatalf("travelog balance amount = %#v, want 42000", ownerReplace.body["amount"])
	}
	if ownerReplace.body["checkedAt"] != "2026-06-25T21:30:00+09:00" {
		t.Fatalf("travelog balance checkedAt = %#v", ownerReplace.body["checkedAt"])
	}

	ownerGet := getJSON(t, httpServer.URL+"/api/trips/"+tripID+"/travelog-balance", ownerToken)
	if ownerGet.status != http.StatusOK {
		t.Fatalf("owner get travelog balance status = %d, want %d, body = %#v", ownerGet.status, http.StatusOK, ownerGet.body)
	}
	if ownerGet.body["note"] != payload["note"] {
		t.Fatalf("owner travelog balance note = %#v, want %#v", ownerGet.body["note"], payload["note"])
	}

	otherGet := getJSON(t, httpServer.URL+"/api/trips/"+tripID+"/travelog-balance", otherToken)
	if otherGet.status != http.StatusForbidden {
		t.Fatalf("other get travelog balance status = %d, want %d", otherGet.status, http.StatusForbidden)
	}

	share := createShareLink(t, httpServer.URL, ownerToken, tripID)
	if share.status != http.StatusCreated {
		t.Fatalf("create share status = %d, want %d", share.status, http.StatusCreated)
	}
	token, ok := share.body["token"].(string)
	if !ok || token == "" {
		t.Fatalf("share token is empty or not a string: %#v", share.body["token"])
	}

	shared := getJSON(t, httpServer.URL+"/api/share/"+token, "")
	if shared.status != http.StatusOK {
		t.Fatalf("shared trip status = %d, want %d, body = %#v", shared.status, http.StatusOK, shared.body)
	}
	balance, ok := shared.body["travelogBalance"].(map[string]any)
	if !ok {
		t.Fatalf("shared travelogBalance has unexpected shape: %#v", shared.body["travelogBalance"])
	}
	if balance["amount"] != float64(42000) {
		t.Fatalf("shared travelog balance amount = %#v, want 42000", balance["amount"])
	}
	if _, exists := shared.body["expenseSummaries"]; exists {
		t.Fatalf("shared response still exposes expenseSummaries: %#v", shared.body["expenseSummaries"])
	}
}

func httptestServer(t *testing.T, srv *Server) *httptest.Server {
	t.Helper()
	httpServer := httptest.NewServer(srv.Routes())
	t.Cleanup(httpServer.Close)
	return httpServer
}

func TestTravelogBalanceRejectInvalidInput(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("JWT_SECRET", "test-secret")

	srv := New()
	httpServer := httptestServer(t, srv)

	ownerToken := registerUser(t, httpServer.URL, "travelog-invalid@example.com")
	tripID := createTrip(t, httpServer.URL, ownerToken, map[string]any{
		"title":     "가족 여행",
		"startDate": "2026-06-27",
		"endDate":   "2026-06-30",
	})

	res := doJSON(t, http.MethodPut, httpServer.URL+"/api/trips/"+tripID+"/travelog-balance", ownerToken, map[string]any{
		"currency": "JPY",
		"amount":   -1,
	})
	if res.status != http.StatusBadRequest {
		t.Fatalf("invalid travelog balance status = %d, want %d", res.status, http.StatusBadRequest)
	}
}
