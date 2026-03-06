-- Add gateway_order_id for Lemon Squeezy order lookup / disputes
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_order_id text;
