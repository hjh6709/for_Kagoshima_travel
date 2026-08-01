package repository

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresVerificationRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresVerificationRepository(pool *pgxpool.Pool) *PostgresVerificationRepository {
	return &PostgresVerificationRepository{pool: pool}
}

func (r *PostgresVerificationRepository) Issue(
	email, purpose, codeHash string,
	expiresAt, now time.Time,
	dailyLimit int,
) error {
	commandTag, err := r.pool.Exec(context.Background(), `
		INSERT INTO auth_verification_challenges (
			email, purpose, code_hash, expires_at, attempts, request_count, request_date, consumed_at, updated_at
		) VALUES ($1, $2, $3, $4, 0, 1, ($5 AT TIME ZONE 'UTC')::date, NULL, $5)
		ON CONFLICT (email, purpose) DO UPDATE SET
			code_hash = EXCLUDED.code_hash,
			expires_at = EXCLUDED.expires_at,
			attempts = 0,
			request_count = CASE
				WHEN auth_verification_challenges.request_date = EXCLUDED.request_date
				THEN auth_verification_challenges.request_count + 1
				ELSE 1
			END,
			request_date = EXCLUDED.request_date,
			consumed_at = NULL,
			updated_at = EXCLUDED.updated_at
		WHERE auth_verification_challenges.request_date <> EXCLUDED.request_date
		   OR auth_verification_challenges.request_count < $6
	`, email, purpose, codeHash, expiresAt, now, dailyLimit)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return ErrVerificationRateLimit
	}
	return nil
}

func (r *PostgresVerificationRepository) Find(email, purpose string) (VerificationChallenge, error) {
	row := r.pool.QueryRow(context.Background(), `
		SELECT email, purpose, code_hash, expires_at, attempts, request_count, request_date::text, consumed_at
		FROM auth_verification_challenges
		WHERE email = $1 AND purpose = $2
	`, email, purpose)

	var challenge VerificationChallenge
	if err := row.Scan(
		&challenge.Email,
		&challenge.Purpose,
		&challenge.CodeHash,
		&challenge.ExpiresAt,
		&challenge.Attempts,
		&challenge.RequestCount,
		&challenge.RequestDate,
		&challenge.ConsumedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return VerificationChallenge{}, ErrNotFound
		}
		return VerificationChallenge{}, err
	}
	return challenge, nil
}

func (r *PostgresVerificationRepository) RecordFailedAttempt(email, purpose string, now time.Time) (int, error) {
	var attempts int
	err := r.pool.QueryRow(context.Background(), `
		UPDATE auth_verification_challenges
		SET attempts = attempts + 1, updated_at = $3
		WHERE email = $1 AND purpose = $2
		RETURNING attempts
	`, email, purpose, now).Scan(&attempts)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrNotFound
	}
	return attempts, err
}

func (r *PostgresVerificationRepository) Consume(email, purpose, codeHash string, now time.Time) error {
	commandTag, err := r.pool.Exec(context.Background(), `
		UPDATE auth_verification_challenges
		SET code_hash = '', consumed_at = $4, updated_at = $4
		WHERE email = $1 AND purpose = $2 AND code_hash = $3 AND consumed_at IS NULL
	`, email, purpose, codeHash, now)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
