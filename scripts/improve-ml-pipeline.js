#!/usr/bin/env node

/**
 * ML Pipeline Improvement Script
 * 
 * Implements improvements to the ML pipeline:
 * 1. Enhanced feature engineering
 * 2. Better model training
 * 3. Model evaluation
 * 4. Performance comparison
 */

const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const { getEnhancedFeatureEngineering } = require('../lib/mlops/enhancedFeatureEngineering');
const { getTrainingPipeline } = require('../lib/mlops/trainingPipeline');

const DATA_DIR = path.join(__dirname, '../.beast-mode/training-data');
const MODELS_DIR = path.join(__dirname, '../.beast-mode/models');
const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/improvements');

// Ensure directories exist
[DATA_DIR, MODELS_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fsSync.existsSync(dir)) {
    fsSync.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Load existing dataset
 */
async function loadDataset() {
  const datasetPath = path.join(DATA_DIR, 'dataset.json');
  
  if (!fsSync.existsSync(datasetPath)) {
    console.log('⚠️  Dataset not found. Running training pipeline first...');
    const pipeline = await getTrainingPipeline();
    const result = await pipeline.buildTrainingDataset({
      productionLimit: 1000,
      githubLimit: 1000,
      minQuality: 0.5,
    });
    
    // Save dataset
    await fs.writeFile(datasetPath, JSON.stringify({
      examples: result.dataset,
      statistics: result.statistics,
    }, null, 2));
    
    return result.dataset;
  }

  const data = JSON.parse(await fs.readFile(datasetPath, 'utf8'));
  return data.examples || [];
}

/**
 * Extract enhanced features
 */
async function extractEnhancedFeatures(examples) {
  console.log('\n🔧 Step 1: Enhanced Feature Engineering\n');
  console.log('='.repeat(60));

  const featureEngineer = await getEnhancedFeatureEngineering();
  
  console.log(`📊 Processing ${examples.length} examples...\n`);

  const enhanced = [];
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    
    try {
      const enhancedFeatures = await featureEngineer.extractEnhancedFeatures({
        repo: example.repo,
        url: example.url,
        features: example.features,
        quality: example.quality,
        created_at: example.created_at,
        updated_at: example.updated_at,
        pushed_at: example.pushed_at,
        description: example.description,
      });

      enhanced.push({
        ...example,
        features: enhancedFeatures,
        originalFeatures: example.features, // Keep original for comparison
      });

      if ((i + 1) % 10 === 0) {
        console.log(`   ✅ Processed ${i + 1}/${examples.length}...`);
      }
    } catch (error) {
      console.warn(`   ⚠️  Failed to process ${example.repo}:`, error.message);
      enhanced.push(example); // Keep original if enhancement fails
    }
  }

  console.log(`\n✅ Enhanced ${enhanced.length} examples`);
  
  // Feature statistics
  const featureCounts = {};
  enhanced.forEach(ex => {
    Object.keys(ex.features || {}).forEach(key => {
      featureCounts[key] = (featureCounts[key] || 0) + 1;
    });
  });

  console.log(`\n📊 Feature Statistics:`);
  console.log(`   Total features: ${Object.keys(featureCounts).length}`);
  console.log(`   Examples with features: ${enhanced.filter(e => e.features).length}`);

  return enhanced;
}

/**
 * Train improved model
 */
