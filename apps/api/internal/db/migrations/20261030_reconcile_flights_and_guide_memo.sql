-- 2026-07 schema.sql 변경 중 마이그레이션이 빠진 두 가지를 예전 DB에도 맞춘다.
-- 1) flights 테이블 추가  2) schedules.parent_memo -> guide_memo 이름 변경
-- 둘 다 없으면 항공 탭과 일정·공유 조회가 500으로 실패한다.

CREATE TABLE IF NOT EXISTS flights (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id             UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    direction           TEXT NOT NULL,
    label               TEXT NOT NULL,
    airline             TEXT,
    flight_number       TEXT,
    departure_airport   TEXT NOT NULL,
    arrival_airport     TEXT NOT NULL,
    departure_date      DATE NOT NULL,
    departure_time      TEXT NOT NULL,
    arrival_date        DATE,
    arrival_time        TEXT,
    memo                TEXT,
    sort_order          INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- schema.sql의 `CREATE INDEX ON flights (...)`가 자동으로 붙이는 이름과 같게 맞춰
-- 새로 만든 DB에서 인덱스가 두 번 생기지 않게 한다.
CREATE INDEX IF NOT EXISTS flights_trip_id_departure_date_sort_order_idx
    ON flights (trip_id, departure_date, sort_order);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'schedules' AND column_name = 'parent_memo'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'schedules' AND column_name = 'guide_memo'
    ) THEN
        ALTER TABLE schedules RENAME COLUMN parent_memo TO guide_memo;
    END IF;
END
$$;

ALTER TABLE IF EXISTS schedules
    ADD COLUMN IF NOT EXISTS guide_memo TEXT;
