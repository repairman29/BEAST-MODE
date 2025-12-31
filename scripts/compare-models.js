/**
 * Script to compare all available models
 */

const { getModelComparison } = require('../lib/mlops/modelComparison');
const { getDataCollectionService } = require('../lib/mlops/dataCollection');
const { getEnhancedFeatureEngineering } = require('../lib/features/enhancedFeatureEngineering');

async function main() {
  console.log('📊 Model Comparison Script\n');

  const comparison = getModelComparison();
  await comparison.initialize();

  const dataCollection = await getDataCollectionService();
  const featureEngine = getEnhancedFeatureEngineering();

  // Collect test data
  console.log('📊 Collecting test data...');
  const qualityData = await dataCollection.getQualityData();

  if (!qualityData || qualityData.length < 50) {
    console.log('⚠️  Insufficient data for comparison');
    console.log(`   Found: ${qualityData?.length || 0} samples (min: 50)`);
    process.exit(1);
  }

  console.log(`✅ Collected ${qualityData.length} samples\n`);

  // Prepare data
  console.log('🔧 Preparing data...');
  const X = [];
  const y = [];

  for (const sample of qualityData) {
    const features = featureEngine.extractFeatures(sample);
    X.push(features);
    y.push(sample.quality_score || sample.quality || 0);
  }

  // Split into train/test (80/20)
  const splitIndex = Math.floor(X.length * 0.8);
  const X_test = X.slice(splitIndex);
  const y_test = y.slice(splitIndex);

  console.log(`✅ Prepared ${X_test.length} test samples\n`);

  // Compare models
  console.log('🔍 Comparing models...\n');
  const results = await comparison.compareModels(X_test, y_test);

  if (results) {
    console.log('✅ Comparison complete!\n');
    console.log('📊 Results:');
    
    results.comparisons.forEach(comp => {
      console.log(`\n${comp.modelName}:`);
      console.log(`   MAE: ${comp.metrics.mae}`);
      console.log(`   RMSE: ${comp.metrics.rmse}`);
      console.log(`   R²: ${comp.metrics.r2}`);
      console.log(`   Accuracy: ${comp.metrics.accuracy}%`);
      console.log(`   Avg Latency: ${comp.performance.avgLatency}ms`);
    });

    if (results.bestModel) {
      console.log(`\n🏆 Best Model: ${results.bestModel.modelName}`);
      console.log(`   Score: ${results.bestModel.score?.toFixed(4)}`);
    }
  } else {
    console.log('❌ Comparison failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

