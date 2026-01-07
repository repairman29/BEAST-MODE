-- Quality-to-Code Improvement System Tables
-- Stores file-level quality scores, improvement plans, and generated code

-- File quality scores table
CREATE TABLE IF NOT EXISTS file_quality_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repository TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  language TEXT,
  quality_score DECIMAL(3,2) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 1),
  quality_level TEXT CHECK (quality_level IN ('excellent', 'good', 'fair', 'poor')),
  factors JSONB DEFAULT '{}'::jsonb, -- hasTests, hasDocumentation, complexity, etc.
  improvements JSONB DEFAULT '[]'::jsonb, -- Array of improvement opportunities
  file_hash TEXT, -- To detect file changes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(repository, file_path, file_hash)
);

CREATE INDEX IF NOT EXISTS idx_file_quality_repository ON file_quality_scores(repository);
CREATE INDEX IF NOT EXISTS idx_file_quality_score ON file_quality_scores(quality_score);
CREATE INDEX IF NOT EXISTS idx_file_quality_level ON file_quality_scores(quality_level);
CREATE INDEX IF NOT EXISTS idx_file_quality_updated_at ON file_quality_scores(updated_at);

-- Quality improvement plans table
CREATE TABLE IF NOT EXISTS quality_improvement_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repository TEXT NOT NULL,
  user_id TEXT,
  target_quality DECIMAL(3,2) NOT NULL CHECK (target_quality >= 0 AND target_quality <= 1),
  current_quality DECIMAL(3,2) NOT NULL,
  final_quality DECIMAL(3,2),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'failed')),
  iterations JSONB DEFAULT '[]'::jsonb, -- Array of iteration plans
  generated_files JSONB DEFAULT '[]'::jsonb, -- Array of generated file metadata
  applied_changes JSONB DEFAULT '[]'::jsonb, -- Array of applied changes
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_improvement_plans_repository ON quality_improvement_plans(repository);
CREATE INDEX IF NOT EXISTS idx_improvement_plans_user_id ON quality_improvement_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_improvement_plans_status ON quality_improvement_plans(status);
CREATE INDEX IF NOT EXISTS idx_improvement_plans_created_at ON quality_improvement_plans(created_at);

-- Generated code files table
CREATE TABLE IF NOT EXISTS generated_code_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  improvement_plan_id UUID REFERENCES quality_improvement_plans(id) ON DELETE CASCADE,
  repository TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'generate_tests', 'generate_workflow', 'generate_readme', etc.
  code_content TEXT NOT NULL,
  language TEXT,
  estimated_impact DECIMAL(3,2),
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'applied', 'rejected', 'failed')),
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_code_repository ON generated_code_files(repository);
CREATE INDEX IF NOT EXISTS idx_generated_code_plan_id ON generated_code_files(improvement_plan_id);
CREATE INDEX IF NOT EXISTS idx_generated_code_status ON generated_code_files(status);
CREATE INDEX IF NOT EXISTS idx_generated_code_action_type ON generated_code_files(action_type);

-- Quality improvement history table
CREATE TABLE IF NOT EXISTS quality_improvement_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repository TEXT NOT NULL,
  change_type TEXT NOT NULL, -- 'file_added', 'file_modified', 'test_added', 'ci_added', etc.
  change_description TEXT,
  quality_before DECIMAL(3,2),
  quality_after DECIMAL(3,2),
  quality_improvement DECIMAL(3,2),
  file_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_improvement_history_repository ON quality_improvement_history(repository);
CREATE INDEX IF NOT EXISTS idx_improvement_history_created_at ON quality_improvement_history(created_at);
CREATE INDEX IF NOT EXISTS idx_improvement_history_change_type ON quality_improvement_history(change_type);

-- Repository quality snapshots table (for tracking quality over time)
CREATE TABLE IF NOT EXISTS repository_quality_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repository TEXT NOT NULL,
  quality_score DECIMAL(3,2) NOT NULL,
  percentile INTEGER,
  average_file_score DECIMAL(3,2),
  file_count INTEGER,
  quality_distribution JSONB DEFAULT '{}'::jsonb, -- {excellent: 10, good: 20, fair: 5, poor: 2}
  factors JSONB DEFAULT '{}'::jsonb, -- Repository-level factors
  recommendations_count INTEGER DEFAULT 0,
  snapshot_type TEXT DEFAULT 'manual' CHECK (snapshot_type IN ('manual', 'automated', 'after_improvement')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_repository ON repository_quality_snapshots(repository);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON repository_quality_snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_quality_score ON repository_quality_snapshots(quality_score);

-- Enable RLS
ALTER TABLE file_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_improvement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_code_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_improvement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_quality_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can access all (for API usage)
-- Users can access their own data via user_id or repository ownership

DROP POLICY IF EXISTS "Service role can access all file quality scores" ON file_quality_scores;
CREATE POLICY "Service role can access all file quality scores" ON file_quality_scores
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all improvement plans" ON quality_improvement_plans;
CREATE POLICY "Service role can access all improvement plans" ON quality_improvement_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all generated code" ON generated_code_files;
CREATE POLICY "Service role can access all generated code" ON generated_code_files
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all improvement history" ON quality_improvement_history;
CREATE POLICY "Service role can access all improvement history" ON quality_improvement_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all quality snapshots" ON repository_quality_snapshots;
CREATE POLICY "Service role can access all quality snapshots" ON repository_quality_snapshots
  FOR ALL
  USING (true)
  WITH CHECK (true);

