package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/model"
)

type PostgresUserRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresUserRepository(pool *pgxpool.Pool) *PostgresUserRepository {
	return &PostgresUserRepository{pool: pool}
}

func (r *PostgresUserRepository) FindByEmail(email string) (model.User, error) {
	row := r.pool.QueryRow(context.Background(),
		`SELECT id, email, password, created_at FROM users WHERE email = $1`, email)

	var u model.User
	if err := row.Scan(&u.ID, &u.Email, &u.Password, &u.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.User{}, ErrNotFound
		}
		return model.User{}, err
	}
	return u, nil
}

func (r *PostgresUserRepository) Save(user model.User) error {
	_, err := r.pool.Exec(context.Background(),
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
