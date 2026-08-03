package repository

import (
	"context"
	"sync"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
)

type UserRepositoryContextProvider interface {
	WithContext(context.Context) UserRepository
}

type VerifiedUserRepository interface {
	SaveVerifiedUser(user model.User, purpose, codeHash string, now time.Time) error
	ResetVerifiedPassword(email, passwordHash, purpose, codeHash string, now time.Time) (model.User, error)
}

func WithUserRepositoryContext(repo UserRepository, ctx context.Context) UserRepository {
	if contextual, ok := repo.(UserRepositoryContextProvider); ok {
		return contextual.WithContext(ctx)
	}
	return repo
}

type UserRepository interface {
	FindByEmail(email string) (model.User, error)
	FindByID(id string) (model.User, error)
	Save(user model.User) error
	UpdatePassword(email string, passwordHash string) (model.User, error)
	DeleteAccount(userID string) error
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

func (r *MemoryUserRepository) FindByID(id string) (model.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, u := range r.users {
		if u.ID == id {
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

func (r *MemoryUserRepository) UpdatePassword(email string, passwordHash string) (model.User, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, u := range r.users {
		if u.Email == email {
			r.users[i].Password = passwordHash
			r.users[i].TokenVersion++
			return r.users[i], nil
		}
	}
	return model.User{}, ErrNotFound
}

func (r *MemoryUserRepository) DeleteAccount(userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, u := range r.users {
		if u.ID == userID {
			r.users = append(r.users[:i], r.users[i+1:]...)
			return nil
		}
	}
	return ErrNotFound
}
