#!/usr/bin/env node

/**
 * Test Complementary ML Work
 * Tests feedback collection, model evaluation, and confidence scoring
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { compareModels } = require('./compare-models');
const { analyzeErrors } = require('./analyze-prediction-errors');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testComplementaryWork() {
  console.log('🧪 Testing Complementary ML Work\n');
  console.log('='.repeat(60));

  const results = {
    feedbackCollection: { passed: false, message: '' },
    modelEvaluation: { passed: false, message: '' },
    confidenceScoring: { passed: false, message: '' },
    autoCollect: { passed: false, message: '' }
  };

  try {
    // Test 1: Feedback Collection
    console.log('\n1️⃣ Testing Feedback Collection...');
    if (!supabaseUrl || !supabaseKey) {
      results.feedbackCollection.message = 'Supabase not configured';
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('ml_predictions')
        .select('id')
        .eq('service_name', 'beast-mode')
        .limit(1);
      
      if (error) {
        results.feedbackCollection.message = `Database error: ${error.message}`;
      } else {
        results.feedbackCollection.passed = true;
        results.feedbackCollection.message = `✅ Database accessible, ${data?.length || 0} predictions found`;
      }
    }

    // Test 2: Model Evaluation
    console.log('\n2️⃣ Testing Model Evaluation...');
    try {
      await compareModels();
      results.modelEvaluation.passed = true;
      results.modelEvaluation.message = '✅ Model comparison tool works';
    } catch (error) {
      results.modelEvaluation.message = `Error: ${error.message}`;
    }

    // Test 3: Confidence Scoring
    console.log('\n3️⃣ Testing Confidence Scoring...');
    try {
      const { getMLModelIntegration } = require('../lib/mlops/mlModelIntegration');
      const mlIntegration = await getMLModelIntegration();
      
      if (mlIntegration && mlIntegration.isMLModelAvailable()) {
        const modelInfo = mlIntegration.getModelInfo();
        if (modelInfo.metrics && modelInfo.metrics.r2 !== undefined) {
          results.confidenceScoring.passed = true;
          results.confidenceScoring.message = `✅ Model available, R² = ${modelInfo.metrics.r2.toFixed(4)}`;
        } else {
          results.confidenceScoring.message = 'Model available but metrics missing';
        }
      } else {
        results.confidenceScoring.message = 'Model not available';
      }
    } catch (error) {
      results.confidenceScoring.message = `Error: ${error.message}`;
    }

    // Test 4: Auto-Collect Feedback
    console.log('\n4️⃣ Testing Auto-Collect Feedback...');
    try {
      const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');
      const collector = await getFeedbackCollector();
      
      if (collector) {
        results.autoCollect.passed = true;
        results.autoCollect.message = '✅ Feedback collector available';
      } else {
        results.autoCollect.message = 'Feedback collector not available';
      }
    } catch (error) {
      results.autoCollect.message = `Error: ${error.message}`;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Results:\n');
    
    const allTests = [
      { name: 'Feedback Collection', result: results.feedbackCollection },
      { name: 'Model Evaluation', result: results.modelEvaluation },
      { name: 'Confidence Scoring', result: results.confidenceScoring },
      { name: 'Auto-Collect Feedback', result: results.autoCollect }
    ];

    allTests.forEach(test => {
      const status = test.result.passed ? '✅' : '⚠️';
      console.log(`   ${status} ${test.name}: ${test.result.message}`);
    });

    const passedCount = allTests.filter(t => t.result.passed).length;
    const totalCount = allTests.length;
    
    console.log(`\n📈 Summary: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('\n✅ All complementary ML work tests passed!\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed - check messages above\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testComplementaryWork();
}

module.exports = { testComplementaryWork };

