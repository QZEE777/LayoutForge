-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'affiliate')),
  is_founder boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Usage events table
CREATE TABLE IF NOT EXISTS usage_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  tool text NOT NULL,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Auto-create profile on signup (first 500 users are founders)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, is_founder)
  VALUES (
    new.id,
    new.email,
    (SELECT COUNT(*) FROM profiles) < 500
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- RLS (optional): allow users to read/update own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile usage_count"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own usage_events"
  ON usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own usage_events"
  ON usage_events FOR SELECT
  USING (auth.uid() = user_id);
