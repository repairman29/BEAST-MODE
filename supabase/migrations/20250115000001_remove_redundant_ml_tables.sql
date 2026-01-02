-- Remove Redundant Service-Specific ML Prediction Tables
-- These tables are redundant - all services use unified ml_predictions table
-- Safe to remove - no code references these tables

-- Drop service-specific prediction tables
DROP TABLE IF EXISTS code_roach_ml_predictions CASCADE;
DROP TABLE IF EXISTS oracle_ml_predictions CASCADE;
DROP TABLE IF EXISTS daisy_chain_ml_predictions CASCADE;
DROP TABLE IF EXISTS first_mate_ml_predictions CASCADE;
DROP TABLE IF EXISTS game_app_ml_predictions CASCADE;

-- Note: ml_predictions, ml_feedback, and ml_performance_metrics are kept
-- as they are actively used by the unified tracking system

COMMENT ON SCHEMA public IS 'Removed 5 redundant service-specific ML prediction tables on 2025-01-15. All services now use unified ml_predictions table.';

