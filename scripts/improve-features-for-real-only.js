#!/usr/bin/env node
/**
 * Improve Features for Real-Only Dataset
 * 
 * Fetches complete features from Quality API for all repos in real-only dataset
 * Updates predictions in database with full feature sets
 */

const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE = process.env.BEAST_MODE_API || 'http://localhost:3000';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchFeaturesFromAPI(repoName) {
  try {
    const response = await fetch(`${API_BASE}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: repoName, platform: 'feature-extractor' })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.features || {};
  } catch (error) {
    console.warn(`   ⚠️  Failed to fetch features for ${repoName}: ${error.message}`);
    return null;
  }
}

async function improveFeaturesForRealOnly() {
  console.log('🔧 Improving Features for Real-Only Dataset\n');
  console.log('='.repeat(70));
  console.log();

  // Get all predictions with real feedback
  const { data: predictions, error } = await supabase
    .from('ml_predictions')
    .select('id, context, source')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .not('actual_value', 'is', null)
    .or('source.eq.direct-database,source.eq.fallback,source.eq.bot-feedback-generator');

  if (error) {
    console.error('❌ Error fetching predictions:', error.message);
    process.exit(1);
  }

  console.log(`📥 Found ${predictions.length} predictions with real feedback`);
  console.log();

  // Filter out synthetic
  const realPredictions = predictions.filter(p => {
    const source = p.source || '';
    const metadata = p.context?.metadata || {};
    
    // Exclude synthetic
    if (source.includes('synthetic') || metadata.synthetic === true) {
      return false;
    }
    
    // Check if features are missing or incomplete
    const features = p.context?.features || {};
    const featureCount = Object.keys(features).length;
    
    // If less than 20 features, consider it incomplete
    return featureCount < 20;
  });

  console.log(`📊 Predictions needing feature improvement: ${realPredictions.length}`);
  console.log();

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  // Process in batches
  const BATCH_SIZE = 10;
  for (let i = 0; i < realPredictions.length; i += BATCH_SIZE) {
    const batch = realPredictions.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(realPredictions.length / BATCH_SIZE);

    console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} repos)`);

    for (const prediction of batch) {
      const repoName = prediction.context?.repo;
      if (!repoName) {
        skipped++;
        continue;
      }

      const currentFeatures = prediction.context?.features || {};
      const currentFeatureCount = Object.keys(currentFeatures).length;

      try {
        // Fetch complete features from API
        const completeFeatures = await fetchFeaturesFromAPI(repoName);

        if (!completeFeatures || Object.keys(completeFeatures).length === 0) {
          console.warn(`   ⚠️  ${repoName}: No features returned`);
          failed++;
          continue;
        }

        const newFeatureCount = Object.keys(completeFeatures).length;

        if (newFeatureCount <= currentFeatureCount) {
          console.log(`   ⏭️  ${repoName}: Already has ${currentFeatureCount} features (new: ${newFeatureCount})`);
          skipped++;
          continue;
        }

        // Update prediction with complete features
        const updatedContext = {
          ...prediction.context,
          features: completeFeatures
        };

        const { error: updateError } = await supabase
          .from('ml_predictions')
          .update({ context: updatedContext })
          .eq('id', prediction.id);

        if (updateError) {
          console.warn(`   ⚠️  ${repoName}: Update failed - ${updateError.message}`);
          failed++;
          continue;
        }

        updated++;
        console.log(`   ✅ ${repoName}: ${currentFeatureCount} → ${newFeatureCount} features`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`   ⚠️  ${repoName}: Error - ${error.message}`);
        failed++;
      }
    }

    console.log();
  }

  console.log('='.repeat(70));
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log();
  console.log(`   Updated: ${updated} ✅`);
  console.log(`   Failed: ${failed} ❌`);
  console.log(`   Skipped: ${skipped} ⏭️`);
  console.log();

  if (updated > 0) {
    console.log('✅ Features improved! Re-export and retrain:');
    console.log('   node scripts/export-predictions-real-only.js');
    console.log('   python3 scripts/train_xgboost.py --data real-only');
  }

  console.log();
}

improveFeaturesForRealOnly().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