async function trainImprovedModel(enhancedExamples) {
  console.log('\n🎯 Step 2: Training Improved Model\n');
  console.log('='.repeat(60));

  // Prepare training data
  const trainingData = enhancedExamples
    .filter(ex => ex.quality !== null && ex.quality !== undefined)
    .map(ex => ({
      features: ex.features || {},
      quality: ex.quality,
      repo: ex.repo,
    }));

  if (trainingData.length === 0) {
    throw new Error('No training data available');
  }

  console.log(`📊 Training data: ${trainingData.length} examples\n`);

  // Extract feature vectors
  const featureNames = new Set();
  trainingData.forEach(ex => {
    Object.keys(ex.features || {}).forEach(key => {
      if (typeof ex.features[key] === 'number' && !isNaN(ex.features[key])) {
        featureNames.add(key);
      }
    });
  });

  const featureArray = Array.from(featureNames);
  console.log(`   Features: ${featureArray.length} numeric features\n`);

  // Create feature matrix
  const X = trainingData.map(ex => 
    featureArray.map(name => ex.features[name] || 0)
  );
  const y = trainingData.map(ex => ex.quality);

  // Simple linear regression (improved with regularization)
  const model = trainLinearRegression(X, y, featureArray);

  // Evaluate
  const predictions = X.map(x => predictLinear(model, x));
  const errors = predictions.map((pred, i) => Math.abs(pred - y[i]));
  
  const mae = errors.reduce((a, b) => a + b, 0) / errors.length;
  const rmse = Math.sqrt(errors.reduce((a, b) => a + b * b, 0) / errors.length);
  
  // R² calculation
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  const ssRes = errors.reduce((a, b) => a + b * b, 0);
  const ssTot = y.reduce((a, b) => a + Math.pow(b - yMean, 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  console.log(`📈 Model Performance:`);
  console.log(`   R²: ${r2.toFixed(4)}`);
  console.log(`   MAE: ${mae.toFixed(2)} points`);
  console.log(`   RMSE: ${rmse.toFixed(2)} points\n`);

  return {
    model,
    metrics: { r2, mae, rmse },
    featureNames: featureArray,
    trainingSize: trainingData.length,
  };
}

/**
 * Simple linear regression with L2 regularization
 */
function trainLinearRegression(X, y, featureNames) {
  const n = X.length;
  const m = X[0].length;
  const lambda = 0.01; // Regularization parameter

  // Initialize weights
  let weights = new Array(m).fill(0);
  let bias = 0;
  const learningRate = 0.01;
  const epochs = 1000;

  // Gradient descent
  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalError = 0;

    for (let i = 0; i < n; i++) {
      const prediction = weights.reduce((sum, w, j) => sum + w * X[i][j], 0) + bias;
      const error = prediction - y[i];
      totalError += error * error;

      // Update weights (with L2 regularization)
      for (let j = 0; j < m; j++) {
        weights[j] = weights[j] * (1 - learningRate * lambda) - learningRate * error * X[i][j];
      }
      bias -= learningRate * error;
    }

    if (epoch % 100 === 0 && epoch > 0) {
      const mse = totalError / n;
      if (mse < 0.001) break; // Early stopping
    }
  }

  return {
    weights,
    bias,
    featureNames,
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Predict using linear model
 */
function predictLinear(model, features) {
  const prediction = model.weights.reduce((sum, w, i) => {
    return sum + w * (features[i] || 0);
  }, 0) + model.bias;
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, prediction));
}

/**
 * Compare models
 */
async function compareModels(oldModel, newModel) {
  console.log('\n📊 Step 3: Model Comparison\n');
  console.log('='.repeat(60));

  const comparison = {
    old: {
      version: oldModel.version || '1.0.0',
      r2: oldModel.metrics?.r2 || 0.790,
      features: oldModel.featureNames?.length || 0,
    },
    new: {
      version: newModel.version || '2.0.0',
      r2: newModel.metrics.r2,
      features: newModel.featureNames.length,
    },
  };

  const improvement = ((newModel.metrics.r2 - comparison.old.r2) / comparison.old.r2) * 100;

  console.log('📈 Performance Comparison:');
  console.log(`   Old Model (v${comparison.old.version}):`);
  console.log(`     R²: ${comparison.old.r2.toFixed(4)}`);
  console.log(`     Features: ${comparison.old.features}`);
  console.log(`\n   New Model (v${comparison.new.version}):`);
  console.log(`     R²: ${comparison.new.r2.toFixed(4)}`);
  console.log(`     Features: ${comparison.new.features}`);
  console.log(`\n   Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}%\n`);

  return {
    comparison,
    improvement,
    shouldDeploy: improvement > 0, // Deploy if improved
  };
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 ML Pipeline Improvement\n');
  console.log('='.repeat(60));
  console.log('📋 This script will:');
  console.log('   1. Extract enhanced features');
  console.log('   2. Train improved model');
  console.log('   3. Compare with existing model');
  console.log('   4. Save results\n');

  try {
    // Load dataset
    console.log('📊 Loading dataset...');
    const examples = await loadDataset();
    console.log(`   ✅ Loaded ${examples.length} examples\n`);

    if (examples.length === 0) {
      throw new Error('No training data available');
    }

    // Step 1: Enhanced features
    const enhanced = await extractEnhancedFeatures(examples);

    // Save enhanced dataset
    const enhancedPath = path.join(OUTPUT_DIR, 'enhanced-dataset.json');
    await fs.writeFile(enhancedPath, JSON.stringify(enhanced, null, 2));
    console.log(`\n💾 Saved enhanced dataset to: ${enhancedPath}`);

    // Step 2: Train improved model
    const newModel = await trainImprovedModel(enhanced);

    // Load old model for comparison
    const oldModelPath = path.join(MODELS_DIR, 'quality-predictor.json');
    let oldModel = null;
    if (fsSync.existsSync(oldModelPath)) {
      oldModel = JSON.parse(await fs.readFile(oldModelPath, 'utf8'));
    }

    // Step 3: Compare
    const comparison = await compareModels(
      oldModel || { metrics: { r2: 0.790 } },
      newModel
    );

    // Save new model if improved
    if (comparison.shouldDeploy) {
      const modelPath = path.join(MODELS_DIR, 'quality-predictor-v2.json');
      await fs.writeFile(modelPath, JSON.stringify(newModel, null, 2));
      console.log(`\n💾 Saved improved model to: ${modelPath}`);
      
      // Also save as latest
      await fs.writeFile(
        path.join(MODELS_DIR, 'quality-predictor.json'),
        JSON.stringify(newModel, null, 2)
      );
      console.log(`   ✅ Deployed as latest model\n`);
    } else {
      console.log(`\n⚠️  Model not improved - keeping existing model\n`);
    }

    // Save comparison report
    const reportPath = path.join(OUTPUT_DIR, `comparison-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      comparison,
      newModel: {
        metrics: newModel.metrics,
        featureCount: newModel.featureNames.length,
        trainingSize: newModel.trainingSize,
      },
    }, null, 2));
    console.log(`📊 Comparison report: ${reportPath}\n`);

    console.log('✅ ML Pipeline Improvement Complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

