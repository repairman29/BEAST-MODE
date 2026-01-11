-- Quality Tracking Table for Self-Healing System
-- Tracks code quality scores and improvements over time

CREATE TABLE IF NOT EXISTS quality_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  quality_score NUMERIC NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  issues_count INTEGER DEFAULT 0,
  metrics JSONB,
  issues JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  threshold NUMERIC DEFAULT 90,
  meets_threshold BOOLEAN DEFAULT false,
  improvements_applied JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_quality_tracking_file_path ON quality_tracking(file_path);
CREATE INDEX IF NOT EXISTS idx_quality_tracking_timestamp ON quality_tracking(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_quality_tracking_score ON quality_tracking(quality_score);
CREATE INDEX IF NOT EXISTS idx_quality_tracking_threshold ON quality_tracking(meets_threshold);

-- Enable RLS
ALTER TABLE quality_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can access all
CREATE POLICY "Service role full access" ON quality_tracking
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Authenticated users can read quality tracking data
CREATE POLICY "Users can read quality tracking" ON quality_tracking
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quality_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_quality_tracking_updated_at
  BEFORE UPDATE ON quality_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_quality_tracking_updated_at();

-- Add comment
COMMENT ON TABLE quality_tracking IS 'Tracks code quality scores and improvements for BEAST MODE self-healing system. Enables continuous quality monitoring and improvement tracking.';
