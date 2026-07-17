package repository

import (
	"sync"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
)

type UserRepository interface {
	FindByEmail(email string) (model.User, error)
	Save(user model.User) error
	UpdatePassword(email string, passwordHash string) error
}

type MemoryUserRepository struct {
	mu    sync.RWMutex
	users []model.User
}

func NewMemoryUserRepository() *MemoryUserRepository {
	return &MemoryUserRepository{}
}

func (r *MemoryUserRepository) FindByEmail(email string) (model.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, u := range r.users {
		if u.Email == email {
			return u, nil
		}
	}
	return model.User{}, ErrNotFound
}

func (r *MemoryUserRepository) Save(user model.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, u := range r.users {
		if u.Email == user.Email {
			return ErrDuplicateEmail
		}
	}
	r.users = append(r.users, user)
	return nil
}

func (r *MemoryUserRepository) UpdatePassword(email string, passwordHash string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, u := range r.users {
		if u.Email == email {
			r.users[i].Password = passwordHash
			return nil
		}
	}
	return ErrNotFound
}
