package service

import (
	"context"
	"errors"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
)

// ChecklistService는 준비물(Checklist) 관련 비즈니스 로직을 처리하는 서비스 구조체입니다.
// 여행 소유자 인가(ensureTripOwner) 가드를 사용하여 비인가 접근을 원격 제어합니다.
type ChecklistService struct {
	checklistRepository repository.ChecklistRepository
	tripRepository      repository.TripRepository
}

// NewChecklistService는 ChecklistService의 새로운 생성자 인스턴스를 반환합니다.
func NewChecklistService(checklistRepository repository.ChecklistRepository, tripRepository repository.TripRepository) *ChecklistService {
	return &ChecklistService{
		checklistRepository: checklistRepository,
		tripRepository:      tripRepository,
	}
}

// ensureTripOwner는 특정 여행 ID의 소유자(Owner)가 로그인한 사용자(userID)인지 검증하는 내부 도우미 메서드입니다.
// 일치하지 않으면 ErrForbidden(403) 또는 ErrTripNotFound(404) 에러를 반환합니다.
func (s *ChecklistService) ensureTripOwner(ctx context.Context, tripID, userID string) error {
	trip, err := s.tripRepository.FindTrip(tripID)
	if err != nil {
		return ErrTripNotFound
	}
	if trip.OwnerID != userID {
		return ErrForbidden
	}
	return nil
}

// ListChecklist는 특정 여행 ID에 등록된 준비물 목록을 조회하여 DTO 배열 규격으로 가공한 뒤 반환합니다.
func (s *ChecklistService) ListChecklist(ctx context.Context, tripID, userID string) ([]dto.ChecklistItemResponse, error) {
	if err := s.ensureTripOwner(ctx, tripID, userID); err != nil {
		return nil, err
	}

	items, err := s.checklistRepository.FindByTrip(ctx, tripID)
	if err != nil {
		return nil, err
	}

	responses := make([]dto.ChecklistItemResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, mapChecklistItemResponse(item))
	}
	return responses, nil
}

// CreateChecklistCustomItem은 여행 소유자가 수동으로 입력한 커스텀 준비물 항목을 유효성 검증 후 DB에 생성 및 저장합니다.
func (s *ChecklistService) CreateChecklistCustomItem(ctx context.Context, tripID, userID string, req dto.CreateChecklistItemRequest) (dto.ChecklistItemResponse, error) {
	if err := s.ensureTripOwner(ctx, tripID, userID); err != nil {
		return dto.ChecklistItemResponse{}, err
	}
	// 카테고리 유효성 및 타이틀 공백 검증
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

	if err := s.checklistRepository.Save(ctx, item); err != nil {
		return dto.ChecklistItemResponse{}, err
	}
	return mapChecklistItemResponse(item), nil
}

// UpdateChecklistItem은 기존 준비물 레코드의 체크 완료 여부(isCompleted) 또는 타이틀을 변경 처리합니다.
func (s *ChecklistService) UpdateChecklistItem(ctx context.Context, checklistID, userID string, req dto.UpdateChecklistItemRequest) (dto.ChecklistItemResponse, error) {
	item, err := s.checklistRepository.FindChecklist(ctx, checklistID)
	if err != nil {
		return dto.ChecklistItemResponse{}, err
	}

	if err := s.ensureTripOwner(ctx, item.TripID, userID); err != nil {
		return dto.ChecklistItemResponse{}, err
	}

	// PATCH 스펙을 고려하여 전달된 선택 항목만 부분 변경 적용
	if req.Title != nil {
		item.Title = *req.Title
	}
	if req.IsCompleted != nil {
		item.IsCompleted = *req.IsCompleted
	}

	if err := s.checklistRepository.Update(ctx, item); err != nil {
		return dto.ChecklistItemResponse{}, err
	}
	return mapChecklistItemResponse(item), nil
}

// DeleteChecklistItem은 지정한 준비물 항목을 인가 검증 후 완전히 삭제합니다.
func (s *ChecklistService) DeleteChecklistItem(ctx context.Context, checklistID, userID string) error {
	item, err := s.checklistRepository.FindChecklist(ctx, checklistID)
	if err != nil {
		return err
	}

	if err := s.ensureTripOwner(ctx, item.TripID, userID); err != nil {
		return err
	}

	return s.checklistRepository.Delete(ctx, checklistID)
}

// mapChecklistItemResponse는 도메인 모델 ChecklistItem 구조체를 DTO ChecklistItemResponse 구조체로 맵핑합니다.
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
