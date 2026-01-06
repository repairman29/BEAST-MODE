-- Create BEAST MODE subscriptions and API keys tables
-- For license validation and usage tracking

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS beast_mode_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- User identifier (can be UUID or GitHub user ID)
  tier TEXT NOT NULL DEFAULT 'free',  -- 'free', 'developer', 'team', 'enterprise'
  status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'canceled', 'past_due', 'trialing'
  stripe_subscription_id TEXT,  -- Stripe subscription ID if using Stripe
  stripe_customer_id TEXT,  -- Stripe customer ID
  price_amount INTEGER,  -- Price in cents (e.g., 7900 for $79)
  currency TEXT DEFAULT 'usd',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_beast_mode_subscriptions_user_id ON beast_mode_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_beast_mode_subscriptions_tier ON beast_mode_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_beast_mode_subscriptions_status ON beast_mode_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_beast_mode_subscriptions_stripe_subscription_id ON beast_mode_subscriptions(stripe_subscription_id);

-- ============================================================================
-- API KEYS TABLE (BEAST MODE API Keys, not AI provider keys)
-- ============================================================================

CREATE TABLE IF NOT EXISTS beast_mode_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,  -- SHA-256 hash of the API key
  key_prefix TEXT NOT NULL,  -- First 8 characters for display (e.g., "bm_live_")
  name TEXT,  -- Optional: user-friendly name
  tier TEXT NOT NULL DEFAULT 'free',  -- Subscription tier when key was created
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,  -- Optional: key expiration
  is_active BOOLEAN DEFAULT true,
  UNIQUE(key_hash)
);

CREATE INDEX IF NOT EXISTS idx_beast_mode_api_keys_user_id ON beast_mode_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_beast_mode_api_keys_key_hash ON beast_mode_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_beast_mode_api_keys_active ON beast_mode_api_keys(is_active) WHERE is_active = true;

-- ============================================================================
-- API USAGE TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS beast_mode_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  api_key_id UUID REFERENCES beast_mode_api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,  -- API endpoint called
  method TEXT NOT NULL,  -- HTTP method
  status_code INTEGER,
  response_time_ms INTEGER,  -- Response time in milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Partition by month for better performance
  month_year TEXT GENERATED ALWAYS AS (to_char(created_at, 'YYYY-MM')) STORED
);

CREATE INDEX IF NOT EXISTS idx_beast_mode_api_usage_user_id ON beast_mode_api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_beast_mode_api_usage_api_key_id ON beast_mode_api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_beast_mode_api_usage_created_at ON beast_mode_api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_beast_mode_api_usage_month_year ON beast_mode_api_usage(month_year);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE beast_mode_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE beast_mode_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE beast_mode_api_usage ENABLE ROW LEVEL SECURITY;

-- Policies: Service role can access all
DROP POLICY IF EXISTS "Service role can access subscriptions" ON beast_mode_subscriptions;
CREATE POLICY "Service role can access subscriptions" ON beast_mode_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can access API keys" ON beast_mode_api_keys;
CREATE POLICY "Service role can access API keys" ON beast_mode_api_keys
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can access API usage" ON beast_mode_api_usage;
CREATE POLICY "Service role can access API usage" ON beast_mode_api_usage
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current subscription tier for a user
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_tier TEXT;
BEGIN
  SELECT tier INTO v_tier
  FROM beast_mode_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > NOW())
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get API call count for current month
CREATE OR REPLACE FUNCTION get_user_api_usage_count(p_user_id TEXT, p_month_year TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_month TEXT;
BEGIN
  v_month := COALESCE(p_month_year, to_char(NOW(), 'YYYY-MM'));
  
  SELECT COUNT(*) INTO v_count
  FROM beast_mode_api_usage
  WHERE user_id = p_user_id
    AND month_year = v_month;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

