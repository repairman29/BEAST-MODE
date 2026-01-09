-- Multi-Model Ensemble System Tables
-- Stores ensemble configurations, predictions, performance, and model weights

-- Ensemble configurations table
CREATE TABLE IF NOT EXISTS ensemble_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  model_ids TEXT[] NOT NULL, -- Array of model IDs in the ensemble
  ensemble_type TEXT NOT NULL CHECK (ensemble_type IN ('voting', 'stacking', 'blending', 'dynamic')),
  weights JSONB DEFAULT '{}'::jsonb, -- Model weights {model_id: weight}
  meta_learner_config JSONB DEFAULT '{}'::jsonb, -- Meta-learner configuration for stacking
  is_active BOOLEAN DEFAULT TRUE,
  performance_score FLOAT, -- Overall performance score
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_ensemble_configs_user_id ON ensemble_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_ensemble_configs_type ON ensemble_configurations(ensemble_type);
CREATE INDEX IF NOT EXISTS idx_ensemble_configs_active ON ensemble_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_ensemble_configs_performance ON ensemble_configurations(performance_score);

-- Ensemble predictions table
CREATE TABLE IF NOT EXISTS ensemble_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ensemble_config_id UUID REFERENCES ensemble_configurations(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL, -- 'code-roach', 'oracle', etc.
  prediction_type TEXT NOT NULL, -- 'quality', 'success', 'relevance'
  input_context JSONB NOT NULL, -- Input context for prediction
  individual_predictions JSONB NOT NULL, -- {model_id: prediction_value}
  ensemble_prediction FLOAT NOT NULL, -- Final ensemble prediction
  confidence FLOAT, -- Ensemble confidence
  model_weights_used JSONB DEFAULT '{}'::jsonb, -- Weights used for this prediction
  actual_value FLOAT, -- Actual value (if available)
  error FLOAT, -- Error between prediction and actual
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ensemble_predictions_config_id ON ensemble_predictions(ensemble_config_id);
CREATE INDEX IF NOT EXISTS idx_ensemble_predictions_service ON ensemble_predictions(service_name);
CREATE INDEX IF NOT EXISTS idx_ensemble_predictions_type ON ensemble_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ensemble_predictions_created_at ON ensemble_predictions(created_at);

-- Ensemble performance metrics table
CREATE INDEX IF NOT EXISTS idx_ensemble_performance_config_id ON ensemble_predictions(ensemble_config_id);
CREATE TABLE IF NOT EXISTS ensemble_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ensemble_config_id UUID REFERENCES ensemble_configurations(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  metric_name TEXT NOT NULL, -- 'accuracy', 'mse', 'mae', 'r2', 'latency'
  metric_value FLOAT NOT NULL,
  metric_unit TEXT, -- 'percentage', 'ms', 'count'
  sample_size INTEGER, -- Number of predictions used
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ensemble_perf_config_id ON ensemble_performance(ensemble_config_id);
CREATE INDEX IF NOT EXISTS idx_ensemble_perf_service ON ensemble_performance(service_name);
CREATE INDEX IF NOT EXISTS idx_ensemble_perf_metric ON ensemble_performance(metric_name);
CREATE INDEX IF NOT EXISTS idx_ensemble_perf_period ON ensemble_performance(period_start, period_end);

-- Model weights table (dynamic weighting over time)
CREATE TABLE IF NOT EXISTS model_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ensemble_config_id UUID REFERENCES ensemble_configurations(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  weight FLOAT NOT NULL CHECK (weight >= 0 AND weight <= 1),
  weight_type TEXT DEFAULT 'static' CHECK (weight_type IN ('static', 'dynamic', 'adaptive')),
  context_filters JSONB DEFAULT '{}'::jsonb, -- Context where this weight applies
  performance_contribution FLOAT, -- How much this model contributes to performance
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_weights_config_id ON model_weights(ensemble_config_id);
CREATE INDEX IF NOT EXISTS idx_model_weights_model_id ON model_weights(model_id);
CREATE INDEX IF NOT EXISTS idx_model_weights_type ON model_weights(weight_type);
CREATE INDEX IF NOT EXISTS idx_model_weights_updated ON model_weights(last_updated);

-- Enable RLS
ALTER TABLE ensemble_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ensemble_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ensemble_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_weights ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can access all (for API usage)
-- Users can access their own configurations

DROP POLICY IF EXISTS "Users can access their own ensemble configs" ON ensemble_configurations;
CREATE POLICY "Users can access their own ensemble configs" ON ensemble_configurations
  FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can access all ensemble predictions" ON ensemble_predictions;
CREATE POLICY "Service role can access all ensemble predictions" ON ensemble_predictions
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all ensemble performance" ON ensemble_performance;
CREATE POLICY "Service role can access all ensemble performance" ON ensemble_performance
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all model weights" ON model_weights;
CREATE POLICY "Service role can access all model weights" ON model_weights
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update ensemble_configurations updated_at
CREATE OR REPLACE FUNCTION update_ensemble_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_ensemble_configurations_updated_at ON ensemble_configurations;
CREATE TRIGGER update_ensemble_configurations_updated_at
  BEFORE UPDATE ON ensemble_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_ensemble_configurations_updated_at();
