-- Advanced Caching System Tables
-- Stores cache predictions, warming jobs, performance metrics, and access patterns

-- Cache predictions table
CREATE TABLE IF NOT EXISTS cache_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL,
  cache_key_hash TEXT NOT NULL, -- Hash for fast lookup
  predicted_access_time TIMESTAMPTZ, -- When this is predicted to be accessed
  prediction_confidence FLOAT CHECK (prediction_confidence >= 0 AND prediction_confidence <= 1),
  predicted_value JSONB, -- Predicted cache value
  cache_tier TEXT DEFAULT 'L1' CHECK (cache_tier IN ('L1', 'L2', 'L3')), -- Cache tier
  ttl_seconds INTEGER, -- Time to live
  access_pattern_id UUID, -- Reference to cache_patterns
  is_prewarmed BOOLEAN DEFAULT FALSE,
  prewarmed_at TIMESTAMPTZ,
  actual_access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(cache_key_hash)
);

CREATE INDEX IF NOT EXISTS idx_cache_predictions_key_hash ON cache_predictions(cache_key_hash);
CREATE INDEX IF NOT EXISTS idx_cache_predictions_tier ON cache_predictions(cache_tier);
CREATE INDEX IF NOT EXISTS idx_cache_predictions_prewarmed ON cache_predictions(is_prewarmed);
CREATE INDEX IF NOT EXISTS idx_cache_predictions_predicted_time ON cache_predictions(predicted_access_time);
CREATE INDEX IF NOT EXISTS idx_cache_predictions_created_at ON cache_predictions(created_at);

-- Cache warming jobs table
CREATE TABLE IF NOT EXISTS cache_warming_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_name TEXT NOT NULL,
  description TEXT,
  warming_strategy TEXT NOT NULL CHECK (warming_strategy IN ('predictive', 'pattern-based', 'scheduled', 'manual')),
  target_cache_tier TEXT DEFAULT 'L1' CHECK (target_cache_tier IN ('L1', 'L2', 'L3')),
  prediction_ids UUID[], -- References to cache_predictions
  pattern_ids UUID[], -- References to cache_patterns
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  progress_percentage FLOAT DEFAULT 0,
  keys_to_warm INTEGER,
  keys_warmed INTEGER DEFAULT 0,
  keys_failed INTEGER DEFAULT 0,
  warming_time_seconds FLOAT,
  hit_rate_after_warming FLOAT, -- Cache hit rate after warming
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_warming_jobs_user_id ON cache_warming_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_cache_warming_jobs_strategy ON cache_warming_jobs(warming_strategy);
CREATE INDEX IF NOT EXISTS idx_cache_warming_jobs_status ON cache_warming_jobs(status);
CREATE INDEX IF NOT EXISTS idx_cache_warming_jobs_created_at ON cache_warming_jobs(created_at);

-- Cache performance metrics table
CREATE TABLE IF NOT EXISTS cache_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_tier TEXT NOT NULL CHECK (cache_tier IN ('L1', 'L2', 'L3', 'all')),
  metric_name TEXT NOT NULL, -- 'hit_rate', 'miss_rate', 'latency', 'size', 'eviction_rate'
  metric_value FLOAT NOT NULL,
  metric_unit TEXT, -- 'percentage', 'ms', 'mb', 'count'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  sample_size INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_perf_tier ON cache_performance(cache_tier);
CREATE INDEX IF NOT EXISTS idx_cache_perf_metric ON cache_performance(metric_name);
CREATE INDEX IF NOT EXISTS idx_cache_perf_period ON cache_performance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_cache_perf_created_at ON cache_performance(created_at);

-- Cache access patterns table
CREATE TABLE IF NOT EXISTS cache_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL, -- 'temporal', 'sequential', 'frequency', 'semantic'
  pattern_description TEXT,
  pattern_signature JSONB NOT NULL, -- Pattern definition
  frequency INTEGER DEFAULT 0, -- How often this pattern occurs
  average_access_interval_seconds FLOAT,
  associated_keys TEXT[], -- Cache keys that match this pattern
  prediction_accuracy FLOAT, -- How accurate predictions based on this pattern are
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_patterns_type ON cache_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_cache_patterns_frequency ON cache_patterns(frequency);
CREATE INDEX IF NOT EXISTS idx_cache_patterns_accuracy ON cache_patterns(prediction_accuracy);
CREATE INDEX IF NOT EXISTS idx_cache_patterns_last_seen ON cache_patterns(last_seen_at);

-- Enable RLS
ALTER TABLE cache_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_warming_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can access all (for API usage)
-- Users can access their own warming jobs

DROP POLICY IF EXISTS "Service role can access all cache predictions" ON cache_predictions;
CREATE POLICY "Service role can access all cache predictions" ON cache_predictions
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can access their own warming jobs" ON cache_warming_jobs;
CREATE POLICY "Users can access their own warming jobs" ON cache_warming_jobs
  FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can access all cache performance" ON cache_performance;
CREATE POLICY "Service role can access all cache performance" ON cache_performance
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all cache patterns" ON cache_patterns;
CREATE POLICY "Service role can access all cache patterns" ON cache_patterns
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update cache_patterns updated_at
CREATE OR REPLACE FUNCTION update_cache_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_cache_patterns_updated_at ON cache_patterns;
CREATE TRIGGER update_cache_patterns_updated_at
  BEFORE UPDATE ON cache_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_cache_patterns_updated_at();
