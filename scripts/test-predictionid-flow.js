/**
 * Test predictionId Flow
 * Verifies that predictionId is passed correctly through Code Roach
 */

const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');
const { getDatabaseWriter } = require('../lib/mlops/databaseWriter');

async function main() {
  console.log('🧪 Testing predictionId Flow\n');
  console.log('='.repeat(60));

  try {
    // 1. Create a test prediction
    console.log('\n1️⃣ Creating test prediction...');
    const dbWriter = await getDatabaseWriter();
    
    const testPrediction = await dbWriter.writePrediction({
      serviceName: 'code-roach',
      predictionType: 'fix-success',
      predictedValue: 0.85,
      confidence: 0.8,
      context: {
        test: true,
        filePath: 'test-file.js',
        riskScore: 0.15
      },
      modelVersion: 'v1-test',
      source: 'heuristic'
    });

    if (!testPrediction || !testPrediction.id) {
      throw new Error('Failed to create test prediction');
    }

    console.log(`✅ Created test prediction: ${testPrediction.id}`);

    // Wait for database write to complete (flush queue)
    console.log('\n⏳ Waiting for database write to complete...');
    await dbWriter.flushQueue();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Give DB time to process

    // 2. Test feedback collection
    console.log('\n2️⃣ Testing feedback collection...');
    const collector = await getFeedbackCollector();
    
    const feedbackResult = await collector.recordOutcome(
      testPrediction.id,
      1.0, // Success
      {
        test: true,
        fixType: 'test-fix',
        filePath: 'test-file.js'
      }
    );

    if (feedbackResult) {
      console.log(`✅ Feedback recorded successfully`);
      console.log(`   Error: ${feedbackResult.error?.toFixed(4) || 'N/A'}`);
    } else {
      console.log('⚠️  Feedback collection returned null');
    }

    // 3. Verify in database
    console.log('\n3️⃣ Verifying in database...');
    const stats = await collector.getFeedbackStats();
    
    console.log(`   Total predictions: ${stats.totalPredictions}`);
    console.log(`   With actual values: ${stats.withActuals}`);
    console.log(`   Feedback rate: ${(stats.feedbackRate * 100).toFixed(2)}%`);

    // 4. Check if our test prediction has actual value
    console.log('\n4️⃣ Checking test prediction...');
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('ml_predictions')
        .select('id, actual_value, predicted_value')
        .eq('id', testPrediction.id)
        .single();

      if (data) {
        console.log(`✅ Found prediction in database`);
        console.log(`   ID: ${data.id}`);
        console.log(`   Predicted: ${data.predicted_value}`);
        console.log(`   Actual: ${data.actual_value || 'null'}`);
        
        if (data.actual_value !== null) {
          console.log(`\n🎉 SUCCESS! predictionId flow is working!`);
        } else {
          console.log(`\n⚠️  Prediction exists but actual_value is null`);
          console.log(`   This might be a timing issue - check again in a moment`);
        }
      } else {
        console.log(`⚠️  Could not find prediction: ${error?.message || 'Not found'}`);
      }
    } else {
      console.log('⚠️  Supabase credentials not available for verification');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test complete!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

