#!/usr/bin/env node
/**
 * Log Training Results to Database
 * 
 * Stores model training results in ml_performance_metrics table
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function logTrainingResults(results) {
  console.log('📊 Logging Training Results to Database\n');
  console.log('='.repeat(70));
  console.log();

  const now = new Date();
  const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
  const periodEnd = now;

  const metrics = [];

  // Log R² scores
  if (results.r2_train !== undefined) {
    metrics.push({
      service_name: 'beast-mode',
      metric_name: 'r2_train',
      metric_value: results.r2_train,
      metric_unit: 'score',
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      metadata: {
        model_type: results.model_type || 'xgboost',
        dataset_size: results.dataset_size,
        feature_count: results.feature_count,
        training_date: now.toISOString(),
        ...results.metadata
      }
    });
  }

  if (results.r2_test !== undefined) {
    metrics.push({
      service_name: 'beast-mode',
      metric_name: 'r2_test',
      metric_value: results.r2_test,
      metric_unit: 'score',
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      metadata: {
        model_type: results.model_type || 'xgboost',
        dataset_size: results.dataset_size,
        feature_count: results.feature_count,
        training_date: now.toISOString(),
        ...results.metadata
      }
    });
  }

  if (results.r2_cv !== undefined) {
    metrics.push({
      service_name: 'beast-mode',
      metric_name: 'r2_cv',
      metric_value: results.r2_cv,
      metric_unit: 'score',
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      metadata: {
        model_type: results.model_type || 'xgboost',
        dataset_size: results.dataset_size,
        feature_count: results.feature_count,
        cv_std: results.r2_cv_std,
        training_date: now.toISOString(),
        ...results.metadata
      }
    });
  }

  // Log MAE and RMSE
  if (results.mae !== undefined) {
    metrics.push({
      service_name: 'beast-mode',
      metric_name: 'mae',
      metric_value: results.mae,
      metric_unit: 'error',
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      metadata: {
        model_type: results.model_type || 'xgboost',
        dataset_size: results.dataset_size,
        training_date: now.toISOString(),
        ...results.metadata
      }
    });
  }

  if (results.rmse !== undefined) {
    metrics.push({
      service_name: 'beast-mode',
      metric_name: 'rmse',
      metric_value: results.rmse,
      metric_unit: 'error',
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      metadata: {
        model_type: results.model_type || 'xgboost',
        dataset_size: results.dataset_size,
        training_date: now.toISOString(),
        ...results.metadata
      }
    });
  }

  // Insert all metrics
  if (metrics.length > 0) {
    const { data, error } = await supabase
      .from('ml_performance_metrics')
      .insert(metrics)
      .select();

    if (error) {
      console.error('❌ Error logging metrics:', error.message);
      return false;
    }

    console.log(`✅ Logged ${metrics.length} metrics to database:`);
    metrics.forEach(m => {
      console.log(`   ${m.metric_name}: ${m.metric_value.toFixed(3)}`);
    });
    console.log();
    return true;
  }

  return false;
}

async function logFromMetadataFile() {
  // Try to find latest model metadata file
  const modelsDir = path.join(__dirname, '../.beast-mode/models');
  
  try {
    const entries = await fs.readdir(modelsDir, { withFileTypes: true });
    const modelDirs = entries
      .filter(e => e.isDirectory() && e.name.startsWith('model-'))
      .map(e => e.name)
      .sort()
      .reverse();

    if (modelDirs.length === 0) {
      console.log('⚠️  No model directories found');
      return;
    }

    const latestModelDir = modelDirs[0];
    const metadataPath = path.join(modelsDir, latestModelDir, 'model-metadata.json');

    if (!await fs.access(metadataPath).then(() => true).catch(() => false)) {
      console.log('⚠️  No metadata file found');
      return;
    }

    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

    const results = {
      model_type: metadata.model_type || 'xgboost',
      r2_train: metadata.metrics?.r2_train,
      r2_test: metadata.metrics?.r2_test,
      r2_cv: metadata.metrics?.r2_cv,
      r2_cv_std: metadata.metrics?.r2_cv_std,
      mae: metadata.metrics?.mae,
      rmse: metadata.metrics?.rmse,
      dataset_size: metadata.training_data?.size,
      feature_count: metadata.training_data?.feature_count,
      metadata: {
        model_version: metadata.version,
        training_date: metadata.training_date,
        hyperparameters: metadata.hyperparameters
      }
    };

    await logTrainingResults(results);
  } catch (error) {
    console.error('❌ Error reading metadata:', error.message);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Auto-detect from latest model metadata
    logFromMetadataFile().catch(console.error);
  } else {
    // Manual input
    const results = {
      model_type: args[0] || 'xgboost',
      r2_train: parseFloat(args[1]) || undefined,
      r2_test: parseFloat(args[2]) || undefined,
      r2_cv: parseFloat(args[3]) || undefined,
      mae: parseFloat(args[4]) || undefined,
      rmse: parseFloat(args[5]) || undefined,
      dataset_size: parseInt(args[6]) || undefined,
      feature_count: parseInt(args[7]) || undefined
    };

    logTrainingResults(results).catch(console.error);
  }
}

module.exports = { logTrainingResults };
