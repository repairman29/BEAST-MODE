#!/usr/bin/env node
/**
 * Check Retrain Threshold and Alert
 * 
 * Monitors feedback collection and alerts when we reach 500+ real feedback examples
 * Can be run as a scheduled job or manually
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Real feedback sources (same as export script)
const REAL_FEEDBACK_SOURCES = [
  'bot-feedback-generator',
  'user',
  'inline_button',
  'manual_user_input',
  'api',
  'recommendation_click',
  'time_spent',
  'detail_view_duration'
];

const SYNTHETIC_SOURCES = [
  'synthetic',
  'auto-inferred',
  'test-bot-feedback-generator'
];

function isRealFeedback(prediction) {
  // Check context metadata for synthetic flag
  if (prediction.context?.metadata?.synthetic === true) {
    return false;
  }

  // Check source
  const source = prediction.context?.source || prediction.source || '';
  
  // Explicitly synthetic
  if (SYNTHETIC_SOURCES.some(s => source.toLowerCase().includes(s.toLowerCase()))) {
    return false;
  }

  // Real feedback sources
  if (REAL_FEEDBACK_SOURCES.some(s => source.toLowerCase().includes(s.toLowerCase()))) {
    return true;
  }

  // Default: if source is empty or unknown, check if it has actual_value
  // If it has actual_value and isn't explicitly synthetic, consider it real
  if (prediction.actual_value !== null && prediction.actual_value !== undefined) {
    // Additional check: if context has synthetic flag, exclude it
    if (prediction.context?.synthetic === true) {
      return false;
    }
    return true; // Has feedback, assume real unless proven otherwise
  }

  return false;
}

async function checkRetrainThreshold() {
  console.log('📊 Checking Retrain Threshold\n');
  console.log('='.repeat(70));
  console.log();

  try {
    // Fetch all predictions with feedback
    const { data: predictions, error } = await supabase
      .from('ml_predictions')
      .select('id, predicted_value, actual_value, context, created_at, source')
      .eq('service_name', 'beast-mode')
      .eq('prediction_type', 'quality')
      .not('actual_value', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Filter real feedback
    const realFeedback = predictions.filter(isRealFeedback);
    const syntheticCount = predictions.length - realFeedback.length;

    // Count unique repos
    const uniqueRepos = new Set();
    realFeedback.forEach(p => {
      const repo = p.context?.repo || `unknown-${p.id.substring(0, 8)}`;
      uniqueRepos.add(repo);
    });

    const RETRAIN_THRESHOLD = 500;
    const currentCount = realFeedback.length;
    const remaining = RETRAIN_THRESHOLD - currentCount;
    const progress = (currentCount / RETRAIN_THRESHOLD) * 100;

    console.log('📈 Feedback Statistics:');
    console.log(`   Total predictions with feedback: ${predictions.length}`);
    console.log(`   Real feedback examples: ${currentCount} ✅`);
    console.log(`   Synthetic feedback: ${syntheticCount} ❌`);
    console.log(`   Unique repos: ${uniqueRepos.size}`);
    console.log();

    console.log('🎯 Retrain Threshold Status:');
    console.log(`   Target: ${RETRAIN_THRESHOLD} real feedback examples`);
    console.log(`   Current: ${currentCount} examples`);
    console.log(`   Remaining: ${remaining} examples`);
    console.log(`   Progress: ${progress.toFixed(1)}%`);
    console.log();

    // Check if we should retrain
    if (currentCount >= RETRAIN_THRESHOLD) {
      console.log('🎉 ✅ THRESHOLD REACHED! READY TO RETRAIN!');
      console.log();
      console.log('🚀 Next Steps:');
      console.log('   1. Export real feedback: node scripts/export-predictions-real-only.js');
      console.log('   2. Prepare for Python: node -e "const fs=require(\'fs\'); const d=JSON.parse(fs.readFileSync(\'.beast-mode/training-data/all-repos-real-only.json\',\'utf8\')); fs.writeFileSync(\'.beast-mode/training-data/all-repos-for-python.json\', JSON.stringify(d, null, 2));"');
      console.log('   3. Train model: python3 scripts/train_xgboost_improved.py');
      console.log('   4. Log results: node scripts/log-training-results.js');
      console.log('   5. Deploy model: node -e "const fs=require(\'fs\'); const path=require(\'path\'); const modelDir=\'.beast-mode/models/model-xgboost-improved-*\'; const dirs=fs.readdirSync(\'.beast-mode/models\').filter(d=>d.startsWith(\'model-xgboost-improved-\')).sort().reverse(); if(dirs.length>0){const latest=dirs[0]; const model=JSON.parse(fs.readFileSync(path.join(\'.beast-mode/models\',latest,\'model.json\'),\'utf8\')); const metadata=JSON.parse(fs.readFileSync(path.join(\'.beast-mode/models\',latest,\'model-metadata.json\'),\'utf8\')); const combined={...model,metadata}; fs.writeFileSync(\'.beast-mode/models/model-notable-quality-latest.json\',JSON.stringify(combined,null,2)); console.log(\'✅ Model deployed\');}"');
      console.log();

      // Write alert file
      const alertPath = path.join(__dirname, '../.beast-mode/retrain-alert.txt');
      fs.writeFileSync(alertPath, JSON.stringify({
        threshold: RETRAIN_THRESHOLD,
        current: currentCount,
        timestamp: new Date().toISOString(),
        message: 'READY TO RETRAIN'
      }, null, 2));
      console.log(`📝 Alert saved to: ${alertPath}`);

      return { shouldRetrain: true, current: currentCount, threshold: RETRAIN_THRESHOLD };
    } else {
      console.log(`⏳ Not yet ready - need ${remaining} more real feedback examples`);
      console.log();
      console.log('💡 Collection Status:');
      console.log('   • Automated collection: Running every 5 minutes');
      console.log('   • Estimated time to threshold: Unknown (depends on usage)');
      console.log();

      // Calculate growth rate if we have historical data
      const recentPredictions = predictions.filter(p => {
        const created = new Date(p.created_at);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return created > dayAgo;
      });
      const recentReal = recentPredictions.filter(isRealFeedback).length;

      if (recentReal > 0) {
        const daysNeeded = Math.ceil(remaining / recentReal);
        console.log(`   • Recent growth (last 24h): ${recentReal} real feedback examples`);
        console.log(`   • Estimated days to threshold: ~${daysNeeded} days`);
        console.log();
      }

      return { shouldRetrain: false, current: currentCount, threshold: RETRAIN_THRESHOLD, remaining };
    }

  } catch (error) {
    console.error('❌ Error checking threshold:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkRetrainThreshold().then(result => {
    process.exit(result.shouldRetrain ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { checkRetrainThreshold };
