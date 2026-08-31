BEGIN;

ALTER TABLE user_
  ADD COLUMN IF NOT EXISTS password_reset_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_reset_nonce_hash VARCHAR(64);

COMMIT;