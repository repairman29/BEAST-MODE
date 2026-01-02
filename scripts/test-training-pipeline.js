/**
 * Test Training Pipeline
 * Tests the combined training pipeline
 */

const { getTrainingPipeline } = require('../lib/mlops/trainingPipeline');

async function main() {
  console.log('🧪 Testing Training Pipeline\n');
  console.log('='.repeat(60));

  try {
    const pipeline = await getTrainingPipeline();

    // Test 1: Get feedback status
    console.log('\n📊 Test 1: Feedback Collection Status');
    console.log('-'.repeat(60));
    
    const feedbackStatus = await pipeline.getFeedbackStatus();
    
    if (feedbackStatus.available) {
      console.log('\n✅ Feedback collector available');
      console.log(`   Total predictions: ${feedbackStatus.stats.totalPredictions}`);
      console.log(`   With actual values: ${feedbackStatus.stats.withActuals}`);
      console.log(`   Without actual values: ${feedbackStatus.stats.withoutActuals}`);
      console.log(`   Feedback rate: ${feedbackStatus.stats.feedbackRate}`);
    } else {
      console.log(`\n⚠️  ${feedbackStatus.message}`);
    }

    // Test 2: Build training dataset
    console.log('\n\n🔨 Test 2: Building Training Dataset');
    console.log('-'.repeat(60));
    
    const dataset = await pipeline.buildTrainingDataset({
      productionLimit: 1000,
      githubLimit: 100,
      minQuality: 0.0, // Include all for testing
      validate: true
    });

    console.log('\n✅ Dataset built successfully!');
    console.log(`   Total examples: ${dataset.statistics.total}`);
    console.log(`   With labels: ${dataset.statistics.withLabels} (${dataset.statistics.labelRate}%)`);
    console.log(`   Average quality: ${dataset.statistics.avgQuality.toFixed(2)}`);
    console.log(`   Production: ${dataset.statistics.production}`);
    console.log(`   GitHub: ${dataset.statistics.github}`);

    // Test 3: Export dataset
    if (dataset.dataset.length > 0) {
      console.log('\n\n💾 Test 3: Exporting Dataset');
      console.log('-'.repeat(60));
      
      const exportPath = await pipeline.exportDataset(dataset.dataset, 'json');
      console.log(`\n✅ Dataset exported to: ${exportPath}`);
    } else {
      console.log('\n\n⚠️  Test 3: Skipping export (no data)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Training pipeline test complete!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

