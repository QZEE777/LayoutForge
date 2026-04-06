-- Founder giveaway campaigns (MVP scaffold)
CREATE TABLE IF NOT EXISTS founder_giveaway_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  max_redemptions integer NOT NULL CHECK (max_redemptions > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_founder_giveaway_campaigns_status ON founder_giveaway_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_founder_giveaway_campaigns_expires_at ON founder_giveaway_campaigns(expires_at);

CREATE TABLE IF NOT EXISTS founder_giveaway_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES founder_giveaway_campaigns(id) ON DELETE CASCADE,
  redeemer_email text NOT NULL,
  redeemer_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'fulfilled', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_founder_giveaway_unique_redemption
  ON founder_giveaway_redemptions(campaign_id, redeemer_email);

CREATE INDEX IF NOT EXISTS idx_founder_giveaway_redemptions_campaign
  ON founder_giveaway_redemptions(campaign_id);
