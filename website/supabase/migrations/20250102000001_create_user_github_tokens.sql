-- Create user_github_tokens table for storing GitHub OAuth tokens per user
-- This ensures proper user isolation for billing and product separation

CREATE TABLE IF NOT EXISTS user_github_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- Supabase auth.users.id
  product TEXT NOT NULL DEFAULT 'beast-mode',  -- For multi-product support
  encrypted_token TEXT NOT NULL,  -- AES-256 encrypted GitHub token
  github_username VARCHAR(255),
  github_user_id BIGINT,
  github_email VARCHAR(255),
  scopes TEXT[],  -- OAuth scopes granted
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product)  -- One GitHub connection per user per product
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_github_tokens_user_id ON user_github_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_github_tokens_product ON user_github_tokens(product);
CREATE INDEX IF NOT EXISTS idx_user_github_tokens_github_user_id ON user_github_tokens(github_user_id);
CREATE INDEX IF NOT EXISTS idx_user_github_tokens_active ON user_github_tokens(user_id, product) WHERE encrypted_token IS NOT NULL;

-- Add RLS (Row Level Security) policies
ALTER TABLE user_github_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tokens
DROP POLICY IF EXISTS "Users can view own tokens" ON user_github_tokens;
CREATE POLICY "Users can view own tokens" ON user_github_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tokens
DROP POLICY IF EXISTS "Users can insert own tokens" ON user_github_tokens;
CREATE POLICY "Users can insert own tokens" ON user_github_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tokens
DROP POLICY IF EXISTS "Users can update own tokens" ON user_github_tokens;
CREATE POLICY "Users can update own tokens" ON user_github_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tokens
DROP POLICY IF EXISTS "Users can delete own tokens" ON user_github_tokens;
CREATE POLICY "Users can delete own tokens" ON user_github_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Service role can access all (for server-side operations)
DROP POLICY IF EXISTS "Service role full access" ON user_github_tokens;
CREATE POLICY "Service role full access" ON user_github_tokens
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE user_github_tokens IS 'Stores encrypted GitHub OAuth tokens per user per product for proper isolation';
COMMENT ON COLUMN user_github_tokens.user_id IS 'Supabase auth.users.id - ensures proper user isolation';
COMMENT ON COLUMN user_github_tokens.product IS 'Product identifier (beast-mode, echeo, etc.) for multi-product support';
COMMENT ON COLUMN user_github_tokens.encrypted_token IS 'AES-256 encrypted GitHub OAuth token';
COMMENT ON COLUMN user_github_tokens.scopes IS 'OAuth scopes granted (repo, read:user, user:email, etc.)';

