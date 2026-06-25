package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestExpenseSummariesOwnerAndShareAccess(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("JWT_SECRET", "test-secret")

	srv := New()
	httpServer := httptestServer(t, srv)

	ownerToken := registerUser(t, httpServer.URL, "expense-owner@example.com")
	otherToken := registerUser(t, httpServer.URL, "expense-other@example.com")

	tripID := createTrip(t, httpServer.URL, ownerToken, map[string]any{
		"title":     "가족 여행",
		"startDate": "2026-06-27",
		"endDate":   "2026-06-30",
		"travelers": []string{"아버지", "어머니"},
	})

	payload := map[string]any{
		"items": []map[string]any{
			{
				"label":    "식비·교통비 예상 경비",
				"currency": "jpy",
				"amount":   42000,
				"note":     "식당, 편의점, 택시 등 현지 경비 기준 금액",
			},
			{
				"label":    "비상 예비 경비",
				"currency": "JPY",
				"amount":   10000,
			},
		},
	}

	ownerReplace := doJSON(t, http.MethodPut, httpServer.URL+"/api/trips/"+tripID+"/expense-summaries", ownerToken, payload)
	if ownerReplace.status != http.StatusOK {
		t.Fatalf("owner replace expense summaries status = %d, want %d, body = %#v", ownerReplace.status, http.StatusOK, ownerReplace.body)
	}

	ownerList := getJSON(t, httpServer.URL+"/api/trips/"+tripID+"/expense-summaries", ownerToken)
	if ownerList.status != http.StatusOK {
		t.Fatalf("owner list expense summaries status = %d, want %d, body = %#v", ownerList.status, http.StatusOK, ownerList.body)
	}
	if len(ownerList.arrayBody) != 2 {
		t.Fatalf("owner expense summaries len = %d, want %d, body = %#v", len(ownerList.arrayBody), 2, ownerList.arrayBody)
	}
	first := ownerList.arrayBody[0]
	if first["currency"] != "JPY" {
		t.Fatalf("expense currency = %#v, want JPY", first["currency"])
	}
	if first["updatedAt"] == "" {
		t.Fatalf("expense updatedAt is empty: %#v", first)
	}

	otherList := getJSON(t, httpServer.URL+"/api/trips/"+tripID+"/expense-summaries", otherToken)
	if otherList.status != http.StatusForbidden {
		t.Fatalf("other list expense summaries status = %d, want %d", otherList.status, http.StatusForbidden)
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
	expenseSummaries, ok := shared.body["expenseSummaries"].([]any)
	if !ok {
		t.Fatalf("shared expenseSummaries has unexpected shape: %#v", shared.body["expenseSummaries"])
	}
	if len(expenseSummaries) != 2 {
		t.Fatalf("shared expense summaries len = %d, want %d, body = %#v", len(expenseSummaries), 2, expenseSummaries)
	}
}

func httptestServer(t *testing.T, srv *Server) *httptest.Server {
	t.Helper()
	httpServer := httptest.NewServer(srv.Routes())
	t.Cleanup(httpServer.Close)
	return httpServer
}

func TestExpenseSummariesRejectInvalidInput(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("JWT_SECRET", "test-secret")

	srv := New()
	httpServer := httptestServer(t, srv)

	ownerToken := registerUser(t, httpServer.URL, "expense-invalid@example.com")
	tripID := createTrip(t, httpServer.URL, ownerToken, map[string]any{
		"title":     "가족 여행",
		"startDate": "2026-06-27",
		"endDate":   "2026-06-30",
	})

	res := doJSON(t, http.MethodPut, httpServer.URL+"/api/trips/"+tripID+"/expense-summaries", ownerToken, map[string]any{
		"items": []map[string]any{
			{
				"label":    "식비",
				"currency": "JPY",
				"amount":   -1,
			},
		},
	})
	if res.status != http.StatusBadRequest {
		t.Fatalf("invalid expense status = %d, want %d", res.status, http.StatusBadRequest)
	}
}
