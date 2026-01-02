/**
 * Test Feedback Collector
 * Tests feedback collection and shows what predictions need feedback
 */

const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');

async function main() {
  console.log('🧪 Testing Feedback Collector\n');
  console.log('='.repeat(60));

  try {
    const collector = await getFeedbackCollector();

    // Test 1: Get feedback stats
    console.log('\n📊 Test 1: Feedback Statistics');
    console.log('-'.repeat(60));
    
    const stats = await collector.getFeedbackStats();
    
    if (stats) {
      console.log(`\n✅ Stats retrieved:`);
      console.log(`   Total predictions: ${stats.totalPredictions}`);
      console.log(`   With actual values: ${stats.withActuals}`);
      console.log(`   Without actual values: ${stats.withoutActuals}`);
      console.log(`   Total feedback: ${stats.totalFeedback}`);
      console.log(`   Feedback rate: ${stats.feedbackRate}`);
      
      if (stats.withoutActuals > 0) {
        console.log(`\n⚠️  ${stats.withoutActuals} predictions need feedback!`);
      }
    } else {
      console.log(`\n❌ Could not get stats (Supabase may not be configured)`);
    }

    // Test 2: Get predictions needing feedback
    console.log('\n\n📋 Test 2: Predictions Needing Feedback');
    console.log('-'.repeat(60));
    
    const needingFeedback = await collector.getPredictionsNeedingFeedback({
      limit: 10
    });

    console.log(`\n✅ Found ${needingFeedback.length} predictions needing feedback`);
    
    if (needingFeedback.length > 0) {
      console.log(`\n📝 Sample predictions:`);
      needingFeedback.slice(0, 3).forEach((pred, i) => {
        console.log(`\n   ${i + 1}. ${pred.service_name} - ${pred.prediction_type}`);
        console.log(`      Predicted: ${pred.predicted_value.toFixed(3)}`);
        console.log(`      Confidence: ${pred.confidence ? pred.confidence.toFixed(3) : 'N/A'}`);
        console.log(`      Created: ${new Date(pred.created_at).toLocaleDateString()}`);
        console.log(`      ID: ${pred.id}`);
      });

      console.log(`\n💡 To record feedback:`);
      console.log(`   await collector.recordOutcome('${needingFeedback[0].id}', 0.85);`);
    } else {
      console.log(`\n✅ All predictions have feedback! (or no predictions found)`);
    }

    // Test 3: Record sample feedback (if we have predictions)
    if (needingFeedback.length > 0) {
      console.log('\n\n📝 Test 3: Recording Sample Feedback');
      console.log('-'.repeat(60));
      
      const samplePrediction = needingFeedback[0];
      const sampleActual = 0.85; // Example actual value
      
      console.log(`\n   Recording outcome for: ${samplePrediction.id}`);
      console.log(`   Predicted: ${samplePrediction.predicted_value.toFixed(3)}`);
      console.log(`   Actual: ${sampleActual.toFixed(3)}`);
      
      const result = await collector.recordOutcome(
        samplePrediction.id,
        sampleActual,
        { test: true, source: 'test-script' }
      );

      if (result) {
        console.log(`\n✅ Successfully recorded feedback!`);
        console.log(`   Updated prediction with actual value: ${result.actual_value}`);
        console.log(`   Error: ${result.error ? result.error.toFixed(3) : 'N/A'}`);
      } else {
        console.log(`\n❌ Failed to record feedback`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Feedback collector test complete!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

