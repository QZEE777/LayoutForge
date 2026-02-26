CREATE TABLE IF NOT EXISTS payments (
  id uuid primary key default gen_random_uuid(),
  email text,
  stripe_session_id text unique,
  stripe_customer_id text,
  payment_type text,
  amount integer,
  status text default 'pending',
  tool text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS beta_access (
  id uuid primary key default gen_random_uuid(),
  email text,
  code_used text,
  tool text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  plan text default '6_months',
  current_period_end timestamptz,
  created_at timestamptz default now()
);
