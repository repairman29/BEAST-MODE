-- Custom Models Table
-- Stores user-defined custom AI models (self-hosted, OpenAI-compatible, etc.)

CREATE TABLE IF NOT EXISTS custom_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL, -- User-friendly name (e.g., "My Local Llama")
  model_id TEXT NOT NULL, -- Unique identifier (e.g., "custom:my-local-llama")
  endpoint_url TEXT NOT NULL, -- API endpoint URL
  provider TEXT NOT NULL DEFAULT 'openai-compatible', -- 'openai-compatible', 'anthropic-compatible', 'custom'
  api_key_encrypted TEXT, -- Encrypted API key (if required)
  api_key_iv TEXT, -- IV for encryption
  headers JSONB DEFAULT '{}'::jsonb, -- Custom headers (e.g., {"Authorization": "Bearer ..."})
  config JSONB DEFAULT '{}'::jsonb, -- Model configuration (temperature, max_tokens, etc.)
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT FALSE, -- Allow other users to use this model
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique model_id per user
  UNIQUE(user_id, model_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_custom_models_user_id ON custom_models(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_models_model_id ON custom_models(model_id);
CREATE INDEX IF NOT EXISTS idx_custom_models_is_active ON custom_models(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_models_is_public ON custom_models(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_models_provider ON custom_models(provider);

-- Enable RLS
ALTER TABLE custom_models ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own models
DROP POLICY IF EXISTS "Users can read their own models" ON custom_models;
CREATE POLICY "Users can read their own models"
  ON custom_models FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

-- Policy: Users can insert their own models
DROP POLICY IF EXISTS "Users can insert their own models" ON custom_models;
CREATE POLICY "Users can insert their own models"
  ON custom_models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own models
DROP POLICY IF EXISTS "Users can update their own models" ON custom_models;
CREATE POLICY "Users can update their own models"
  ON custom_models FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own models
DROP POLICY IF EXISTS "Users can delete their own models" ON custom_models;
CREATE POLICY "Users can delete their own models"
  ON custom_models FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_custom_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_custom_models_updated_at ON custom_models;
CREATE TRIGGER update_custom_models_updated_at
  BEFORE UPDATE ON custom_models
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_models_updated_at();

-- Function to encrypt API key (similar to user_api_keys)
CREATE OR REPLACE FUNCTION encrypt_custom_model_api_key(api_key TEXT)
RETURNS TABLE(encrypted TEXT, iv TEXT) AS $$
DECLARE
  encryption_key TEXT;
  iv_value TEXT;
  encrypted_value TEXT;
BEGIN
  -- Get encryption key from environment or use a default
  encryption_key := current_setting('app.settings.encryption_key', TRUE);
  
  IF encryption_key IS NULL THEN
    -- Use a default key (in production, this should be from env)
    encryption_key := 'default-encryption-key-change-in-production';
  END IF;
  
  -- Generate IV
  iv_value := encode(gen_random_bytes(16), 'hex');
  
  -- Encrypt (simplified - in production use proper encryption)
  encrypted_value := encode(
    encrypt(api_key::bytea, encryption_key::bytea, 'aes'),
    'hex'
  );
  
  RETURN QUERY SELECT encrypted_value, iv_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
