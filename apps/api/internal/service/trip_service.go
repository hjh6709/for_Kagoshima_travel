package service

import (
	"errors"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
)

var (
	ErrTripNotFound  = errors.New("trip not found")
	ErrShareNotFound = errors.New("share link not found")
	ErrForbidden     = errors.New("forbidden")
	ErrInvalidTrip   = errors.New("invalid trip input")
)

type TripService struct {
	tripRepository repository.TripRepository
}

func NewTripService(tripRepository repository.TripRepository) *TripService {
	return &TripService{tripRepository: tripRepository}
}

func (s *TripService) GetTrip(id string) (dto.TripResponse, error) {
	trip, err := s.tripRepository.FindTrip(id)
	if err != nil {
		return dto.TripResponse{}, mapRepositoryError(err)
	}
	return mapTripResponse(trip), nil
}

func (s *TripService) GetOwnedTrip(id, ownerID string) (dto.TripResponse, error) {
	trip, err := s.tripRepository.FindTrip(id)
	if err != nil {
		return dto.TripResponse{}, mapRepositoryError(err)
	}
	if !sameID(trip.OwnerID, ownerID) {
		return dto.TripResponse{}, ErrForbidden
	}
	return mapTripResponse(trip), nil
}

func (s *TripService) CreateShareLink(tripID, ownerID string) (dto.ShareLinkResponse, error) {
	trip, err := s.tripRepository.FindTrip(tripID)
	if err != nil {
		return dto.ShareLinkResponse{}, mapRepositoryError(err)
	}
	if !sameID(trip.OwnerID, ownerID) {
		return dto.ShareLinkResponse{}, ErrForbidden
	}

	id, err := newID()
	if err != nil {
		return dto.ShareLinkResponse{}, err
	}
	token, err := newShareToken()
	if err != nil {
		return dto.ShareLinkResponse{}, err
	}

	link := model.ShareLink{
		ID:        id,
		TripID:    tripID,
		Token:     token,
		CreatedAt: time.Now(),
	}

	if err := s.tripRepository.SaveShareLink(link); err != nil {
		return dto.ShareLinkResponse{}, err
	}
	return mapShareLinkResponse(link), nil
}

func (s *TripService) GetSharedTrip(token string) (dto.SharedTripResponse, error) {
	link, err := s.tripRepository.FindShareLinkByToken(token)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.SharedTripResponse{}, ErrShareNotFound
		}
		return dto.SharedTripResponse{}, err
	}

	trip, err := s.tripRepository.FindTrip(link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, mapRepositoryError(err)
	}
	schedules, err := s.ListSchedules(link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, err
	}
	places, err := s.ListPlaces(link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, err
	}
	flights, err := s.ListFlights(link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, err
	}

	// 공유 화면에서는 민감한 항공 메모 마스킹 처리
	sharedFlights := make([]dto.FlightResponse, len(flights))
	copy(sharedFlights, flights)
	for i := range sharedFlights {
		if sharedFlights[i].Memo != "" {
			sharedFlights[i].Memo = "[공유용 화면에서는 비공개 처리됨]"
		}
	}

	routes, err := s.ListRoutes(link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, err
	}
	return dto.SharedTripResponse{
		Trip:      mapPublicTripResponse(trip),
		Schedules: schedules,
		Places:    places,
		Flights:   sharedFlights,
		Routes:    routes,
	}, nil
}

func (s *TripService) ListSchedules(tripID string) ([]dto.ScheduleResponse, error) {
	schedules, err := s.tripRepository.FindSchedules(tripID)
	if err != nil {
		return nil, mapRepositoryError(err)
	}

	responses := make([]dto.ScheduleResponse, 0, len(schedules))
	for _, schedule := range schedules {
		responses = append(responses, mapScheduleResponse(schedule))
	}
	return responses, nil
}

func (s *TripService) ListSchedulesForOwner(tripID, ownerID string) ([]dto.ScheduleResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return nil, err
	}
	return s.ListSchedules(tripID)
}

