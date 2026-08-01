package service

import (
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
)

type placeSearchRoundTripFunc func(*http.Request) (*http.Response, error)

func (f placeSearchRoundTripFunc) RoundTrip(request *http.Request) (*http.Response, error) {
	return f(request)
}

func TestShanghaiFallbackContainsTenUsablePlaces(t *testing.T) {
	service := NewTripService(repository.NewMemoryTripRepository(), repository.NewMemoryChecklistRepository())

	places := service.getMockPlaces("CN", "")
	if len(places) != 10 {
		t.Fatalf("Shanghai fallback place count = %d, want 10", len(places))
	}

	for _, place := range places {
		if place.Name == "" || place.ChineseName == "" || place.ChineseAddress == "" {
			t.Errorf("fallback place lacks local display data: %#v", place)
		}
		if place.Latitude == nil || place.Longitude == nil {
			t.Errorf("fallback place lacks coordinates: %#v", place)
		}
	}
}

func TestSearchPlacesChecksOwnershipBeforeReturningBlankQuery(t *testing.T) {
	tripRepo := repository.NewMemoryTripRepository()
	service := NewTripService(tripRepo, repository.NewMemoryChecklistRepository())
	const tripID = "place-search-owner-check"

	if err := tripRepo.Save(model.Trip{ID: tripID, OwnerID: "owner-a", DestinationCountry: "CN"}); err != nil {
		t.Fatalf("save trip: %v", err)
	}

	_, err := service.SearchPlaces(tripID, "owner-b", "   ")
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("SearchPlaces error = %v, want ErrForbidden", err)
	}
}

func TestPlaceSearchHTTPClientHasTimeout(t *testing.T) {
	if placeSearchHTTPClient.Timeout != 10*time.Second {
		t.Fatalf("place search HTTP timeout = %s, want 10s", placeSearchHTTPClient.Timeout)
	}
}

func TestGoogleSearchRequestLimitsKoreanCategoriesToShanghai(t *testing.T) {
	tests := []struct {
		query        string
		wantType     string
		wantLanguage string
	}{
		{query: "카페", wantType: "cafe", wantLanguage: "ko"},
		{query: "식당", wantType: "restaurant", wantLanguage: "ko"},
		{query: "맛집", wantType: "restaurant", wantLanguage: "ko"},
		{query: "东方明珠", wantType: "", wantLanguage: "zh-CN"},
	}

	for _, tt := range tests {
		t.Run(tt.query, func(t *testing.T) {
			request := buildGoogleTextSearchRequest(tt.query, "CN")
			if request.TextQuery != tt.query {
				t.Errorf("text query = %q, want %q", request.TextQuery, tt.query)
			}
			if request.IncludedType != tt.wantType {
				t.Errorf("included type = %q, want %q", request.IncludedType, tt.wantType)
			}
			if request.PageSize != 20 || request.LanguageCode != tt.wantLanguage || request.RegionCode != "CN" {
				t.Errorf("Shanghai request metadata = %#v", request)
			}
			if request.LocationRestriction == nil {
				t.Fatal("Shanghai location restriction is nil")
			}
			if tt.wantType != "" && !request.StrictTypeFiltering {
				t.Error("category search must use strict type filtering")
			}
		})
	}
}

func TestSearchPlacesReturnsUnavailableInsteadOfEmptyFallback(t *testing.T) {
	t.Setenv("GOOGLE_MAPS_API_KEY", "")
	tripRepo := repository.NewMemoryTripRepository()
	const tripID = "cn-cafe-search"
	const ownerID = "owner-a"
	if err := tripRepo.Save(model.Trip{ID: tripID, OwnerID: ownerID, DestinationCountry: "CN"}); err != nil {
		t.Fatalf("save trip: %v", err)
	}

	results, err := NewTripService(tripRepo, repository.NewMemoryChecklistRepository()).SearchPlaces(tripID, ownerID, "카페")
	if !errors.Is(err, ErrPlaceSearchUnavailable) {
		t.Fatalf("SearchPlaces error = %v, want ErrPlaceSearchUnavailable", err)
	}
	if results != nil {
		t.Fatalf("SearchPlaces results = %#v, want nil", results)
	}
}

