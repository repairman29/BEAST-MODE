/**
 * Script to train transformer model
 */

const path = require('path');
const { TransformerTrainer } = require('../lib/models/transformerTrainer');
const { getDataCollectionService } = require('../lib/mlops/dataCollection');
const { getEnhancedFeatureEngineering } = require('../lib/features/enhancedFeatureEngineering');

async function main() {
  console.log('🤖 Transformer Training Script\n');

  const trainer = new TransformerTrainer();
  const dataCollection = await getDataCollectionService();
  const featureEngine = getEnhancedFeatureEngineering();

  // Collect training data
  console.log('📊 Collecting training data...');
  const qualityData = await dataCollection.getQualityData();

  if (!qualityData || qualityData.length < 100) {
    console.log('⚠️  Insufficient data for training');
    console.log(`   Found: ${qualityData?.length || 0} samples (min: 100)`);
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

  console.log(`✅ Prepared ${X.length} samples with ${X[0].length} features\n`);

  // Train model
  console.log('🚀 Training transformer...\n');
  const result = await trainer.train(X, y, {
    dModel: 64,
    nHeads: 4,
    nLayers: 2,
    dFF: 256,
    learningRate: 0.001,
    epochs: 50,
    batchSize: 16
  });

  if (result.success) {
    console.log('✅ Training complete!\n');
    console.log('📊 Model Info:');
    const info = trainer.getModelInfo();
    console.log(`   Architecture: ${info.architecture}`);
    console.log(`   Training History: ${result.trainingHistory.length} epochs recorded`);
    console.log(`   Final Loss: ${result.trainingHistory[result.trainingHistory.length - 1].loss.toFixed(4)}`);

    // Save model
    const modelPath = path.join(__dirname, '../.beast-mode/models/quality-predictor-transformer.json');
    await trainer.saveModel(modelPath);
    console.log(`\n💾 Model saved to: ${modelPath}`);
  } else {
    console.log('❌ Training failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

