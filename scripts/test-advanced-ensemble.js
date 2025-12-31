/**
 * Test script for advanced ensemble strategies
 */

const { getAdvancedEnsemble } = require('../lib/mlops/advancedEnsemble');

async function main() {
  console.log('🧪 Testing Advanced Ensemble Strategies\n');

  const ensemble = getAdvancedEnsemble();
  await ensemble.initialize();

  // Test data
  const predictions = [
    { value: 7.5, confidence: 0.9, model: 'model-a' },
    { value: 8.0, confidence: 0.8, model: 'model-b' },
    { value: 7.0, confidence: 0.7, model: 'model-c' }
  ];

  const context = {
    serviceName: 'ai-gm',
    predictionType: 'narrative-quality'
  };

  console.log('📊 Base Predictions:');
  predictions.forEach((p, i) => {
    console.log(`   Model ${i + 1}: ${p.value} (confidence: ${p.confidence})`);
  });
  console.log();

  // Test stacking
  console.log('🔗 Testing Stacking Ensemble...');
  try {
    const stackingResult = await ensemble.stackingEnsemble(predictions, context);
    console.log('✅ Stacking Result:');
    console.log(`   Prediction: ${stackingResult.prediction.toFixed(2)}`);
    console.log(`   Confidence: ${stackingResult.confidence.toFixed(2)}`);
    console.log(`   Meta Weights: ${stackingResult.metaWeights.map(w => w.toFixed(2)).join(', ')}`);
    console.log();
  } catch (error) {
    console.log(`❌ Stacking failed: ${error.message}\n`);
  }

  // Test dynamic selection
  console.log('🎯 Testing Dynamic Selection...');
  try {
    const dynamicResult = await ensemble.dynamicSelection(predictions, context);
    console.log('✅ Dynamic Selection Result:');
    console.log(`   Prediction: ${dynamicResult.prediction.toFixed(2)}`);
    console.log(`   Confidence: ${dynamicResult.confidence.toFixed(2)}`);
    console.log(`   Selected Models: ${dynamicResult.selectedCount}/${dynamicResult.totalModels}`);
    dynamicResult.selectedModels.forEach(m => {
      console.log(`     - ${m.model}: ${m.prediction.toFixed(2)} (score: ${m.score.toFixed(2)})`);
    });
    console.log();
  } catch (error) {
    console.log(`❌ Dynamic selection failed: ${error.message}\n`);
  }

  // Test confidence-weighted voting
  console.log('⚖️  Testing Confidence-Weighted Voting...');
  try {
    const votingResult = await ensemble.confidenceWeightedVoting(predictions);
    console.log('✅ Confidence-Weighted Voting Result:');
    console.log(`   Prediction: ${votingResult.prediction.toFixed(2)}`);
    console.log(`   Confidence: ${votingResult.confidence.toFixed(2)}`);
    votingResult.weights.forEach(w => {
      console.log(`     - ${w.model}: weight ${w.weight.toFixed(3)}`);
    });
    console.log();
  } catch (error) {
    console.log(`❌ Confidence-weighted voting failed: ${error.message}\n`);
  }

  // Test feedback update
  console.log('🔄 Testing Feedback Update...');
  try {
    await ensemble.updateWithFeedback(predictions, 7.8, context);
    console.log('✅ Feedback updated successfully');
    console.log();

    const stats = ensemble.getStatistics();
    console.log('📊 Ensemble Statistics:');
    console.log(`   History Size: ${stats.historySize}`);
    console.log(`   Average Error: ${stats.avgError.toFixed(4)}`);
    console.log(`   Performance Weights: ${Object.keys(stats.performanceWeights).length} models`);
    console.log();
  } catch (error) {
    console.log(`❌ Feedback update failed: ${error.message}\n`);
  }

  console.log('✅ Advanced ensemble tests complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

