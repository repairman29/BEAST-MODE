#!/usr/bin/env node
/**
 * Check ML feedback collection rate
 */

// Load env from website directory
const path = require('path');
const fs = require('fs');

// Try to load .env.local from website directory
const websiteEnvPath = path.join(__dirname, '../website/.env.local');
if (fs.existsSync(websiteEnvPath)) {
  require('dotenv').config({ path: websiteEnvPath });
}

// Also try root .env
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFeedbackRate() {
  console.log('📊 Checking ML Feedback Collection Rate...\n');

  try {
    // Get total predictions
    const { count: totalPredictions, error: pError } = await supabase
      .from('ml_predictions')
      .select('*', { count: 'exact', head: true });

    if (pError) {
      throw pError;
    }

    // Get feedback with feedback scores (not null) - ml_feedback uses feedback_score, not actual_value
    const { data: feedbackData, error: fError } = await supabase
      .from('ml_feedback')
      .select('*')
      .not('feedback_score', 'is', null);
    
    const feedbackCount = feedbackData?.length || 0;

    if (fError) {
      throw fError;
    }

    // Get feedback by service (use feedbackData we already have)
    const feedbackByService = feedbackData || [];

    const serviceCounts = {};
    feedbackByService?.forEach(f => {
      serviceCounts[f.service_name] = (serviceCounts[f.service_name] || 0) + 1;
    });

    const rate = totalPredictions > 0 ? ((feedbackCount / totalPredictions) * 100).toFixed(2) : 0;

    console.log('📈 Statistics:');
    console.log(`   Total Predictions: ${totalPredictions || 0}`);
    console.log(`   With Feedback: ${feedbackCount || 0}`);
    console.log(`   Feedback Rate: ${rate}%`);
    console.log(`   Target Rate: 5-10%`);
    console.log(`   Status: ${parseFloat(rate) >= 5 ? '✅' : '⚠️'} ${parseFloat(rate) >= 5 ? 'GOOD' : 'NEEDS IMPROVEMENT'}`);
    console.log('');

    if (Object.keys(serviceCounts).length > 0) {
      console.log('📊 Feedback by Service:');
      Object.entries(serviceCounts).forEach(([service, count]) => {
        console.log(`   ${service}: ${count}`);
      });
      console.log('');
    }

    // Training readiness - need feedback linked to predictions
    // Count predictions that have feedback
    const { data: predictionsWithFeedback, error: pwfError } = await supabase
      .from('ml_predictions')
      .select('id')
      .in('id', feedbackData?.map(f => f.prediction_id).filter(Boolean) || []);
    
    const predictionsWithFeedbackCount = predictionsWithFeedback?.length || 0;
    const readyToTrain = predictionsWithFeedbackCount >= 50;
    
    console.log('🎯 Training Readiness:');
    console.log(`   Predictions with feedback: ${predictionsWithFeedbackCount || 0}`);
    console.log(`   Total feedback entries: ${feedbackCount || 0}`);
    console.log(`   Need for training: 50+ predictions with feedback`);
    console.log(`   Status: ${readyToTrain ? '✅ READY TO TRAIN' : `⚠️  Need ${50 - (predictionsWithFeedbackCount || 0)} more predictions with feedback`}`);
    console.log('');

    // Recommendations
    if (parseFloat(rate) < 5) {
      console.log('💡 Recommendations:');
      console.log('   1. Verify predictionId flow in all services');
      console.log('   2. Check feedback collection triggers');
      console.log('   3. Review service logs for errors');
      console.log('   4. Ensure feedback UI is accessible');
    }

    if (readyToTrain) {
      console.log('🚀 Ready to train! Run:');
      console.log('   npm run ml:train');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkFeedbackRate();
