CREATE TABLE IF NOT EXISTS external_api_monthly_usage (
    provider      TEXT NOT NULL,
    period_start  DATE NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (provider, period_start)
);
