-- Create custom_model_monitoring table for tracking model usage
CREATE TABLE IF NOT EXISTS custom_model_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT NOT NULL,
  endpoint TEXT,
  latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  from_cache BOOLEAN DEFAULT false,
  error_message TEXT,
  usage JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_custom_model_monitoring_model_id ON custom_model_monitoring(model_id);
CREATE INDEX IF NOT EXISTS idx_custom_model_monitoring_created_at ON custom_model_monitoring(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_model_monitoring_success ON custom_model_monitoring(success);

-- Enable RLS
ALTER TABLE custom_model_monitoring ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can read/write everything
CREATE POLICY "Service role full access" ON custom_model_monitoring
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Authenticated users can read their own data
CREATE POLICY "Users can read own data" ON custom_model_monitoring
  FOR SELECT
  USING (auth.role() = 'authenticated');
