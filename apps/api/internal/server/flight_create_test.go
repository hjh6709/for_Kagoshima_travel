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

	// 항공편 편집 UI가 기대하는 부분 수정 동작: 보낸 필드만 바뀌고 나머지는 유지된다.
	updated := updateFlight(t, httpServer.URL, ownerToken, tripID, flightID, map[string]any{
		"label":        "변경된 출국 항공편",
		"flightNumber": "KE456",
	})
	if updated.status != http.StatusOK {
		t.Fatalf("owner update flight status = %d, want %d, body = %#v", updated.status, http.StatusOK, updated.body)
	}
	if updated.body["label"] != "변경된 출국 항공편" {
		t.Fatalf("updated flight label = %#v, want changed label", updated.body["label"])
	}
	if updated.body["flightNumber"] != "KE456" {
		t.Fatalf("updated flight number = %#v, want changed flight number", updated.body["flightNumber"])
	}
	if updated.body["departureAirport"] != payload["departureAirport"] {
		t.Fatalf("partial update changed departure airport = %#v, want %#v", updated.body["departureAirport"], payload["departureAirport"])
	}

	otherUpdate := updateFlight(t, httpServer.URL, otherToken, tripID, flightID, map[string]any{
		"label": "권한 없는 수정",
	})
	if otherUpdate.status != http.StatusForbidden {
		t.Fatalf("other user update flight status = %d, want %d", otherUpdate.status, http.StatusForbidden)
	}

	invalidUpdate := updateFlight(t, httpServer.URL, ownerToken, tripID, flightID, map[string]any{
		"label": "",
	})
	if invalidUpdate.status != http.StatusBadRequest {
		t.Fatalf("invalid update flight status = %d, want %d", invalidUpdate.status, http.StatusBadRequest)
	}

	missingFlightUpdate := updateFlight(t, httpServer.URL, ownerToken, tripID, "00000000-0000-0000-0000-000000000000", map[string]any{
		"label": "없는 항공편",
	})
	if missingFlightUpdate.status != http.StatusNotFound {
		t.Fatalf("missing flight update status = %d, want %d", missingFlightUpdate.status, http.StatusNotFound)
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

	otherDelete := deleteFlight(t, httpServer.URL, otherToken, tripID, flightID)
	if otherDelete.status != http.StatusForbidden {
		t.Fatalf("other user delete flight status = %d, want %d", otherDelete.status, http.StatusForbidden)
	}

	deleted := deleteFlight(t, httpServer.URL, ownerToken, tripID, flightID)
	if deleted.status != http.StatusNoContent {
		t.Fatalf("owner delete flight status = %d, want %d, body = %#v", deleted.status, http.StatusNoContent, deleted.body)
	}

	listAfterDelete := getJSON(t, httpServer.URL+"/api/trips/"+tripID+"/flights", ownerToken)
	if listAfterDelete.status != http.StatusOK {
		t.Fatalf("list flights after delete status = %d, want %d, body = %#v", listAfterDelete.status, http.StatusOK, listAfterDelete.body)
	}
	for _, flight := range listAfterDelete.arrayBody {
		if flight["id"] == flightID {
			t.Fatalf("deleted flight %q still found in list: %#v", flightID, listAfterDelete.arrayBody)
		}
	}

	deleteAgain := deleteFlight(t, httpServer.URL, ownerToken, tripID, flightID)
	if deleteAgain.status != http.StatusNotFound {
		t.Fatalf("delete missing flight status = %d, want %d", deleteAgain.status, http.StatusNotFound)
	}
}

func createFlight(t *testing.T, baseURL, token, tripID string, payload map[string]any) jsonResponse {
	t.Helper()
	return doJSON(t, http.MethodPost, baseURL+"/api/trips/"+tripID+"/flights", token, payload)
}

func updateFlight(t *testing.T, baseURL, token, tripID, flightID string, payload map[string]any) jsonResponse {
	t.Helper()
	return doJSON(t, http.MethodPatch, baseURL+"/api/trips/"+tripID+"/flights/"+flightID, token, payload)
}

func deleteFlight(t *testing.T, baseURL, token, tripID, flightID string) jsonResponse {
	t.Helper()
	return doJSON(t, http.MethodDelete, baseURL+"/api/trips/"+tripID+"/flights/"+flightID, token, nil)
}