func TestSearchPlacesStopsBeforeGoogleAtMonthlyLimit(t *testing.T) {
	t.Setenv("GOOGLE_MAPS_API_KEY", "test-key")
	tripRepo := repository.NewMemoryTripRepository()
	const tripID = "cn-google-quota"
	const ownerID = "owner-a"
	if err := tripRepo.Save(model.Trip{ID: tripID, OwnerID: ownerID, DestinationCountry: "CN"}); err != nil {
		t.Fatalf("save trip: %v", err)
	}
	periodStart := time.Now().UTC().Format("2006-01") + "-01"
	for i := 0; i < googlePlacesMonthlyLimit; i++ {
		allowed, err := tripRepo.ConsumeMonthlyAPIRequest("google-places-text-search", periodStart, googlePlacesMonthlyLimit)
		if err != nil || !allowed {
			t.Fatalf("consume request %d: allowed=%v err=%v", i+1, allowed, err)
		}
	}

	results, err := NewTripService(tripRepo, repository.NewMemoryChecklistRepository()).SearchPlaces(tripID, ownerID, "카페")
	if !errors.Is(err, ErrPlaceSearchQuotaExceeded) {
		t.Fatalf("SearchPlaces error = %v, want ErrPlaceSearchQuotaExceeded", err)
	}
	if results != nil {
		t.Fatalf("SearchPlaces results = %#v, want nil", results)
	}
}

func TestChineseTripSearchUsesGoogleAndReturnsChineseDisplayData(t *testing.T) {
	t.Setenv("GOOGLE_MAPS_API_KEY", "test-key")
	originalClient := placeSearchHTTPClient
	t.Cleanup(func() { placeSearchHTTPClient = originalClient })
	placeSearchHTTPClient = &http.Client{Transport: placeSearchRoundTripFunc(func(request *http.Request) (*http.Response, error) {
		if request.URL.Host != "places.googleapis.com" {
			t.Fatalf("request host = %q, want places.googleapis.com", request.URL.Host)
		}
		if got := request.Header.Get("X-Goog-Api-Key"); got != "test-key" {
			t.Fatalf("API key header = %q, want test-key", got)
		}
		body, err := io.ReadAll(request.Body)
		if err != nil {
			t.Fatalf("read request body: %v", err)
		}
		if !strings.Contains(string(body), `"includedType":"cafe"`) || !strings.Contains(string(body), `"locationRestriction"`) {
			t.Fatalf("Google request body lacks Shanghai cafe filters: %s", body)
		}
		return &http.Response{
			StatusCode: http.StatusOK,
			Header:     make(http.Header),
			Body: io.NopCloser(strings.NewReader(`{
				"places":[{
					"id":"google-cafe-1",
					"displayName":{"text":"上海咖啡店"},
					"formattedAddress":"上海市黄浦区测试路1号",
					"location":{"latitude":31.23,"longitude":121.47}
				}]
			}`)),
		}, nil
	})}

	tripRepo := repository.NewMemoryTripRepository()
	const tripID = "cn-google-search"
	const ownerID = "owner-a"
	if err := tripRepo.Save(model.Trip{ID: tripID, OwnerID: ownerID, DestinationCountry: "CN"}); err != nil {
		t.Fatalf("save trip: %v", err)
	}

	results, err := NewTripService(tripRepo, repository.NewMemoryChecklistRepository()).SearchPlaces(tripID, ownerID, "카페")
	if err != nil {
		t.Fatalf("SearchPlaces: %v", err)
	}
	if len(results) != 1 || results[0].GooglePlaceID != "google-cafe-1" {
		t.Fatalf("SearchPlaces results = %#v", results)
	}
	if results[0].ChineseName != "上海咖啡店" || results[0].ChineseAddress == "" {
		t.Fatalf("Chinese display data = %#v", results[0])
	}
}
