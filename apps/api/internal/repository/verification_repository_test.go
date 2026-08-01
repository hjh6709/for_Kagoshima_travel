package repository

import (
	"errors"
	"testing"
	"time"
)

func TestMemoryVerificationRepositoryConsumesOnlyMatchingUnusedCode(t *testing.T) {
	repo := NewMemoryVerificationRepository()
	now := time.Now()
	if err := repo.Issue("traveler@example.com", "forgot", "expected-hash", now.Add(5*time.Minute), now, 3); err != nil {
		t.Fatalf("Issue: %v", err)
	}

	if err := repo.Consume("traveler@example.com", "forgot", "wrong-hash", now); !errors.Is(err, ErrNotFound) {
		t.Fatalf("Consume wrong hash = %v, want ErrNotFound", err)
	}
	if err := repo.Consume("traveler@example.com", "forgot", "expected-hash", now); err != nil {
		t.Fatalf("Consume matching hash: %v", err)
	}
	if err := repo.Consume("traveler@example.com", "forgot", "expected-hash", now); !errors.Is(err, ErrNotFound) {
		t.Fatalf("Consume reused hash = %v, want ErrNotFound", err)
	}
}
