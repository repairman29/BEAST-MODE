#!/usr/bin/env node
/**
 * Export Predictions for XGBoost Training - REAL FEEDBACK ONLY
 * 
 * Filters out all synthetic feedback and exports only real feedback
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

// Sources that are considered REAL feedback
const REAL_FEEDBACK_SOURCES = [
  'bot-feedback-generator',  // Bot feedback (realistic)
  'user',                    // User feedback
  'inline_button',           // User clicked feedback button
  'manual_user_input',       // Manual user input
  'api',                     // API feedback
  'recommendation_click',     // User clicked recommendation
  'time_spent',              // Time-based inference
  'detail_view_duration'     // Detail view inference
];

// Sources that are considered SYNTHETIC
const SYNTHETIC_SOURCES = [
  'synthetic',
  'auto-inferred',           // Auto-inferred (too synthetic)
  'test-bot-feedback-generator'
];

function isRealFeedback(prediction) {
  // Check metadata for synthetic flag
  if (prediction.context?.metadata?.synthetic === true) {
    return false;
  }

  // Check source
  const source = prediction.context?.source || prediction.source || '';
  
  // Explicitly synthetic
  if (SYNTHETIC_SOURCES.some(s => source.includes(s))) {
    return false;
  }

  // Check feedback entries
  if (prediction.feedback) {
    const feedbackSource = prediction.feedback.metadata?.source || 
                          prediction.feedback.feedback_type || '';
    
    if (SYNTHETIC_SOURCES.some(s => feedbackSource.includes(s))) {
      return false;
    }
  }

  // If it's bot feedback generator, it's real (we just generated it)
  if (source.includes('bot-feedback-generator')) {
    return true;
  }

  // Default: consider it real if not explicitly synthetic
  return true;
}

async function exportRealFeedbackOnly() {
  console.log('📊 Exporting Predictions - REAL FEEDBACK ONLY\n');
  console.log('='.repeat(70));
  console.log();

  // Fetch all predictions with feedback
  const { data: predictions, error } = await supabase
    .from('ml_predictions')
    .select('id, predicted_value, actual_value, context, created_at, source')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .not('actual_value', 'is', null); // Only predictions with feedback

  if (error) {
    console.error('❌ Error fetching predictions:', error.message);
    process.exit(1);
  }

  console.log(`📥 Fetched ${predictions.length} predictions with feedback`);
  console.log();

  // Filter out synthetic feedback
  const realPredictions = predictions.filter(isRealFeedback);
  const syntheticCount = predictions.length - realPredictions.length;

  console.log(`📊 Filtering Results:`);
  console.log(`   Total predictions: ${predictions.length}`);
  console.log(`   Real feedback: ${realPredictions.length} ✅`);
  console.log(`   Synthetic feedback: ${syntheticCount} ❌ (removed)`);
  console.log();

  if (realPredictions.length === 0) {
    console.error('❌ No real feedback found!');
    process.exit(1);
  }

  // Group by repo and prepare data
  const repoMap = new Map();
  let skippedCount = 0;

  for (const prediction of realPredictions) {
    const repo = prediction.context?.repo || `unknown-repo-${prediction.id.substring(0, 8)}`;
    
    // Extract features
    let features = prediction.context?.features || {};
    
    // If no features, try to use defaults
    if (!features || Object.keys(features).length === 0) {
      console.warn(`   ⚠️  Features not stored for ${repo}, using defaults`);
      features = {
        stars: 0,
        forks: 0,
        hasReadme: false,
        hasLicense: false,
        hasTests: false,
        hasCI: false,
        fileCount: 0
      };
    }

    // Use actual_value as quality score (this is the feedback)
    const qualityScore = prediction.actual_value || prediction.predicted_value;

    const repoData = {
      repo: repo,
      quality_score: qualityScore,
      features: features,
      prediction_id: prediction.id,
      created_at: prediction.created_at,
      source: prediction.source || 'real-feedback',
      metadata: {
        ...prediction.context,
        isRealFeedback: true,
        originalSource: prediction.source
      }
    };

    // If repo already exists, keep the one with more features or later date
    if (repoMap.has(repo)) {
      const existing = repoMap.get(repo);
      const existingFeatureCount = Object.keys(existing.features || {}).length;
      const newFeatureCount = Object.keys(features).length;
      
      if (newFeatureCount > existingFeatureCount || 
          new Date(prediction.created_at) > new Date(existing.created_at)) {
        repoMap.set(repo, repoData);
      } else {
        skippedCount++;
      }
    } else {
      repoMap.set(repo, repoData);
    }
  }

  const allReposData = Array.from(repoMap.values());

  // Save to file
  const outputPath = path.join(__dirname, '../.beast-mode/training-data/all-repos-real-only.json');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify({ repositories: allReposData }, null, 2));

  console.log('='.repeat(70));
  console.log('✅ Export Complete!');
  console.log('='.repeat(70));
  console.log();
  console.log(`📁 Saved to: ${outputPath}`);
  console.log();
  console.log(`📊 Export Summary:`);
  console.log(`   Total repos: ${allReposData.length}`);
  console.log(`   Skipped duplicates: ${skippedCount}`);
  console.log();

  // Calculate statistics
  const qualities = allReposData.map(r => r.quality_score);
  const avgQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;
  const minQuality = Math.min(...qualities);
  const maxQuality = Math.max(...qualities);

  const featureCounts = allReposData.map(r => Object.keys(r.features || {}).length);
  const avgFeatures = featureCounts.reduce((a, b) => a + b, 0) / featureCounts.length;

  console.log(`   Avg quality: ${(avgQuality * 100).toFixed(1)}%`);
  console.log(`   Min quality: ${(minQuality * 100).toFixed(1)}%`);
  console.log(`   Max quality: ${(maxQuality * 100).toFixed(1)}%`);
  console.log();
  console.log(`   Avg features per repo: ${avgFeatures.toFixed(1)}`);
  console.log();

  // Show source breakdown
  const sourceBreakdown = {};
  allReposData.forEach(r => {
    const source = r.source || 'unknown';
    sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
  });

  console.log(`📊 Source Breakdown:`);
  Object.entries(sourceBreakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`   ${source}: ${count}`);
    });
  console.log();

  console.log('🚀 Ready for XGBoost training!');
  console.log('   Run: python3 scripts/train_xgboost.py --data real-only');
  console.log();
}

exportRealFeedbackOnly().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
