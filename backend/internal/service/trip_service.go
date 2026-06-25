package service

import (
	"errors"
	"strings"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/repository"
)

var (
	ErrTripNotFound   = errors.New("trip not found")
	ErrShareNotFound  = errors.New("share link not found")
	ErrForbidden      = errors.New("forbidden")
	ErrInvalidTrip    = errors.New("invalid trip input")
	ErrInvalidExpense = errors.New("invalid expense input")
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
	routes, err := s.ListRoutes(link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, err
	}
	expenseSummaries, err := s.ListExpenseSummaries(link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, err
	}

	return dto.SharedTripResponse{
		Trip:             mapPublicTripResponse(trip),
		Schedules:        schedules,
		Places:           places,
		Routes:           routes,
		ExpenseSummaries: expenseSummaries,
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

func (s *TripService) ListExpenseSummaries(tripID string) ([]dto.ExpenseSummaryResponse, error) {
	summaries, err := s.tripRepository.FindExpenseSummaries(tripID)
	if err != nil {
		return nil, mapRepositoryError(err)
	}

	responses := make([]dto.ExpenseSummaryResponse, 0, len(summaries))
	for _, summary := range summaries {
		responses = append(responses, mapExpenseSummaryResponse(summary))
	}
	return responses, nil
}

func (s *TripService) ListExpenseSummariesForOwner(tripID, ownerID string) ([]dto.ExpenseSummaryResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return nil, err
	}
	return s.ListExpenseSummaries(tripID)
}

func (s *TripService) ReplaceExpenseSummaries(tripID, ownerID string, req dto.ReplaceExpenseSummariesRequest) ([]dto.ExpenseSummaryResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return nil, err
	}

	now := time.Now().Format(time.RFC3339)
	summaries := make([]model.ExpenseSummary, 0, len(req.Items))
	for index, item := range req.Items {
		label := strings.TrimSpace(item.Label)
		currency := strings.ToUpper(strings.TrimSpace(item.Currency))
		if label == "" || currency == "" || item.Amount < 0 {
			return nil, ErrInvalidExpense
		}

		id := strings.TrimSpace(item.ID)
		if id == "" {
			generatedID, err := newID()
			if err != nil {
				return nil, err
			}
			id = generatedID
		}

		summaries = append(summaries, model.ExpenseSummary{
			ID:        id,
			TripID:    tripID,
			Label:     label,
			Currency:  currency,
			Amount:    item.Amount,
			Note:      strings.TrimSpace(item.Note),
			UpdatedAt: now,
			SortOrder: index,
		})
	}

	if err := s.tripRepository.ReplaceExpenseSummaries(tripID, summaries); err != nil {
		return nil, err
	}

	responses := make([]dto.ExpenseSummaryResponse, 0, len(summaries))
	for _, summary := range summaries {
		responses = append(responses, mapExpenseSummaryResponse(summary))
	}
	return responses, nil
}

func (s *TripService) CreateTrip(ownerID string, req dto.CreateTripRequest) (dto.TripResponse, error) {
	if req.Title == "" || req.StartDate == "" || req.EndDate == "" {
		return dto.TripResponse{}, ErrInvalidTrip
	}
	id, err := newID()
	if err != nil {
		return dto.TripResponse{}, err
	}
	trip := model.Trip{
		ID:        id,
		OwnerID:   ownerID,
		Title:     req.Title,
		StartDate: req.StartDate,
		EndDate:   req.EndDate,
		Travelers: req.Travelers,
		Memo:      req.Memo,
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
		ID:        trip.ID,
		Title:     trip.Title,
		StartDate: trip.StartDate,
		EndDate:   trip.EndDate,
		Travelers: trip.Travelers,
		Memo:      trip.Memo,
	}
}

func mapPublicTripResponse(trip model.Trip) dto.PublicTripResponse {
	return dto.PublicTripResponse{
		ID:        trip.ID,
		Title:     trip.Title,
		StartDate: trip.StartDate,
		EndDate:   trip.EndDate,
		Travelers: trip.Travelers,
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

func mapExpenseSummaryResponse(summary model.ExpenseSummary) dto.ExpenseSummaryResponse {
	return dto.ExpenseSummaryResponse{
		ID:        summary.ID,
		Label:     summary.Label,
		Currency:  summary.Currency,
		Amount:    summary.Amount,
		Note:      summary.Note,
		UpdatedAt: summary.UpdatedAt,
	}
}
