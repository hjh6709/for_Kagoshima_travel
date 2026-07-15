package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
)

type PostgresChecklistRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresChecklistRepository(pool *pgxpool.Pool) *PostgresChecklistRepository {
	return &PostgresChecklistRepository{pool: pool}
}

func (r *PostgresChecklistRepository) Save(item model.ChecklistItem) error {
	var destCountry *string
	if item.DestinationCountry != "" {
		destCountry = &item.DestinationCountry
	}

	_, err := r.pool.Exec(context.Background(),
		`INSERT INTO checklists (id, trip_id, category, title, is_completed, custom, destination_country, created_at) 
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		item.ID, item.TripID, item.Category, item.Title, item.IsCompleted, item.Custom, destCountry, item.CreatedAt)
	return err
}

func (r *PostgresChecklistRepository) SaveAll(items []model.ChecklistItem) error {
	ctx := context.Background()
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, item := range items {
		var destCountry *string
		if item.DestinationCountry != "" {
			destCountry = &item.DestinationCountry
		}
		_, err := tx.Exec(ctx,
			`INSERT INTO checklists (id, trip_id, category, title, is_completed, custom, destination_country, created_at) 
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			item.ID, item.TripID, item.Category, item.Title, item.IsCompleted, item.Custom, destCountry, item.CreatedAt)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *PostgresChecklistRepository) FindChecklist(id string) (model.ChecklistItem, error) {
	row := r.pool.QueryRow(context.Background(),
		`SELECT id, trip_id, category, title, is_completed, custom, COALESCE(destination_country, ''), created_at 
		 FROM checklists WHERE id = $1`, id)

	var item model.ChecklistItem
	err := row.Scan(&item.ID, &item.TripID, &item.Category, &item.Title, &item.IsCompleted, &item.Custom, &item.DestinationCountry, &item.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.ChecklistItem{}, ErrNotFound
		}
		return model.ChecklistItem{}, err
	}
	return item, nil
}

func (r *PostgresChecklistRepository) FindByTrip(tripID string) ([]model.ChecklistItem, error) {
	rows, err := r.pool.Query(context.Background(),
		`SELECT id, trip_id, category, title, is_completed, custom, COALESCE(destination_country, ''), created_at 
		 FROM checklists WHERE trip_id = $1 ORDER BY created_at ASC`, tripID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.ChecklistItem
	for rows.Next() {
		var item model.ChecklistItem
		err := rows.Scan(&item.ID, &item.TripID, &item.Category, &item.Title, &item.IsCompleted, &item.Custom, &item.DestinationCountry, &item.CreatedAt)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *PostgresChecklistRepository) Update(item model.ChecklistItem) error {
	var destCountry *string
	if item.DestinationCountry != "" {
		destCountry = &item.DestinationCountry
	}

	_, err := r.pool.Exec(context.Background(),
		`UPDATE checklists SET category = $1, title = $2, is_completed = $3, custom = $4, destination_country = $5 
		 WHERE id = $6`,
		item.Category, item.Title, item.IsCompleted, item.Custom, destCountry, item.ID)
	return err
}

func (r *PostgresChecklistRepository) Delete(id string) error {
	_, err := r.pool.Exec(context.Background(), `DELETE FROM checklists WHERE id = $1`, id)
	return err
}
