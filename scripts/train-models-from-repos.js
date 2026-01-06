#!/usr/bin/env node

/**
 * Train ML Models from Repository Dataset
 * 
 * Trains quality prediction models using the repository scan data
 */

const fs = require('fs-extra');
const path = require('path');

const DATASET_PATH = path.join(__dirname, '../.beast-mode/training-data/dataset-split.json');

/**
 * Load dataset
 */
async function loadDataset() {
  try {
    const data = await fs.readJson(DATASET_PATH);
    return data;
  } catch (error) {
    console.error('❌ Error loading dataset:', error.message);
    console.log(`   Expected file: ${DATASET_PATH}`);
    process.exit(1);
  }
}

/**
 * Prepare features and labels
 */
function prepareTrainingData(examples) {
  const X = [];
  const y = [];

  for (const example of examples) {
    const features = example.features || {};
    
    // Extract numeric features
    const featureVector = [
      features.stars || 0,
      features.forks || 0,
      features.openIssues || 0,
      features.fileCount || 0,
      features.codeFileCount || 0,
      features.hasLicense || 0,
      features.hasDescription || 0,
      features.hasTopics || 0,
      features.hasReadme || 0,
      features.hasTests || 0,
      features.hasCI || 0,
      features.hasDocker || 0,
      features.hasConfig || 0,
      features.issues || 0,
      features.improvements || 0,
    ];

    X.push(featureVector);
    y.push(example.quality || features.qualityScore || 0);
  }

  return { X, y };
}

/**
 * Simple linear regression model
 */
class SimpleQualityPredictor {
  constructor() {
    this.weights = null;
    this.bias = 0;
  }

  train(X, y, options = {}) {
    const learningRate = options.learningRate || 0.01;
    const epochs = options.epochs || 100;
    const batchSize = options.batchSize || 32;

    const numFeatures = X[0].length;
    this.weights = new Array(numFeatures).fill(0);
    this.bias = 0;

    console.log(`  🎯 Training with ${X.length} examples, ${numFeatures} features...`);

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;

      // Mini-batch gradient descent
      for (let i = 0; i < X.length; i += batchSize) {
        const batchX = X.slice(i, i + batchSize);
        const batchY = y.slice(i, i + batchSize);

        for (let j = 0; j < batchX.length; j++) {
          const prediction = this.predict(batchX[j]);
          const error = batchY[j] - prediction;

          // Update weights
          for (let k = 0; k < this.weights.length; k++) {
            this.weights[k] += learningRate * error * batchX[j][k];
          }
          this.bias += learningRate * error;

          totalError += Math.abs(error);
        }
      }

      const avgError = totalError / X.length;
      if (epoch % 20 === 0 || epoch === epochs - 1) {
        console.log(`     Epoch ${epoch + 1}/${epochs}: MAE = ${avgError.toFixed(2)}`);
      }
    }

    return { success: true, weights: this.weights, bias: this.bias };
  }

  predict(features) {
    if (!this.weights) return 0;

    let prediction = this.bias;
    for (let i = 0; i < features.length; i++) {
      prediction += this.weights[i] * features[i];
    }

    // Clamp to 0-100 range
    return Math.max(0, Math.min(100, prediction));
  }

  evaluate(X, y) {
    let totalError = 0;
    let squaredError = 0;
    const predictions = [];

    for (let i = 0; i < X.length; i++) {
      const pred = this.predict(X[i]);
      const actual = y[i];
      const error = Math.abs(pred - actual);
      
      totalError += error;
      squaredError += error * error;
      predictions.push({ predicted: pred, actual: actual, error: error });
    }

    const mae = totalError / X.length;
    const mse = squaredError / X.length;
    const rmse = Math.sqrt(mse);

    // Calculate R²
    const meanY = y.reduce((a, b) => a + b, 0) / y.length;
    const ssRes = predictions.reduce((sum, p) => sum + Math.pow(p.actual - p.predicted, 2), 0);
    const ssTot = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    return {
      mae: mae.toFixed(2),
      mse: mse.toFixed(2),
      rmse: rmse.toFixed(2),
      r2: r2.toFixed(3),
      predictions: predictions.slice(0, 10), // Sample predictions
    };
  }

  save(modelPath) {
    const model = {
      weights: this.weights,
      bias: this.bias,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    fs.writeJsonSync(modelPath, model, { spaces: 2 });
    return modelPath;
  }
}

/**
 * Main training function
 */
async function main() {
  console.log('🤖 Training ML Models from Repository Dataset\n');
  console.log('='.repeat(60));

  // Load dataset
  console.log('📊 Loading dataset...');
  const dataset = await loadDataset();
  
  console.log(`  ✅ Training set: ${dataset.train.length} examples`);
  console.log(`  ✅ Validation set: ${dataset.val.length} examples`);
  console.log(`  ✅ Test set: ${dataset.test.length} examples\n`);

  if (dataset.train.length < 10) {
    console.log('⚠️  Not enough training data (need at least 10 examples)');
    process.exit(1);
  }

  // Prepare data
  console.log('🔧 Preparing training data...');
  const { X: X_train, y: y_train } = prepareTrainingData(dataset.train);
  const { X: X_val, y: y_val } = prepareTrainingData(dataset.val);
  const { X: X_test, y: y_test } = prepareTrainingData(dataset.test);

  console.log(`  ✅ Training: ${X_train.length} examples, ${X_train[0].length} features`);
  console.log(`  ✅ Validation: ${X_val.length} examples`);
  console.log(`  ✅ Test: ${X_test.length} examples\n`);

  // Train model
  console.log('🚀 Training Quality Predictor Model...\n');
  const model = new SimpleQualityPredictor();
  
  const trainResult = model.train(X_train, y_train, {
    learningRate: 0.001,
    epochs: 200,
    batchSize: 16,
  });

  if (!trainResult.success) {
    console.error('❌ Training failed');
    process.exit(1);
  }

  // Evaluate on validation set
  console.log('\n📊 Evaluating on validation set...');
  const valMetrics = model.evaluate(X_val, y_val);
  console.log(`  ✅ MAE: ${valMetrics.mae}`);
  console.log(`  ✅ RMSE: ${valMetrics.rmse}`);
  console.log(`  ✅ R²: ${valMetrics.r2}`);

  // Evaluate on test set
  console.log('\n📊 Evaluating on test set...');
  const testMetrics = model.evaluate(X_test, y_test);
  console.log(`  ✅ MAE: ${testMetrics.mae}`);
  console.log(`  ✅ RMSE: ${testMetrics.rmse}`);
  console.log(`  ✅ R²: ${testMetrics.r2}`);

  // Show sample predictions
  console.log('\n📋 Sample predictions:');
  testMetrics.predictions.slice(0, 5).forEach((p, i) => {
    console.log(`  ${i + 1}. Predicted: ${p.predicted.toFixed(1)}, Actual: ${p.actual.toFixed(1)}, Error: ${p.error.toFixed(1)}`);
  });

  // Save model
  const modelDir = path.join(__dirname, '../.beast-mode/models');
  fs.ensureDirSync(modelDir);
  const modelPath = path.join(modelDir, 'quality-predictor.json');
  model.save(modelPath);

  console.log(`\n✅ Model saved: ${modelPath}`);

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Training Complete!\n');
  console.log('📊 Model Performance:');
  console.log(`  Validation R²: ${valMetrics.r2}`);
  console.log(`  Test R²: ${testMetrics.r2}`);
  console.log(`  Test MAE: ${testMetrics.mae} points\n`);
  console.log('🎯 Model is ready to use in production!\n');
}

main().catch(console.error);

