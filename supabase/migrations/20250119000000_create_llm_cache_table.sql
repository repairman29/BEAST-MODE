-- Create LLM Cache Table for Multi-Tier Cache (L3)
-- This table stores cached LLM responses in the database (persistent cache)

CREATE TABLE IF NOT EXISTS llm_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_llm_cache_expires_at ON llm_cache(expires_at);

-- Index for access tracking
CREATE INDEX IF NOT EXISTS idx_llm_cache_last_accessed ON llm_cache(last_accessed_at);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_llm_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM llm_cache
  WHERE expires_at < NOW();
END;
$$;

-- Enable RLS (Row Level Security)
ALTER TABLE llm_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to read/write
CREATE POLICY "Service role can manage llm_cache"
  ON llm_cache
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Allow authenticated users to read their own cache (if needed)
-- Note: This is optional - adjust based on your security requirements
-- CREATE POLICY "Users can read their cache"
--   ON llm_cache
--   FOR SELECT
--   USING (auth.uid()::text = key);

COMMENT ON TABLE llm_cache IS 'Multi-tier cache L3: Persistent database cache for LLM responses';
COMMENT ON COLUMN llm_cache.key IS 'Cache key (SHA256 hash of request)';
COMMENT ON COLUMN llm_cache.value IS 'Cached response (JSON string)';
COMMENT ON COLUMN llm_cache.expires_at IS 'Expiration timestamp';
COMMENT ON COLUMN llm_cache.access_count IS 'Number of times this cache entry was accessed';
COMMENT ON COLUMN llm_cache.last_accessed_at IS 'Last access timestamp for LRU eviction';
