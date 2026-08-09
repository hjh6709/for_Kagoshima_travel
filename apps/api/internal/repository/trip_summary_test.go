package repository

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/db"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
)

func TestMemoryTripRepositoryFindSummariesByOwnerIncludesChildCounts(t *testing.T) {
	repo := NewMemoryTripRepository()
	const (
		ownerID = "summary-owner"
		tripID  = "summary-trip"
	)

	if err := repo.Save(model.Trip{ID: tripID, OwnerID: ownerID, Title: "상하이 여행"}); err != nil {
		t.Fatalf("Save() error = %v", err)
	}
	for _, placeID := range []string{"place-1", "place-2"} {
		if err := repo.SavePlace(model.Place{ID: placeID, TripID: tripID, Name: placeID}); err != nil {
			t.Fatalf("SavePlace() error = %v", err)
		}
	}
	if err := repo.SaveSchedule(model.Schedule{ID: "schedule-1", TripID: tripID}); err != nil {
		t.Fatalf("SaveSchedule() error = %v", err)
	}

	summaries, err := repo.FindSummariesByOwner(ownerID)
	if err != nil {
		t.Fatalf("FindSummariesByOwner() error = %v", err)
	}
	if len(summaries) != 1 {
		t.Fatalf("len(summaries) = %d, want 1", len(summaries))
	}
	if summaries[0].Trip.ID != tripID {
		t.Errorf("Trip.ID = %q, want %q", summaries[0].Trip.ID, tripID)
	}
	if summaries[0].PlaceCount != 2 || summaries[0].ScheduleCount != 1 || summaries[0].FlightCount != 0 {
		t.Errorf(
			"counts = (%d, %d, %d), want (2, 1, 0)",
			summaries[0].PlaceCount,
			summaries[0].ScheduleCount,
			summaries[0].FlightCount,
		)
	}
}

func TestPostgresTripRepositoryFindSummariesByOwnerUsesAggregateCounts(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	ctx := context.Background()
	pool, err := db.NewPool(databaseURL)
	if err != nil {
		t.Fatalf("NewPool() error = %v", err)
	}
	t.Cleanup(pool.Close)
	if err := db.RunMigrations(ctx, pool); err != nil {
		t.Fatalf("RunMigrations() error = %v", err)
	}

	var ownerID string
	email := fmt.Sprintf("trip-summary-%d@example.com", time.Now().UnixNano())
	if err := pool.QueryRow(ctx,
		`INSERT INTO users (email, password) VALUES ($1, 'hash') RETURNING id::text`,
		email,
	).Scan(&ownerID); err != nil {
		t.Fatalf("insert owner: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), `DELETE FROM users WHERE id = $1`, ownerID)
	})

	var tripID string
	if err := pool.QueryRow(ctx, `
		INSERT INTO trips (owner_id, title, start_date, end_date, destination_country)
		VALUES ($1, '상하이 여행', '2026-08-23', '2026-08-26', 'CN')
		RETURNING id::text
	`, ownerID).Scan(&tripID); err != nil {
		t.Fatalf("insert trip: %v", err)
	}

	for _, name := range []string{"푸둥공항", "인민광장"} {
		if _, err := pool.Exec(ctx,
			`INSERT INTO places (trip_id, name, category) VALUES ($1, $2, 'sightseeing')`,
			tripID,
			name,
		); err != nil {
			t.Fatalf("insert place: %v", err)
		}
	}
	if _, err := pool.Exec(ctx, `
		INSERT INTO schedules (trip_id, date, time, type, title)
		VALUES ($1, '2026-08-23', '11:00', 'move', '푸둥공항 도착')
	`, tripID); err != nil {
		t.Fatalf("insert schedule: %v", err)
	}
	if _, err := pool.Exec(ctx, `
		INSERT INTO flights (
			trip_id, direction, label, departure_airport, arrival_airport,
			departure_date, departure_time
		) VALUES ($1, 'departure', '출국', 'ICN', 'PVG', '2026-08-23', '08:00')
	`, tripID); err != nil {
		t.Fatalf("insert flight: %v", err)
	}

	summaries, err := NewPostgresTripRepository(pool).FindSummariesByOwner(ownerID)
	if err != nil {
		t.Fatalf("FindSummariesByOwner() error = %v", err)
	}
	if len(summaries) != 1 {
		t.Fatalf("len(summaries) = %d, want 1", len(summaries))
	}
	if summaries[0].PlaceCount != 2 || summaries[0].ScheduleCount != 1 || summaries[0].FlightCount != 1 {
		t.Errorf(
			"counts = (%d, %d, %d), want (2, 1, 1)",
			summaries[0].PlaceCount,
			summaries[0].ScheduleCount,
			summaries[0].FlightCount,
		)
	}
}
