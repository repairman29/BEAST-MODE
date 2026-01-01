-- Create SSO configs table
CREATE TABLE IF NOT EXISTS sso_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'saml', 'oauth', 'ldap', 'okta', 'azure'
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_sso_configs_user_id ON sso_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_configs_provider ON sso_configs(provider);
CREATE INDEX IF NOT EXISTS idx_sso_configs_enabled ON sso_configs(enabled);

-- Enable RLS
ALTER TABLE sso_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role handles access control
DROP POLICY IF EXISTS "Service role can access all" ON sso_configs;
CREATE POLICY "Service role can access all" ON sso_configs
  FOR ALL
  USING (true)
  WITH CHECK (true);

