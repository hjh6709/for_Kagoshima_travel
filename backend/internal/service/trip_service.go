package service

import (
	"errors"

	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/repository"
)

var ErrTripNotFound = errors.New("trip not found")

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

func mapRepositoryError(err error) error {
	if errors.Is(err, repository.ErrNotFound) {
		return ErrTripNotFound
	}
	return err
}

func mapTripResponse(trip model.Trip) dto.TripResponse {
	return dto.TripResponse{
		ID:        trip.ID,
		Title:     trip.Title,
		StartDate: trip.StartDate,
		EndDate:   trip.EndDate,
		Travelers: trip.Travelers,
		Memo:      trip.Memo,
	}
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
		ParentMemo:    schedule.ParentMemo,
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
