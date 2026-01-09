#!/usr/bin/env node
/**
 * End-to-End Test for Feedback Collection System
 * 
 * Tests the complete feedback collection flow:
 * 1. Make a quality prediction
 * 2. Verify predictionId is returned
 * 3. Test automatic feedback inference (recommendation click)
 * 4. Test manual feedback submission
 * 5. Verify feedback is stored in database
 * 6. Check feedback stats API
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

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}${message ? `: ${message}` : ''}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}${message ? `: ${message}` : ''}`);
  }
}

async function testQualityPrediction() {
  console.log('\n📊 Test 1: Quality Prediction');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${API_BASE}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        repo: 'facebook/react',
        platform: 'beast-mode'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    logTest('Quality API returns prediction', !!data.quality, `Quality: ${(data.quality * 100).toFixed(1)}%`);
    logTest('PredictionId is included', !!data.predictionId, `ID: ${data.predictionId?.substring(0, 8)}...`);
    logTest('Confidence is included', typeof data.confidence === 'number', `Confidence: ${(data.confidence * 100).toFixed(1)}%`);
    
    return data.predictionId;
  } catch (error) {
    logTest('Quality API request', false, error.message);
    return null;
  }
}

async function testAutomaticFeedbackInference(predictionId) {
  console.log('\n🤖 Test 2: Automatic Feedback Inference');
  console.log('='.repeat(50));
  
  if (!predictionId) {
    logTest('Automatic feedback inference', false, 'No predictionId available');
    return false;
  }

  try {
    // Simulate recommendation click (automatic feedback)
    const response = await fetch(`${API_BASE}/api/feedback/auto-collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        predictionId,
        inferredValue: 0.8,
        context: {
          source: 'recommendation_click',
          inferred: true,
          recommendation: 'Add README',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    logTest('Auto-collect API accepts inferred feedback', data.success !== false, data.message || 'Success');
    
    // Wait a moment for database write
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify feedback was stored
    const { data: feedback, error } = await supabase
      .from('ml_feedback')
      .select('*')
      .eq('prediction_id', predictionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    // Check if feedback is in ml_feedback or ml_predictions
    const hasFeedback = !!feedback || (prediction && prediction.actual_value !== null);
    logTest('Inferred feedback stored in database', hasFeedback, 
      feedback ? `ml_feedback: ${feedback.feedback_score}` : 
      prediction?.actual_value !== null ? `ml_predictions: ${prediction.actual_value}` : 
      'Not found');
    
    if (feedback) {
      logTest('Feedback metadata includes source', feedback.metadata?.source === 'recommendation_click' || feedback.metadata?.inferred === true, 'Source tracked');
    } else if (prediction?.context) {
      logTest('Prediction context includes source', prediction.context.source === 'auto-inferred' || prediction.context.inferred === true, 'Source tracked');
    }
    
    return true;
  } catch (error) {
    logTest('Automatic feedback inference', false, error.message);
    return false;
  }
}

async function testManualFeedback(predictionId) {
  console.log('\n👤 Test 3: Manual Feedback Submission');
  console.log('='.repeat(50));
  
  if (!predictionId) {
    logTest('Manual feedback submission', false, 'No predictionId available');
    return false;
  }

  try {
    // Submit manual feedback
    const response = await fetch(`${API_BASE}/api/feedback/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        predictionId,
        actualValue: 0.85,
        context: {
          source: 'manual',
          userRating: 'helpful',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    logTest('Manual feedback API accepts submission', data.success !== false, data.message || 'Success');
    
    // Wait a moment for database write
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify feedback was stored
    const { data: feedback, error } = await supabase
      .from('ml_feedback')
      .select('*')
      .eq('prediction_id', predictionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Check if feedback is in ml_feedback or ml_predictions
    const hasFeedback = !!feedback || (prediction && prediction.actual_value !== null);
    logTest('Manual feedback stored in database', hasFeedback, 
      feedback ? `ml_feedback: ${feedback.feedback_score}` : 
      prediction?.actual_value !== null ? `ml_predictions: ${prediction.actual_value}` : 
      'Not found');
    
    return true;
  } catch (error) {
    logTest('Manual feedback submission', false, error.message);
    return false;
  }
}

async function testFeedbackStats() {
  console.log('\n📈 Test 4: Feedback Stats API');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${API_BASE}/api/feedback/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const stats = await response.json();
    
    logTest('Stats API returns data', !!stats, 'Data received');
    logTest('Total predictions included', typeof stats.totalPredictions === 'number', `Total: ${stats.totalPredictions}`);
    logTest('Feedback rate included', typeof stats.feedbackRate === 'number', `${(stats.feedbackRate * 100).toFixed(2)}%`);
    logTest('Training readiness included', typeof stats.trainingReady === 'boolean', stats.trainingReady ? 'Ready' : 'Not ready');
    
    if (stats.inferredFeedback !== undefined) {
      logTest('Inferred feedback tracked', typeof stats.inferredFeedback === 'number', `Inferred: ${stats.inferredFeedback}`);
    }
    
    if (stats.bySource) {
      logTest('Source breakdown included', Object.keys(stats.bySource).length > 0, `${Object.keys(stats.bySource).length} sources`);
    }
    
    return true;
  } catch (error) {
    logTest('Feedback stats API', false, error.message);
    return false;
  }
}

async function testDatabaseVerification(predictionId) {
  console.log('\n🗄️  Test 5: Database Verification');
  console.log('='.repeat(50));
  
  if (!predictionId) {
    logTest('Database verification', false, 'No predictionId available');
    return false;
  }

  try {
    // Wait a bit for async writes
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check ml_predictions table
    const { data: prediction, error: predError } = await supabase
      .from('ml_predictions')
      .select('*')
      .eq('id', predictionId)
      .single();

    if (predError && predError.code !== 'PGRST116') {
      throw predError;
    }

    logTest('Prediction stored in ml_predictions', !!prediction, prediction ? `Service: ${prediction.service_name}` : 'Not found (may be async)');
    
    // Check ml_feedback table
    const { data: feedback, error: fbError } = await supabase
      .from('ml_feedback')
      .select('*')
      .eq('prediction_id', predictionId)
      .order('created_at', { ascending: false });

    if (fbError) {
      throw fbError;
    }

    logTest('Feedback entries found', feedback && feedback.length > 0, `${feedback?.length || 0} entries`);
    
    if (feedback && feedback.length > 0) {
      const latest = feedback[0];
      logTest('Latest feedback has score', typeof latest.feedback_score === 'number', `Score: ${latest.feedback_score}`);
      logTest('Latest feedback has metadata', !!latest.metadata, 'Metadata present');
    }
    
    return true;
  } catch (error) {
    logTest('Database verification', false, error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 End-to-End Feedback Collection Test');
  console.log('='.repeat(50));
  console.log(`API Base: ${API_BASE}`);
  console.log(`Supabase: ${supabaseUrl ? '✅ Configured' : '❌ Missing'}`);
  console.log();

  let predictionId = null;

  // Test 1: Quality Prediction
  predictionId = await testQualityPrediction();

  // Test 2: Automatic Feedback Inference
  await testAutomaticFeedbackInference(predictionId);

  // Test 3: Manual Feedback
  await testManualFeedback(predictionId);

  // Test 4: Feedback Stats
  await testFeedbackStats();

  // Test 5: Database Verification
  await testDatabaseVerification(predictionId);

  // Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${testResults.tests.length}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
  console.log();

  if (testResults.failed === 0) {
    console.log('🎉 All tests passed! Feedback collection system is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Review the output above for details.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
