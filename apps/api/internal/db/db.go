package db

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPool은 pgbouncer(트랜잭션 풀링 모드, 예: Supabase pooler 6543 포트) 뒤에서도 안전하게 동작하도록
// prepared statement 캐시를 쓰지 않는 simple protocol 모드로 커넥션을 구성한다.
// 기본 설정(QueryExecModeCacheStatement)은 풀의 여러 커넥션이 pgbouncer의 공유 백엔드 커넥션을
// 넘나들며 같은 이름의 prepared statement를 준비하려다 "already exists"(SQLSTATE 42P05) 충돌을 일으킨다.
func NewPool(databaseURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	return pgxpool.NewWithConfig(context.Background(), config)
}
