package server

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

func TestPlaceSearchDoesNotExposeCuratedFallbackAsLiveResult(t *testing.T) {
	setServerTestEnv(t)
	t.Setenv("GOOGLE_MAPS_API_KEY", "")

	srv := newTestServer(t)
	httpServer := httptest.NewServer(srv.Routes())
	defer httpServer.Close()

	ownerToken := registerUser(t, httpServer.URL, uniqueTestEmail(t, "place-search-owner"))
	tripID := createTrip(t, httpServer.URL, ownerToken, map[string]any{
		"title":              "실시간 장소 검색 테스트",
		"startDate":          "2026-08-18",
		"endDate":            "2026-08-21",
		"travelers":          []string{"여행자"},
		"destinationCountry": "CN",
	})

	result := getJSON(t, httpServer.URL+"/api/trips/"+tripID+"/places/search?q="+url.QueryEscape("동방명주"), ownerToken)
	if result.status != http.StatusServiceUnavailable {
		t.Fatalf("place search status = %d, want %d, body = %#v", result.status, http.StatusServiceUnavailable, result.body)
	}
	if result.body["error"] != "지도 검색을 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요." {
		t.Fatalf("place search error = %#v", result.body["error"])
	}
}
