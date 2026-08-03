package repository

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

var tripDateConstraintNames = map[string]struct{}{
	"checklists_within_trip_dates": {},
	"schedules_within_trip_dates":  {},
	"trip_contains_dated_items":    {},
}

func mapPostgresWriteError(err error) error {
	if err == nil {
		return nil
	}
	var postgresError *pgconn.PgError
	if errors.As(err, &postgresError) && postgresError.Code == "23514" {
		if _, ok := tripDateConstraintNames[postgresError.ConstraintName]; ok {
			return ErrTripDateConflict
		}
	}
	return err
}
