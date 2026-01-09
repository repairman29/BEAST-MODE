#!/usr/bin/env node
/**
 * Fetch missing features from Quality API for predictions that don't have them
 * This will help us use ALL 970 predictions
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
      body: JSON.stringify({ repo: repoName, platform: 'beast-mode' })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.features || {};
  } catch (error) {
    console.warn(`   ⚠️  ${repoName}: ${error.message}`);
    return null;
  }
}

async function updatePredictionWithFeatures(predictionId, features) {
  try {
    const { error } = await supabase
      .from('ml_predictions')
      .update({
        context: supabase.rpc('jsonb_set', {
          path: ['features'],
          new_value: features,
          create_missing: true
        })
      })
      .eq('id', predictionId);

    if (error) {
      // Try direct update
      const { data: current } = await supabase
        .from('ml_predictions')
        .select('context')
        .eq('id', predictionId)
        .single();

      if (current) {
        const updatedContext = {
          ...current.context,
          features: features
        };

        await supabase
          .from('ml_predictions')
          .update({ context: updatedContext })
          .eq('id', predictionId);
      }
    }
    return true;
  } catch (error) {
    console.warn(`   ⚠️  Update failed: ${error.message}`);
    return false;
  }
}

async function fetchMissingFeatures() {
  console.log('🔍 Fetching Missing Features from API\n');
  console.log('='.repeat(70));
  console.log();

  // Get predictions without features
  const { data: predictions, error } = await supabase
    .from('ml_predictions')
    .select('id, context')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .or('context->features.is.null,context->features.eq.{}');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`📊 Found ${predictions.length} predictions without features`);
  console.log();

  let fetched = 0;
  let failed = 0;
  let updated = 0;

  // Process in batches
  const batchSize = 10;
  for (let i = 0; i < predictions.length; i += batchSize) {
    const batch = predictions.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} predictions)...`);

    for (const pred of batch) {
      const repoName = pred.context?.repo;
      if (!repoName) {
        failed++;
        continue;
      }

      const features = await fetchFeaturesFromAPI(repoName);
      if (features && Object.keys(features).length > 0) {
        const success = await updatePredictionWithFeatures(pred.id, features);
        if (success) {
          fetched++;
          updated++;
          console.log(`   ✅ ${repoName} (${Object.keys(features).length} features)`);
        } else {
          failed++;
        }
      } else {
        failed++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log();
  console.log('='.repeat(70));
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log();
  console.log(`   ✅ Fetched: ${fetched}`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log();
  console.log('✅ Complete!');
  console.log();
  console.log('💡 Run export-all-supabase-data.js again to include these in training data');
  console.log();
}

fetchMissingFeatures().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
