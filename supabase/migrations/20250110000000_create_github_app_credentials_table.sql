-- GitHub App Credentials Table
-- Stores GitHub App configuration for BEAST MODE integration

CREATE TABLE IF NOT EXISTS github_app_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id BIGINT UNIQUE NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT, -- Encrypted in application layer
  webhook_secret TEXT, -- Encrypted in application layer
  private_key TEXT, -- Encrypted in application layer
  app_slug TEXT,
  app_name TEXT,
  webhook_url TEXT,
  callback_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup by app_id
CREATE INDEX IF NOT EXISTS idx_github_app_credentials_app_id ON github_app_credentials(app_id);

-- RLS (Row Level Security) - only service role can access
ALTER TABLE github_app_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can read/write
CREATE POLICY "Service role only" ON github_app_credentials
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_github_app_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_github_app_credentials_updated_at
  BEFORE UPDATE ON github_app_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_github_app_credentials_updated_at();

-- Comments
COMMENT ON TABLE github_app_credentials IS 'Stores GitHub App credentials for BEAST MODE integration';
COMMENT ON COLUMN github_app_credentials.app_id IS 'GitHub App ID (unique identifier)';
COMMENT ON COLUMN github_app_credentials.client_secret IS 'Client secret (should be encrypted)';
COMMENT ON COLUMN github_app_credentials.webhook_secret IS 'Webhook secret (should be encrypted)';
COMMENT ON COLUMN github_app_credentials.private_key IS 'Private key (should be encrypted)';
