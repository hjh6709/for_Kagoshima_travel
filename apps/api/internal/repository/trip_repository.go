package repository

import (
	"errors"
	"sync"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
)

var (
	ErrNotFound       = errors.New("not found")
	ErrDuplicateEmail = errors.New("email already exists")
)

type TripRepository interface {
	FindTrip(id string) (model.Trip, error)
	FindByOwner(ownerID string) ([]model.Trip, error)
	FindShareLinkByToken(token string) (model.ShareLink, error)
	FindSchedules(tripID string) ([]model.Schedule, error)
	FindPlaces(tripID string) ([]model.Place, error)
	FindRoutes(tripID string) ([]model.Route, error)
	Save(trip model.Trip) error
	SaveShareLink(link model.ShareLink) error
	Update(trip model.Trip) error
	Delete(id string) error
}

type MemoryTripRepository struct {
	mu        sync.RWMutex
	trips     []model.Trip
	schedules []model.Schedule
	places    []model.Place
	routes    []model.Route
	shares    []model.ShareLink
}

func NewMemoryTripRepository() *MemoryTripRepository {
	const tripID = "sample-trip-2026"

	return &MemoryTripRepository{
		trips: []model.Trip{
			{
				ID:        tripID,
				Title:     "나의 여행",
				StartDate: "2026-06-27",
				EndDate:   "2026-06-30",
				Travelers: []string{"여행자 1", "여행자 2"},
				Memo:      "샘플 데이터입니다. 실제 일정으로 교체 예정입니다.",
			},
		},
		schedules: []model.Schedule{
			{
				ID:            "schedule-1",
				TripID:        tripID,
				PlaceID:       "place-hotel",
				Date:          "2026-06-27",
				Time:          "오전",
				Type:          "move",
				Title:         "여행지 도착",
				TransportMemo: "공항에서 숙소 이동 방법 확정 필요",
				GuideMemo:     "도착 후 무리하지 말고 숙소 체크인부터 확인하세요.",
			},
			{
				ID:            "schedule-2",
				TripID:        tripID,
				PlaceID:       "place-sightseeing",
				Date:          "2026-06-28",
				Time:          "10:30",
				Type:          "sightseeing",
				Title:         "관광지 후보 방문",
				TransportMemo: "숙소 기준 이동 경로 확인 필요",
				GuideMemo:     "입장권과 운영시간은 출발 전 다시 확인하세요.",
			},
		},
		places: []model.Place{
			{
				ID:                "place-sightseeing",
				TripID:            tripID,
				Name:              "관광지 후보",
				Category:          "sightseeing",
				Address:           "관광지 주소 입력 예정",
				GoogleMapsURL:     "https://www.google.com/maps/search/?api=1&query=sightseeing",
				RecommendedReason: "여행 중 가볍게 들를 수 있는 관광 후보 장소입니다.",
			},
			{
				ID:                "place-local-food",
				TripID:            tripID,
				Name:              "현지 맛집 후보",
				Category:          "meal",
				GoogleMapsURL:     "https://www.google.com/maps/search/?api=1&query=local%20restaurant",
				RecommendedReason: "여행지의 대표 음식을 먹는 후보 장소입니다.",
			},
		},
		routes: []model.Route{
			{
				ID:                "route-1",
				TripID:            tripID,
				Title:             "둘째 날 천천히 관광 루트",
				Description:       "관광지 후보를 보고 현지 맛집에서 식사하는 여유 일정입니다.",
				PlaceIDs:          []string{"place-sightseeing", "place-local-food"},
				TransportMemo:     "실제 숙소 위치 확정 후 이동 시간을 업데이트합니다.",
				EstimatedDuration: "반나절",
			},
		},
	}
}

func (r *MemoryTripRepository) FindTrip(id string) (model.Trip, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, trip := range r.trips {
		if trip.ID == id {
			return trip, nil
		}
	}
	return model.Trip{}, ErrNotFound
}

func (r *MemoryTripRepository) FindByOwner(ownerID string) ([]model.Trip, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]model.Trip, 0)
	for _, trip := range r.trips {
		if trip.OwnerID == ownerID {
			result = append(result, trip)
		}
	}
	return result, nil
}

func (r *MemoryTripRepository) FindShareLinkByToken(token string) (model.ShareLink, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, link := range r.shares {
		if link.Token == token {
			return link, nil
		}
	}
	return model.ShareLink{}, ErrNotFound
}

func (r *MemoryTripRepository) FindSchedules(tripID string) ([]model.Schedule, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	schedules := make([]model.Schedule, 0)
	for _, schedule := range r.schedules {
		if schedule.TripID == tripID {
			schedules = append(schedules, schedule)
		}
	}
	return schedules, nil
}

func (r *MemoryTripRepository) FindPlaces(tripID string) ([]model.Place, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	places := make([]model.Place, 0)
	for _, place := range r.places {
		if place.TripID == tripID {
			places = append(places, place)
		}
	}
	return places, nil
}

func (r *MemoryTripRepository) FindRoutes(tripID string) ([]model.Route, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	routes := make([]model.Route, 0)
	for _, route := range r.routes {
		if route.TripID == tripID {
			routes = append(routes, route)
		}
	}
	return routes, nil
}

func (r *MemoryTripRepository) Save(trip model.Trip) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.trips = append(r.trips, trip)
	return nil
}

func (r *MemoryTripRepository) SaveShareLink(link model.ShareLink) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.shares = append(r.shares, link)
	return nil
}

func (r *MemoryTripRepository) Update(trip model.Trip) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, t := range r.trips {
		if t.ID == trip.ID {
			r.trips[i] = trip
			return nil
		}
	}
	return ErrNotFound
}

func (r *MemoryTripRepository) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, trip := range r.trips {
		if trip.ID == id {
			r.trips = append(r.trips[:i], r.trips[i+1:]...)
			return nil
		}
	}
	return ErrNotFound
}
