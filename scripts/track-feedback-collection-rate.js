#!/usr/bin/env node
/**
 * Track Feedback Collection Rate
 * Monitor how well we're collecting feedback from users
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

async function trackFeedbackRate() {
  console.log('📊 Feedback Collection Rate Analysis\n');
  console.log('='.repeat(70));
  console.log();

  // Get all predictions
  const { data: allPredictions, error: predError } = await supabase
    .from('ml_predictions')
    .select('id, created_at, actual_value, context')
    .eq('service_name', 'beast-mode')
    .eq('prediction_type', 'quality')
    .order('created_at', { ascending: false });

  if (predError) {
    console.error('❌ Error:', predError.message);
    return;
  }

  const total = allPredictions?.length || 0;
  const withFeedback = allPredictions?.filter(p => p.actual_value !== null) || [];
  const withoutFeedback = allPredictions?.filter(p => p.actual_value === null) || [];

  console.log('📈 Overall Statistics:');
  console.log(`   Total predictions: ${total}`);
  console.log(`   With feedback: ${withFeedback.length} (${(withFeedback.length / total * 100).toFixed(1)}%)`);
  console.log(`   Without feedback: ${withoutFeedback.length} (${(withoutFeedback.length / total * 100).toFixed(1)}%)`);
  console.log();

  // Get feedback entries
  const { data: feedbackEntries, error: fbError } = await supabase
    .from('ml_feedback')
    .select('*')
    .eq('service_name', 'beast-mode')
    .order('created_at', { ascending: false })
    .limit(1000);

  let realFeedback = [];
  let syntheticFeedback = [];

  if (!fbError && feedbackEntries) {
    console.log('💡 Feedback Sources:');
    const bySource = {};
    const byType = {};

    feedbackEntries.forEach(f => {
      const source = f.metadata?.source || f.feedback_type || 'unknown';
      bySource[source] = (bySource[source] || 0) + 1;
      byType[f.feedback_type] = (byType[f.feedback_type] || 0) + 1;

      if (f.metadata?.synthetic) {
        syntheticFeedback.push(f);
      } else {
        realFeedback.push(f);
      }
    });

    console.log(`   Total feedback entries: ${feedbackEntries.length}`);
    console.log(`   Real feedback: ${realFeedback.length} (${(realFeedback.length / feedbackEntries.length * 100).toFixed(1)}%)`);
    console.log(`   Synthetic feedback: ${syntheticFeedback.length} (${(syntheticFeedback.length / feedbackEntries.length * 100).toFixed(1)}%)`);
    console.log();
    console.log('   By source:');
    Object.entries(bySource).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
      console.log(`     ${source}: ${count} (${(count / feedbackEntries.length * 100).toFixed(1)}%)`);
    });
    console.log();
  }

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentPredictions = allPredictions?.filter(p => 
    new Date(p.created_at) >= sevenDaysAgo
  ) || [];

  const recentWithFeedback = recentPredictions.filter(p => p.actual_value !== null);

  console.log('📅 Recent Activity (Last 7 Days):');
  console.log(`   Predictions: ${recentPredictions.length}`);
  console.log(`   With feedback: ${recentWithFeedback.length} (${recentPredictions.length > 0 ? (recentWithFeedback.length / recentPredictions.length * 100).toFixed(1) : 0}%)`);
  console.log();

  // Feedback rate trend
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const last30Predictions = allPredictions?.filter(p => 
    new Date(p.created_at) >= last30Days
  ) || [];

  const last30WithFeedback = last30Predictions.filter(p => p.actual_value !== null);

  console.log('📊 Last 30 Days:');
  console.log(`   Predictions: ${last30Predictions.length}`);
  console.log(`   With feedback: ${last30WithFeedback.length} (${last30Predictions.length > 0 ? (last30WithFeedback.length / last30Predictions.length * 100).toFixed(1) : 0}%)`);
  console.log();

  // Recommendations
  console.log('='.repeat(70));
  console.log('💡 Recommendations:');
  console.log('='.repeat(70));
  console.log();

  const overallRate = (withFeedback.length / total * 100);
  const recentRate = recentPredictions.length > 0 ? (recentWithFeedback.length / recentPredictions.length * 100) : 0;

  if (overallRate < 50) {
    console.log('⚠️  Overall feedback rate is below 50%');
    console.log('   - Make feedback collection more prominent');
    console.log('   - Add incentives for providing feedback');
    console.log('   - Simplify the feedback process');
    console.log();
  }

  if (recentRate < overallRate) {
    console.log('⚠️  Recent feedback rate is declining');
    console.log('   - Check if feedback UI is working');
    console.log('   - Verify API endpoints are accessible');
    console.log('   - Consider A/B testing different prompts');
    console.log();
  }

  const realFeedbackRate = realFeedback.length / feedbackEntries.length * 100;
  if (realFeedbackRate < 30) {
    console.log('⚠️  Real feedback rate is below 30%');
    console.log('   - Too much synthetic feedback');
    console.log('   - Focus on collecting real user feedback');
    console.log('   - Deploy enhanced feedback prompts');
    console.log();
  }

  // Target: 200+ real feedback examples
  if (realFeedback.length < 200) {
    console.log(`🎯 Target: 200+ real feedback examples`);
    console.log(`   Current: ${realFeedback.length}`);
    console.log(`   Need: ${200 - realFeedback.length} more`);
    console.log();
  }

  console.log('✅ Analysis complete!');
  console.log();
}

trackFeedbackRate().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
