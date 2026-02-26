CREATE TABLE IF NOT EXISTS payments (
  id uuid primary key default gen_random_uuid(),
  email text,
  payment_type text,
  amount integer,
  status text default 'pending',
  tool text,
  gateway text default 'pending',
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS beta_access (
  id uuid primary key default gen_random_uuid(),
  email text,
  tool text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text,
  status text default 'active',
  plan text default '6_months',
  current_period_end timestamptz,
  created_at timestamptz default now()
);
