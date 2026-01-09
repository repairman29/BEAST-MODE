#!/usr/bin/env node
/**
 * Check what data is available in Supabase
 * Compare with what we're using for training
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseData() {
  console.log('🔍 Checking Supabase Data Availability\n');
  console.log('='.repeat(70));
  console.log();

  // 1. Check ml_predictions table
  console.log('📊 ML Predictions Table:');
  const { data: allPredictions, error: predError } = await supabase
    .from('ml_predictions')
    .select('*')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality');

  if (predError) {
    console.error('❌ Error:', predError.message);
    return;
  }

  console.log(`   Total predictions: ${allPredictions?.length || 0}`);

  // With feedback
  const withFeedback = allPredictions?.filter(p => p.actual_value !== null) || [];
  console.log(`   With feedback: ${withFeedback.length}`);
  console.log(`   Without feedback: ${(allPredictions?.length || 0) - withFeedback.length}`);
  console.log();

  // 2. Check what we're using
  const exportedFile = path.join(__dirname, '../.beast-mode/training-data/all-repos-for-python.json');
  let exportedCount = 0;
  if (fs.existsSync(exportedFile)) {
    const exportedData = JSON.parse(fs.readFileSync(exportedFile, 'utf8'));
    exportedCount = exportedData.repositories?.length || 0;
    console.log('📦 Exported Training Data:');
    console.log(`   Repositories in export: ${exportedCount}`);
    console.log();
  }

  // 3. Analyze what's in Supabase vs what we're using
  console.log('🔬 Data Analysis:');
  console.log();

  // Check context fields
  const withContext = allPredictions?.filter(p => p.context && typeof p.context === 'object') || [];
  const withFeatures = withContext.filter(p => p.context.features && typeof p.context.features === 'object');
  const withFullFeatures = withFeatures.filter(p => Object.keys(p.context.features).length > 10);

  console.log(`   Predictions with context: ${withContext.length}`);
  console.log(`   Predictions with features: ${withFeatures.length}`);
  console.log(`   Predictions with full features (10+): ${withFullFeatures.length}`);
  console.log();

  // Check feedback sources
  const { data: feedbackData, error: fbError } = await supabase
    .from('ml_feedback')
    .select('*')
    .eq('service_name', 'beast-mode')
    .limit(1000);

  if (!fbError && feedbackData) {
    console.log('💡 ML Feedback Table:');
    console.log(`   Total feedback entries: ${feedbackData.length}`);
    
    const bySource = {};
    const byType = {};
    feedbackData.forEach(f => {
      const source = f.metadata?.source || f.feedback_type || 'unknown';
      bySource[source] = (bySource[source] || 0) + 1;
      byType[f.feedback_type] = (byType[f.feedback_type] || 0) + 1;
    });

    console.log(`   By source:`);
    Object.entries(bySource).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
      console.log(`     ${source}: ${count}`);
    });
    console.log();
  }

  // 4. Check for additional data we might be missing
  console.log('🎯 Additional Data Available:');
  console.log();

  // Check if we have predictions from other services
  const { data: otherServices, error: otherError } = await supabase
    .from('ml_predictions')
    .select('service_name, prediction_type')
    .neq('service_name', 'beast-mode')
    .limit(100);

  if (!otherError && otherServices) {
    const serviceCounts = {};
    otherServices.forEach(p => {
      const key = `${p.service_name}:${p.prediction_type}`;
      serviceCounts[key] = (serviceCounts[key] || 0) + 1;
    });
    
    if (Object.keys(serviceCounts).length > 0) {
      console.log(`   Other services with predictions: ${Object.keys(serviceCounts).length}`);
      Object.entries(serviceCounts).forEach(([key, count]) => {
        console.log(`     ${key}: ${count}`);
      });
      console.log();
    }
  }

  // 5. Check context richness
  console.log('📈 Context Richness Analysis:');
  console.log();

  const contextStats = {
    hasRepo: 0,
    hasPlatform: 0,
    hasFeatures: 0,
    hasRecommendations: 0,
    hasPercentile: 0,
    featureCounts: []
  };

  withContext.forEach(p => {
    if (p.context.repo) contextStats.hasRepo++;
    if (p.context.platform) contextStats.hasPlatform++;
    if (p.context.features) {
      contextStats.hasFeatures++;
      contextStats.featureCounts.push(Object.keys(p.context.features).length);
    }
    if (p.context.hasRecommendations !== undefined) contextStats.hasRecommendations++;
    if (p.context.percentile !== undefined) contextStats.hasPercentile++;
  });

  console.log(`   Has repo name: ${contextStats.hasRepo}`);
  console.log(`   Has platform: ${contextStats.hasPlatform}`);
  console.log(`   Has features: ${contextStats.hasFeatures}`);
  console.log(`   Has recommendations flag: ${contextStats.hasRecommendations}`);
  console.log(`   Has percentile: ${contextStats.hasPercentile}`);
  
  if (contextStats.featureCounts.length > 0) {
    const avgFeatures = contextStats.featureCounts.reduce((a, b) => a + b, 0) / contextStats.featureCounts.length;
    const minFeatures = Math.min(...contextStats.featureCounts);
    const maxFeatures = Math.max(...contextStats.featureCounts);
    console.log(`   Avg features per prediction: ${avgFeatures.toFixed(1)}`);
    console.log(`   Feature range: [${minFeatures}, ${maxFeatures}]`);
  }
  console.log();

  // 6. Recommendations
  console.log('='.repeat(70));
  console.log('💡 Recommendations:');
  console.log('='.repeat(70));
  console.log();

  const totalAvailable = withFeedback.length;
  const using = exportedCount;

  if (totalAvailable > using) {
    console.log(`⚠️  We're only using ${using} of ${totalAvailable} available predictions!`);
    console.log(`   Missing: ${totalAvailable - using} predictions with feedback`);
    console.log();
  }

  if (withFullFeatures.length < totalAvailable) {
    console.log(`⚠️  Only ${withFullFeatures.length} predictions have full features (10+)`);
    console.log(`   ${totalAvailable - withFullFeatures.length} predictions may have incomplete features`);
    console.log();
  }

  // Check for predictions we could add feedback to
  const withoutFeedback = allPredictions?.filter(p => p.actual_value === null) || [];
  if (withoutFeedback.length > 0) {
    console.log(`💡 ${withoutFeedback.length} predictions without feedback available`);
    console.log(`   Could add synthetic feedback to reach 1000+ examples`);
    console.log();
  }

  // Check for other prediction types
  const { data: otherTypes, error: typeError } = await supabase
    .from('ml_predictions')
    .select('prediction_type')
    .eq('service_name', 'beast-mode')
    .limit(1000);

  if (!typeError && otherTypes) {
    const typeCounts = {};
    otherTypes.forEach(p => {
      typeCounts[p.prediction_type] = (typeCounts[p.prediction_type] || 0) + 1;
    });
    
    if (Object.keys(typeCounts).length > 1) {
      console.log(`💡 Other prediction types available:`);
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
      console.log();
    }
  }

  console.log('✅ Analysis complete!');
  console.log();
}

checkSupabaseData().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
