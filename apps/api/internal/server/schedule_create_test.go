package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestScheduleCreateBoundaries(t *testing.T) {
	setServerTestEnv(t)

	srv := New()
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	ownerToken := registerUser(t, httpServer.URL, uniqueTestEmail(t, "schedule-owner"))
	otherToken := registerUser(t, httpServer.URL, uniqueTestEmail(t, "schedule-other"))

	tripID := createTrip(t, httpServer.URL, ownerToken, map[string]any{
		"title":     "일정 생성 테스트 여행",
		"startDate": "2026-07-10",
		"endDate":   "2026-07-12",
		"travelers": []string{"여행자"},
	})

	payload := map[string]any{
		"date":          "2026-07-10",
		"time":          "10:30",
		"type":          "sightseeing",
		"title":         "전망대 방문",
		"transportMemo": "택시 이동",
		"guideMemo":     "운영시간 재확인",
	}

	created := createSchedule(t, httpServer.URL, ownerToken, tripID, payload)
	if created.status != http.StatusCreated {
		t.Fatalf("owner create schedule status = %d, want %d, body = %#v", created.status, http.StatusCreated, created.body)
	}
	scheduleID, ok := created.body["id"].(string)
	if !ok || scheduleID == "" {
		t.Fatalf("created schedule id is empty or not a string: %#v", created.body["id"])
	}
	if created.body["title"] != payload["title"] {
		t.Fatalf("created schedule title = %#v, want %#v", created.body["title"], payload["title"])
	}

	list := getJSON(t, httpServer.URL+"/api/trips/"+tripID+"/schedules", ownerToken)
	if list.status != http.StatusOK {
		t.Fatalf("list schedules status = %d, want %d, body = %#v", list.status, http.StatusOK, list.body)
	}
	found := false
	for _, schedule := range list.arrayBody {
		if schedule["id"] == scheduleID {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("created schedule %q not found in list: %#v", scheduleID, list.arrayBody)
	}

	otherCreate := createSchedule(t, httpServer.URL, otherToken, tripID, payload)
	if otherCreate.status != http.StatusForbidden {
		t.Fatalf("other user create schedule status = %d, want %d", otherCreate.status, http.StatusForbidden)
	}

	missingTripCreate := createSchedule(t, httpServer.URL, ownerToken, "00000000-0000-0000-0000-000000000000", payload)
	if missingTripCreate.status != http.StatusNotFound {
		t.Fatalf("missing trip create schedule status = %d, want %d", missingTripCreate.status, http.StatusNotFound)
	}

	otherDelete := deleteSchedule(t, httpServer.URL, otherToken, tripID, scheduleID)
	if otherDelete.status != http.StatusForbidden {
		t.Fatalf("other user delete schedule status = %d, want %d", otherDelete.status, http.StatusForbidden)
	}

	deleted := deleteSchedule(t, httpServer.URL, ownerToken, tripID, scheduleID)
	if deleted.status != http.StatusNoContent {
		t.Fatalf("owner delete schedule status = %d, want %d, body = %#v", deleted.status, http.StatusNoContent, deleted.body)
	}

	listAfterDelete := getJSON(t, httpServer.URL+"/api/trips/"+tripID+"/schedules", ownerToken)
	if listAfterDelete.status != http.StatusOK {
		t.Fatalf("list schedules after delete status = %d, want %d, body = %#v", listAfterDelete.status, http.StatusOK, listAfterDelete.body)
	}
	for _, schedule := range listAfterDelete.arrayBody {
		if schedule["id"] == scheduleID {
			t.Fatalf("deleted schedule %q still found in list: %#v", scheduleID, listAfterDelete.arrayBody)
		}
	}

	deleteAgain := deleteSchedule(t, httpServer.URL, ownerToken, tripID, scheduleID)
	if deleteAgain.status != http.StatusNotFound {
		t.Fatalf("delete missing schedule status = %d, want %d", deleteAgain.status, http.StatusNotFound)
	}
}

func createSchedule(t *testing.T, baseURL, token, tripID string, payload map[string]any) jsonResponse {
	t.Helper()
	return doJSON(t, http.MethodPost, baseURL+"/api/trips/"+tripID+"/schedules", token, payload)
}

func deleteSchedule(t *testing.T, baseURL, token, tripID, scheduleID string) jsonResponse {
	t.Helper()
	return doJSON(t, http.MethodDelete, baseURL+"/api/trips/"+tripID+"/schedules/"+scheduleID, token, nil)
}
