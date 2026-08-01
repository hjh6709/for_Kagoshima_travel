package repository

import (
	"errors"
	"sync"
	"time"
)

var ErrVerificationRateLimit = errors.New("verification send rate limit exceeded")

type VerificationChallenge struct {
	Email        string
	Purpose      string
	CodeHash     string
	ExpiresAt    time.Time
	Attempts     int
	RequestCount int
	RequestDate  string
	ConsumedAt   *time.Time
}

type VerificationRepository interface {
	Issue(email, purpose, codeHash string, expiresAt, now time.Time, dailyLimit int) error
	Find(email, purpose string) (VerificationChallenge, error)
	RecordFailedAttempt(email, purpose string, now time.Time) (int, error)
	Consume(email, purpose, codeHash string, now time.Time) error
}

type MemoryVerificationRepository struct {
	mu         sync.RWMutex
	challenges map[string]VerificationChallenge
}

func NewMemoryVerificationRepository() *MemoryVerificationRepository {
	return &MemoryVerificationRepository{challenges: make(map[string]VerificationChallenge)}
}

func verificationKey(email, purpose string) string {
	return email + "\x00" + purpose
}

func (r *MemoryVerificationRepository) Issue(
	email, purpose, codeHash string,
	expiresAt, now time.Time,
	dailyLimit int,
) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := verificationKey(email, purpose)
	requestDate := now.UTC().Format("2006-01-02")
	requestCount := 1
	if current, ok := r.challenges[key]; ok && current.RequestDate == requestDate {
		if current.RequestCount >= dailyLimit {
			return ErrVerificationRateLimit
		}
		requestCount = current.RequestCount + 1
	}

	r.challenges[key] = VerificationChallenge{
		Email:        email,
		Purpose:      purpose,
		CodeHash:     codeHash,
		ExpiresAt:    expiresAt,
		RequestCount: requestCount,
		RequestDate:  requestDate,
	}
	return nil
}

func (r *MemoryVerificationRepository) Find(email, purpose string) (VerificationChallenge, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	challenge, ok := r.challenges[verificationKey(email, purpose)]
	if !ok {
		return VerificationChallenge{}, ErrNotFound
	}
	return challenge, nil
}

func (r *MemoryVerificationRepository) RecordFailedAttempt(email, purpose string, now time.Time) (int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := verificationKey(email, purpose)
	challenge, ok := r.challenges[key]
	if !ok {
		return 0, ErrNotFound
	}
	challenge.Attempts++
	r.challenges[key] = challenge
	return challenge.Attempts, nil
}

func (r *MemoryVerificationRepository) Consume(email, purpose, codeHash string, now time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := verificationKey(email, purpose)
	challenge, ok := r.challenges[key]
	if !ok || challenge.ConsumedAt != nil || challenge.CodeHash != codeHash {
		return ErrNotFound
	}
	consumedAt := now
	challenge.ConsumedAt = &consumedAt
	challenge.CodeHash = ""
	r.challenges[key] = challenge
	return nil
}
