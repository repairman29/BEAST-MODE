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

