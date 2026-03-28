-- ─────────────────────────────────────────────────────────────────────────────
-- 015_share_referral_engine.sql
-- Result-sharing referral engine — Phase 1
-- Tables: share_tokens, share_clicks, share_rewards, canonical_ref_audit
-- Also: adds canonical_ref_id column to affiliates table
-- ─────────────────────────────────────────────────────────────────────────────

-- Share tokens — one per user, maps to canonical identity
CREATE TABLE IF NOT EXISTS share_tokens (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email                      TEXT NOT NULL,
  canonical_ref_id           UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  canonical_ref_id_version   TEXT NOT NULL DEFAULT 'sharer'
                               CHECK (canonical_ref_id_version IN ('sharer', 'partner_upgrade')),
  token                      TEXT NOT NULL UNIQUE,
  token_status               TEXT NOT NULL DEFAULT 'active'
                               CHECK (token_status IN ('active', 'revoked', 'expired')),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at                 TIMESTAMPTZ,
  expiry_at                  TIMESTAMPTZ,
  last_click_at              TIMESTAMPTZ,
  total_clicks               INTEGER NOT NULL DEFAULT 0,
  total_conversions          INTEGER NOT NULL DEFAULT 0,
  total_conversions_pending  INTEGER NOT NULL DEFAULT 0
);

-- Share clicks — attribution events
CREATE TABLE IF NOT EXISTS share_clicks (
  click_id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token                      TEXT NOT NULL REFERENCES share_tokens(token) ON DELETE CASCADE,
  ip_hash                    TEXT,
  device_fingerprint_hash    TEXT,
  user_agent_hash            TEXT,
  referer_hash               TEXT,
  clicked_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_page                TEXT,
  fraud_score                INTEGER NOT NULL DEFAULT 0,
  fraud_flags                JSONB DEFAULT '[]'::JSONB,
  time_to_conversion_seconds INTEGER,
  converted                  BOOLEAN NOT NULL DEFAULT FALSE,
  converted_at               TIMESTAMPTZ,
  order_id                   TEXT
);

-- Share rewards — credited conversions
CREATE TABLE IF NOT EXISTS share_rewards (
  reward_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token                  TEXT NOT NULL REFERENCES share_tokens(token) ON DELETE CASCADE,
  canonical_ref_id       UUID NOT NULL,
  order_id               TEXT NOT NULL UNIQUE,   -- idempotency key
  sharer_email           TEXT NOT NULL,
  purchaser_email_hash   TEXT NOT NULL,          -- SHA-256 hashed, never plain
  reward_type            TEXT NOT NULL DEFAULT 'scan_credit'
                           CHECK (reward_type IN ('scan_credit', 'pending_cash')),
  credits_amount         INTEGER NOT NULL DEFAULT 1,
  status                 TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'awarded', 'voided', 'expired')),
  refund_window_closes_at TIMESTAMPTZ NOT NULL,
  fraud_hold_reason      TEXT,
  fraud_hold_until       TIMESTAMPTZ,
  used_at                TIMESTAMPTZ,
  used_for_order_id      TEXT,
  refund_processed_at    TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Canonical ref audit — lifecycle tracking
CREATE TABLE IF NOT EXISTS canonical_ref_audit (
  audit_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_ref_id   UUID NOT NULL,
  event_type         TEXT NOT NULL
                       CHECK (event_type IN ('created', 'linked_to_partner', 'migrated')),
  event_data         JSONB DEFAULT '{}'::JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add canonical_ref_id to affiliates (nullable, populated on partner upgrade)
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS canonical_ref_id UUID UNIQUE;

-- ─── Indexes ─────────────────────────────────────────────────────────────────

-- share_tokens
CREATE INDEX IF NOT EXISTS idx_share_tokens_user_id          ON share_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_share_tokens_email            ON share_tokens(email);
CREATE INDEX IF NOT EXISTS idx_share_tokens_canonical_ref_id ON share_tokens(canonical_ref_id);
CREATE INDEX IF NOT EXISTS idx_share_tokens_token            ON share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_share_tokens_status           ON share_tokens(token_status);

-- share_clicks
CREATE INDEX IF NOT EXISTS idx_share_clicks_token            ON share_clicks(token);
CREATE INDEX IF NOT EXISTS idx_share_clicks_clicked_at       ON share_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_share_clicks_converted_at     ON share_clicks(converted_at);

-- share_rewards
CREATE UNIQUE INDEX IF NOT EXISTS idx_share_rewards_order_id         ON share_rewards(order_id);
CREATE INDEX IF NOT EXISTS idx_share_rewards_canonical_ref_id        ON share_rewards(canonical_ref_id);
CREATE INDEX IF NOT EXISTS idx_share_rewards_status                  ON share_rewards(status);
CREATE INDEX IF NOT EXISTS idx_share_rewards_created_at              ON share_rewards(created_at);
CREATE INDEX IF NOT EXISTS idx_share_rewards_refund_window_closes_at ON share_rewards(refund_window_closes_at);

-- canonical_ref_audit
CREATE INDEX IF NOT EXISTS idx_canonical_ref_audit_id ON canonical_ref_audit(canonical_ref_id);

-- affiliates
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_canonical_ref_id ON affiliates(canonical_ref_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- share_tokens: users can read/create their own token only
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_share_token" ON share_tokens
  FOR ALL USING (auth.uid() = user_id);

-- share_clicks: insert-only from server (service role), no user access
ALTER TABLE share_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_clicks" ON share_clicks
  FOR ALL USING (FALSE);   -- blocked for all; service role bypasses RLS

-- share_rewards: users can read their own rewards only
ALTER TABLE share_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_rewards" ON share_rewards
  FOR SELECT USING (
    sharer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- canonical_ref_audit: service role only
ALTER TABLE canonical_ref_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_audit" ON canonical_ref_audit
  FOR ALL USING (FALSE);
