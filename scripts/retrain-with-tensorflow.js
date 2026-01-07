#!/usr/bin/env node

/**
 * Retrain Model with TensorFlow.js
 * 
 * Neural network approach for repository quality prediction
 * Often better at learning complex patterns than tree-based models
 */

const fs = require('fs-extra');
const path = require('path');
const { calculateHybridQuality } = require('./simple-quality-calculation');
const { loadScannedRepos } = require('../lib/mlops/loadTrainingData');

// Check if TensorFlow.js is available
let tf;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (error) {
  console.error('❌ TensorFlow.js not installed.');
  console.error('   Run: npm install @tensorflow/tfjs-node');
  console.error('   Or: npm install @tensorflow/tfjs (CPU only, slower)');
  process.exit(1);
}

const MODELS_DIR = path.join(__dirname, '../.beast-mode/models');
fs.ensureDirSync(MODELS_DIR);

/**
 * Load all scanned repositories (Storage-first pattern)
 */
async function loadAllScannedRepos() {
  const repos = await loadScannedRepos({ fromStorage: true });
  
  if (repos.length === 0) {
    throw new Error('No scanned repository files found in Storage or local');
  }

  const allRepos = [];
  const seenRepos = new Set();

  for (const repo of repos) {
    const repoKey = repo.repo || repo.url || JSON.stringify(repo.features || {});
    if (!seenRepos.has(repoKey)) {
      seenRepos.add(repoKey);
      allRepos.push(repo);
    }
  }

  console.log(`✅ Loaded ${seenRepos.size} unique repositories from Storage (or local fallback)`);
  return allRepos;
}

/**
 * Normalize feature structure
 */
function normalizeFeatures(repo) {
  const features = repo.features || {};
  if (features.metadata) {
    const normalized = { ...features.metadata, ...features };
    delete normalized.metadata;
    return normalized;
  }
  return features;
}

/**
 * Prepare training data
 */
function prepareTrainingData(repos) {
  console.log('\n📊 Calculating quality labels with hybrid algorithm...\n');
  
  const trainingData = repos.map(repo => {
    const normalizedFeatures = normalizeFeatures(repo);
    const normalizedRepo = { ...repo, features: normalizedFeatures };
    
    return {
      features: normalizedFeatures,
      quality: calculateHybridQuality(normalizedRepo),
      repo: repo.repo || repo.url,
    };
  }).filter(d => !isNaN(d.quality) && d.quality >= 0);

  // Quality distribution
  const qualities = trainingData.map(d => d.quality);
  const mean = qualities.reduce((a, b) => a + b, 0) / qualities.length;
  const std = Math.sqrt(qualities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / qualities.length);
  
  console.log('📊 Quality Label Distribution:');
  console.log(`   Min: ${Math.min(...qualities).toFixed(3)}`);
  console.log(`   Max: ${Math.max(...qualities).toFixed(3)}`);
  console.log(`   Mean: ${mean.toFixed(3)}`);
  console.log(`   Std Dev: ${std.toFixed(3)}`);
  console.log(`   Variance: ${(std * std).toFixed(3)}\n`);

  // Extract features
  const featureNames = new Set();
  trainingData.forEach(ex => {
    Object.keys(ex.features || {}).forEach(key => {
      if (typeof ex.features[key] === 'number' && !isNaN(ex.features[key])) {
        featureNames.add(key);
      }
    });
  });

  const featureArray = Array.from(featureNames).sort();
  const X = trainingData.map(ex => featureArray.map(name => ex.features[name] || 0));
  const y = trainingData.map(ex => ex.quality);

  return { X, y, featureNames: featureArray, trainingData };
}

/**
 * Normalize features (zero mean, unit variance)
 */
function normalizeFeaturesArray(X) {
  const n = X[0].length;
  const means = new Array(n).fill(0);
  const stds = new Array(n).fill(0);
  
  // Calculate means
  X.forEach(row => {
    row.forEach((val, i) => {
      means[i] += val;
    });
  });
  means.forEach((mean, i) => means[i] = mean / X.length);
  
  // Calculate standard deviations
  X.forEach(row => {
    row.forEach((val, i) => {
      stds[i] += Math.pow(val - means[i], 2);
    });
  });
  stds.forEach((std, i) => stds[i] = Math.sqrt(std / X.length) || 1);
  
  // Normalize
  const normalized = X.map(row => 
    row.map((val, i) => (val - means[i]) / stds[i])
  );
  
  return { normalized, means, stds };
}

/**
 * Create neural network model
 */
function createModel(inputSize) {
  const model = tf.sequential({
    layers: [
      // Input layer
      tf.layers.dense({
        inputShape: [inputSize],
        units: 128,
        activation: 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
      }),
      tf.layers.dropout({ rate: 0.3 }),
      
      // Hidden layer 1
      tf.layers.dense({
        units: 64,
        activation: 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
      }),
      tf.layers.dropout({ rate: 0.2 }),
      
      // Hidden layer 2
      tf.layers.dense({
        units: 32,
        activation: 'relu'
      }),
      
      // Output layer (single value for regression)
      tf.layers.dense({
        units: 1,
        activation: 'linear' // Linear for regression
      })
    ]
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
    // Note: metrics removed - TensorFlow.js API may differ
  });

  return model;
}

