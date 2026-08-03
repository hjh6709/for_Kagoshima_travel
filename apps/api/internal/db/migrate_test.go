package db

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type recordingExecer struct {
	statements []string
	err        error
}

func (r *recordingExecer) Exec(_ context.Context, sql string, _ ...any) (pgconn.CommandTag, error) {
	r.statements = append(r.statements, sql)
	return pgconn.CommandTag{}, r.err
}

func TestRunMigrationsAppliesCurrentSchemaIdempotently(t *testing.T) {
	execer := &recordingExecer{}

	if err := RunMigrations(context.Background(), execer); err != nil {
		t.Fatalf("RunMigrations() error = %v", err)
	}

	joined := strings.Join(execer.statements, "\n")
	for _, column := range []string{
		"google_place_id",
		"chinese_name",
		"chinese_address",
		"subway_exit",
		"taxi_phrase",
	} {
		want := "ADD COLUMN IF NOT EXISTS " + column
		if !strings.Contains(joined, want) {
			t.Errorf("migration SQL does not contain %q", want)
		}
	}
	if !strings.Contains(joined, "CREATE TABLE IF NOT EXISTS external_api_monthly_usage") {
		t.Error("migration SQL does not create external_api_monthly_usage")
	}
	if !strings.Contains(joined, "CREATE TABLE IF NOT EXISTS auth_verification_challenges") {
		t.Error("migration SQL does not create auth_verification_challenges")
	}
	if !strings.Contains(joined, "ALTER TABLE IF EXISTS trips\n    ADD COLUMN IF NOT EXISTS destination_country") {
		t.Error("migration SQL does not add trips.destination_country for existing databases")
	}
	if !strings.Contains(joined, "ALTER TABLE IF EXISTS checklists\n    ADD COLUMN IF NOT EXISTS destination_country") {
		t.Error("migration SQL does not add checklists.destination_country for existing databases")
	}
	if !strings.Contains(joined, "CREATE TABLE IF NOT EXISTS checklists") {
		t.Error("migration SQL does not create checklists for existing databases")
	}
	if !strings.Contains(joined, "ADD COLUMN IF NOT EXISTS scheduled_date") {
		t.Error("migration SQL does not add checklists.scheduled_date for existing databases")
	}
	if !strings.Contains(joined, "ADD COLUMN IF NOT EXISTS token_version") {
		t.Error("migration SQL does not add users.token_version for existing databases")
	}
	for _, trigger := range []string{
		"schedules_trip_date_guard",
		"checklists_trip_date_guard",
		"trips_dated_items_guard",
	} {
		if !strings.Contains(joined, trigger) {
			t.Errorf("migration SQL does not create %s", trigger)
		}
	}
}

func TestRunMigrationsReportsFailingMigration(t *testing.T) {
	wantErr := errors.New("database unavailable")
	execer := &recordingExecer{err: wantErr}

	err := RunMigrations(context.Background(), execer)
	if !errors.Is(err, wantErr) {
		t.Fatalf("RunMigrations() error = %v, want wrapped %v", err, wantErr)
	}
	if err == nil || !strings.Contains(err.Error(), "add_shanghai_place_fields.sql") {
		t.Fatalf("RunMigrations() error = %v, want migration filename", err)
	}
}

