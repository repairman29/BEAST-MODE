#!/usr/bin/env node

/**
 * Model Comparison Tool
 * Compare different ML models (XGBoost, Random Forest, etc.)
 */

const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { getMLModelIntegration } = require('../lib/mlops/mlModelIntegration');

async function compareModels() {
  console.log('🔬 Model Comparison Tool\n');
  console.log('='.repeat(60));

  try {
    const mlIntegration = await getMLModelIntegration();
    
    if (!mlIntegration || !mlIntegration.isMLModelAvailable()) {
      console.error('❌ ML model not available');
      process.exit(1);
    }

    const modelInfo = mlIntegration.getModelInfo();
    console.log('\n📊 Current Model Info:');
    console.log(`   Algorithm: ${modelInfo.algorithm || 'Unknown'}`);
    console.log(`   Version: ${modelInfo.version || 'Unknown'}`);
    console.log(`   R²: ${modelInfo.metrics?.r2?.toFixed(4) || 'N/A'}`);
    console.log(`   MAE: ${modelInfo.metrics?.mae?.toFixed(4) || 'N/A'}`);
    console.log(`   RMSE: ${modelInfo.metrics?.rmse?.toFixed(4) || 'N/A'}`);
    console.log(`   Dataset Size: ${modelInfo.datasetSize || 'N/A'}`);
    console.log(`   Features: ${modelInfo.featureCount || 'N/A'}`);

    // Check for other model files
    const modelsDir = path.join(__dirname, '../.beast-mode/models');
    try {
      const modelDirs = await fs.readdir(modelsDir);
      const modelTypes = modelDirs.filter(d => d.startsWith('model-'));
      
      console.log(`\n📁 Found ${modelTypes.length} model(s) in .beast-mode/models:`);
      for (const modelType of modelTypes) {
        const modelPath = path.join(modelsDir, modelType);
        const metadataPath = path.join(modelPath, 'model-metadata.json');
        
        try {
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
          console.log(`\n   ${modelType}:`);
          console.log(`     Algorithm: ${metadata.algorithm || 'Unknown'}`);
          console.log(`     R²: ${metadata.metrics?.r2?.toFixed(4) || 'N/A'}`);
          console.log(`     MAE: ${metadata.metrics?.mae?.toFixed(4) || 'N/A'}`);
          console.log(`     RMSE: ${metadata.metrics?.rmse?.toFixed(4) || 'N/A'}`);
          console.log(`     Trained: ${metadata.trainedAt || 'Unknown'}`);
        } catch (e) {
          console.log(`     (metadata not available)`);
        }
      }
    } catch (e) {
      console.log('\n⚠️  Could not read models directory');
    }

    // Feature importance
    if (mlIntegration.qualityPredictor?.metadata?.featureImportance) {
      console.log('\n🎯 Top 10 Features (by importance):');
      const topFeatures = mlIntegration.qualityPredictor.metadata.featureImportance
        .slice(0, 10)
        .map((item, idx) => {
          const name = item.name || item[0] || 'unknown';
          const importance = item.importance || item[1] || 0;
          return { name, importance, rank: idx + 1 };
        });

      topFeatures.forEach(f => {
        const bar = '█'.repeat(Math.floor(f.importance * 20));
        console.log(`   ${f.rank.toString().padStart(2)}. ${f.name.padEnd(20)} ${bar} ${f.importance.toFixed(3)}`);
      });
    }

    console.log('\n✅ Model comparison complete!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  compareModels();
}

module.exports = { compareModels };
