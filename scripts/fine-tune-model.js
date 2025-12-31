/**
 * Script to fine-tune a model with new production data
 */

const path = require('path');
const { getModelFineTuning } = require('../lib/mlops/modelFineTuning');
const { getDataCollection } = require('../lib/mlops/dataCollection');
const { getDataIntegration } = require('../lib/mlops/dataIntegration');

async function main() {
  console.log('🎯 Model Fine-Tuning Script\n');

  const fineTuning = getModelFineTuning();
  await fineTuning.initialize();

  // Get base model path
  const baseModelPath = process.argv[2] || 'quality-predictor-v3-advanced.json';
  
  console.log(`📦 Base Model: ${baseModelPath}\n`);

  // Collect new data from Supabase
  console.log('📊 Collecting new production data...');
  const dataIntegration = getDataIntegration();
  await dataIntegration.initialize();

  const newData = await dataIntegration.collectQualityData({
    days: 7, // Last 7 days
    limit: 1000
  });

  if (!newData || newData.length < 100) {
    console.log('⚠️  Insufficient new data for fine-tuning');
    console.log(`   Found: ${newData?.length || 0} samples (min: 100)`);
    console.log('\n💡 Tip: Wait for more production data or use synthetic data');
    process.exit(1);
  }

  console.log(`✅ Collected ${newData.length} new samples\n`);

  // Prepare data for fine-tuning
  const { getEnhancedFeatureEngineering } = require('../lib/features/enhancedFeatureEngineering');
  const featureEngine = getEnhancedFeatureEngineering();

  const preparedData = newData.map(sample => {
    const features = featureEngine.extractFeatures(sample);
    return {
      features,
      quality: sample.quality_score || sample.quality || 0
    };
  });

  console.log('🔧 Fine-tuning model...\n');

  // Fine-tune model
  const result = await fineTuning.fineTuneModel(baseModelPath, preparedData, {
    learningRate: 0.001,
    epochs: 10,
    batchSize: 32
  });

  if (result.success) {
    console.log('✅ Fine-tuning complete!\n');
    console.log('📊 Results:');
    console.log(`   Model: ${result.modelPath}`);
    console.log(`   Version: ${result.version}`);
    console.log(`   Metrics:`);
    console.log(`     - MSE: ${result.metrics.mse}`);
    console.log(`     - MAE: ${result.metrics.mae}`);
    console.log(`     - R²: ${result.metrics.r2}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Review metrics');
    console.log('   2. Test fine-tuned model');
    console.log('   3. Deploy if improved');
  } else {
    console.log('❌ Fine-tuning failed:');
    console.log(`   ${result.error}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

