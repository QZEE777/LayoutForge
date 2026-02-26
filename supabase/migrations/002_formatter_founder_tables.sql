-- Formatter landing page email capture
CREATE TABLE IF NOT EXISTS formatter_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Platform notify me (coming soon tools)
CREATE TABLE IF NOT EXISTS platform_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  platform text NOT NULL,
  notify_all boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Founder applications
CREATE TABLE IF NOT EXISTS founder_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  primary_platform text NOT NULL,
  platform_url text NOT NULL,
  follower_count text NOT NULL,
  publishing_platforms text[] NOT NULL,
  audience_description text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
