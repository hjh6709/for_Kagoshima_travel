package repository

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
)

type PostgresUserRepository struct {
	pool *pgxpool.Pool
	ctx  context.Context
}

func (r *PostgresUserRepository) WithContext(ctx context.Context) UserRepository {
	return &PostgresUserRepository{pool: r.pool, ctx: ctx}
}

func (r *PostgresUserRepository) context() context.Context {
	if r.ctx != nil {
		return r.ctx
	}
	return context.Background()
}

func NewPostgresUserRepository(pool *pgxpool.Pool) *PostgresUserRepository {
	return &PostgresUserRepository{pool: pool}
}

func (r *PostgresUserRepository) FindByEmail(email string) (model.User, error) {
	row := r.pool.QueryRow(r.context(),
		`SELECT id, email, password, token_version, created_at FROM users WHERE email = $1`, email)

	var u model.User
	if err := row.Scan(&u.ID, &u.Email, &u.Password, &u.TokenVersion, &u.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.User{}, ErrNotFound
		}
		return model.User{}, err
	}
	return u, nil
}

func (r *PostgresUserRepository) FindByID(id string) (model.User, error) {
	row := r.pool.QueryRow(r.context(),
		`SELECT id, email, password, token_version, created_at FROM users WHERE id = $1`, id)

	var u model.User
	if err := row.Scan(&u.ID, &u.Email, &u.Password, &u.TokenVersion, &u.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.User{}, ErrNotFound
		}
		return model.User{}, err
	}
	return u, nil
}

func (r *PostgresUserRepository) Save(user model.User) error {
	_, err := r.pool.Exec(r.context(),
		`INSERT INTO users (id, email, password, created_at) VALUES ($1, $2, $3, $4)`,
		user.ID, user.Email, user.Password, user.CreatedAt)
	if err != nil {
		if isDuplicateKeyError(err) {
			return ErrDuplicateEmail
		}
		return err
	}
	return nil
}

func (r *PostgresUserRepository) SaveVerifiedUser(user model.User, purpose, codeHash string, now time.Time) error {
	ctx := r.context()
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(context.WithoutCancel(ctx)) }()

	consumed, err := tx.Exec(ctx, `
		UPDATE auth_verification_challenges
		SET code_hash = '', consumed_at = $5, updated_at = $5
		WHERE email = $1 AND purpose = $2 AND code_hash = $3
		  AND consumed_at IS NULL AND expires_at > $5 AND attempts < $4
	`, user.Email, purpose, codeHash, 5, now)
	if err != nil {
		return err
	}
	if consumed.RowsAffected() == 0 {
		return ErrNotFound
	}
	if _, err := tx.Exec(ctx,
		`INSERT INTO users (id, email, password, token_version, created_at) VALUES ($1, $2, $3, $4, $5)`,
		user.ID, user.Email, user.Password, user.TokenVersion, user.CreatedAt,
	); err != nil {
		if isDuplicateKeyError(err) {
			return ErrDuplicateEmail
		}
		return err
	}
	return tx.Commit(ctx)
}

func (r *PostgresUserRepository) UpdatePassword(email string, passwordHash string) (model.User, error) {
	row := r.pool.QueryRow(r.context(), `
		UPDATE users
		SET password = $1, token_version = token_version + 1
		WHERE email = $2
		RETURNING id, email, password, token_version, created_at
	`, passwordHash, email)

	var u model.User
	if err := row.Scan(&u.ID, &u.Email, &u.Password, &u.TokenVersion, &u.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.User{}, ErrNotFound
		}
		return model.User{}, err
	}
	return u, nil
}

func (r *PostgresUserRepository) ResetVerifiedPassword(
	email, passwordHash, purpose, codeHash string,
	now time.Time,
) (model.User, error) {
	ctx := r.context()
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return model.User{}, err
	}
	defer func() { _ = tx.Rollback(context.WithoutCancel(ctx)) }()

	consumed, err := tx.Exec(ctx, `
		UPDATE auth_verification_challenges
		SET code_hash = '', consumed_at = $5, updated_at = $5
		WHERE email = $1 AND purpose = $2 AND code_hash = $3
		  AND consumed_at IS NULL AND expires_at > $5 AND attempts < $4
	`, email, purpose, codeHash, 5, now)
	if err != nil {
		return model.User{}, err
	}
	if consumed.RowsAffected() == 0 {
		return model.User{}, ErrNotFound
	}

	var user model.User
	if err := tx.QueryRow(ctx, `
		UPDATE users
		SET password = $1, token_version = token_version + 1
		WHERE email = $2
		RETURNING id, email, password, token_version, created_at
	`, passwordHash, email).Scan(&user.ID, &user.Email, &user.Password, &user.TokenVersion, &user.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.User{}, ErrNotFound
		}
		return model.User{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return model.User{}, err
	}
	return user, nil
}

func (r *PostgresUserRepository) DeleteAccount(userID string) error {
	tx, err := r.pool.Begin(r.context())
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(context.WithoutCancel(r.context())) }()

	var email string
	if err := tx.QueryRow(r.context(), `SELECT email FROM users WHERE id = $1 FOR UPDATE`, userID).Scan(&email); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}
	if _, err := tx.Exec(r.context(), `DELETE FROM auth_verification_challenges WHERE email = $1`, email); err != nil {
		return err
	}
	if _, err := tx.Exec(r.context(), `DELETE FROM users WHERE id = $1`, userID); err != nil {
		return err
	}
	return tx.Commit(r.context())
}