func (s *TripService) CreateSchedule(tripID, ownerID string, req dto.CreateScheduleRequest) (dto.ScheduleResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return dto.ScheduleResponse{}, err
	}
	if req.Date == "" || req.Time == "" || req.Type == "" || req.Title == "" {
		return dto.ScheduleResponse{}, ErrInvalidTrip
	}
	id, err := newID()
	if err != nil {
		return dto.ScheduleResponse{}, err
	}
	schedule := model.Schedule{
		ID:            id,
		TripID:        tripID,
		PlaceID:       req.PlaceID,
		Date:          req.Date,
		Time:          req.Time,
		Type:          req.Type,
		Title:         req.Title,
		TransportMemo: req.TransportMemo,
		GuideMemo:     req.GuideMemo,
	}
	if err := s.tripRepository.SaveSchedule(schedule); err != nil {
		return dto.ScheduleResponse{}, err
	}
	return mapScheduleResponse(schedule), nil
}

// UpdateSchedule은 여행 소유자만 기존 일정을 부분 수정할 수 있게 한다.
func (s *TripService) UpdateSchedule(tripID, scheduleID, ownerID string, req dto.UpdateScheduleRequest) (dto.ScheduleResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return dto.ScheduleResponse{}, err
	}
	schedule, err := s.tripRepository.FindSchedule(tripID, scheduleID)
	if err != nil {
		return dto.ScheduleResponse{}, mapRepositoryError(err)
	}

	// PATCH 요청은 전달된 필드만 바꾸고, 누락된 필드는 기존 일정 값을 유지한다.
	if req.PlaceID != nil {
		schedule.PlaceID = *req.PlaceID
	}
	if req.Date != nil {
		schedule.Date = *req.Date
	}
	if req.Time != nil {
		schedule.Time = *req.Time
	}
	if req.Type != nil {
		schedule.Type = *req.Type
	}
	if req.Title != nil {
		schedule.Title = *req.Title
	}
	if req.TransportMemo != nil {
		schedule.TransportMemo = *req.TransportMemo
	}
	if req.GuideMemo != nil {
		schedule.GuideMemo = *req.GuideMemo
	}

	// 수정 후에도 일정 화면의 핵심 필드는 비어 있으면 안 된다.
	if schedule.Date == "" || schedule.Time == "" || schedule.Type == "" || schedule.Title == "" {
		return dto.ScheduleResponse{}, ErrInvalidTrip
	}
	if err := s.tripRepository.UpdateSchedule(schedule); err != nil {
		return dto.ScheduleResponse{}, mapRepositoryError(err)
	}
	return mapScheduleResponse(schedule), nil
}

func (s *TripService) DeleteSchedule(tripID, scheduleID, ownerID string) error {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return err
	}
	if err := s.tripRepository.DeleteSchedule(tripID, scheduleID); err != nil {
		return mapRepositoryError(err)
	}
	return nil
}

func (s *TripService) CreatePlace(tripID, ownerID string, req dto.CreatePlaceRequest) (dto.PlaceResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return dto.PlaceResponse{}, err
	}
	if req.Name == "" || req.Category == "" {
		return dto.PlaceResponse{}, ErrInvalidTrip
	}
	id, err := newID()
	if err != nil {
		return dto.PlaceResponse{}, err
	}
	place := model.Place{
		ID:                id,
		TripID:            tripID,
		Name:              req.Name,
		Category:          req.Category,
		Address:           req.Address,
		GoogleMapsURL:     req.GoogleMapsURL,
		RecommendedReason: req.RecommendedReason,
	}
	if err := s.tripRepository.SavePlace(place); err != nil {
		return dto.PlaceResponse{}, err
	}
	return mapPlaceResponse(place), nil
}

// UpdatePlace는 여행 소유자가 장소 정보를 부분 수정할 때 기존 값을 보존한다.
func (s *TripService) UpdatePlace(tripID, placeID, ownerID string, req dto.UpdatePlaceRequest) (dto.PlaceResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return dto.PlaceResponse{}, err
	}
	place, err := s.tripRepository.FindPlace(tripID, placeID)
	if err != nil {
		return dto.PlaceResponse{}, mapRepositoryError(err)
	}

	// PATCH 요청은 사용자가 편집한 입력만 덮어쓰고, 누락된 값은 현재 장소 정보를 유지한다.
	if req.Name != nil {
		place.Name = *req.Name
	}
	if req.Category != nil {
		place.Category = *req.Category
	}
	if req.Address != nil {
		place.Address = *req.Address
	}
	if req.GoogleMapsURL != nil {
		place.GoogleMapsURL = *req.GoogleMapsURL
	}
	if req.RecommendedReason != nil {
		place.RecommendedReason = *req.RecommendedReason
	}

	// 장소 카드가 화면에 의미 있게 표시되려면 이름과 분류는 수정 후에도 필수다.
	if place.Name == "" || place.Category == "" {
		return dto.PlaceResponse{}, ErrInvalidTrip
	}
	if err := s.tripRepository.UpdatePlace(place); err != nil {
		return dto.PlaceResponse{}, mapRepositoryError(err)
	}
	return mapPlaceResponse(place), nil
}

