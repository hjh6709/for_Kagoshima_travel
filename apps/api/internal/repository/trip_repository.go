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
	FindSchedule(tripID, scheduleID string) (model.Schedule, error)
	FindSchedules(tripID string) ([]model.Schedule, error)
	FindPlace(tripID, placeID string) (model.Place, error)
	FindPlaces(tripID string) ([]model.Place, error)
	FindFlight(tripID, flightID string) (model.Flight, error)
	FindFlights(tripID string) ([]model.Flight, error)
	FindRoutes(tripID string) ([]model.Route, error)
	Save(trip model.Trip) error
	SaveShareLink(link model.ShareLink) error
	SaveSchedule(schedule model.Schedule) error
	UpdateSchedule(schedule model.Schedule) error
	SavePlace(place model.Place) error
	UpdatePlace(place model.Place) error
	SaveFlight(flight model.Flight) error
	UpdateFlight(flight model.Flight) error
	DeleteSchedule(tripID, scheduleID string) error
	DeletePlace(tripID, placeID string) error
	DeleteFlight(tripID, flightID string) error
	Update(trip model.Trip) error
	Delete(id string) error
}

type MemoryTripRepository struct {
	mu        sync.RWMutex
	trips     []model.Trip
	schedules []model.Schedule
	places    []model.Place
	flights   []model.Flight
	routes    []model.Route
	shares    []model.ShareLink
}

func NewMemoryTripRepository() *MemoryTripRepository {
	const tripID = "sample-trip-2026"

	return &MemoryTripRepository{
		trips: []model.Trip{
			{
				ID:                 tripID,
				Title:              "나의 여행",
				StartDate:          "2026-06-27",
				EndDate:            "2026-06-30",
				Travelers:          []string{"여행자 1", "여행자 2"},
				DestinationCountry: "JP",
				Memo:               "샘플 데이터입니다. 실제 일정으로 교체 예정입니다.",
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
		flights: []model.Flight{
			{
				ID:               "flight-departure",
				TripID:           tripID,
				Direction:        "departure",
				Label:            "출국 항공편",
				Airline:          "항공사 입력 예정",
				FlightNumber:     "편명 입력 예정",
				DepartureAirport: "출발 공항",
				ArrivalAirport:   "도착 공항",
				DepartureDate:    "2026-06-27",
				DepartureTime:    "출발 시간 입력 예정",
				Memo:             "실제 항공권 정보로 교체하세요.",
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

// FindSchedule은 수정 대상 일정이 선택한 여행에 실제로 속해 있는지 함께 확인한다.
func (r *MemoryTripRepository) FindSchedule(tripID, scheduleID string) (model.Schedule, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, schedule := range r.schedules {
		if schedule.TripID == tripID && schedule.ID == scheduleID {
			return schedule, nil
		}
	}
	return model.Schedule{}, ErrNotFound
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

// FindPlace는 수정 대상 장소가 선택한 여행에 속하는지 함께 확인한다.
func (r *MemoryTripRepository) FindPlace(tripID, placeID string) (model.Place, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, place := range r.places {
		if place.TripID == tripID && place.ID == placeID {
			return place, nil
		}
	}
	return model.Place{}, ErrNotFound
}

func (r *MemoryTripRepository) FindFlights(tripID string) ([]model.Flight, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	flights := make([]model.Flight, 0)
	for _, flight := range r.flights {
		if flight.TripID == tripID {
			flights = append(flights, flight)
		}
	}
	return flights, nil
}

// FindFlight는 수정/삭제 대상 항공편이 선택한 여행에 속하는지 함께 확인한다.
func (r *MemoryTripRepository) FindFlight(tripID, flightID string) (model.Flight, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, flight := range r.flights {
		if flight.TripID == tripID && flight.ID == flightID {
			return flight, nil
		}
	}
	return model.Flight{}, ErrNotFound
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

func (r *MemoryTripRepository) SaveSchedule(schedule model.Schedule) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.schedules = append(r.schedules, schedule)
	return nil
}

// UpdateSchedule은 일정 ID와 여행 ID가 모두 맞을 때만 기존 일정을 교체한다.
func (r *MemoryTripRepository) UpdateSchedule(schedule model.Schedule) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, currentSchedule := range r.schedules {
		if currentSchedule.ID == schedule.ID && currentSchedule.TripID == schedule.TripID {
			r.schedules[i] = schedule
			return nil
		}
	}
	return ErrNotFound
}

func (r *MemoryTripRepository) SavePlace(place model.Place) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.places = append(r.places, place)
	return nil
}

// UpdatePlace는 장소 ID와 여행 ID가 모두 맞을 때만 기존 장소를 교체한다.
func (r *MemoryTripRepository) UpdatePlace(place model.Place) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, currentPlace := range r.places {
		if currentPlace.ID == place.ID && currentPlace.TripID == place.TripID {
			r.places[i] = place
			return nil
		}
	}
	return ErrNotFound
}

func (r *MemoryTripRepository) SaveFlight(flight model.Flight) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.flights = append(r.flights, flight)
	return nil
}

// UpdateFlight는 항공편 ID와 여행 ID가 모두 맞을 때만 기존 항공편을 교체한다.
func (r *MemoryTripRepository) UpdateFlight(flight model.Flight) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, currentFlight := range r.flights {
		if currentFlight.ID == flight.ID && currentFlight.TripID == flight.TripID {
			r.flights[i] = flight
			return nil
		}
	}
	return ErrNotFound
}

func (r *MemoryTripRepository) DeleteSchedule(tripID, scheduleID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, schedule := range r.schedules {
		if schedule.ID == scheduleID && schedule.TripID == tripID {
			r.schedules = append(r.schedules[:i], r.schedules[i+1:]...)
			return nil
		}
	}
	return ErrNotFound
}

func (r *MemoryTripRepository) DeletePlace(tripID, placeID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, place := range r.places {
		if place.ID == placeID && place.TripID == tripID {
			r.places = append(r.places[:i], r.places[i+1:]...)
			for scheduleIndex, schedule := range r.schedules {
				if schedule.PlaceID == placeID {
					r.schedules[scheduleIndex].PlaceID = ""
				}
			}
			for routeIndex, route := range r.routes {
				nextPlaceIDs := make([]string, 0, len(route.PlaceIDs))
				for _, id := range route.PlaceIDs {
					if id != placeID {
						nextPlaceIDs = append(nextPlaceIDs, id)
					}
				}
				r.routes[routeIndex].PlaceIDs = nextPlaceIDs
			}
			return nil
		}
	}
	return ErrNotFound
}

func (r *MemoryTripRepository) DeleteFlight(tripID, flightID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	// 같은 항공편 ID라도 다른 여행에 속하면 삭제하지 않도록 tripID를 함께 비교한다.
	for i, flight := range r.flights {
		if flight.ID == flightID && flight.TripID == tripID {
			r.flights = append(r.flights[:i], r.flights[i+1:]...)
			return nil
		}
	}
	return ErrNotFound
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
