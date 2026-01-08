/**
 * Check Training Readiness
 * Determines if we have enough feedback to train a model
 */

const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');

async function main() {
  console.log('🎯 Checking Training Readiness...\n');
  console.log('='.repeat(60));

  try {
    const collector = await getFeedbackCollector();
    if (!collector) {
      console.error('❌ Feedback collector not available');
      process.exit(1);
    }

    // Get feedback stats
    const stats = await collector.getFeedbackStats();
    
    console.log('\n📊 Current Status:');
    console.log(`   Total Predictions: ${stats.totalPredictions}`);
    console.log(`   With Feedback: ${stats.withActuals}`);
    console.log(`   Feedback Rate: ${(stats.feedbackRate * 100).toFixed(2)}%`);
    console.log(`   Target Rate: 5-10%`);
    
    // Check training readiness
    const minExamples = 50;
    const hasEnough = stats.withActuals >= minExamples;
    
    console.log('\n🎯 Training Readiness:');
    console.log(`   Predictions with feedback: ${stats.withActuals}`);
    console.log(`   Minimum needed: ${minExamples}`);
    console.log(`   Status: ${hasEnough ? '✅ READY TO TRAIN' : '⚠️  Need more feedback'}`);
    
    if (!hasEnough) {
      const needed = minExamples - stats.withActuals;
      console.log(`   Need ${needed} more predictions with feedback`);
    }
    
    // Get predictions needing feedback
    console.log('\n📋 Predictions Needing Feedback:');
    const needingFeedback = await collector.getPredictionsNeedingFeedback({
      limit: 10,
      orderBy: 'created_at',
      orderDirection: 'desc'
    });
    
    console.log(`   Found ${needingFeedback.length} recent predictions needing feedback`);
    if (needingFeedback.length > 0) {
      console.log('\n   Recent predictions:');
      needingFeedback.slice(0, 5).forEach((pred, i) => {
        const age = Math.floor((Date.now() - new Date(pred.created_at).getTime()) / (1000 * 60 * 60));
        console.log(`   ${i + 1}. ${pred.service_name} (${age}h ago) - ${pred.prediction_type || 'unknown'}`);
      });
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (!hasEnough) {
      console.log('   1. Continue using BEAST MODE features to generate predictions');
      console.log('   2. Provide feedback when prompted (bottom-right corner)');
      console.log('   3. Feedback prompts appear automatically after predictions');
      console.log('   4. Check back when you have 50+ feedback entries');
    } else {
      console.log('   ✅ Ready to train first model!');
      console.log('   Run: npm run ml:train');
      console.log('   Or: node scripts/train-model.js');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n📈 MLflow UI: http://localhost:5000`);
    console.log(`   (Start with: mlflow ui --port 5000)\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
