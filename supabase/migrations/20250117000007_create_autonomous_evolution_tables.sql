-- Autonomous Evolution System Tables
-- Stores evolution generations, candidates, selections, and metrics

-- Evolution generations table
CREATE TABLE IF NOT EXISTS evolution_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_number INTEGER NOT NULL,
  population_size INTEGER NOT NULL,
  parent_generation_id UUID REFERENCES evolution_generations(id) ON DELETE SET NULL,
  evolution_strategy TEXT NOT NULL CHECK (evolution_strategy IN ('genetic', 'differential', 'particle_swarm', 'neural_evolution')),
  fitness_function JSONB NOT NULL, -- Fitness function definition
  mutation_rate FLOAT DEFAULT 0.1 CHECK (mutation_rate >= 0 AND mutation_rate <= 1),
  crossover_rate FLOAT DEFAULT 0.7 CHECK (crossover_rate >= 0 AND crossover_rate <= 1),
  best_fitness FLOAT,
  average_fitness FLOAT,
  diversity_score FLOAT, -- Population diversity metric
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'converged', 'stopped')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_evolution_generations_user_id ON evolution_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_generations_number ON evolution_generations(generation_number);
CREATE INDEX IF NOT EXISTS idx_evolution_generations_parent ON evolution_generations(parent_generation_id);
CREATE INDEX IF NOT EXISTS idx_evolution_generations_status ON evolution_generations(status);
CREATE INDEX IF NOT EXISTS idx_evolution_generations_started_at ON evolution_generations(started_at);

-- Evolution candidates table
CREATE TABLE IF NOT EXISTS evolution_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES evolution_generations(id) ON DELETE CASCADE,
  candidate_config JSONB NOT NULL, -- Candidate configuration/parameters
  candidate_hash TEXT NOT NULL, -- Hash for duplicate detection
  parent_ids UUID[], -- Parent candidate IDs (for crossover)
  mutation_type TEXT, -- 'point', 'gaussian', 'uniform', 'none'
  fitness_score FLOAT, -- Fitness evaluation result
  fitness_components JSONB DEFAULT '{}'::jsonb, -- Breakdown of fitness components
  evaluated BOOLEAN DEFAULT FALSE,
  evaluation_time_seconds FLOAT,
  selected_for_next_generation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evolution_candidates_generation_id ON evolution_candidates(generation_id);
CREATE INDEX IF NOT EXISTS idx_evolution_candidates_hash ON evolution_candidates(candidate_hash);
CREATE INDEX IF NOT EXISTS idx_evolution_candidates_fitness ON evolution_candidates(fitness_score);
CREATE INDEX IF NOT EXISTS idx_evolution_candidates_evaluated ON evolution_candidates(evaluated);
CREATE INDEX IF NOT EXISTS idx_evolution_candidates_selected ON evolution_candidates(selected_for_next_generation);

-- Evolution selections table
CREATE TABLE IF NOT EXISTS evolution_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES evolution_generations(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES evolution_candidates(id) ON DELETE CASCADE,
  selection_method TEXT NOT NULL CHECK (selection_method IN ('tournament', 'roulette', 'rank', 'elitism')),
  selection_rank INTEGER, -- Rank in selection (1 = best)
  fitness_at_selection FLOAT,
  will_reproduce BOOLEAN DEFAULT FALSE,
  will_mutate BOOLEAN DEFAULT FALSE,
  selected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evolution_selections_generation_id ON evolution_selections(generation_id);
CREATE INDEX IF NOT EXISTS idx_evolution_selections_candidate_id ON evolution_selections(candidate_id);
CREATE INDEX IF NOT EXISTS idx_evolution_selections_method ON evolution_selections(selection_method);
CREATE INDEX IF NOT EXISTS idx_evolution_selections_rank ON evolution_selections(selection_rank);

-- Evolution metrics table
CREATE TABLE IF NOT EXISTS evolution_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES evolution_generations(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- 'best_fitness', 'avg_fitness', 'diversity', 'convergence_rate'
  metric_value FLOAT NOT NULL,
  metric_unit TEXT, -- 'score', 'percentage', 'count'
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evolution_metrics_generation_id ON evolution_metrics(generation_id);
CREATE INDEX IF NOT EXISTS idx_evolution_metrics_name ON evolution_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_evolution_metrics_recorded_at ON evolution_metrics(recorded_at);

-- Enable RLS
ALTER TABLE evolution_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can access all (for API usage)
-- Users can access their own generations

DROP POLICY IF EXISTS "Users can access their own evolution generations" ON evolution_generations;
CREATE POLICY "Users can access their own evolution generations" ON evolution_generations
  FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can access all evolution candidates" ON evolution_candidates;
CREATE POLICY "Service role can access all evolution candidates" ON evolution_candidates
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all evolution selections" ON evolution_selections;
CREATE POLICY "Service role can access all evolution selections" ON evolution_selections
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all evolution metrics" ON evolution_metrics;
CREATE POLICY "Service role can access all evolution metrics" ON evolution_metrics
  FOR ALL
  USING (true)
  WITH CHECK (true);
