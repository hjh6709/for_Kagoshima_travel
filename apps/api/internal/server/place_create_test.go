package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPlaceCreateBoundaries(t *testing.T) {
	setServerTestEnv(t)

	srv := New()
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	ownerToken := registerUser(t, httpServer.URL, uniqueTestEmail(t, "place-owner"))
	otherToken := registerUser(t, httpServer.URL, uniqueTestEmail(t, "place-other"))

	tripID := createTrip(t, httpServer.URL, ownerToken, map[string]any{
		"title":     "장소 생성 테스트 여행",
		"startDate": "2026-07-10",
		"endDate":   "2026-07-12",
		"travelers": []string{"여행자"},
	})

	payload := map[string]any{
		"name":              "공항 렌터카 센터",
		"category":          "transport",
		"address":           "공항 1층",
		"googleMapsUrl":     "https://www.google.com/maps/search/?api=1&query=airport",
		"recommendedReason": "도착 후 바로 이동할 장소",
	}

	created := createPlace(t, httpServer.URL, ownerToken, tripID, payload)
	if created.status != http.StatusCreated {
		t.Fatalf("owner create place status = %d, want %d, body = %#v", created.status, http.StatusCreated, created.body)
	}
	placeID, ok := created.body["id"].(string)
	if !ok || placeID == "" {
		t.Fatalf("created place id is empty or not a string: %#v", created.body["id"])
	}
	if created.body["name"] != payload["name"] {
		t.Fatalf("created place name = %#v, want %#v", created.body["name"], payload["name"])
	}

	list := getJSON(t, httpServer.URL+"/api/trips/"+tripID+"/places", ownerToken)
	if list.status != http.StatusOK {
		t.Fatalf("list places status = %d, want %d, body = %#v", list.status, http.StatusOK, list.body)
	}
	found := false
	for _, place := range list.arrayBody {
		if place["id"] == placeID {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("created place %q not found in list: %#v", placeID, list.arrayBody)
	}

	// 장소 편집 UI가 기대하는 부분 수정 동작: 보낸 필드만 바뀌고 나머지는 유지된다.
	updated := updatePlace(t, httpServer.URL, ownerToken, tripID, placeID, map[string]any{
		"name":    "공항 렌터카 센터 변경",
		"address": "공항 2층",
	})
	if updated.status != http.StatusOK {
		t.Fatalf("owner update place status = %d, want %d, body = %#v", updated.status, http.StatusOK, updated.body)
	}
	if updated.body["name"] != "공항 렌터카 센터 변경" {
		t.Fatalf("updated place name = %#v, want changed name", updated.body["name"])
	}
	if updated.body["category"] != payload["category"] {
		t.Fatalf("partial update changed category = %#v, want %#v", updated.body["category"], payload["category"])
	}
	if updated.body["address"] != "공항 2층" {
		t.Fatalf("updated place address = %#v, want changed address", updated.body["address"])
	}

	otherUpdate := updatePlace(t, httpServer.URL, otherToken, tripID, placeID, map[string]any{
		"name": "권한 없는 수정",
	})
	if otherUpdate.status != http.StatusForbidden {
		t.Fatalf("other user update place status = %d, want %d", otherUpdate.status, http.StatusForbidden)
	}

	invalidUpdate := updatePlace(t, httpServer.URL, ownerToken, tripID, placeID, map[string]any{
		"name": "",
	})
	if invalidUpdate.status != http.StatusBadRequest {
		t.Fatalf("invalid update place status = %d, want %d", invalidUpdate.status, http.StatusBadRequest)
	}

	missingPlaceUpdate := updatePlace(t, httpServer.URL, ownerToken, tripID, "00000000-0000-0000-0000-000000000000", map[string]any{
		"name": "없는 장소",
	})
	if missingPlaceUpdate.status != http.StatusNotFound {
		t.Fatalf("missing place update status = %d, want %d", missingPlaceUpdate.status, http.StatusNotFound)
	}

	otherCreate := createPlace(t, httpServer.URL, otherToken, tripID, payload)
	if otherCreate.status != http.StatusForbidden {
		t.Fatalf("other user create place status = %d, want %d", otherCreate.status, http.StatusForbidden)
	}

	missingTripCreate := createPlace(t, httpServer.URL, ownerToken, "00000000-0000-0000-0000-000000000000", payload)
	if missingTripCreate.status != http.StatusNotFound {
		t.Fatalf("missing trip create place status = %d, want %d", missingTripCreate.status, http.StatusNotFound)
	}

	invalidCreate := createPlace(t, httpServer.URL, ownerToken, tripID, map[string]any{
		"category": "transport",
	})
	if invalidCreate.status != http.StatusBadRequest {
		t.Fatalf("invalid create place status = %d, want %d", invalidCreate.status, http.StatusBadRequest)
	}

	otherDelete := deletePlace(t, httpServer.URL, otherToken, tripID, placeID)
	if otherDelete.status != http.StatusForbidden {
		t.Fatalf("other user delete place status = %d, want %d", otherDelete.status, http.StatusForbidden)
	}

	deleted := deletePlace(t, httpServer.URL, ownerToken, tripID, placeID)
	if deleted.status != http.StatusNoContent {
		t.Fatalf("owner delete place status = %d, want %d, body = %#v", deleted.status, http.StatusNoContent, deleted.body)
	}

	listAfterDelete := getJSON(t, httpServer.URL+"/api/trips/"+tripID+"/places", ownerToken)
	if listAfterDelete.status != http.StatusOK {
		t.Fatalf("list places after delete status = %d, want %d, body = %#v", listAfterDelete.status, http.StatusOK, listAfterDelete.body)
	}
	for _, place := range listAfterDelete.arrayBody {
		if place["id"] == placeID {
			t.Fatalf("deleted place %q still found in list: %#v", placeID, listAfterDelete.arrayBody)
		}
	}

	deleteAgain := deletePlace(t, httpServer.URL, ownerToken, tripID, placeID)
	if deleteAgain.status != http.StatusNotFound {
		t.Fatalf("delete missing place status = %d, want %d", deleteAgain.status, http.StatusNotFound)
	}
}

func createPlace(t *testing.T, baseURL, token, tripID string, payload map[string]any) jsonResponse {
	t.Helper()
	return doJSON(t, http.MethodPost, baseURL+"/api/trips/"+tripID+"/places", token, payload)
}

func updatePlace(t *testing.T, baseURL, token, tripID, placeID string, payload map[string]any) jsonResponse {
	t.Helper()
	return doJSON(t, http.MethodPatch, baseURL+"/api/trips/"+tripID+"/places/"+placeID, token, payload)
}

func deletePlace(t *testing.T, baseURL, token, tripID, placeID string) jsonResponse {
	t.Helper()
	return doJSON(t, http.MethodDelete, baseURL+"/api/trips/"+tripID+"/places/"+placeID, token, nil)
}
