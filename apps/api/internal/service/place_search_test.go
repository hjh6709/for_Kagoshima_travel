package service

import (
	"errors"
	"net/url"
	"testing"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
)

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

func TestAmapSearchParametersTranslateKoreanCategoriesAndLimitToShanghai(t *testing.T) {
	tests := []struct {
		query        string
		wantKeywords string
		wantTypes    string
	}{
		{query: "카페", wantKeywords: "咖啡店", wantTypes: "050000"},
		{query: "식당", wantKeywords: "餐厅", wantTypes: "050000"},
		{query: "맛집", wantKeywords: "餐厅", wantTypes: "050000"},
		{query: "东方明珠", wantKeywords: "东方明珠", wantTypes: ""},
	}

	for _, tt := range tests {
		t.Run(tt.query, func(t *testing.T) {
			requestURL, err := buildAmapPlaceSearchURL(tt.query, "test-key")
			if err != nil {
				t.Fatalf("build URL: %v", err)
			}
			parsed, err := url.Parse(requestURL)
			if err != nil {
				t.Fatalf("parse URL: %v", err)
			}

			query := parsed.Query()
			if parsed.Path != "/v5/place/text" {
				t.Errorf("Amap path = %q, want /v5/place/text", parsed.Path)
			}
			if got := query.Get("keywords"); got != tt.wantKeywords {
				t.Errorf("keywords = %q, want %q", got, tt.wantKeywords)
			}
			if got := query.Get("types"); got != tt.wantTypes {
				t.Errorf("types = %q, want %q", got, tt.wantTypes)
			}
			if got := query.Get("region"); got != "上海市" {
				t.Errorf("region = %q, want 上海市", got)
			}
			if got := query.Get("city_limit"); got != "true" {
				t.Errorf("city_limit = %q, want true", got)
			}
			if got := query.Get("page_size"); got != "20" {
				t.Errorf("page_size = %q, want 20", got)
			}
		})
	}
}

func TestSearchPlacesReturnsUnavailableInsteadOfEmptyFallback(t *testing.T) {
	t.Setenv("AMAP_API_KEY", "")
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
