package repository

import "github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"

type ChecklistRepository interface {
	Save(item model.ChecklistItem) error
	SaveAll(items []model.ChecklistItem) error
	FindChecklist(id string) (model.ChecklistItem, error)
	FindByTrip(tripID string) ([]model.ChecklistItem, error)
	Update(item model.ChecklistItem) error
	Delete(id string) error
}
