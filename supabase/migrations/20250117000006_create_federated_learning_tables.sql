-- Federated Learning System Tables
-- Stores federated nodes, updates, aggregations, and metrics

-- Federated nodes table
CREATE TABLE IF NOT EXISTS federated_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id TEXT NOT NULL UNIQUE, -- Unique node identifier
  node_name TEXT NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('client', 'server', 'coordinator')),
  endpoint_url TEXT NOT NULL, -- Node API endpoint
  public_key TEXT, -- Public key for secure communication
  is_active BOOLEAN DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_federated_nodes_node_id ON federated_nodes(node_id);
CREATE INDEX IF NOT EXISTS idx_federated_nodes_type ON federated_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_federated_nodes_active ON federated_nodes(is_active);
CREATE INDEX IF NOT EXISTS idx_federated_nodes_last_seen ON federated_nodes(last_seen_at);

-- Federated updates table
CREATE TABLE IF NOT EXISTS federated_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id TEXT NOT NULL REFERENCES federated_nodes(node_id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL, -- Federated learning round
  model_version TEXT NOT NULL, -- Model version being updated
  update_data JSONB NOT NULL, -- Encrypted/compressed model update
  update_hash TEXT NOT NULL, -- Hash of update for verification
  sample_count INTEGER NOT NULL, -- Number of samples used for this update
  training_time_seconds FLOAT,
  privacy_budget_used FLOAT, -- Differential privacy budget used
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'aggregated', 'failed')),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  aggregated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_federated_updates_node_id ON federated_updates(node_id);
CREATE INDEX IF NOT EXISTS idx_federated_updates_round ON federated_updates(round_number);
CREATE INDEX IF NOT EXISTS idx_federated_updates_status ON federated_updates(status);
CREATE INDEX IF NOT EXISTS idx_federated_updates_received_at ON federated_updates(received_at);

-- Federated aggregations table
CREATE TABLE IF NOT EXISTS federated_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER NOT NULL,
  aggregation_method TEXT NOT NULL CHECK (aggregation_method IN ('fedavg', 'fedprox', 'scaffold', 'feddyn')),
  participating_nodes TEXT[] NOT NULL, -- Array of node IDs
  update_ids UUID[] NOT NULL, -- Array of federated_updates IDs
  aggregated_model JSONB NOT NULL, -- Aggregated model weights
  aggregation_hash TEXT NOT NULL,
  total_samples INTEGER NOT NULL, -- Total samples across all nodes
  aggregation_time_seconds FLOAT,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_federated_aggregations_round ON federated_aggregations(round_number);
CREATE INDEX IF NOT EXISTS idx_federated_aggregations_method ON federated_aggregations(aggregation_method);
CREATE INDEX IF NOT EXISTS idx_federated_aggregations_created_at ON federated_aggregations(created_at);

-- Federated metrics table
CREATE TABLE IF NOT EXISTS federated_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER,
  node_id TEXT REFERENCES federated_nodes(node_id) ON DELETE SET NULL,
  metric_name TEXT NOT NULL, -- 'accuracy', 'loss', 'privacy_budget', 'communication_cost'
  metric_value FLOAT NOT NULL,
  metric_unit TEXT, -- 'percentage', 'count', 'bytes', 'seconds'
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_federated_metrics_round ON federated_metrics(round_number);
CREATE INDEX IF NOT EXISTS idx_federated_metrics_node_id ON federated_metrics(node_id);
CREATE INDEX IF NOT EXISTS idx_federated_metrics_name ON federated_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_federated_metrics_recorded_at ON federated_metrics(recorded_at);

-- Enable RLS
ALTER TABLE federated_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE federated_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE federated_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE federated_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can access all (for API usage)

DROP POLICY IF EXISTS "Service role can access all federated nodes" ON federated_nodes;
CREATE POLICY "Service role can access all federated nodes" ON federated_nodes
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all federated updates" ON federated_updates;
CREATE POLICY "Service role can access all federated updates" ON federated_updates
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all federated aggregations" ON federated_aggregations;
CREATE POLICY "Service role can access all federated aggregations" ON federated_aggregations
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can access all federated metrics" ON federated_metrics;
CREATE POLICY "Service role can access all federated metrics" ON federated_metrics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update federated_nodes updated_at
CREATE OR REPLACE FUNCTION update_federated_nodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_federated_nodes_updated_at ON federated_nodes;
CREATE TRIGGER update_federated_nodes_updated_at
  BEFORE UPDATE ON federated_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_federated_nodes_updated_at();
