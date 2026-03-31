-- Add avatar URL to user profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

COMMENT ON COLUMN profiles.avatar_url IS 'User profile photo URL stored in Supabase Storage avatars bucket.';
