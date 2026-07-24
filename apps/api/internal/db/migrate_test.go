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

func TestRunMigrationsAddsShanghaiPlaceColumnsIdempotently(t *testing.T) {
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
}
