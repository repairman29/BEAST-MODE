#!/usr/bin/env node
/**
 * Export ALL data from Supabase for training
 * Uses all predictions with feedback, and adds synthetic feedback to those without
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

function generateSyntheticFeedback(predictedQuality) {
  let baseScore = predictedQuality;
  const variance = (Math.random() - 0.5) * 0.3;
  baseScore = Math.max(0, Math.min(1, baseScore + variance));
  return Math.round(baseScore * 100) / 100;
}

async function exportAllData() {
  console.log('📊 Exporting ALL Supabase Data for Training\n');
  console.log('='.repeat(70));
  console.log();

  // 1. Get all predictions with feedback
  console.log('📥 Fetching predictions with feedback...');
  const { data: withFeedback, error: withError } = await supabase
    .from('ml_predictions')
    .select('*')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .not('actual_value', 'is', null)
    .order('created_at', { ascending: false });

  if (withError) {
    console.error('❌ Error:', withError.message);
    return;
  }

  console.log(`   ✅ Found ${withFeedback.length} predictions with feedback`);
  console.log();

  // 2. Get predictions without feedback (we'll add synthetic)
  console.log('📥 Fetching predictions without feedback...');
  const { data: withoutFeedback, error: withoutError } = await supabase
    .from('ml_predictions')
    .select('*')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .is('actual_value', null)
    .order('created_at', { ascending: false });

  if (withoutError) {
    console.error('❌ Error:', withoutError.message);
    return;
  }

  console.log(`   ✅ Found ${withoutFeedback.length} predictions without feedback`);
  console.log();

  // 3. Process predictions with feedback
  console.log('🔄 Processing predictions with feedback...');
  const reposWithFeedback = [];
  let processed = 0;
  let skipped = 0;

  for (const pred of withFeedback) {
    const repo = pred.context?.repo || `unknown-repo-${pred.id.substring(0, 8)}`;
    const features = pred.context?.features || {};
    
    // Only include if we have features
    if (Object.keys(features).length > 0) {
      reposWithFeedback.push({
        repo: repo,
        quality_score: pred.actual_value || pred.predicted_value,
        features: features,
        prediction_id: pred.id,
        created_at: pred.created_at,
        source: pred.source || 'supabase',
        has_real_feedback: true,
        metadata: {
          ...pred.context,
          confidence: pred.confidence,
          synthetic: pred.context?.synthetic || false
        }
      });
      processed++;
    } else {
      skipped++;
    }
  }

  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ⚠️  Skipped (no features): ${skipped}`);
  console.log();

  // 4. Process predictions without feedback (add synthetic)
  console.log('🔄 Processing predictions without feedback (adding synthetic)...');
  const reposWithoutFeedback = [];
  processed = 0;
  skipped = 0;

  for (const pred of withoutFeedback) {
    const repo = pred.context?.repo || `unknown-repo-${pred.id.substring(0, 8)}`;
    const features = pred.context?.features || {};
    
    // Only include if we have features
    if (Object.keys(features).length > 0) {
      const predictedQuality = pred.predicted_value || 0.75;
      const syntheticFeedback = generateSyntheticFeedback(predictedQuality);
      
      reposWithoutFeedback.push({
        repo: repo,
        quality_score: syntheticFeedback,
        features: features,
        prediction_id: pred.id,
        created_at: pred.created_at,
        source: pred.source || 'supabase',
        has_real_feedback: false,
        metadata: {
          ...pred.context,
          confidence: pred.confidence,
          synthetic: true,
          original_predicted: predictedQuality
        }
      });
      processed++;
    } else {
      skipped++;
    }
  }

  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ⚠️  Skipped (no features): ${skipped}`);
  console.log();

  // 5. Combine all data
  const allRepos = [...reposWithFeedback, ...reposWithoutFeedback];
  
  console.log('='.repeat(70));
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log();
  console.log(`   Total repositories: ${allRepos.length}`);
  console.log(`   With real feedback: ${reposWithFeedback.length}`);
  console.log(`   With synthetic feedback: ${reposWithoutFeedback.length}`);
  console.log();

  // Calculate stats
  const qualityScores = allRepos.map(r => r.quality_score);
  const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  const minQuality = Math.min(...qualityScores);
  const maxQuality = Math.max(...qualityScores);
  const featureCounts = allRepos.map(r => Object.keys(r.features).length);
  const avgFeatures = featureCounts.reduce((a, b) => a + b, 0) / featureCounts.length;

  console.log('📈 Statistics:');
  console.log(`   Avg quality: ${(avgQuality * 100).toFixed(1)}%`);
  console.log(`   Quality range: [${(minQuality * 100).toFixed(1)}%, ${(maxQuality * 100).toFixed(1)}%]`);
  console.log(`   Avg features: ${avgFeatures.toFixed(1)}`);
  console.log(`   Feature range: [${Math.min(...featureCounts)}, ${Math.max(...featureCounts)}]`);
  console.log();

  // 6. Save to file
  const outputPath = path.join(__dirname, '../.beast-mode/training-data/all-repos-for-python.json');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  
  const outputData = {
    repositories: allRepos,
    metadata: {
      total: allRepos.length,
      with_real_feedback: reposWithFeedback.length,
      with_synthetic_feedback: reposWithoutFeedback.length,
      exported_at: new Date().toISOString(),
      avg_quality: avgQuality,
      avg_features: avgFeatures
    }
  };

  await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2));

  console.log('💾 Saved to:');
  console.log(`   ${outputPath}`);
  console.log();
  console.log('✅ Export complete!');
  console.log();
  console.log('🚀 Ready for training!');
  console.log(`   Run: python3 scripts/train_xgboost_improved.py`);
  console.log();
}

exportAllData().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
