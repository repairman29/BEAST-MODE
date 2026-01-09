-- Cross-Domain Learning System Tables
-- Stores domain mappings, transfer learning runs, adaptation metrics, and predictions

-- Domain mappings table
CREATE TABLE IF NOT EXISTS domain_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_domain TEXT NOT NULL, -- Source domain identifier
  target_domain TEXT NOT NULL, -- Target domain identifier
  domain_type TEXT NOT NULL, -- 'code-quality', 'narrative', 'search', 'general'
  similarity_score FLOAT CHECK (similarity_score >= 0 AND similarity_score <= 1), -- Domain similarity
  transfer_feasibility FLOAT CHECK (transfer_feasibility >= 0 AND transfer_feasibility <= 1),
  shared_features JSONB DEFAULT '[]'::jsonb, -- Features shared between domains
  domain_specific_features JSONB DEFAULT '[]'::jsonb, -- Domain-specific features
  transfer_strategy TEXT, -- 'fine-tuning', 'feature-extraction', 'adversarial', 'multi-task'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(source_domain, target_domain)
);

CREATE INDEX IF NOT EXISTS idx_domain_mappings_source ON domain_mappings(source_domain);
CREATE INDEX IF NOT EXISTS idx_domain_mappings_target ON domain_mappings(target_domain);
CREATE INDEX IF NOT EXISTS idx_domain_mappings_type ON domain_mappings(domain_type);
CREATE INDEX IF NOT EXISTS idx_domain_mappings_similarity ON domain_mappings(similarity_score);

-- Transfer learning runs table
CREATE TABLE IF NOT EXISTS transfer_learning_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_domain TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  source_model_id TEXT NOT NULL,
  source_model_version TEXT NOT NULL,
  run_name TEXT NOT NULL,
  description TEXT,
  transfer_strategy TEXT NOT NULL CHECK (transfer_strategy IN ('fine-tuning', 'feature-extraction', 'adversarial', 'multi-task')),
  frozen_layers INTEGER, -- Number of layers to freeze
  learning_rate FLOAT,
  training_data_count INTEGER NOT NULL,
  validation_data_count INTEGER,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  progress_percentage FLOAT DEFAULT 0,
  target_model_id TEXT, -- Resulting model ID
  target_model_version TEXT,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_runs_user_id ON transfer_learning_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_runs_source_domain ON transfer_learning_runs(source_domain);
CREATE INDEX IF NOT EXISTS idx_transfer_runs_target_domain ON transfer_learning_runs(target_domain);
CREATE INDEX IF NOT EXISTS idx_transfer_runs_status ON transfer_learning_runs(status);
CREATE INDEX IF NOT EXISTS idx_transfer_runs_created_at ON transfer_learning_runs(created_at);

-- Domain adaptation metrics table
CREATE TABLE IF NOT EXISTS domain_adaptation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_run_id UUID REFERENCES transfer_learning_runs(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- 'accuracy', 'f1', 'domain_shift', 'adaptation_gain'
  metric_value FLOAT NOT NULL,
  metric_unit TEXT, -- 'percentage', 'score'
  evaluation_phase TEXT CHECK (evaluation_phase IN ('before_transfer', 'after_transfer', 'target_domain_only')),
  sample_size INTEGER,
  confidence_interval JSONB, -- {lower: x, upper: y}
  metadata JSONB DEFAULT '{}'::jsonb,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adaptation_metrics_run_id ON domain_adaptation_metrics(transfer_run_id);
CREATE INDEX IF NOT EXISTS idx_adaptation_metrics_name ON domain_adaptation_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_adaptation_metrics_phase ON domain_adaptation_metrics(evaluation_phase);
CREATE INDEX IF NOT EXISTS idx_adaptation_metrics_evaluated_at ON domain_adaptation_metrics(evaluated_at);

-- Cross-domain predictions table
CREATE TABLE IF NOT EXISTS cross_domain_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_run_id UUID REFERENCES transfer_learning_runs(id) ON DELETE SET NULL,
  source_domain TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  input_context JSONB NOT NULL,
  source_domain_prediction FLOAT, -- Prediction using source domain model
  target_domain_prediction FLOAT NOT NULL, -- Prediction using transferred model
  adaptation_confidence FLOAT, -- Confidence in adaptation
  actual_value FLOAT, -- Actual value (if available)
  error FLOAT, -- Error between prediction and actual
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cross_domain_pred_run_id ON cross_domain_predictions(transfer_run_id);
CREATE INDEX IF NOT EXISTS idx_cross_domain_pred_source ON cross_domain_predictions(source_domain);
CREATE INDEX IF NOT EXISTS idx_cross_domain_pred_target ON cross_domain_predictions(target_domain);
CREATE INDEX IF NOT EXISTS idx_cross_domain_pred_created_at ON cross_domain_predictions(created_at);

-- Enable RLS
ALTER TABLE domain_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_learning_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_adaptation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_domain_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can access all (for API usage)
-- Users can access their own transfer runs

DROP POLICY IF EXISTS "Service role can access all domain mappings" ON domain_mappings;
CREATE POLICY "Service role can access all domain mappings" ON domain_mappings
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can access their own transfer runs" ON transfer_learning_runs;
CREATE POLICY "Users can access their own transfer runs" ON transfer_learning_runs
  FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can access all adaptation metrics" ON domain_adaptation_metrics;
CREATE POLICY "Service role can access all adaptation metrics" ON domain_adaptation_metrics
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all cross-domain predictions" ON cross_domain_predictions;
CREATE POLICY "Service role can access all cross-domain predictions" ON cross_domain_predictions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update domain_mappings updated_at
CREATE OR REPLACE FUNCTION update_domain_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_domain_mappings_updated_at ON domain_mappings;
CREATE TRIGGER update_domain_mappings_updated_at
  BEFORE UPDATE ON domain_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_domain_mappings_updated_at();
