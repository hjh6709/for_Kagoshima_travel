package repository

import (
	"sync"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
)

// MemoryChecklistRepository는 데이터베이스 연결이 없거나 테스트 실행 시에 동작하는
// 스레드 세이프(Thread-safe)한 인메모리 준비물 데이터 저장소 구현체입니다.
type MemoryChecklistRepository struct {
	mu    sync.RWMutex          // 동시성 접근 제어를 위한 RWMutex
	items []model.ChecklistItem // 준비물 데이터를 담는 메모리 슬라이스
}

// NewMemoryChecklistRepository는 MemoryChecklistRepository를 초기화하여 반환합니다.
func NewMemoryChecklistRepository() *MemoryChecklistRepository {
	return &MemoryChecklistRepository{
		items: make([]model.ChecklistItem, 0),
	}
}

// Save는 메모리 슬라이스에 새로운 준비물 항목을 덧붙여 저장합니다.
func (r *MemoryChecklistRepository) Save(item model.ChecklistItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.items = append(r.items, item)
	return nil
}

// SaveAll은 여러 항목을 메모리 슬라이스에 벌크로 추가합니다.
func (r *MemoryChecklistRepository) SaveAll(items []model.ChecklistItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.items = append(r.items, items...)
	return nil
}

// FindChecklist는 메모리 슬라이스에서 일치하는 ID의 준비물 데이터를 선형 검색으로 조회합니다.
func (r *MemoryChecklistRepository) FindChecklist(id string) (model.ChecklistItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, item := range r.items {
		if item.ID == id {
			return item, nil
		}
	}
	return model.ChecklistItem{}, ErrNotFound
}

// FindByTrip은 특정 여행 ID에 묶인 전체 준비물들을 검색해서 슬라이스로 모아 반환합니다.
func (r *MemoryChecklistRepository) FindByTrip(tripID string) ([]model.ChecklistItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []model.ChecklistItem
	for _, item := range r.items {
		if item.TripID == tripID {
			result = append(result, item)
		}
	}
	return result, nil
}

// Update는 메모리 슬라이스 내 매칭되는 기존 항목을 찾아 새로운 상태의 구조체로 덮어씁니다.
func (r *MemoryChecklistRepository) Update(item model.ChecklistItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, existing := range r.items {
		if existing.ID == item.ID {
			r.items[i] = item
			return nil
		}
	}
	return ErrNotFound
}

// Delete는 메모리 슬라이스 내 매칭되는 ID의 인덱스를 찾아 슬라이스 슬라이싱 연산으로 항목을 제거합니다.
func (r *MemoryChecklistRepository) Delete(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, item := range r.items {
		if item.ID == id {
			r.items = append(r.items[:i], r.items[i+1:]...)
			return nil
		}
	}
	return ErrNotFound
}
