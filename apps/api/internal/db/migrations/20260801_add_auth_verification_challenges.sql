CREATE TABLE IF NOT EXISTS auth_verification_challenges (
    email         TEXT NOT NULL,
    purpose       TEXT NOT NULL CHECK (purpose IN ('register', 'forgot')),
    code_hash     TEXT NOT NULL,
    expires_at    TIMESTAMPTZ NOT NULL,
    attempts      INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 1),
    request_date  DATE NOT NULL,
    consumed_at   TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (email, purpose)
);

CREATE INDEX IF NOT EXISTS auth_verification_challenges_expires_at_idx
    ON auth_verification_challenges (expires_at);
