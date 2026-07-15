package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
)

// PostgresChecklistRepository는 pgx connection pool을 기반으로 PostgreSQL 데이터베이스와 통신하여
// checklists 테이블 데이터를 조작하는 실제 DB 리포지토리 구현체입니다.
type PostgresChecklistRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresChecklistRepository는 PostgresChecklistRepository의 새로운 생성자 인스턴스를 반환합니다.
func NewPostgresChecklistRepository(pool *pgxpool.Pool) *PostgresChecklistRepository {
	return &PostgresChecklistRepository{pool: pool}
}

// toNullableString은 빈 문자열일 때 데이터베이스 NULL 주입을 위해 nil 포인터로 변환해주는 DRY 헬퍼 함수입니다.
func toNullableString(val string) *string {
	if val == "" {
		return nil
	}
	return &val
}

// Save는 하나의 신규 준비물 레코드를 PostgreSQL에 삽입합니다.
func (r *PostgresChecklistRepository) Save(ctx context.Context, item model.ChecklistItem) error {
	destCountry := toNullableString(item.DestinationCountry)

	_, err := r.pool.Exec(ctx,
		`INSERT INTO checklists (id, trip_id, category, title, is_completed, custom, destination_country, created_at) 
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		item.ID, item.TripID, item.Category, item.Title, item.IsCompleted, item.Custom, destCountry, item.CreatedAt)
	return err
}

// SaveAll은 트랜잭션을 구동하여 제공된 여러 준비물 리스트를 벌크로 빠르게 삽입합니다. (여행 첫 생성 시 프리셋 인서트에 사용)
func (r *PostgresChecklistRepository) SaveAll(ctx context.Context, items []model.ChecklistItem) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, item := range items {
		destCountry := toNullableString(item.DestinationCountry)
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

// FindChecklist는 단일 준비물 ID로 checklists 레코드를 조회하여 model.ChecklistItem으로 반환합니다.
func (r *PostgresChecklistRepository) FindChecklist(ctx context.Context, id string) (model.ChecklistItem, error) {
	row := r.pool.QueryRow(ctx,
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

// FindByTrip은 한 여행(trip_id)에 연결된 전체 준비물 항목 목록을 가져옵니다. 생성 시간 순서로 정렬하여 반환합니다.
func (r *PostgresChecklistRepository) FindByTrip(ctx context.Context, tripID string) ([]model.ChecklistItem, error) {
	rows, err := r.pool.Query(ctx,
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

// Update는 기존 준비물 레코드의 내용(완료 여부, 타이틀 등)을 갱신합니다.
func (r *PostgresChecklistRepository) Update(ctx context.Context, item model.ChecklistItem) error {
	destCountry := toNullableString(item.DestinationCountry)

	_, err := r.pool.Exec(ctx,
		`UPDATE checklists SET category = $1, title = $2, is_completed = $3, custom = $4, destination_country = $5 
		 WHERE id = $6`,
		item.Category, item.Title, item.IsCompleted, item.Custom, destCountry, item.ID)
	return err
}

// Delete는 지정한 준비물 항목 ID의 레코드를 완전히 물리 삭제합니다.
func (r *PostgresChecklistRepository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM checklists WHERE id = $1`, id)
	return err
}