func TestRunMigrationsUpgradesLegacyPlacesSchema(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	ctx := context.Background()
	pool, err := NewPool(databaseURL)
	if err != nil {
		t.Fatalf("NewPool() error = %v", err)
	}
	defer pool.Close()

	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatalf("Begin() error = %v", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	schemaName := fmt.Sprintf("migration_test_%d", time.Now().UnixNano())
	quotedSchema := pgx.Identifier{schemaName}.Sanitize()
	if _, err := tx.Exec(ctx, "CREATE SCHEMA "+quotedSchema); err != nil {
		t.Fatalf("create test schema: %v", err)
	}
	if _, err := tx.Exec(ctx, "SET LOCAL search_path TO "+quotedSchema); err != nil {
		t.Fatalf("set test search_path: %v", err)
	}
	if _, err := tx.Exec(ctx, "CREATE TABLE places (id UUID PRIMARY KEY)"); err != nil {
		t.Fatalf("create legacy places table: %v", err)
	}
	if _, err := tx.Exec(ctx, "CREATE TABLE trips (id UUID PRIMARY KEY)"); err != nil {
		t.Fatalf("create legacy trips table: %v", err)
	}

	// A second run verifies that API restarts do not fail after the migration was applied once.
	for run := 1; run <= 2; run++ {
		if err := RunMigrations(ctx, tx); err != nil {
			t.Fatalf("RunMigrations() run %d error = %v", run, err)
		}
	}

	for _, column := range []string{
		"google_place_id",
		"chinese_name",
		"chinese_address",
		"subway_exit",
		"taxi_phrase",
	} {
		var count int
		err := tx.QueryRow(ctx, `
			SELECT COUNT(*)
			FROM information_schema.columns
			WHERE table_schema = $1 AND table_name = 'places' AND column_name = $2
		`, schemaName, column).Scan(&count)
		if err != nil {
			t.Fatalf("query column %s: %v", column, err)
		}
		if count != 1 {
			t.Errorf("column %s count = %d, want 1", column, count)
		}
	}

	var checklistTableCount int
	if err := tx.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM information_schema.tables
		WHERE table_schema = $1 AND table_name = 'checklists'
	`, schemaName).Scan(&checklistTableCount); err != nil {
		t.Fatalf("query checklists table: %v", err)
	}
	if checklistTableCount != 1 {
		t.Fatalf("checklists table count = %d, want 1", checklistTableCount)
	}

	var scheduledDateColumnCount int
	if err := tx.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM information_schema.columns
		WHERE table_schema = $1 AND table_name = 'checklists' AND column_name = 'scheduled_date'
	`, schemaName).Scan(&scheduledDateColumnCount); err != nil {
		t.Fatalf("query checklists scheduled_date column: %v", err)
	}
	if scheduledDateColumnCount != 1 {
		t.Fatalf("checklists scheduled_date column count = %d, want 1", scheduledDateColumnCount)
	}
}

func TestTripDateInvariantTriggersRejectInvalidWrites(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	ctx := context.Background()
	pool, err := NewPool(databaseURL)
	if err != nil {
		t.Fatalf("NewPool() error = %v", err)
	}
	defer pool.Close()
	if err := RunMigrations(ctx, pool); err != nil {
		t.Fatalf("RunMigrations() error = %v", err)
	}

	tests := []struct {
		name           string
		wantConstraint string
		write          func(context.Context, pgx.Tx, string) error
	}{
		{
			name:           "schedule outside trip",
			wantConstraint: "schedules_within_trip_dates",
			write: func(ctx context.Context, tx pgx.Tx, tripID string) error {
				_, err := tx.Exec(ctx, `INSERT INTO schedules (trip_id, date, time, type, title) VALUES ($1, '2026-08-07', '09:00', 'visit', '기간 밖 일정')`, tripID)
				return err
			},
		},
		{
			name:           "checklist outside trip",
			wantConstraint: "checklists_within_trip_dates",
			write: func(ctx context.Context, tx pgx.Tx, tripID string) error {
				_, err := tx.Exec(ctx, `INSERT INTO checklists (trip_id, category, title, scheduled_date) VALUES ($1, 'daily', '기간 밖 준비물', '2026-08-07')`, tripID)
				return err
			},
		},
		{
			name:           "trip shrink excludes schedule",
			wantConstraint: "trip_contains_dated_items",
			write: func(ctx context.Context, tx pgx.Tx, tripID string) error {
				if _, err := tx.Exec(ctx, `INSERT INTO schedules (trip_id, date, time, type, title) VALUES ($1, '2026-08-06', '09:00', 'visit', '마지막 날 일정')`, tripID); err != nil {
					return err
				}
				_, err := tx.Exec(ctx, `UPDATE trips SET end_date = '2026-08-05' WHERE id = $1`, tripID)
				return err
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tx, err := pool.Begin(ctx)
			if err != nil {
				t.Fatalf("Begin() error = %v", err)
			}
			defer func() { _ = tx.Rollback(ctx) }()

			var ownerID string
			if err := tx.QueryRow(ctx,
				`INSERT INTO users (email, password) VALUES ($1, 'hash') RETURNING id::text`,
				fmt.Sprintf("date-trigger-%d@example.com", time.Now().UnixNano()),
			).Scan(&ownerID); err != nil {
				t.Fatalf("insert owner: %v", err)
			}
			var tripID string
			if err := tx.QueryRow(ctx,
				`INSERT INTO trips (owner_id, title, start_date, end_date) VALUES ($1, '상하이 여행', '2026-08-03', '2026-08-06') RETURNING id::text`,
				ownerID,
			).Scan(&tripID); err != nil {
				t.Fatalf("insert trip: %v", err)
			}

			err = tt.write(ctx, tx, tripID)
			var postgresError *pgconn.PgError
			if !errors.As(err, &postgresError) {
				t.Fatalf("write error = %v, want PostgreSQL constraint error", err)
			}
			if postgresError.ConstraintName != tt.wantConstraint {
				t.Fatalf("constraint = %q, want %q", postgresError.ConstraintName, tt.wantConstraint)
			}
		})
	}
}
