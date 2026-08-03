package repository

import (
	"errors"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
)

func TestMapPostgresWriteErrorMapsTripDateConstraints(t *testing.T) {
	for constraintName := range tripDateConstraintNames {
		err := &pgconn.PgError{Code: "23514", ConstraintName: constraintName}
		if got := mapPostgresWriteError(err); !errors.Is(got, ErrTripDateConflict) {
			t.Fatalf("constraint %q mapped to %v", constraintName, got)
		}
	}
}

func TestMapPostgresWriteErrorPreservesUnrelatedConstraint(t *testing.T) {
	err := &pgconn.PgError{Code: "23514", ConstraintName: "unrelated_check"}
	if got := mapPostgresWriteError(err); got != err {
		t.Fatalf("unrelated error mapped to %v", got)
	}
}
