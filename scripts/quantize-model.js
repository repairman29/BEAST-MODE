/**
 * Script to quantize a model
 */

const path = require('path');
const { getModelQuantization } = require('../lib/mlops/modelQuantization');
const { getMLModelIntegration } = require('../lib/mlops/mlModelIntegration');

async function main() {
  console.log('🔧 Model Quantization Script\n');

  const quantization = getModelQuantization();
  const mlIntegration = await getMLModelIntegration();
  await mlIntegration.initialize();

  if (!mlIntegration.qualityPredictor || !mlIntegration.qualityPredictor.model) {
    console.log('❌ No model loaded to quantize');
    process.exit(1);
  }

  console.log('📊 Quantizing model...\n');

  const modelName = mlIntegration.modelPath 
    ? path.basename(mlIntegration.modelPath, '.json')
    : 'current_model';

  const result = quantization.quantizeModel(
    mlIntegration.qualityPredictor.model,
    modelName,
    {
      bits: 8,
      preserveAccuracy: true
    }
  );

  if (result) {
    console.log('✅ Quantization complete!\n');
    console.log('📊 Results:');
    console.log(`   Original Size: ${(result.originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Quantized Size: ${(result.quantizedSize / 1024).toFixed(2)} KB`);
    console.log(`   Compression: ${result.compressionRatio}%`);

    // Save quantized model
    const quantizedPath = path.join(
      path.dirname(mlIntegration.modelPath || '.beast-mode/models'),
      `${modelName}-quantized.json`
    );
    
    const fs = require('fs').promises;
    await fs.writeFile(quantizedPath, JSON.stringify(result.model, null, 2));
    console.log(`\n💾 Quantized model saved to: ${quantizedPath}`);
  } else {
    console.log('❌ Quantization failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

