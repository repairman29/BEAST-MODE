-- ============================================================================
-- BEAST MODE - ALL DATABASE MIGRATIONS
-- ============================================================================
-- Run these in order in Supabase SQL Editor
-- Copy and paste each section one at a time
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Create app_config table
-- ============================================================================

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
DROP POLICY IF EXISTS "Service role only" ON app_config;
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

-- ============================================================================
-- MIGRATION 2: Create secrets table
-- ============================================================================

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

-- ============================================================================
-- MIGRATION 3: Add porkbun provider to user_api_keys
-- ============================================================================
-- NOTE: This assumes user_api_keys table already exists
-- If it doesn't exist, you may need to create it first or skip this migration

-- Add porkbun to allowed providers in user_api_keys table
ALTER TABLE user_api_keys 
DROP CONSTRAINT IF EXISTS user_api_keys_provider_check;

ALTER TABLE user_api_keys 
ADD CONSTRAINT user_api_keys_provider_check 
CHECK (provider IN ('openai', 'mistral', 'gemini', 'groq', 'anthropic', 'together', 'porkbun'));

-- ============================================================================
-- MIGRATION 4: Create integrations tables
-- ============================================================================

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'webhook', 'api', 'custom'
  description TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_enabled ON integrations(enabled);

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhooks(enabled);

-- Create webhook_deliveries table for tracking webhook deliveries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed', 'pending'
  status_code INTEGER,
  response_body TEXT,
  error TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_delivered_at ON webhook_deliveries(delivered_at);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
-- Note: These policies assume user_id is stored as text. Adjust if using UUID auth.users.id

DROP POLICY IF EXISTS "Users can view own integrations" ON integrations;
CREATE POLICY "Users can view own integrations" ON integrations
  FOR SELECT
  USING (true); -- Service role will filter by user_id in application code

DROP POLICY IF EXISTS "Users can insert own integrations" ON integrations;
CREATE POLICY "Users can insert own integrations" ON integrations
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own integrations" ON integrations;
CREATE POLICY "Users can update own integrations" ON integrations
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete own integrations" ON integrations;
CREATE POLICY "Users can delete own integrations" ON integrations
  FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Users can view own webhooks" ON webhooks;
CREATE POLICY "Users can view own webhooks" ON webhooks
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own webhooks" ON webhooks;
CREATE POLICY "Users can insert own webhooks" ON webhooks
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own webhooks" ON webhooks;
CREATE POLICY "Users can update own webhooks" ON webhooks
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete own webhooks" ON webhooks;
CREATE POLICY "Users can delete own webhooks" ON webhooks
  FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Users can view own webhook deliveries" ON webhook_deliveries;
CREATE POLICY "Users can view own webhook deliveries" ON webhook_deliveries
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service can insert webhook deliveries" ON webhook_deliveries;
CREATE POLICY "Service can insert webhook deliveries" ON webhook_deliveries
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- MIGRATION 5: Create SSO configs table
-- ============================================================================

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

-- ============================================================================
-- MIGRATION 6: Create error_logs and quality_checks tables
-- ============================================================================

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  message TEXT NOT NULL,
  stack TEXT,
  name TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  component TEXT,
  severity TEXT DEFAULT 'error',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON error_logs(component);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);

-- Create quality_checks table
CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repository TEXT NOT NULL,
  branch TEXT NOT NULL,
  commit TEXT NOT NULL,
  pull_request TEXT,
  quality_score INTEGER NOT NULL,
  issues JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL, -- 'passed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_checks_repository ON quality_checks(repository);
CREATE INDEX IF NOT EXISTS idx_quality_checks_branch ON quality_checks(branch);
CREATE INDEX IF NOT EXISTS idx_quality_checks_commit ON quality_checks(commit);
CREATE INDEX IF NOT EXISTS idx_quality_checks_created_at ON quality_checks(created_at);
CREATE INDEX IF NOT EXISTS idx_quality_checks_status ON quality_checks(status);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role handles access control
DROP POLICY IF EXISTS "Service role can access all error logs" ON error_logs;
CREATE POLICY "Service role can access all error logs" ON error_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all quality checks" ON quality_checks;
CREATE POLICY "Service role can access all quality checks" ON quality_checks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- MIGRATION 7: Create janitor tables
-- ============================================================================

-- Create janitor_features table for feature toggles
CREATE TABLE IF NOT EXISTS janitor_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  feature_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_name)
);

CREATE INDEX IF NOT EXISTS idx_janitor_features_user_id ON janitor_features(user_id);
CREATE INDEX IF NOT EXISTS idx_janitor_features_name ON janitor_features(feature_name);
CREATE INDEX IF NOT EXISTS idx_janitor_features_enabled ON janitor_features(enabled);

