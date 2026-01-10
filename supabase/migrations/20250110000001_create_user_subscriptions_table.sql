-- User Subscriptions Table
-- Tracks user subscription tiers, usage, and billing

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'team', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Usage Tracking Table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month (YYYY-MM-01)
  prs_analyzed INTEGER DEFAULT 0,
  repos_scanned INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_month ON user_usage(month);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month);

-- GitHub Installations Table
CREATE TABLE IF NOT EXISTS github_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installation_id BIGINT NOT NULL UNIQUE, -- GitHub installation ID
  account_id BIGINT, -- GitHub user/org ID
  account_type TEXT CHECK (account_type IN ('User', 'Organization')),
  account_login TEXT,
  repository_selection TEXT CHECK (repository_selection IN ('all', 'selected')),
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_github_installations_user_id ON github_installations(user_id);
CREATE INDEX IF NOT EXISTS idx_github_installations_installation_id ON github_installations(installation_id);
CREATE INDEX IF NOT EXISTS idx_github_installations_account_id ON github_installations(account_id);

-- RLS Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_installations ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can read own subscription" ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access" ON user_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can read their own usage
CREATE POLICY "Users can read own usage" ON user_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access usage" ON user_usage
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can read their own installations
CREATE POLICY "Users can read own installations" ON github_installations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access installations" ON github_installations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Functions
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_github_installations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscriptions_updated_at();

CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage_updated_at();

CREATE TRIGGER update_github_installations_updated_at
  BEFORE UPDATE ON github_installations
  FOR EACH ROW
  EXECUTE FUNCTION update_github_installations_updated_at();

-- Helper function to get or create user subscription
CREATE OR REPLACE FUNCTION get_or_create_user_subscription(p_user_id UUID)
RETURNS user_subscriptions AS $$
DECLARE
  v_subscription user_subscriptions;
BEGIN
  -- Try to get existing subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  -- If not found, create free tier subscription
  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (user_id, tier, status)
    VALUES (p_user_id, 'free', 'active')
    RETURNING * INTO v_subscription;
  END IF;
  
  RETURN v_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get or create user usage for current month
CREATE OR REPLACE FUNCTION get_or_create_user_usage(p_user_id UUID, p_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE))
RETURNS user_usage AS $$
DECLARE
  v_usage user_usage;
BEGIN
  -- Try to get existing usage
  SELECT * INTO v_usage
  FROM user_usage
  WHERE user_id = p_user_id AND month = p_month;
  
  -- If not found, create new usage record
  IF NOT FOUND THEN
    INSERT INTO user_usage (user_id, month, prs_analyzed, repos_scanned, api_calls)
    VALUES (p_user_id, p_month, 0, 0, 0)
    RETURNING * INTO v_usage;
  END IF;
  
  RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE user_subscriptions IS 'Tracks user subscription tiers and billing information';
COMMENT ON TABLE user_usage IS 'Tracks monthly usage per user (PRs analyzed, repos scanned, etc.)';
COMMENT ON TABLE github_installations IS 'Links GitHub App installations to user accounts';
