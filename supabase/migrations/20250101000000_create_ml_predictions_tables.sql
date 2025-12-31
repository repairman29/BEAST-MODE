-- ML System Database Tables
-- Migration: 20250101000000_create_ml_predictions_tables.sql
-- Description: Tables for storing ML predictions and feedback from all services

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Unified ML Predictions Table
-- Stores all ML predictions from all services
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL, -- 'code-roach', 'oracle', 'daisy-chain', 'ai-gm', 'first-mate', 'game-app'
    prediction_type TEXT NOT NULL, -- 'quality', 'success', 'relevance', 'code-quality', 'narrative-quality'
    predicted_value FLOAT NOT NULL, -- Predicted value (0-1 or 0-100 depending on type)
    actual_value FLOAT, -- Actual value (if available)
    confidence FLOAT, -- Prediction confidence (0-1)
    context JSONB DEFAULT '{}', -- Full context of the prediction
    model_version TEXT, -- Model version used (e.g., 'v3-advanced')
    source TEXT DEFAULT 'ml_model', -- 'ml_model', 'heuristic', 'ensemble'
    error FLOAT, -- Error between predicted and actual (if actual available)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML Feedback Table
-- Stores feedback on predictions
CREATE TABLE IF NOT EXISTS ml_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID REFERENCES ml_predictions(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    feedback_type TEXT, -- 'user', 'system', 'automated'
    feedback_score FLOAT, -- Feedback score (0-1)
    feedback_text TEXT,
    user_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML Performance Metrics Table
-- Stores aggregated performance metrics
CREATE TABLE IF NOT EXISTS ml_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL,
    metric_name TEXT NOT NULL, -- 'accuracy', 'error_rate', 'latency', 'cache_hit_rate'
    metric_value FLOAT NOT NULL,
    metric_unit TEXT, -- 'percentage', 'ms', 'count'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service-Specific Prediction Tables (for detailed tracking)

-- Code Roach ML Predictions
CREATE TABLE IF NOT EXISTS code_roach_ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID,
    file_path TEXT,
    prediction_type TEXT NOT NULL, -- 'code-quality', 'fix-success'
    predicted_quality FLOAT NOT NULL,
    actual_quality FLOAT,
    code_metrics JSONB, -- Code quality metrics
    context JSONB DEFAULT '{}',
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oracle ML Predictions
CREATE TABLE IF NOT EXISTS oracle_ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT,
    knowledge_id UUID,
    predicted_quality FLOAT NOT NULL,
    predicted_relevance FLOAT NOT NULL,
    actual_quality FLOAT,
    actual_relevance FLOAT,
    context JSONB DEFAULT '{}',
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daisy Chain ML Predictions
CREATE TABLE IF NOT EXISTS daisy_chain_ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID,
    task_type TEXT,
    predicted_quality FLOAT NOT NULL,
    predicted_success FLOAT NOT NULL,
    actual_success BOOLEAN,
    context JSONB DEFAULT '{}',
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- First Mate ML Predictions
CREATE TABLE IF NOT EXISTS first_mate_ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    roll_type TEXT NOT NULL, -- 'dice', 'action'
    stat_name TEXT,
    stat_value INTEGER,
    modifier INTEGER,
    predicted_success FLOAT NOT NULL,
    actual_success BOOLEAN,
    context JSONB DEFAULT '{}',
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game App ML Predictions
CREATE TABLE IF NOT EXISTS game_app_ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID,
    narrative_id UUID,
    predicted_quality FLOAT NOT NULL,
    actual_quality FLOAT,
    scenario_id TEXT,
    roll_type TEXT,
    context JSONB DEFAULT '{}',
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ml_predictions_service ON ml_predictions(service_name);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_type ON ml_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_created ON ml_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model ON ml_predictions(model_version);

CREATE INDEX IF NOT EXISTS idx_ml_feedback_prediction ON ml_feedback(prediction_id);
CREATE INDEX IF NOT EXISTS idx_ml_feedback_service ON ml_feedback(service_name);
CREATE INDEX IF NOT EXISTS idx_ml_feedback_created ON ml_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ml_performance_service ON ml_performance_metrics(service_name);
CREATE INDEX IF NOT EXISTS idx_ml_performance_metric ON ml_performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_ml_performance_period ON ml_performance_metrics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_code_roach_ml_project ON code_roach_ml_predictions(project_id);
CREATE INDEX IF NOT EXISTS idx_code_roach_ml_created ON code_roach_ml_predictions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_oracle_ml_knowledge ON oracle_ml_predictions(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_oracle_ml_created ON oracle_ml_predictions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daisy_chain_ml_task ON daisy_chain_ml_predictions(task_id);
CREATE INDEX IF NOT EXISTS idx_daisy_chain_ml_created ON daisy_chain_ml_predictions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_first_mate_ml_user ON first_mate_ml_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_first_mate_ml_created ON first_mate_ml_predictions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_app_ml_session ON game_app_ml_predictions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_app_ml_created ON game_app_ml_predictions(created_at DESC);

-- Row Level Security (RLS) - Allow service role full access
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_roach_ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oracle_ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daisy_chain_ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_mate_ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_app_ml_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
DO $$
BEGIN
    -- ml_predictions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ml_predictions' AND policyname = 'service_role_all') THEN
        CREATE POLICY service_role_all ON ml_predictions
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    -- ml_feedback
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ml_feedback' AND policyname = 'service_role_all') THEN
        CREATE POLICY service_role_all ON ml_feedback
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    -- ml_performance_metrics
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ml_performance_metrics' AND policyname = 'service_role_all') THEN
        CREATE POLICY service_role_all ON ml_performance_metrics
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    -- code_roach_ml_predictions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'code_roach_ml_predictions' AND policyname = 'service_role_all') THEN
        CREATE POLICY service_role_all ON code_roach_ml_predictions
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    -- oracle_ml_predictions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'oracle_ml_predictions' AND policyname = 'service_role_all') THEN
        CREATE POLICY service_role_all ON oracle_ml_predictions
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    -- daisy_chain_ml_predictions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daisy_chain_ml_predictions' AND policyname = 'service_role_all') THEN
        CREATE POLICY service_role_all ON daisy_chain_ml_predictions
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    -- first_mate_ml_predictions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'first_mate_ml_predictions' AND policyname = 'service_role_all') THEN
        CREATE POLICY service_role_all ON first_mate_ml_predictions
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    -- game_app_ml_predictions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_app_ml_predictions' AND policyname = 'service_role_all') THEN
        CREATE POLICY service_role_all ON game_app_ml_predictions
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