func (s *TripService) ListPlaces(tripID string) ([]dto.PlaceResponse, error) {
	places, err := s.tripRepository.FindPlaces(tripID)
	if err != nil {
		return nil, mapRepositoryError(err)
	}

	responses := make([]dto.PlaceResponse, 0, len(places))
	for _, place := range places {
		responses = append(responses, mapPlaceResponse(place))
	}
	return responses, nil
}

func (s *TripService) ListPlacesForOwner(tripID, ownerID string) ([]dto.PlaceResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return nil, err
	}
	return s.ListPlaces(tripID)
}

func (s *TripService) DeletePlace(tripID, placeID, ownerID string) error {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return err
	}
	if err := s.tripRepository.DeletePlace(tripID, placeID); err != nil {
		return mapRepositoryError(err)
	}
	return nil
}

func (s *TripService) CreateFlight(tripID, ownerID string, req dto.CreateFlightRequest) (dto.FlightResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return dto.FlightResponse{}, err
	}
	if req.Direction == "" || req.Label == "" || req.DepartureAirport == "" || req.ArrivalAirport == "" ||
		req.DepartureDate == "" || req.DepartureTime == "" {
		return dto.FlightResponse{}, ErrInvalidTrip
	}
	id, err := newID()
	if err != nil {
		return dto.FlightResponse{}, err
	}
	flight := model.Flight{
		ID:               id,
		TripID:           tripID,
		Direction:        req.Direction,
		Label:            req.Label,
		Airline:          req.Airline,
		FlightNumber:     req.FlightNumber,
		DepartureAirport: req.DepartureAirport,
		ArrivalAirport:   req.ArrivalAirport,
		DepartureDate:    req.DepartureDate,
		DepartureTime:    req.DepartureTime,
		ArrivalDate:      req.ArrivalDate,
		ArrivalTime:      req.ArrivalTime,
		Memo:             req.Memo,
	}
	if err := s.tripRepository.SaveFlight(flight); err != nil {
		return dto.FlightResponse{}, err
	}
	return mapFlightResponse(flight), nil
}

func (s *TripService) ListFlights(tripID string) ([]dto.FlightResponse, error) {
	flights, err := s.tripRepository.FindFlights(tripID)
	if err != nil {
		return nil, mapRepositoryError(err)
	}

	responses := make([]dto.FlightResponse, 0, len(flights))
	for _, flight := range flights {
		responses = append(responses, mapFlightResponse(flight))
	}
	return responses, nil
}

func (s *TripService) ListFlightsForOwner(tripID, ownerID string) ([]dto.FlightResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return nil, err
	}
	return s.ListFlights(tripID)
}

