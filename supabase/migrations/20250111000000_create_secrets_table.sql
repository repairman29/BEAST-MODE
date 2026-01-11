-- Create secrets table for storing system secrets and credentials
-- This table stores secrets found in documentation and environment variables

CREATE TABLE IF NOT EXISTS secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  category TEXT NOT NULL, -- 'github', 'stripe', 'supabase', 'jwt', 'encryption', etc.
  environment TEXT DEFAULT 'production', -- 'production', 'development', 'staging'
  source TEXT, -- Which doc file or source this came from
  encrypted BOOLEAN DEFAULT false, -- Whether the value is encrypted
  description TEXT, -- What this secret is used for
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_secrets_key ON secrets(key);
CREATE INDEX IF NOT EXISTS idx_secrets_category ON secrets(category);
CREATE INDEX IF NOT EXISTS idx_secrets_environment ON secrets(environment);

-- RLS policies
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Only service role can access secrets
CREATE POLICY "Service role can manage secrets"
  ON secrets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users cannot access secrets
CREATE POLICY "Users cannot access secrets"
  ON secrets
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_secrets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_secrets_updated_at
  BEFORE UPDATE ON secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_secrets_updated_at();

COMMENT ON TABLE secrets IS 'Stores system secrets and credentials extracted from documentation';
COMMENT ON COLUMN secrets.key IS 'Unique identifier for the secret (e.g., github_client_secret_prod)';
COMMENT ON COLUMN secrets.value IS 'The secret value (should be encrypted in production)';
COMMENT ON COLUMN secrets.category IS 'Category of secret (github, stripe, supabase, etc.)';
COMMENT ON COLUMN secrets.environment IS 'Environment this secret is for (production, development, staging)';
COMMENT ON COLUMN secrets.source IS 'Source file or location where this secret was found';
