-- Create secrets table for storing API keys and credentials
CREATE TABLE IF NOT EXISTS secrets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_secrets_key ON secrets(key);

-- Enable RLS
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access
DROP POLICY IF EXISTS "Service role only" ON secrets;
CREATE POLICY "Service role only" ON secrets
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Insert Porkbun credentials
INSERT INTO secrets (key, value, description)
VALUES (
  'porkbun_api',
  '{"api_key": "pk1_7cad269a0c08c304bdeef027a8c77b4593b251ce0202f022cd4ff11b04962b7d", "secret_key": "sk1_21538a7e248a1beb603511a1d6b721980333ddd9f29cc0cd29a0704135e5fb3b", "stored_at": "2025-01-01T00:00:00.000Z"}'::jsonb,
  'Porkbun DNS API credentials for beast-mode.dev'
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

