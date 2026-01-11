-- Credit System Migration
-- Adds credit balance, purchases, and usage tracking

-- Add credit balance to user_subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_total_purchased INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_total_used INTEGER DEFAULT 0;

-- Create credit_purchases table
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  credits_amount INTEGER NOT NULL,
  price_amount INTEGER NOT NULL, -- in cents
  price_currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional: credits can expire
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create credit_usage table (track when credits are consumed)
CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  credits_used INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- analyze_pr, scan_repo, api_call, etc.
  action_id TEXT, -- Reference to the action (PR number, repo ID, etc.)
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create credit_transactions table (for balance changes)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- purchase, usage, refund, bonus, expiration
  credits_amount INTEGER NOT NULL, -- positive for purchases, negative for usage
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id UUID, -- Links to credit_purchases or credit_usage
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_stripe_payment_intent ON credit_purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_stripe_checkout_session ON credit_purchases(stripe_checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created_at ON credit_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_usage_action_type ON credit_usage(action_type);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);

-- RLS Policies
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit purchases
CREATE POLICY "Users can view own credit purchases"
  ON credit_purchases FOR SELECT
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Users can view their own credit usage
CREATE POLICY "Users can view own credit usage"
  ON credit_usage FOR SELECT
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Users can view their own credit transactions
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Service role can insert/update credit purchases (for webhooks)
CREATE POLICY "Service role can manage credit purchases"
  ON credit_purchases FOR ALL
  USING (auth.role() = 'service_role');

-- Service role can insert credit usage
CREATE POLICY "Service role can insert credit usage"
  ON credit_usage FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Service role can insert credit transactions
CREATE POLICY "Service role can insert credit transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Function to add credits to user balance
CREATE OR REPLACE FUNCTION add_credits_to_user(
  p_user_id TEXT,
  p_credits_amount INTEGER,
  p_transaction_type TEXT DEFAULT 'purchase',
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(credits_balance, 0) INTO v_balance_before
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  -- Update balance
  UPDATE user_subscriptions
  SET 
    credits_balance = COALESCE(credits_balance, 0) + p_credits_amount,
    credits_total_purchased = COALESCE(credits_total_purchased, 0) + 
      CASE WHEN p_transaction_type = 'purchase' THEN p_credits_amount ELSE 0 END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Get new balance
  SELECT COALESCE(credits_balance, 0) INTO v_balance_after
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    balance_before,
    balance_after,
    reference_id,
    description
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_credits_amount,
    v_balance_before,
    v_balance_after,
    p_reference_id,
    p_description
  );

  RETURN v_balance_after;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use credits from user balance
CREATE OR REPLACE FUNCTION use_credits_from_user(
  p_user_id TEXT,
  p_credits_amount INTEGER,
  p_action_type TEXT,
  p_action_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current balance
  SELECT COALESCE(credits_balance, 0) INTO v_balance_before
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  -- Check if user has enough credits
  IF v_balance_before < p_credits_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Current balance: %, Required: %', v_balance_before, p_credits_amount;
  END IF;

  -- Update balance
  UPDATE user_subscriptions
  SET 
    credits_balance = COALESCE(credits_balance, 0) - p_credits_amount,
    credits_total_used = COALESCE(credits_total_used, 0) + p_credits_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Get new balance
  SELECT COALESCE(credits_balance, 0) INTO v_balance_after
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  -- Record usage
  INSERT INTO credit_usage (
    user_id,
    credits_used,
    action_type,
    action_id,
    description
  ) VALUES (
    p_user_id,
    p_credits_amount,
    p_action_type,
    p_action_id,
    p_description
  ) RETURNING id INTO v_transaction_id;

  -- Record transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    balance_before,
    balance_after,
    reference_id,
    description
  ) VALUES (
    p_user_id,
    'usage',
    -p_credits_amount, -- Negative for usage
    v_balance_before,
    v_balance_after,
    v_transaction_id,
    p_description
  );

  RETURN v_balance_after;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id TEXT)
RETURNS TABLE (
  balance INTEGER,
  total_purchased INTEGER,
  total_used INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(us.credits_balance, 0)::INTEGER as balance,
    COALESCE(us.credits_total_purchased, 0)::INTEGER as total_purchased,
    COALESCE(us.credits_total_used, 0)::INTEGER as total_used
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
