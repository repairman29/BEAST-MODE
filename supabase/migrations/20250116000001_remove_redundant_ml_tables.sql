-- Remove Redundant ML Prediction Tables
-- These tables are defined but never used - all services write to unified ml_predictions table
-- Migration: 20250116000001_remove_redundant_ml_tables.sql

-- Drop service-specific prediction tables (not used)
DROP TABLE IF EXISTS code_roach_ml_predictions CASCADE;
DROP TABLE IF EXISTS oracle_ml_predictions CASCADE;
DROP TABLE IF EXISTS daisy_chain_ml_predictions CASCADE;
DROP TABLE IF EXISTS first_mate_ml_predictions CASCADE;
DROP TABLE IF EXISTS game_app_ml_predictions CASCADE;

-- Note: ml_predictions, ml_feedback, and ml_performance_metrics are kept
-- These are the unified tables that are actually used

