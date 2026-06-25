-- 가고시마 여행 앱 PostgreSQL 스키마

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,  -- bcrypt hash
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trips (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    travelers   TEXT[] NOT NULL DEFAULT '{}',
    memo        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE places (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id             UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    category            TEXT NOT NULL,
    address             TEXT,
    latitude            NUMERIC(9,6),
    longitude           NUMERIC(9,6),
    google_maps_url     TEXT,
    recommended_reason  TEXT,
    opening_memo        TEXT,
    budget_memo         TEXT,
    caution_memo        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    place_id        UUID REFERENCES places(id) ON DELETE SET NULL,
    date            DATE NOT NULL,
    time            TEXT NOT NULL,
    type            TEXT NOT NULL,
    title           TEXT NOT NULL,
    transport_memo  TEXT,
    reservation_memo TEXT,
    parent_memo     TEXT,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE routes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id             UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    description         TEXT,
    transport_memo      TEXT,
    estimated_duration  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE route_places (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id    UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    place_id    UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE travelog_balances (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    currency    TEXT NOT NULL,
    amount      BIGINT NOT NULL DEFAULT 0,
    note        TEXT,
    checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE share_links (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX ON trips (owner_id);
CREATE INDEX ON schedules (trip_id, date, sort_order);
CREATE INDEX ON places (trip_id, category);
CREATE UNIQUE INDEX ON travelog_balances (trip_id);
CREATE UNIQUE INDEX ON share_links (token);
