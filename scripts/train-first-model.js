/**
 * Train First ML Model
 * Trains Code Quality Predictor with collected data
 */

const { getModelTrainer } = require('../lib/mlops/modelTrainer');
const { getFeedbackMonitor } = require('../lib/mlops/feedbackMonitor');

async function main() {
  console.log('🎯 Training First ML Model\n');
  console.log('='.repeat(60));

  try {
    // Check feedback status first
    console.log('\n📊 Checking Feedback Status...');
    const monitor = await getFeedbackMonitor();
    const status = await monitor.checkStatus();

    if (status.available) {
      console.log(`   Total predictions: ${status.stats.totalPredictions}`);
      console.log(`   With actual values: ${status.stats.withActuals}`);
      console.log(`   Feedback rate: ${status.stats.feedbackRate}`);
      
      if (status.stats.withActuals < 50) {
        console.log(`\n⚠️  Warning: Only ${status.stats.withActuals} examples with actual values`);
        console.log(`   Need at least 50 for meaningful training`);
        console.log(`   Recommendation: Wait for more feedback or use GitHub code data\n`);
      }
    }

    // Train model
    console.log('\n🚀 Training Code Quality Predictor...\n');
    const trainer = await getModelTrainer();
    
    const result = await trainer.trainCodeQualityModel({
      minExamples: 50, // Lower threshold for first model
      testSplit: 0.2,
      validationSplit: 0.1
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Model Training Complete!\n');
    console.log('📊 Results:');
    console.log(`   Accuracy: ${(result.metrics.accuracy * 100).toFixed(1)}%`);
    console.log(`   MAE: ${result.metrics.mae.toFixed(4)}`);
    console.log(`   RMSE: ${result.metrics.rmse.toFixed(4)}`);
    console.log(`   MLflow Run ID: ${result.runId}\n`);

    console.log('📝 Next Steps:');
    console.log('   1. Review model performance');
    console.log('   2. Deploy model if accuracy > 70%');
    console.log('   3. Monitor predictions vs actuals');
    console.log('   4. Retrain with more data\n');

  } catch (error) {
    if (error.message.includes('Not enough')) {
      console.log(`\n⚠️  ${error.message}`);
      console.log('\n💡 Recommendations:');
      console.log('   1. Wait for more feedback to be collected');
      console.log('   2. Use GitHub code data (if available)');
      console.log('   3. Lower minExamples threshold (not recommended)');
    } else {
      console.error('\n❌ Training failed:', error);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

