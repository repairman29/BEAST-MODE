-- Advanced Analytics System Tables
-- Stores dashboards, reports, usage trends, and user analytics

-- Analytics dashboards table
CREATE TABLE IF NOT EXISTS analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  dashboard_config JSONB NOT NULL, -- Dashboard layout, widgets, etc.
  is_shared BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_user_id ON analytics_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_team_id ON analytics_dashboards(team_id);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_shared ON analytics_dashboards(is_shared);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_created_at ON analytics_dashboards(created_at);

-- Analytics reports table
CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('pdf', 'csv', 'json', 'html')),
  report_data JSONB NOT NULL, -- Report content/data
  file_path TEXT, -- Path to generated file (if stored)
  file_size_bytes INTEGER,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiration
  download_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_analytics_reports_dashboard_id ON analytics_reports(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_user_id ON analytics_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_type ON analytics_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_generated_at ON analytics_reports(generated_at);

-- Usage trends table
CREATE TABLE IF NOT EXISTS usage_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  metric_name TEXT NOT NULL, -- 'api_calls', 'predictions', 'storage', 'cost'
  metric_value FLOAT NOT NULL,
  metric_unit TEXT, -- 'count', 'bytes', 'dollars', 'percentage'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('hour', 'day', 'week', 'month')),
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_trends_user_id ON usage_trends(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_trends_team_id ON usage_trends(team_id);
CREATE INDEX IF NOT EXISTS idx_usage_trends_metric_name ON usage_trends(metric_name);
CREATE INDEX IF NOT EXISTS idx_usage_trends_period ON usage_trends(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_trends_period_type ON usage_trends(period_type);

-- User analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'page_view', 'feature_used', 'action', 'conversion'
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  properties JSONB DEFAULT '{}'::jsonb, -- Additional properties
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_name ON user_analytics(event_name);
CREATE INDEX IF NOT EXISTS idx_user_analytics_session_id ON user_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON user_analytics(created_at);

-- Enable RLS
ALTER TABLE analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can access their own analytics and shared/team analytics

DROP POLICY IF EXISTS "Users can access their own dashboards" ON analytics_dashboards;
CREATE POLICY "Users can access their own dashboards" ON analytics_dashboards
  FOR ALL
  USING (auth.uid() = user_id OR is_public = TRUE OR (is_shared = TRUE AND EXISTS (
    SELECT 1 FROM team_members WHERE team_id = analytics_dashboards.team_id AND user_id = auth.uid()
  )));

DROP POLICY IF EXISTS "Users can access their own reports" ON analytics_reports;
CREATE POLICY "Users can access their own reports" ON analytics_reports
  FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can access all usage trends" ON usage_trends;
CREATE POLICY "Service role can access all usage trends" ON usage_trends
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can access their own analytics" ON user_analytics;
CREATE POLICY "Users can access their own analytics" ON user_analytics
  FOR ALL
  USING (auth.uid() = user_id);

-- Function to update analytics_dashboards updated_at
CREATE OR REPLACE FUNCTION update_analytics_dashboards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_analytics_dashboards_updated_at ON analytics_dashboards;
CREATE TRIGGER update_analytics_dashboards_updated_at
  BEFORE UPDATE ON analytics_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_dashboards_updated_at();
