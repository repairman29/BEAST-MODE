#!/usr/bin/env node
/**
 * Improve Feedback Collection
 * 
 * This script:
 * 1. Checks current feedback rate
 * 2. Identifies predictions without feedback
 * 3. Suggests improvements
 * 4. Tests feedback collection endpoints
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

async function checkFeedbackRate() {
  console.log('📊 Checking Feedback Collection Rate...\n');

  try {
    // Get total predictions
    const { data: predictions, error: predError } = await supabase
      .from('ml_predictions')
      .select('id, service_name, prediction_type, created_at, actual_value')
      .eq('service_name', 'beast-mode')
      .eq('prediction_type', 'quality')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (predError) throw predError;

    const total = predictions.length;
    const withFeedback = predictions.filter(p => p.actual_value !== null).length;
    const feedbackRate = total > 0 ? (withFeedback / total) * 100 : 0;

    console.log(`📈 Statistics:`);
    console.log(`   Total Predictions: ${total}`);
    console.log(`   With Feedback: ${withFeedback}`);
    console.log(`   Feedback Rate: ${feedbackRate.toFixed(2)}%`);
    console.log(`   Target Rate: 5-10%`);
    console.log(`   Status: ${feedbackRate >= 5 ? '✅ GOOD' : '⚠️  NEEDS IMPROVEMENT'}\n`);

    // Get recent predictions without feedback
    const recentWithoutFeedback = predictions
      .filter(p => p.actual_value === null)
      .slice(0, 10);

    if (recentWithoutFeedback.length > 0) {
      console.log(`📋 Recent Predictions Without Feedback (${recentWithoutFeedback.length}):`);
      recentWithoutFeedback.forEach((p, i) => {
        const age = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60));
        console.log(`   ${i + 1}. ID: ${p.id.substring(0, 8)}... (${age} minutes ago)`);
      });
      console.log();
    }

    // Check feedback table
    const { data: feedback, error: fbError } = await supabase
      .from('ml_feedback')
      .select('id, prediction_id, feedback_score, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!fbError && feedback && feedback.length > 0) {
      console.log(`✅ Recent Feedback Entries (${feedback.length}):`);
      feedback.forEach((f, i) => {
        const age = Math.floor((Date.now() - new Date(f.created_at).getTime()) / (1000 * 60));
        console.log(`   ${i + 1}. Prediction: ${f.prediction_id?.substring(0, 8)}... Score: ${f.feedback_score} (${age} minutes ago)`);
      });
      console.log();
    }

    // Recommendations
    console.log(`💡 Recommendations:`);
    if (feedbackRate < 5) {
      console.log(`   1. ✅ Add inline feedback buttons to quality dashboard (DONE)`);
      console.log(`   2. ✅ Ensure predictionId is included in API responses (DONE)`);
      console.log(`   3. ⚠️  Verify feedback prompts are visible to users`);
      console.log(`   4. ⚠️  Test feedback collection endpoints`);
      console.log(`   5. ⚠️  Add automatic feedback inference where possible`);
    } else {
      console.log(`   ✅ Feedback rate is healthy!`);
    }
    console.log();

    // Training readiness
    const trainingReady = withFeedback >= 50;
    console.log(`🎯 Training Readiness:`);
    console.log(`   Predictions with feedback: ${withFeedback}`);
    console.log(`   Need for training: 50+ predictions with feedback`);
    console.log(`   Status: ${trainingReady ? '✅ READY' : `⚠️  Need ${50 - withFeedback} more`}\n`);

    return { total, withFeedback, feedbackRate, trainingReady };
  } catch (error) {
    console.error('❌ Error checking feedback rate:', error.message);
    throw error;
  }
}

async function testFeedbackEndpoints() {
  console.log('🧪 Testing Feedback Collection Endpoints...\n');

  const testPredictionId = 'test-' + Date.now();
  
  // Test 1: Submit feedback
  try {
    const response = await fetch('http://localhost:3000/api/feedback/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        predictionId: testPredictionId,
        actualValue: 0.85,
        context: { test: true }
      })
    });

    if (response.ok) {
      console.log('   ✅ /api/feedback/submit - Working');
    } else {
      console.log(`   ⚠️  /api/feedback/submit - Status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ /api/feedback/submit - Error: ${error.message}`);
  }

  // Test 2: Collect feedback
  try {
    const response = await fetch('http://localhost:3000/api/feedback/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        predictionId: testPredictionId,
        serviceName: 'beast-mode',
        feedbackType: 'user',
        feedbackScore: 1,
        metadata: { test: true }
      })
    });

    if (response.ok) {
      console.log('   ✅ /api/feedback/collect - Working');
    } else {
      console.log(`   ⚠️  /api/feedback/collect - Status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ /api/feedback/collect - Error: ${error.message}`);
    console.log(`   💡 Note: This is expected if the dev server is not running`);
  }
  console.log();
}

async function main() {
  console.log('🚀 Improving Feedback Collection\n');
  console.log('='.repeat(50));
  console.log();

  try {
    const stats = await checkFeedbackRate();
    await testFeedbackEndpoints();

    console.log('='.repeat(50));
    console.log('\n✅ Feedback collection analysis complete!\n');

    if (stats.feedbackRate < 5) {
      console.log('📋 Next Steps:');
      console.log('   1. Test feedback buttons in quality dashboard');
      console.log('   2. Verify feedback prompts appear');
      console.log('   3. Monitor feedback rate over next week');
      console.log('   4. Add automatic feedback inference');
    }

    if (stats.trainingReady) {
      console.log('\n🎉 Ready to train first model!');
      console.log('   Run: npm run ml:train');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
