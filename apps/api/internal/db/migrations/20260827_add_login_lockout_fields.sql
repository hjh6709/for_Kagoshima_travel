-- 로그인 브루트포스 방어: 실패 횟수와 잠금 만료 시각을 계정에 직접 기록한다.
-- 기존 IP 레이트리밋은 X-Forwarded-For 스푸핑으로 우회 가능했고(별도로 고침),
-- 계정 단위 방어가 전혀 없었다.
ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
