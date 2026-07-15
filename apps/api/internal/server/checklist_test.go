package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
)

type checklistTestResponse struct {
	status    int
	body      map[string]any
	arrayBody []map[string]any
}

var emailCounter uint64

func checklistUniqueEmail(prefix string) string {
	val := atomic.AddUint64(&emailCounter, 1)
	return fmt.Sprintf("%s-%d@example.com", prefix, val)
}

func checklistRegisterUser(t *testing.T, baseURL, email string) string {
	payload := map[string]string{
		"email":    email,
		"password": "password123",
	}
	bodyBytes, _ := json.Marshal(payload)
	resp, err := http.Post(baseURL+"/api/auth/register", "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		t.Fatalf("failed to register: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		t.Fatalf("register failed with status %d", resp.StatusCode)
	}

	var res map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&res)
	token, _ := res["accessToken"].(string)
	return token
}

func checklistCreateTrip(t *testing.T, baseURL, token string, payload map[string]any) string {
	bodyBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest(http.MethodPost, baseURL+"/api/trips", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("failed to create trip: %v", err)
	}
	defer resp.Body.Close()

	var res map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&res)
	id, _ := res["id"].(string)
	return id
}

func checklistRequestJSON(t *testing.T, method, url, token string, payload any) checklistTestResponse {
	var body io.Reader
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			t.Fatalf("failed to marshal payload: %v", err)
		}
		body = bytes.NewBuffer(b)
	}

	req, err := http.NewRequest(method, url, body)
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("failed to read body: %v", err)
	}

	var res checklistTestResponse
	res.status = resp.StatusCode

	if len(respBytes) > 0 {
		if respBytes[0] == '[' {
			_ = json.Unmarshal(respBytes, &res.arrayBody)
		} else {
			_ = json.Unmarshal(respBytes, &res.body)
		}
	}
	return res
}

func TestChecklistLifecycleAndBoundaries(t *testing.T) {
	setServerTestEnv(t)

	srv := New()
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	ownerToken := checklistRegisterUser(t, httpServer.URL, checklistUniqueEmail("checklist-owner"))
	otherToken := checklistRegisterUser(t, httpServer.URL, checklistUniqueEmail("checklist-other"))

	// 1. 여행 생성 (자동으로 일본용 프리셋이 꽂혀야 함)
	tripID := checklistCreateTrip(t, httpServer.URL, ownerToken, map[string]any{
		"title":              "체크리스트 테스트 여행",
		"startDate":          "2026-07-20",
		"endDate":            "2026-07-24",
		"destinationCountry": "JP",
		"travelers":          []string{"길동"},
	})

	// 2. 체크리스트 목록 조회
	listRes := checklistRequestJSON(t, http.MethodGet, httpServer.URL+"/api/trips/"+tripID+"/checklists", ownerToken, nil)
	if listRes.status != http.StatusOK {
		t.Fatalf("list checklists status = %d, want 200, arrayBody = %#v, body = %#v", listRes.status, listRes.arrayBody, listRes.body)
	}

	// 기본 JP 프리셋을 포함하여 준비물이 제대로 들어왔는지 개수 확인 (9개 공통 + 3개 JP = 최소 12개)
	if len(listRes.arrayBody) < 12 {
		t.Fatalf("checklist count = %d, want at least 12 items", len(listRes.arrayBody))
	}

	// 3. 커스텀 체크리스트 항목 추가
	createPayload := map[string]any{
		"category": "before",
		"title":    "돼지코 2개 멀티탭 포함 준비",
	}
	createRes := checklistRequestJSON(t, http.MethodPost, httpServer.URL+"/api/trips/"+tripID+"/checklists", ownerToken, createPayload)
	if createRes.status != http.StatusCreated {
		t.Fatalf("create checklist item status = %d, want 201, body = %#v", createRes.status, createRes.body)
	}

	itemID, ok := createRes.body["id"].(string)
	if !ok || itemID == "" {
		t.Fatalf("invalid checklist item id returned: %#v", createRes.body)
	}

	// 4. 완료 상태 업데이트 (PATCH)
	trueVal := true
	updatePayload := map[string]any{
		"isCompleted": &trueVal,
	}
	updateRes := checklistRequestJSON(t, http.MethodPatch, httpServer.URL+"/api/trips/checklists/"+itemID, ownerToken, updatePayload)
	if updateRes.status != http.StatusOK {
		t.Fatalf("update checklist item status = %d, want 200, body = %#v", updateRes.status, updateRes.body)
	}

	if updateRes.body["isCompleted"] != true {
		t.Fatalf("updated checklist item isCompleted = %v, want true", updateRes.body["isCompleted"])
	}

	// 5. 비소유자 수정 권한 차단 검증 (다른 유저의 토큰으로 시도 ➡️ 403 Forbidden)
	badUpdateRes := checklistRequestJSON(t, http.MethodPatch, httpServer.URL+"/api/trips/checklists/"+itemID, otherToken, updatePayload)
	if badUpdateRes.status != http.StatusForbidden {
		t.Fatalf("other user update checklist item status = %d, want 403, body = %#v", badUpdateRes.status, badUpdateRes.body)
	}

	// 6. 공유 링크를 통한 체크리스트 노출 여부 검증
	shareRes := checklistRequestJSON(t, http.MethodPost, httpServer.URL+"/api/trips/"+tripID+"/share", ownerToken, map[string]any{})
	if shareRes.status != http.StatusCreated {
		t.Fatalf("create share link status = %d, want 201, body = %#v", shareRes.status, shareRes.body)
	}
	token := shareRes.body["token"].(string)

	sharedTripRes := checklistRequestJSON(t, http.MethodGet, httpServer.URL+"/api/share/"+token, "", nil)
	if sharedTripRes.status != http.StatusOK {
		t.Fatalf("get shared trip status = %d, want 200, body = %#v", sharedTripRes.status, sharedTripRes.body)
	}

	sharedChecklist, ok := sharedTripRes.body["checklist"].([]any)
	if !ok || len(sharedChecklist) == 0 {
		t.Fatalf("shared trip response does not contain checklist items: %#v", sharedTripRes.body)
	}

	// 7. 소유자에 의한 체크리스트 항목 삭제
	delRes := checklistRequestJSON(t, http.MethodDelete, httpServer.URL+"/api/trips/checklists/"+itemID, ownerToken, nil)
	if delRes.status != http.StatusNoContent {
		t.Fatalf("delete checklist item status = %d, want 204, body = %#v", delRes.status, delRes.body)
	}
}
