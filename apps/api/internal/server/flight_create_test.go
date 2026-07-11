package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestFlightCreateBoundaries(t *testing.T) {
	setServerTestEnv(t)

	srv := New()
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	ownerToken := registerUser(t, httpServer.URL, uniqueTestEmail(t, "flight-owner"))
	otherToken := registerUser(t, httpServer.URL, uniqueTestEmail(t, "flight-other"))

	tripID := createTrip(t, httpServer.URL, ownerToken, map[string]any{
		"title":     "항공편 생성 테스트 여행",
		"startDate": "2026-07-10",
		"endDate":   "2026-07-12",
		"travelers": []string{"여행자"},
	})

	payload := map[string]any{
		"direction":        "departure",
		"label":            "출국 항공편",
		"airline":          "대한항공",
		"flightNumber":     "KE123",
		"departureAirport": "인천",
		"arrivalAirport":   "도쿄",
		"departureDate":    "2026-07-10",
		"departureTime":    "10:30",
		"arrivalDate":      "2026-07-10",
		"arrivalTime":      "12:45",
		"memo":             "터미널 확인 필요",
	}

	created := createFlight(t, httpServer.URL, ownerToken, tripID, payload)
	if created.status != http.StatusCreated {
		t.Fatalf("owner create flight status = %d, want %d, body = %#v", created.status, http.StatusCreated, created.body)
	}
	flightID, ok := created.body["id"].(string)
	if !ok || flightID == "" {
		t.Fatalf("created flight id is empty or not a string: %#v", created.body["id"])
	}
	if created.body["flightNumber"] != payload["flightNumber"] {
		t.Fatalf("created flight number = %#v, want %#v", created.body["flightNumber"], payload["flightNumber"])
	}

	list := getJSON(t, httpServer.URL+"/api/trips/"+tripID+"/flights", ownerToken)
	if list.status != http.StatusOK {
		t.Fatalf("list flights status = %d, want %d, body = %#v", list.status, http.StatusOK, list.body)
	}
	found := false
	for _, flight := range list.arrayBody {
		if flight["id"] == flightID {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("created flight %q not found in list: %#v", flightID, list.arrayBody)
	}

	otherCreate := createFlight(t, httpServer.URL, otherToken, tripID, payload)
	if otherCreate.status != http.StatusForbidden {
		t.Fatalf("other user create flight status = %d, want %d", otherCreate.status, http.StatusForbidden)
	}

	missingTripCreate := createFlight(t, httpServer.URL, ownerToken, "00000000-0000-0000-0000-000000000000", payload)
	if missingTripCreate.status != http.StatusNotFound {
		t.Fatalf("missing trip create flight status = %d, want %d", missingTripCreate.status, http.StatusNotFound)
	}

	invalidCreate := createFlight(t, httpServer.URL, ownerToken, tripID, map[string]any{
		"label": "출국 항공편",
	})
	if invalidCreate.status != http.StatusBadRequest {
		t.Fatalf("invalid create flight status = %d, want %d", invalidCreate.status, http.StatusBadRequest)
	}
}

func createFlight(t *testing.T, baseURL, token, tripID string, payload map[string]any) jsonResponse {
	t.Helper()
	return doJSON(t, http.MethodPost, baseURL+"/api/trips/"+tripID+"/flights", token, payload)
}
