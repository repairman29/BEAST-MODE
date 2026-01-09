-- Neural Architecture Search (NAS) System Tables
-- Stores NAS experiments, candidate architectures, performance, and optimal architectures

-- Architecture search runs table
CREATE TABLE IF NOT EXISTS architecture_search_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  search_space JSONB NOT NULL, -- Define search space (layers, activations, etc.)
  search_strategy TEXT NOT NULL CHECK (search_strategy IN ('random', 'grid', 'bayesian', 'evolutionary', 'reinforcement')),
  objective TEXT NOT NULL, -- 'accuracy', 'latency', 'cost', 'composite'
  max_trials INTEGER DEFAULT 100,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'stopped')),
  best_architecture_id UUID, -- Reference to optimal_architectures
  best_score FLOAT,
  total_trials INTEGER DEFAULT 0,
  completed_trials INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nas_runs_user_id ON architecture_search_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_nas_runs_status ON architecture_search_runs(status);
CREATE INDEX IF NOT EXISTS idx_nas_runs_strategy ON architecture_search_runs(search_strategy);
CREATE INDEX IF NOT EXISTS idx_nas_runs_started_at ON architecture_search_runs(started_at);

-- Architecture candidates table
CREATE TABLE IF NOT EXISTS architecture_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_run_id UUID REFERENCES architecture_search_runs(id) ON DELETE CASCADE,
  architecture_config JSONB NOT NULL, -- Architecture definition
  architecture_hash TEXT NOT NULL, -- Hash to detect duplicates
  generation INTEGER DEFAULT 1, -- Generation number (for evolutionary)
  parent_ids UUID[], -- Parent architectures (for evolutionary)
  mutation_type TEXT, -- 'crossover', 'mutation', 'initial'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(search_run_id, architecture_hash)
);

CREATE INDEX IF NOT EXISTS idx_nas_candidates_run_id ON architecture_candidates(search_run_id);
CREATE INDEX IF NOT EXISTS idx_nas_candidates_hash ON architecture_candidates(architecture_hash);
CREATE INDEX IF NOT EXISTS idx_nas_candidates_generation ON architecture_candidates(generation);
CREATE INDEX IF NOT EXISTS idx_nas_candidates_created_at ON architecture_candidates(created_at);

-- Architecture performance metrics table
CREATE TABLE IF NOT EXISTS architecture_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES architecture_candidates(id) ON DELETE CASCADE,
  search_run_id UUID REFERENCES architecture_search_runs(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- 'accuracy', 'latency', 'cost', 'memory', 'throughput'
  metric_value FLOAT NOT NULL,
  metric_unit TEXT, -- 'percentage', 'ms', 'dollars', 'mb', 'requests_per_sec'
  training_time_seconds FLOAT, -- Time to train this architecture
  inference_time_ms FLOAT, -- Inference latency
  model_size_mb FLOAT, -- Model size
  metadata JSONB DEFAULT '{}'::jsonb,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nas_perf_candidate_id ON architecture_performance(candidate_id);
CREATE INDEX IF NOT EXISTS idx_nas_perf_run_id ON architecture_performance(search_run_id);
CREATE INDEX IF NOT EXISTS idx_nas_perf_metric ON architecture_performance(metric_name);
CREATE INDEX IF NOT EXISTS idx_nas_perf_evaluated_at ON architecture_performance(evaluated_at);

-- Optimal architectures table
CREATE TABLE IF NOT EXISTS optimal_architectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_run_id UUID REFERENCES architecture_search_runs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES architecture_candidates(id) ON DELETE CASCADE,
  architecture_config JSONB NOT NULL, -- Final architecture definition
  performance_summary JSONB NOT NULL, -- Summary of all metrics
  ranking_score FLOAT NOT NULL, -- Composite ranking score
  is_deployed BOOLEAN DEFAULT FALSE,
  deployment_version TEXT, -- Version if deployed
  deployment_metrics JSONB DEFAULT '{}'::jsonb, -- Production metrics
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_optimal_arch_run_id ON optimal_architectures(search_run_id);
CREATE INDEX IF NOT EXISTS idx_optimal_arch_candidate_id ON optimal_architectures(candidate_id);
CREATE INDEX IF NOT EXISTS idx_optimal_arch_ranking ON optimal_architectures(ranking_score);
CREATE INDEX IF NOT EXISTS idx_optimal_arch_deployed ON optimal_architectures(is_deployed);

-- Enable RLS
ALTER TABLE architecture_search_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE architecture_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE architecture_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimal_architectures ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can access all (for API usage)
-- Users can access their own search runs

DROP POLICY IF EXISTS "Users can access their own NAS runs" ON architecture_search_runs;
CREATE POLICY "Users can access their own NAS runs" ON architecture_search_runs
  FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can access all architecture candidates" ON architecture_candidates;
CREATE POLICY "Service role can access all architecture candidates" ON architecture_candidates
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all architecture performance" ON architecture_performance;
CREATE POLICY "Service role can access all architecture performance" ON architecture_performance
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all optimal architectures" ON optimal_architectures;
CREATE POLICY "Service role can access all optimal architectures" ON optimal_architectures
  FOR ALL
  USING (true)
  WITH CHECK (true);
