-- Add first_name for email marketing and personalization
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name text;

-- RLS already allows users to UPDATE own profile; no policy change needed.
COMMENT ON COLUMN profiles.first_name IS 'User-provided first name for emails and dashboard.';
