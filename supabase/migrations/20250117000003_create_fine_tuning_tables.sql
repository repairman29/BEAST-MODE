-- Real-Time Fine-Tuning System Tables
-- Stores fine-tuning jobs, incremental updates, model versions, and metrics

-- Fine-tuning jobs table
CREATE TABLE IF NOT EXISTS fine_tuning_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  base_model_id TEXT NOT NULL, -- Base model identifier
  base_model_version TEXT NOT NULL,
  job_name TEXT NOT NULL,
  description TEXT,
  training_data_count INTEGER NOT NULL,
  training_data_hash TEXT, -- Hash of training data
  hyperparameters JSONB NOT NULL, -- Learning rate, epochs, batch size, etc.
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  progress_percentage FLOAT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_epoch INTEGER DEFAULT 0,
  total_epochs INTEGER NOT NULL,
  error_message TEXT,
  fine_tuned_model_id TEXT, -- Resulting model ID
  fine_tuned_model_version TEXT,
  performance_metrics JSONB DEFAULT '{}'::jsonb, -- Training metrics
  metadata JSONB DEFAULT '{}'::jsonb,
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_user_id ON fine_tuning_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_base_model ON fine_tuning_jobs(base_model_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_status ON fine_tuning_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_created_at ON fine_tuning_jobs(created_at);

-- Incremental updates table
CREATE TABLE IF NOT EXISTS incremental_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES fine_tuning_jobs(id) ON DELETE CASCADE,
  model_version_id UUID REFERENCES model_versions(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('incremental', 'full', 'hot_swap')),
  new_data_count INTEGER NOT NULL,
  previous_model_version TEXT NOT NULL,
  new_model_version TEXT NOT NULL,
  update_size_mb FLOAT, -- Size of update
  performance_delta JSONB DEFAULT '{}'::jsonb, -- Performance change
  validation_metrics JSONB DEFAULT '{}'::jsonb,
  is_applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,
  rollback_available BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incremental_updates_job_id ON incremental_updates(job_id);
CREATE INDEX IF NOT EXISTS idx_incremental_updates_model_version ON incremental_updates(model_version_id);
CREATE INDEX IF NOT EXISTS idx_incremental_updates_type ON incremental_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_incremental_updates_applied ON incremental_updates(is_applied);
CREATE INDEX IF NOT EXISTS idx_incremental_updates_created_at ON incremental_updates(created_at);


-- Fine-tuning metrics table
CREATE TABLE IF NOT EXISTS fine_tuning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES fine_tuning_jobs(id) ON DELETE CASCADE,
  epoch INTEGER NOT NULL,
  metric_name TEXT NOT NULL, -- 'loss', 'accuracy', 'val_loss', 'val_accuracy', 'learning_rate'
  metric_value FLOAT NOT NULL,
  step INTEGER, -- Training step within epoch
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fine_tuning_metrics_job_id ON fine_tuning_metrics(job_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_metrics_epoch ON fine_tuning_metrics(epoch);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_metrics_name ON fine_tuning_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_metrics_timestamp ON fine_tuning_metrics(timestamp);

-- Enable RLS
ALTER TABLE fine_tuning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incremental_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_tuning_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can access all (for API usage)
-- Users can access their own jobs

DROP POLICY IF EXISTS "Users can access their own fine-tuning jobs" ON fine_tuning_jobs;
CREATE POLICY "Users can access their own fine-tuning jobs" ON fine_tuning_jobs
  FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can access all incremental updates" ON incremental_updates;
CREATE POLICY "Service role can access all incremental updates" ON incremental_updates
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all model versions" ON model_versions;
CREATE POLICY "Service role can access all model versions" ON model_versions
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all fine-tuning metrics" ON fine_tuning_metrics;
CREATE POLICY "Service role can access all fine-tuning metrics" ON fine_tuning_metrics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fix: Create model_versions table before incremental_updates references it
-- (Move the CREATE TABLE statement above the incremental_updates table)
