CREATE TABLE IF NOT EXISTS checklists (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id             UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    category            TEXT NOT NULL,
    title               TEXT NOT NULL,
    is_completed        BOOLEAN NOT NULL DEFAULT FALSE,
    custom              BOOLEAN NOT NULL DEFAULT FALSE,
    destination_country TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS checklists_trip_id_idx ON checklists (trip_id);
