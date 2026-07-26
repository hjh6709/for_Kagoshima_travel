package repository

import "testing"

func TestMemoryTripRepositoryConsumesMonthlyAPIQuotaAtomically(t *testing.T) {
	repo := NewMemoryTripRepository()
	for attempt := 1; attempt <= 2; attempt++ {
		allowed, err := repo.ConsumeMonthlyAPIRequest("google-places", "2026-07-01", 2)
		if err != nil || !allowed {
			t.Fatalf("attempt %d: allowed=%v err=%v", attempt, allowed, err)
		}
	}

	allowed, err := repo.ConsumeMonthlyAPIRequest("google-places", "2026-07-01", 2)
	if err != nil {
		t.Fatalf("over-limit attempt: %v", err)
	}
	if allowed {
		t.Fatal("over-limit attempt was allowed")
	}

	allowed, err = repo.ConsumeMonthlyAPIRequest("google-places", "2026-08-01", 2)
	if err != nil || !allowed {
		t.Fatalf("next month: allowed=%v err=%v", allowed, err)
	}
}
