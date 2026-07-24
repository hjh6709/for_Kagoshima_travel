package db

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"path/filepath"

	"github.com/jackc/pgx/v5/pgconn"
)

// migrationFiles contains small, repeatable schema upgrades that must also work
// against an already initialized production database.
//
//go:embed migrations/*.sql
var migrationFiles embed.FS

type migrationExecer interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
}

// RunMigrations applies every embedded SQL migration in filename order.
// Each migration must be idempotent because it runs at every API startup.
func RunMigrations(ctx context.Context, db migrationExecer) error {
	entries, err := fs.ReadDir(migrationFiles, "migrations")
	if err != nil {
		return fmt.Errorf("read embedded migrations: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".sql" {
			continue
		}

		path := "migrations/" + entry.Name()
		query, err := migrationFiles.ReadFile(path)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", entry.Name(), err)
		}
		if _, err := db.Exec(ctx, string(query)); err != nil {
			return fmt.Errorf("apply migration %s: %w", entry.Name(), err)
		}
	}

	return nil
}