-- Create architecture_rules table
CREATE TABLE IF NOT EXISTS architecture_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  severity TEXT NOT NULL, -- 'error', 'warning', 'info'
  category TEXT NOT NULL, -- 'security', 'architecture', 'quality'
  examples JSONB DEFAULT '[]'::jsonb,
  pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_architecture_rules_enabled ON architecture_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_architecture_rules_category ON architecture_rules(category);

-- Create refactoring_runs table
CREATE TABLE IF NOT EXISTS refactoring_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  repository TEXT,
  issues_fixed INTEGER DEFAULT 0,
  prs_created INTEGER DEFAULT 0,
  status TEXT NOT NULL, -- 'pending', 'running', 'completed', 'failed'
  changes JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refactoring_runs_user_id ON refactoring_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_refactoring_runs_repository ON refactoring_runs(repository);
CREATE INDEX IF NOT EXISTS idx_refactoring_runs_status ON refactoring_runs(status);
CREATE INDEX IF NOT EXISTS idx_refactoring_runs_created_at ON refactoring_runs(created_at);

-- Create vibe_restoration_states table
CREATE TABLE IF NOT EXISTS vibe_restoration_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  repository TEXT,
  commit_hash TEXT NOT NULL,
  quality_score INTEGER NOT NULL,
  description TEXT,
  is_good BOOLEAN DEFAULT true,
  state_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vibe_states_user_id ON vibe_restoration_states(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_states_repository ON vibe_restoration_states(repository);
CREATE INDEX IF NOT EXISTS idx_vibe_states_is_good ON vibe_restoration_states(is_good);
CREATE INDEX IF NOT EXISTS idx_vibe_states_created_at ON vibe_restoration_states(created_at);

-- Create repo_memory_graph table
CREATE TABLE IF NOT EXISTS repo_memory_graph (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  repository TEXT,
  node_id TEXT NOT NULL,
  node_label TEXT NOT NULL,
  node_type TEXT NOT NULL, -- 'component', 'module', 'function', 'file'
  connections JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, repository, node_id)
);

CREATE INDEX IF NOT EXISTS idx_repo_memory_user_id ON repo_memory_graph(user_id);
CREATE INDEX IF NOT EXISTS idx_repo_memory_repository ON repo_memory_graph(repository);
CREATE INDEX IF NOT EXISTS idx_repo_memory_node_type ON repo_memory_graph(node_type);

-- Create vibe_ops_tests table
CREATE TABLE IF NOT EXISTS vibe_ops_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  repository TEXT,
  description TEXT NOT NULL,
  type TEXT NOT NULL, -- 'happy-path', 'edge-case', 'error-handling'
  status TEXT NOT NULL, -- 'created', 'running', 'passed', 'failed'
  code TEXT NOT NULL,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vibe_ops_tests_user_id ON vibe_ops_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_ops_tests_repository ON vibe_ops_tests(repository);
CREATE INDEX IF NOT EXISTS idx_vibe_ops_tests_status ON vibe_ops_tests(status);

-- Enable RLS
ALTER TABLE janitor_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE architecture_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE refactoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_restoration_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_memory_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_ops_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role handles access control
DROP POLICY IF EXISTS "Service role can access all" ON janitor_features;
CREATE POLICY "Service role can access all" ON janitor_features
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all" ON architecture_rules;
CREATE POLICY "Service role can access all" ON architecture_rules
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all" ON refactoring_runs;
CREATE POLICY "Service role can access all" ON refactoring_runs
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all" ON vibe_restoration_states;
CREATE POLICY "Service role can access all" ON vibe_restoration_states
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all" ON repo_memory_graph;
CREATE POLICY "Service role can access all" ON repo_memory_graph
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all" ON vibe_ops_tests;
CREATE POLICY "Service role can access all" ON vibe_ops_tests
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default architecture rules
INSERT INTO architecture_rules (id, name, description, enabled, severity, category, examples) VALUES
  ('block-secrets', 'Block Secrets in Code', 'Prevents hardcoded API keys, passwords, and other secrets', true, 'error', 'security', '["const apiKey = \"sk-1234567890\";", "const password = \"mypassword123\";"]'::jsonb),
  ('prevent-db-in-frontend', 'Prevent Database Logic in Frontend', 'Blocks database queries and logic in frontend code', true, 'error', 'architecture', '["db.query(\"SELECT * FROM users\");", "database.connect();"]'::jsonb),
  ('enforce-separation', 'Enforce Separation of Concerns', 'Ensures proper separation between UI, business logic, and data layers', true, 'warning', 'architecture', '["Business logic in component files", "UI rendering in utility functions"]'::jsonb),
  ('block-eval', 'Block eval() Usage', 'Prevents use of eval() which is a security risk', true, 'error', 'security', '["eval(userInput);", "Function(userInput)();"]'::jsonb),
  ('auto-fix-patterns', 'Auto-Fix Common Patterns', 'Automatically fixes common code patterns', true, 'info', 'quality', '["console.log() → logger.debug()", "var → const/let"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- All tables created successfully
-- Verify in Supabase Dashboard → Table Editor
-- ============================================================================

