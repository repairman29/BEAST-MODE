-- UX/PLG Analysis System Tables
-- Stores analysis results, recommendations, and improvement tracking
-- Migration: 20250109000000_create_ux_plg_analysis_tables.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- UX/PLG Analysis Runs
-- Stores each analysis run
CREATE TABLE IF NOT EXISTS ux_plg_analysis_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name TEXT NOT NULL, -- 'echeo-landing', 'BEAST-MODE-PRODUCT', 'first-mate-app'
    run_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'incremental', 'component-only'
    components_analyzed INTEGER DEFAULT 0,
    total_components INTEGER DEFAULT 0,
    analysis_data JSONB NOT NULL, -- Full analysis results
    summary JSONB, -- Summary scores and metrics
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ux_plg_runs_product ON ux_plg_analysis_runs(product_name);
CREATE INDEX IF NOT EXISTS idx_ux_plg_runs_created_at ON ux_plg_analysis_runs(created_at DESC);

-- UX/PLG Recommendations
-- Stores prioritized recommendations from analysis
CREATE TABLE IF NOT EXISTS ux_plg_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_run_id UUID REFERENCES ux_plg_analysis_runs(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    recommendation_type TEXT NOT NULL, -- 'design-quality', 'plg-principle', 'quick-win', 'long-term'
    category TEXT NOT NULL, -- 'documentation', 'testing', 'ci-cd', 'visual-hierarchy', 'time-to-value', etc.
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    impact_score DECIMAL(3,2), -- 0.00-1.00
    effort_estimate TEXT, -- 'quick', 'medium', 'long'
    estimated_hours INTEGER,
    estimated_gain DECIMAL(3,2), -- Expected quality/PLG score improvement
    current_value TEXT, -- Current state
    target_value TEXT, -- Target state
    benchmark TEXT, -- Comparison to best-in-class
    actionable_steps JSONB, -- Step-by-step implementation
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'deferred', 'cancelled')),
    assigned_to UUID, -- User ID
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ux_plg_recs_run_id ON ux_plg_recommendations(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_ux_plg_recs_product ON ux_plg_recommendations(product_name);
CREATE INDEX IF NOT EXISTS idx_ux_plg_recs_priority ON ux_plg_recommendations(priority, status);
CREATE INDEX IF NOT EXISTS idx_ux_plg_recs_status ON ux_plg_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ux_plg_recs_type ON ux_plg_recommendations(recommendation_type);

-- Component Analysis
-- Stores individual component analysis results
CREATE TABLE IF NOT EXISTS ux_plg_component_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_run_id UUID REFERENCES ux_plg_analysis_runs(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    component_path TEXT NOT NULL,
    component_name TEXT NOT NULL,
    component_type TEXT, -- 'page', 'layout', 'modal', 'form', 'data-display', 'navigation', 'component'
    quality_score DECIMAL(3,2), -- 0.00-1.00
    design_scores JSONB, -- { visualHierarchy, cognitiveLoad, feedback, consistency, accessibility, delight }
    plg_scores JSONB, -- { timeToValue, selfService, onboarding, freemium, viral, usageValue, dataDriven }
    factors JSONB, -- Quality factors
    recommendations JSONB, -- Component-specific recommendations
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ux_plg_components_run_id ON ux_plg_component_analysis(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_ux_plg_components_product ON ux_plg_component_analysis(product_name);
CREATE INDEX IF NOT EXISTS idx_ux_plg_components_type ON ux_plg_component_analysis(component_type);
CREATE INDEX IF NOT EXISTS idx_ux_plg_components_quality ON ux_plg_component_analysis(quality_score DESC);

-- Improvement Tracking
-- Tracks implementation of recommendations
CREATE TABLE IF NOT EXISTS ux_plg_improvements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID REFERENCES ux_plg_recommendations(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    improvement_type TEXT NOT NULL, -- 'design', 'plg', 'documentation', 'testing', 'ci-cd'
    before_score DECIMAL(3,2), -- Score before improvement
    after_score DECIMAL(3,2), -- Score after improvement
    improvement_delta DECIMAL(3,2), -- Change in score
    implementation_notes TEXT,
    metrics_before JSONB, -- Metrics before improvement
    metrics_after JSONB, -- Metrics after improvement
    implemented_by UUID, -- User ID
    implemented_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ux_plg_improvements_rec_id ON ux_plg_improvements(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_ux_plg_improvements_product ON ux_plg_improvements(product_name);
CREATE INDEX IF NOT EXISTS idx_ux_plg_improvements_type ON ux_plg_improvements(improvement_type);
CREATE INDEX IF NOT EXISTS idx_ux_plg_improvements_implemented_at ON ux_plg_improvements(implemented_at DESC);

-- PLG Metrics Tracking
-- Tracks PLG metrics over time
CREATE TABLE IF NOT EXISTS ux_plg_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name TEXT NOT NULL,
    metric_date DATE NOT NULL,
    time_to_value_seconds INTEGER, -- Average time to value
    self_service_success_rate DECIMAL(5,4), -- 0.0000-1.0000
    onboarding_completion_rate DECIMAL(5,4), -- 0.0000-1.0000
    viral_coefficient DECIMAL(5,4), -- Viral coefficient
    usage_growth_rate DECIMAL(5,4), -- Month-over-month growth
    conversion_rate DECIMAL(5,4), -- Conversion rate
    overall_plg_score DECIMAL(3,2), -- Overall PLG score (0-1)
    design_quality_score DECIMAL(3,2), -- Overall design quality (0-1)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_name, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_ux_plg_metrics_product_date ON ux_plg_metrics(product_name, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_ux_plg_metrics_date ON ux_plg_metrics(metric_date DESC);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_ux_plg_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ux_plg_recommendations_updated_at
    BEFORE UPDATE ON ux_plg_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_ux_plg_updated_at();
