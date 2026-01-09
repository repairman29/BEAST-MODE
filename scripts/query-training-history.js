#!/usr/bin/env node
/**
 * Query Training History
 * 
 * Shows all logged training results from ml_performance_metrics table
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryTrainingHistory() {
  console.log('📊 Training History from Database\n');
  console.log('='.repeat(70));
  console.log();

  // Get all training metrics
  const { data: metrics, error } = await supabase
    .from('ml_performance_metrics')
    .select('*')
    .eq('service_name', 'beast-mode')
    .in('metric_name', ['r2_train', 'r2_test', 'r2_cv', 'mae', 'rmse'])
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('❌ Error fetching metrics:', error.message);
    return;
  }

  if (!metrics || metrics.length === 0) {
    console.log('⚠️  No training metrics found in database');
    console.log('   Run training scripts to log results');
    return;
  }

  // Group by training run (using period_end as identifier)
  const runs = {};
  metrics.forEach(m => {
    const runKey = m.period_end;
    if (!runs[runKey]) {
      runs[runKey] = {
        date: new Date(m.period_end),
        metrics: {},
        metadata: m.metadata || {}
      };
    }
    runs[runKey].metrics[m.metric_name] = m.metric_value;
  });

  const sortedRuns = Object.values(runs).sort((a, b) => b.date - a.date);

  console.log(`📈 Found ${sortedRuns.length} training runs:\n`);

  sortedRuns.forEach((run, idx) => {
    console.log(`Run ${idx + 1}: ${run.date.toLocaleString()}`);
    console.log(`   Model: ${run.metadata.model_type || 'unknown'}`);
    console.log(`   Dataset: ${run.metadata.dataset_size || 'unknown'} examples`);
    console.log(`   Features: ${run.metadata.feature_count || 'unknown'}`);
    
    if (run.metrics.r2_train !== undefined) {
      console.log(`   R² (train): ${run.metrics.r2_train.toFixed(3)}`);
    }
    if (run.metrics.r2_test !== undefined) {
      const icon = run.metrics.r2_test > 0 ? '✅' : '❌';
      console.log(`   R² (test):  ${run.metrics.r2_test.toFixed(3)} ${icon}`);
    }
    if (run.metrics.r2_cv !== undefined) {
      const icon = run.metrics.r2_cv > 0 ? '✅' : '❌';
      const std = run.metadata.cv_std ? ` (+/- ${run.metadata.cv_std.toFixed(3)})` : '';
      console.log(`   R² (CV):    ${run.metrics.r2_cv.toFixed(3)}${std} ${icon}`);
    }
    if (run.metrics.mae !== undefined) {
      console.log(`   MAE:        ${run.metrics.mae.toFixed(3)}`);
    }
    if (run.metrics.rmse !== undefined) {
      console.log(`   RMSE:       ${run.metrics.rmse.toFixed(3)}`);
    }
    console.log();
  });

  // Show trend
  if (sortedRuns.length > 1) {
    console.log('📈 Trend:');
    const latest = sortedRuns[0].metrics.r2_cv;
    const previous = sortedRuns[1].metrics.r2_cv;
    
    if (latest !== undefined && previous !== undefined) {
      const change = latest - previous;
      const icon = change > 0 ? '⬆️' : change < 0 ? '⬇️' : '➡️';
      console.log(`   R² (CV): ${previous.toFixed(3)} → ${latest.toFixed(3)} (${change > 0 ? '+' : ''}${change.toFixed(3)}) ${icon}`);
    }
    console.log();
  }
}

queryTrainingHistory().catch(console.error);
