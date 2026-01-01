-- Create app_config table for storing application configuration
-- This includes GitHub OAuth credentials and other secure config

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);

-- Add RLS (Row Level Security) policies
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can read/write (server-side only)
CREATE POLICY "Service role only" ON app_config
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Insert GitHub OAuth config (if not exists)
INSERT INTO app_config (key, value, updated_at)
VALUES (
  'github_oauth',
  jsonb_build_object(
    'client_id', 'Ov23lidLvmp68FVMEqEB',
    'client_secret', 'df4c598018de45ce8cb90313489eeb21448aedcf',
    'redirect_uri', 'http://localhost:7777/api/github/oauth/callback',
    'encryption_key', '20abb6f3b973e2fdeea6e2c417ce93824e7b64962f9fee4bfd6339264c8e792c'
  ),
  NOW()
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Add comment
COMMENT ON TABLE app_config IS 'Application configuration stored securely in Supabase';
COMMENT ON COLUMN app_config.key IS 'Configuration key (e.g., github_oauth)';
COMMENT ON COLUMN app_config.value IS 'Configuration value as JSONB';