/**
 * Train neural network
 */
async function trainNeuralNetwork(X, y, featureNames) {
  console.log('🧠 Training Neural Network Model...\n');
  console.log(`   Training samples: ${X.length}`);
  console.log(`   Features: ${featureNames.length}`);
  console.log(`   Target range: [${Math.min(...y).toFixed(3)}, ${Math.max(...y).toFixed(3)}]\n`);

  // Normalize features
  const { normalized: XNorm, means, stds } = normalizeFeaturesArray(X);
  const XTensor = tf.tensor2d(XNorm);
  const yTensor = tf.tensor1d(y);

  // Create model
  const model = createModel(featureNames.length);
  
  console.log('📊 Model Architecture:');
  model.summary();
  console.log('');

  // Train model
  console.log('🔄 Training...\n');
  const history = await model.fit(XTensor, yTensor, {
    epochs: 100,
    batchSize: 32,
    validationSplit: 0.2,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 10 === 0 || epoch === 0) {
          console.log(`   Epoch ${epoch + 1}/100 - loss: ${logs.loss.toFixed(4)}, val_loss: ${logs.val_loss.toFixed(4)}`);
        }
      }
    }
  });

  // Evaluate on full dataset
  const predictions = model.predict(XTensor);
  const predArray = await predictions.data();
  const yPred = Array.from(predArray);
  
  // Calculate metrics
  const n = y.length;
  const mean = y.reduce((a, b) => a + b, 0) / n;
  const ssRes = y.reduce((sum, yTrue, i) => sum + Math.pow(yTrue - yPred[i], 2), 0);
  const ssTot = y.reduce((sum, yTrue) => sum + Math.pow(yTrue - mean, 2), 0);
  const r2 = 1 - (ssRes / ssTot);
  const mae = y.reduce((sum, yTrue, i) => sum + Math.abs(yTrue - yPred[i]), 0) / n;
  const rmse = Math.sqrt(ssRes / n);

  // Cleanup
  XTensor.dispose();
  yTensor.dispose();
  predictions.dispose();

  return {
    model,
    metrics: { r2, mae, rmse },
    featureNames,
    normalization: { means, stds },
    history: history.history
  };
}

/**
 * Save model
 */
async function saveModel(trainedModel, outputPath) {
  // Save model architecture and weights
  await trainedModel.model.save(`file://${outputPath}`);
  
  // Save metadata
  const metadataPath = outputPath.replace('/model.json', '/model-metadata.json');
  await fs.writeJson(metadataPath, {
    algorithm: 'neural-network',
    metrics: trainedModel.metrics,
    featureNames: trainedModel.featureNames,
    normalization: trainedModel.normalization,
    trainedAt: new Date().toISOString(),
  }, { spaces: 2 });
  
  return { modelPath: outputPath, metadataPath };
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Retraining ML Model with TensorFlow.js Neural Network\n');
  console.log('='.repeat(60));

  try {
    // Load data
    const repos = await loadAllScannedRepos();
    const { X, y, featureNames, trainingData } = prepareTrainingData(repos);

    // Train model
    const trainedModel = await trainNeuralNetwork(X, y, featureNames);

    // Display results
    console.log('📊 Model Performance:\n');
    console.log(`   R²: ${trainedModel.metrics.r2.toFixed(3)} ${trainedModel.metrics.r2 > 0.5 ? '✅' : trainedModel.metrics.r2 > 0.1 ? '⚠️' : '❌'}`);
    console.log(`   MAE: ${trainedModel.metrics.mae.toFixed(3)} ${trainedModel.metrics.mae < 0.2 ? '✅' : trainedModel.metrics.mae < 0.3 ? '⚠️' : '❌'}`);
    console.log(`   RMSE: ${trainedModel.metrics.rmse.toFixed(3)} ${trainedModel.metrics.rmse < 0.25 ? '✅' : trainedModel.metrics.rmse < 0.35 ? '⚠️' : '❌'}\n`);

    // Save model
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const modelDir = path.join(MODELS_DIR, `model-neural-network-${timestamp}`);
    await fs.ensureDir(modelDir);
    
    const { modelPath, metadataPath } = await saveModel(trainedModel, modelDir);
    
    console.log(`💾 Model saved to: ${modelPath}`);
    console.log(`💾 Metadata saved to: ${metadataPath}\n`);

    // Performance summary
    console.log('='.repeat(60));
    if (trainedModel.metrics.r2 > 0.5) {
      console.log('✅ Excellent! Model shows strong predictive power (R² > 0.5)');
    } else if (trainedModel.metrics.r2 > 0.1) {
      console.log('✅ Good! Model is learning (R² > 0.1)');
    } else {
      console.log('⚠️  Model R² is still low. Consider:');
      console.log('   - More training epochs');
      console.log('   - Different architecture');
      console.log('   - More/better features');
      console.log('   - Different quality labels');
    }
    
    console.log('='.repeat(60));
    console.log('✅ Retraining complete!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { trainNeuralNetwork, createModel };

