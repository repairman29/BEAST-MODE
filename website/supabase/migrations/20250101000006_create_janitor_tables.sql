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