// UpdateFlight는 여행 소유자가 항공편 정보를 부분 수정할 때 기존 값을 보존한다.
func (s *TripService) UpdateFlight(tripID, flightID, ownerID string, req dto.UpdateFlightRequest) (dto.FlightResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return dto.FlightResponse{}, err
	}
	flight, err := s.tripRepository.FindFlight(tripID, flightID)
	if err != nil {
		return dto.FlightResponse{}, mapRepositoryError(err)
	}

	// PATCH 요청은 사용자가 편집한 항공편 필드만 덮어쓰고 나머지는 기존 값을 유지한다.
	if req.Direction != nil {
		flight.Direction = *req.Direction
	}
	if req.Label != nil {
		flight.Label = *req.Label
	}
	if req.Airline != nil {
		flight.Airline = *req.Airline
	}
	if req.FlightNumber != nil {
		flight.FlightNumber = *req.FlightNumber
	}
	if req.DepartureAirport != nil {
		flight.DepartureAirport = *req.DepartureAirport
	}
	if req.ArrivalAirport != nil {
		flight.ArrivalAirport = *req.ArrivalAirport
	}
	if req.DepartureDate != nil {
		flight.DepartureDate = *req.DepartureDate
	}
	if req.DepartureTime != nil {
		flight.DepartureTime = *req.DepartureTime
	}
	if req.ArrivalDate != nil {
		flight.ArrivalDate = *req.ArrivalDate
	}
	if req.ArrivalTime != nil {
		flight.ArrivalTime = *req.ArrivalTime
	}
	if req.Memo != nil {
		flight.Memo = *req.Memo
	}

	// 공유 화면에서 항공편 카드가 성립하려면 핵심 이동 정보는 수정 후에도 비어 있으면 안 된다.
	if flight.Direction == "" || flight.Label == "" || flight.DepartureAirport == "" || flight.ArrivalAirport == "" ||
		flight.DepartureDate == "" || flight.DepartureTime == "" {
		return dto.FlightResponse{}, ErrInvalidTrip
	}
	if err := s.tripRepository.UpdateFlight(flight); err != nil {
		return dto.FlightResponse{}, mapRepositoryError(err)
	}
	return mapFlightResponse(flight), nil
}

func (s *TripService) DeleteFlight(tripID, flightID, ownerID string) error {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return err
	}
	// 항공편 삭제도 여행 소유권을 먼저 확인한 뒤 여행 ID와 항공편 ID를 함께 사용해 경계를 고정한다.
	if err := s.tripRepository.DeleteFlight(tripID, flightID); err != nil {
		return mapRepositoryError(err)
	}
	return nil
}

func (s *TripService) ListRoutes(tripID string) ([]dto.RouteResponse, error) {
	routes, err := s.tripRepository.FindRoutes(tripID)
	if err != nil {
		return nil, mapRepositoryError(err)
	}

	responses := make([]dto.RouteResponse, 0, len(routes))
	for _, route := range routes {
		responses = append(responses, mapRouteResponse(route))
	}
	return responses, nil
}

func (s *TripService) ListRoutesForOwner(tripID, ownerID string) ([]dto.RouteResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return nil, err
	}
	return s.ListRoutes(tripID)
}

func (s *TripService) CreateTrip(ownerID string, req dto.CreateTripRequest) (dto.TripResponse, error) {
	if req.Title == "" || req.StartDate == "" || req.EndDate == "" {
		return dto.TripResponse{}, ErrInvalidTrip
	}
	id, err := newID()
	if err != nil {
		return dto.TripResponse{}, err
	}
	destCountry := req.DestinationCountry
	if destCountry == "" || (destCountry != "JP" && destCountry != "CN") {
		destCountry = "JP"
	}
	trip := model.Trip{
		ID:                 id,
		OwnerID:            ownerID,
		Title:              req.Title,
		StartDate:          req.StartDate,
		EndDate:            req.EndDate,
		Travelers:          req.Travelers,
		DestinationCountry: destCountry,
		Memo:               req.Memo,
	}
	if err := s.tripRepository.Save(trip); err != nil {
		return dto.TripResponse{}, err
	}
	return mapTripResponse(trip), nil
}

func (s *TripService) ListMyTrips(ownerID string) ([]dto.TripResponse, error) {
	trips, err := s.tripRepository.FindByOwner(ownerID)
	if err != nil {
		return nil, err
	}
	responses := make([]dto.TripResponse, 0, len(trips))
	for _, trip := range trips {
		responses = append(responses, mapTripResponse(trip))
	}
	return responses, nil
}

func (s *TripService) UpdateTrip(id, ownerID string, req dto.UpdateTripRequest) (dto.TripResponse, error) {
	trip, err := s.tripRepository.FindTrip(id)
	if err != nil {
		return dto.TripResponse{}, mapRepositoryError(err)
	}
	if !sameID(trip.OwnerID, ownerID) {
		return dto.TripResponse{}, ErrForbidden
	}
	if req.Title != nil {
		trip.Title = *req.Title
	}
	if req.StartDate != nil {
		trip.StartDate = *req.StartDate
	}
	if req.EndDate != nil {
		trip.EndDate = *req.EndDate
	}
	if req.Travelers != nil {
		trip.Travelers = req.Travelers
	}
	if req.DestinationCountry != nil {
		dc := *req.DestinationCountry
		if dc == "" || (dc != "JP" && dc != "CN") {
			dc = "JP"
		}
		trip.DestinationCountry = dc
	}
	if req.Memo != nil {
		trip.Memo = *req.Memo
	}
	if err := s.tripRepository.Update(trip); err != nil {
		return dto.TripResponse{}, mapRepositoryError(err)
	}
	return mapTripResponse(trip), nil
}

