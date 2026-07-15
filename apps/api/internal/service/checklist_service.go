package service

import (
	"errors"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
)

type ChecklistService struct {
	checklistRepository repository.ChecklistRepository
	tripRepository      repository.TripRepository
}

func NewChecklistService(checklistRepository repository.ChecklistRepository, tripRepository repository.TripRepository) *ChecklistService {
	return &ChecklistService{
		checklistRepository: checklistRepository,
		tripRepository:      tripRepository,
	}
}

func (s *ChecklistService) ensureTripOwner(tripID, userID string) error {
	trip, err := s.tripRepository.FindTrip(tripID)
	if err != nil {
		return ErrTripNotFound
	}
	if trip.OwnerID != userID {
		return ErrForbidden
	}
	return nil
}

func (s *ChecklistService) ListChecklist(tripID, userID string) ([]dto.ChecklistItemResponse, error) {
	if err := s.ensureTripOwner(tripID, userID); err != nil {
		return nil, err
	}

	items, err := s.checklistRepository.FindByTrip(tripID)
	if err != nil {
		return nil, err
	}

	responses := make([]dto.ChecklistItemResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, mapChecklistItemResponse(item))
	}
	return responses, nil
}

func (s *ChecklistService) CreateChecklistCustomItem(tripID, userID string, req dto.CreateChecklistItemRequest) (dto.ChecklistItemResponse, error) {
	if err := s.ensureTripOwner(tripID, userID); err != nil {
		return dto.ChecklistItemResponse{}, err
	}
	if req.Title == "" || (req.Category != "before" && req.Category != "airport" && req.Category != "daily" && req.Category != "return") {
		return dto.ChecklistItemResponse{}, errors.New("invalid checklist item input")
	}

	id, err := newID()
	if err != nil {
		return dto.ChecklistItemResponse{}, err
	}

	item := model.ChecklistItem{
		ID:          id,
		TripID:      tripID,
		Category:    req.Category,
		Title:       req.Title,
		IsCompleted: false,
		Custom:      true,
		CreatedAt:   time.Now(),
	}

	if err := s.checklistRepository.Save(item); err != nil {
		return dto.ChecklistItemResponse{}, err
	}
	return mapChecklistItemResponse(item), nil
}

func (s *ChecklistService) UpdateChecklistItem(checklistID, userID string, req dto.UpdateChecklistItemRequest) (dto.ChecklistItemResponse, error) {
	item, err := s.checklistRepository.FindChecklist(checklistID)
	if err != nil {
		return dto.ChecklistItemResponse{}, err
	}

	if err := s.ensureTripOwner(item.TripID, userID); err != nil {
		return dto.ChecklistItemResponse{}, err
	}

	if req.Title != nil {
		item.Title = *req.Title
	}
	if req.IsCompleted != nil {
		item.IsCompleted = *req.IsCompleted
	}

	if err := s.checklistRepository.Update(item); err != nil {
		return dto.ChecklistItemResponse{}, err
	}
	return mapChecklistItemResponse(item), nil
}

func (s *ChecklistService) DeleteChecklistItem(checklistID, userID string) error {
	item, err := s.checklistRepository.FindChecklist(checklistID)
	if err != nil {
		return err
	}

	if err := s.ensureTripOwner(item.TripID, userID); err != nil {
		return err
	}

	return s.checklistRepository.Delete(checklistID)
}

func mapChecklistItemResponse(item model.ChecklistItem) dto.ChecklistItemResponse {
	return dto.ChecklistItemResponse{
		ID:                 item.ID,
		Category:           item.Category,
		Title:              item.Title,
		IsCompleted:        item.IsCompleted,
		Custom:             item.Custom,
		DestinationCountry: item.DestinationCountry,
	}
}
