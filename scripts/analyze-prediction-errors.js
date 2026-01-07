#!/usr/bin/env node

/**
 * Prediction Error Analysis Tool
 * Identify repos that are hard to predict accurately
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeErrors() {
  console.log('🔍 Prediction Error Analysis\n');
  console.log('='.repeat(60));

  try {
    // Get predictions with actual values (have feedback)
    const { data: predictions, error } = await supabase
      .from('ml_predictions')
      .select('*')
      .not('actual_value', 'is', null)
      .eq('service_name', 'beast-mode')
      .eq('prediction_type', 'quality')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    if (!predictions || predictions.length === 0) {
      console.log('⚠️  No predictions with feedback found');
      console.log('   Need feedback to analyze errors');
      return;
    }

    console.log(`\n📊 Analyzing ${predictions.length} predictions with feedback\n`);

    // Calculate errors
    const errors = predictions.map(p => ({
      id: p.id,
      predicted: p.predicted_value,
      actual: p.actual_value,
      error: Math.abs(p.predicted_value - p.actual_value),
      errorPercent: Math.abs(p.predicted_value - p.actual_value) / p.actual_value * 100,
      context: p.context || {}
    }));

    // Sort by error
    errors.sort((a, b) => b.error - a.error);

    // Statistics
    const avgError = errors.reduce((sum, e) => sum + e.error, 0) / errors.length;
    const maxError = errors[0].error;
    const minError = errors[errors.length - 1].error;
    const highErrorCount = errors.filter(e => e.error > 0.2).length;

    console.log('📈 Error Statistics:');
    console.log(`   Average Error: ${(avgError * 100).toFixed(2)}%`);
    console.log(`   Max Error: ${(maxError * 100).toFixed(2)}%`);
    console.log(`   Min Error: ${(minError * 100).toFixed(2)}%`);
    console.log(`   High Error (>20%): ${highErrorCount} (${(highErrorCount / errors.length * 100).toFixed(1)}%)`);

    // Top 10 worst predictions
    console.log('\n🔴 Top 10 Worst Predictions:');
    errors.slice(0, 10).forEach((e, idx) => {
      const repo = e.context.repo || 'unknown';
      console.log(`   ${(idx + 1).toString().padStart(2)}. ${repo}`);
      console.log(`      Predicted: ${(e.predicted * 100).toFixed(1)}% | Actual: ${(e.actual * 100).toFixed(1)}% | Error: ${(e.error * 100).toFixed(1)}%`);
    });

    // Error patterns
    const overPredictions = errors.filter(e => e.predicted > e.actual);
    const underPredictions = errors.filter(e => e.predicted < e.actual);

    console.log('\n📊 Error Patterns:');
    console.log(`   Over-predictions (predicted > actual): ${overPredictions.length} (${(overPredictions.length / errors.length * 100).toFixed(1)}%)`);
    console.log(`   Under-predictions (predicted < actual): ${underPredictions.length} (${(underPredictions.length / errors.length * 100).toFixed(1)}%)`);

    // Feature analysis (if available)
    if (errors[0].context.features) {
      console.log('\n🔍 Feature Analysis:');
      console.log('   (Feature importance analysis would go here)');
    }

    console.log('\n✅ Error analysis complete!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  analyzeErrors();
}

module.exports = { analyzeErrors };

