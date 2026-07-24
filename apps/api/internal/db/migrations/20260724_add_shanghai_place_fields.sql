ALTER TABLE places
    ADD COLUMN IF NOT EXISTS google_place_id TEXT,
    ADD COLUMN IF NOT EXISTS chinese_name TEXT,
    ADD COLUMN IF NOT EXISTS chinese_address TEXT,
    ADD COLUMN IF NOT EXISTS subway_exit TEXT,
    ADD COLUMN IF NOT EXISTS taxi_phrase TEXT;
