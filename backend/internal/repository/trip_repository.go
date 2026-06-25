package repository

import (
	"errors"
	"sync"

	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/model"
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
	FindTravelogBalance(tripID string) (model.TravelogBalance, error)
	Save(trip model.Trip) error
	SaveShareLink(link model.ShareLink) error
	UpsertTravelogBalance(balance model.TravelogBalance) error
	Update(trip model.Trip) error
	Delete(id string) error
}

type MemoryTripRepository struct {
	mu        sync.RWMutex
	trips     []model.Trip
	schedules []model.Schedule
	places    []model.Place
	routes    []model.Route
	balances  []model.TravelogBalance
	shares    []model.ShareLink
}

func NewMemoryTripRepository() *MemoryTripRepository {
	const tripID = "kagoshima-2026"

	return &MemoryTripRepository{
		trips: []model.Trip{
			{
				ID:        tripID,
				Title:     "가고시마 부모님 여행",
				StartDate: "2026-06-27",
				EndDate:   "2026-06-30",
				Travelers: []string{"아버지", "어머니"},
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
				Title:         "가고시마 도착",
				TransportMemo: "공항에서 숙소 이동 방법 확정 필요",
				ParentMemo:    "도착 후 무리하지 말고 숙소 체크인부터 확인하세요.",
			},
			{
				ID:            "schedule-2",
				TripID:        tripID,
				PlaceID:       "place-senganen",
				Date:          "2026-06-28",
				Time:          "10:30",
				Type:          "sightseeing",
				Title:         "센간엔 관광",
				TransportMemo: "숙소 기준 이동 경로 확인 필요",
				ParentMemo:    "입장권과 운영시간은 출발 전 다시 확인하세요.",
			},
		},
		places: []model.Place{
			{
				ID:                "place-senganen",
				TripID:            tripID,
				Name:              "센간엔",
				Category:          "sightseeing",
				Address:           "9700-1 Yoshinocho, Kagoshima, 892-0871 Japan",
				GoogleMapsURL:     "https://www.google.com/maps/search/?api=1&query=Sengan-en%20Kagoshima",
				RecommendedReason: "사쿠라지마를 배경으로 볼 수 있는 대표 정원입니다.",
			},
			{
				ID:                "place-kurobuta",
				TripID:            tripID,
				Name:              "흑돼지 맛집 후보",
				Category:          "meal",
				GoogleMapsURL:     "https://www.google.com/maps/search/?api=1&query=Kagoshima%20kurobuta%20restaurant",
				RecommendedReason: "가고시마 대표 음식인 흑돼지를 먹는 후보 장소입니다.",
			},
		},
		routes: []model.Route{
			{
				ID:                "route-1",
				TripID:            tripID,
				Title:             "둘째 날 천천히 관광 루트",
				Description:       "센간엔을 보고 흑돼지 점심을 먹는 여유 일정입니다.",
				PlaceIDs:          []string{"place-senganen", "place-kurobuta"},
				TransportMemo:     "실제 숙소 위치 확정 후 이동 시간을 업데이트합니다.",
				EstimatedDuration: "반나절",
			},
		},
		balances: []model.TravelogBalance{
			{
				ID:        "travelog-balance-sample",
				TripID:    tripID,
				Currency:  "JPY",
				Amount:    42000,
				Note:      "트래블로그 체크카드 잔액을 직접 확인해 입력한 참고 금액입니다.",
				CheckedAt: "2026-06-24T21:10:00+09:00",
				UpdatedAt: "2026-06-24T21:10:00+09:00",
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

func (r *MemoryTripRepository) FindTravelogBalance(tripID string) (model.TravelogBalance, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, balance := range r.balances {
		if balance.TripID == tripID {
			return balance, nil
		}
	}
	return model.TravelogBalance{}, ErrNotFound
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

func (r *MemoryTripRepository) UpsertTravelogBalance(balance model.TravelogBalance) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, existing := range r.balances {
		if existing.TripID == balance.TripID {
			r.balances[i] = balance
			return nil
		}
	}
	r.balances = append(r.balances, balance)
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
