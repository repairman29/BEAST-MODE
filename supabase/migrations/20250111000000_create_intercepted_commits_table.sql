-- Create intercepted_commits table for storing data that was blocked from commits
-- This allows bots/AI assistants to access the data via Supabase without exposing it publicly

CREATE TABLE IF NOT EXISTS intercepted_commits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repo_name TEXT NOT NULL,
  repo_path TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_content TEXT, -- Full file content (can be large)
  issues JSONB NOT NULL, -- Array of issues found
  reason TEXT,
  intercepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'intercepted', -- intercepted, reviewed, approved, rejected
  metadata JSONB, -- Additional metadata (file size, issue count, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_intercepted_commits_repo_name ON intercepted_commits(repo_name);
CREATE INDEX IF NOT EXISTS idx_intercepted_commits_intercepted_at ON intercepted_commits(intercepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_intercepted_commits_status ON intercepted_commits(status);
CREATE INDEX IF NOT EXISTS idx_intercepted_commits_file_path ON intercepted_commits(file_path);

-- Enable RLS
ALTER TABLE intercepted_commits ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can access all
CREATE POLICY "Service role full access" ON intercepted_commits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Authenticated users can read their own repo's intercepted data
-- (only if user_repositories table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_repositories') THEN
    CREATE POLICY "Users can read their repos" ON intercepted_commits
      FOR SELECT
      USING (
        auth.role() = 'authenticated' AND
        EXISTS (
          SELECT 1 FROM user_repositories ur
          WHERE ur.repo_name = intercepted_commits.repo_name
          AND ur.user_id = auth.uid()
        )
      );
  ELSE
    -- If user_repositories doesn't exist, only service role can access
    -- (service role policy above is sufficient)
    RAISE NOTICE 'user_repositories table not found - skipping user policy';
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_intercepted_commits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_intercepted_commits_updated_at
  BEFORE UPDATE ON intercepted_commits
  FOR EACH ROW
  EXECUTE FUNCTION update_intercepted_commits_updated_at();

-- Add comment
COMMENT ON TABLE intercepted_commits IS 'Stores files and data that were intercepted by Brand/Reputation/Secret Interceptor before committing to public repos. Allows bots/AI assistants to access via Supabase API without exposing publicly.';
