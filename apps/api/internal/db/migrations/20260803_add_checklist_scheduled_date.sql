ALTER TABLE IF EXISTS checklists
    ADD COLUMN IF NOT EXISTS scheduled_date DATE;

CREATE INDEX IF NOT EXISTS checklists_trip_scheduled_date_idx
    ON checklists (trip_id, scheduled_date, created_at);
