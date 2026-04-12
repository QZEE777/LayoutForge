-- ─────────────────────────────────────────────────────────────────────────────
-- 034_blog_notification_log.sql
-- One row per blog slug after notification batch (idempotency for cron).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blog_notification_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT        NOT NULL UNIQUE,
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipient_count  INTEGER     NOT NULL DEFAULT 0
);

COMMENT ON TABLE blog_notification_log IS 'Records blog post notification sends to platform_notifications subscribers.';

ALTER TABLE blog_notification_log ENABLE ROW LEVEL SECURITY;

-- Pre-seed existing in-repo posts so we do not mass-email historical articles on first cron run.
INSERT INTO blog_notification_log (slug, recipient_count)
VALUES
  ('why-kdp-rejects-your-pdf', 0),
  ('kdp-margin-requirements', 0),
  ('welcome', 0)
ON CONFLICT (slug) DO NOTHING;