func (s *TripService) DeleteTrip(id, ownerID string) error {
	trip, err := s.tripRepository.FindTrip(id)
	if err != nil {
		return mapRepositoryError(err)
	}
	if !sameID(trip.OwnerID, ownerID) {
		return ErrForbidden
	}
	return s.tripRepository.Delete(id)
}

func (s *TripService) ensureTripOwner(tripID, ownerID string) error {
	trip, err := s.tripRepository.FindTrip(tripID)
	if err != nil {
		return mapRepositoryError(err)
	}
	if !sameID(trip.OwnerID, ownerID) {
		return ErrForbidden
	}
	return nil
}

func mapRepositoryError(err error) error {
	if errors.Is(err, repository.ErrNotFound) {
		return ErrTripNotFound
	}
	return err
}

func mapTripResponse(trip model.Trip) dto.TripResponse {
	return dto.TripResponse{
		ID:                 trip.ID,
		Title:              trip.Title,
		StartDate:          trip.StartDate,
		EndDate:            trip.EndDate,
		Travelers:          trip.Travelers,
		DestinationCountry: trip.DestinationCountry,
		Memo:               trip.Memo,
	}
}

func mapPublicTripResponse(trip model.Trip) dto.PublicTripResponse {
	return dto.PublicTripResponse{
		ID:                 trip.ID,
		Title:              trip.Title,
		StartDate:          trip.StartDate,
		EndDate:            trip.EndDate,
		Travelers:          trip.Travelers,
		DestinationCountry: trip.DestinationCountry,
	}
}

func mapShareLinkResponse(link model.ShareLink) dto.ShareLinkResponse {
	res := dto.ShareLinkResponse{
		Token:   link.Token,
		APIPath: "/api/share/" + link.Token,
		WebPath: "/share/" + link.Token,
	}
	if link.ExpiresAt != nil {
		res.ExpiresAt = link.ExpiresAt.Format(time.RFC3339)
	}
	return res
}

func mapScheduleResponse(schedule model.Schedule) dto.ScheduleResponse {
	return dto.ScheduleResponse{
		ID:            schedule.ID,
		PlaceID:       schedule.PlaceID,
		Date:          schedule.Date,
		Time:          schedule.Time,
		Type:          schedule.Type,
		Title:         schedule.Title,
		TransportMemo: schedule.TransportMemo,
		GuideMemo:     schedule.GuideMemo,
	}
}

func mapPlaceResponse(place model.Place) dto.PlaceResponse {
	return dto.PlaceResponse{
		ID:                place.ID,
		Name:              place.Name,
		Category:          place.Category,
		Address:           place.Address,
		GoogleMapsURL:     place.GoogleMapsURL,
		RecommendedReason: place.RecommendedReason,
	}
}

func mapFlightResponse(flight model.Flight) dto.FlightResponse {
	return dto.FlightResponse{
		ID:               flight.ID,
		Direction:        flight.Direction,
		Label:            flight.Label,
		Airline:          flight.Airline,
		FlightNumber:     flight.FlightNumber,
		DepartureAirport: flight.DepartureAirport,
		ArrivalAirport:   flight.ArrivalAirport,
		DepartureDate:    flight.DepartureDate,
		DepartureTime:    flight.DepartureTime,
		ArrivalDate:      flight.ArrivalDate,
		ArrivalTime:      flight.ArrivalTime,
		Memo:             flight.Memo,
	}
}

func mapRouteResponse(route model.Route) dto.RouteResponse {
	return dto.RouteResponse{
		ID:                route.ID,
		Title:             route.Title,
		Description:       route.Description,
		PlaceIDs:          route.PlaceIDs,
		TransportMemo:     route.TransportMemo,
		EstimatedDuration: route.EstimatedDuration,
	}
}
