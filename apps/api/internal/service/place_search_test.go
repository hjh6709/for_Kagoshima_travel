package service

import (
	"errors"
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
