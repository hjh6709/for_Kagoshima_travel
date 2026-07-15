package repository

import (
	"sync"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
)

type MemoryChecklistRepository struct {
	mu    sync.RWMutex
	items []model.ChecklistItem
}

func NewMemoryChecklistRepository() *MemoryChecklistRepository {
	return &MemoryChecklistRepository{
		items: make([]model.ChecklistItem, 0),
	}
}

func (r *MemoryChecklistRepository) Save(item model.ChecklistItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.items = append(r.items, item)
	return nil
}

func (r *MemoryChecklistRepository) SaveAll(items []model.ChecklistItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.items = append(r.items, items...)
	return nil
}

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
