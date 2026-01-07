#!/usr/bin/env node

/**
 * Retrain Model with XGBoost
 * 
 * XGBoost often outperforms Random Forest for regression tasks
 * This script trains an XGBoost model for repository quality prediction
 */

const fs = require('fs-extra');
const path = require('path');
const { calculateNotableQuality } = require('./analyze-high-quality-repos');

const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
const MODELS_DIR = path.join(__dirname, '../.beast-mode/models');
const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data');

// Check if XGBoost is available
let XGBoost;
try {
  XGBoost = require('xgboost');
} catch (error) {
  console.error('❌ XGBoost not installed. Installing...');
  console.error('   Run: npm install xgboost');
  console.error('   Or use Python version: pip install xgboost');
  process.exit(1);
}

/**
 * Load all scanned repositories
 */
function loadAllScannedRepos() {
  const files = fs.readdirSync(SCANNED_DIR)
    .filter(f => f.startsWith('scanned-repos-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No scanned repository files found');
  }

  const allRepos = [];
  const seenRepos = new Set();

  for (const file of files) {
    const filePath = path.join(SCANNED_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const repos = data.trainingData || [];

    for (const repo of repos) {
      const repoKey = repo.repo || repo.url || JSON.stringify(repo.features || {});
      if (!seenRepos.has(repoKey)) {
        seenRepos.add(repoKey);
        allRepos.push(repo);
      }
    }
  }

  console.log(`✅ Loaded ${seenRepos.size} unique repositories from ${files.length} file(s)`);
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
  console.log('\n📊 Calculating quality labels...\n');
  
  const trainingData = repos.map(repo => {
    const normalizedFeatures = normalizeFeatures(repo);
    const normalizedRepo = { ...repo, features: normalizedFeatures };
    
    return {
      features: normalizedFeatures,
      quality: calculateNotableQuality(normalizedRepo),
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
 * Train XGBoost model
 */
async function trainXGBoostModel(X, y, featureNames) {
  console.log('🚀 Training XGBoost Model...\n');
  console.log(`   Training samples: ${X.length}`);
  console.log(`   Features: ${featureNames.length}`);
  console.log(`   Target range: [${Math.min(...y).toFixed(3)}, ${Math.max(...y).toFixed(3)}]\n`);

  // XGBoost parameters
  const params = {
    objective: 'reg:squarederror',
    max_depth: 6,
    learning_rate: 0.1,
    n_estimators: 100,
    subsample: 0.8,
    colsample_bytree: 0.8,
    min_child_weight: 1,
    gamma: 0,
    reg_alpha: 0,
    reg_lambda: 1,
    random_state: 42,
  };

  console.log('📊 XGBoost Parameters:');
  console.log(`   Max depth: ${params.max_depth}`);
  console.log(`   Learning rate: ${params.learning_rate}`);
  console.log(`   Estimators: ${params.n_estimators}`);
  console.log(`   Subsample: ${params.subsample}`);
  console.log(`   Colsample: ${params.colsample_bytree}\n`);

  try {
    // Note: XGBoost npm package may have different API
    // This is a placeholder - actual implementation depends on the package
    console.log('⚠️  Note: XGBoost npm package API may differ');
    console.log('   Consider using Python XGBoost via child_process\n');
    
    // For now, we'll create a model structure that can be trained with Python
    // or use a JavaScript XGBoost implementation
    const modelData = {
      algorithm: 'xgboost',
      parameters: params,
      featureNames: featureNames,
      trainingData: {
        X: X,
        y: y,
      },
      metadata: {
        trainedAt: new Date().toISOString(),
        datasetSize: X.length,
        featureCount: featureNames.length,
      }
    };

    return modelData;
  } catch (error) {
    console.error('❌ Error training XGBoost model:', error.message);
    throw error;
  }
}

/**
 * Evaluate model (placeholder - would need actual predictions)
 */
function evaluateModel(yTrue, yPred) {
  const n = yTrue.length;
  const mean = yTrue.reduce((a, b) => a + b, 0) / n;
  
  // Calculate metrics
  const ssRes = yTrue.reduce((sum, y, i) => sum + Math.pow(y - yPred[i], 2), 0);
  const ssTot = yTrue.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0);
  const r2 = 1 - (ssRes / ssTot);
  
  const mae = yTrue.reduce((sum, y, i) => sum + Math.abs(y - yPred[i]), 0) / n;
  const rmse = Math.sqrt(ssRes / n);

  return { r2, mae, rmse };
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Retraining ML Model with XGBoost\n');
  console.log('='.repeat(60));

  try {
    // Load data
    const repos = loadAllScannedRepos();
    const { X, y, featureNames, trainingData } = prepareTrainingData(repos);

    // Train model
    const modelData = await trainXGBoostModel(X, y, featureNames);

    // Note: Actual XGBoost training would happen here
    // For now, we'll save the model structure
    // In production, you'd train with Python XGBoost or use a JS implementation

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(MODELS_DIR, `model-xgboost-${timestamp}.json`);

    await fs.ensureDir(MODELS_DIR);
    await fs.writeJson(outputPath, modelData, { spaces: 2 });

    console.log('='.repeat(60));
    console.log('⚠️  Note: This is a model structure template.');
    console.log('   To actually train XGBoost:');
    console.log('   1. Use Python: python scripts/train_xgboost.py');
    console.log('   2. Or use a JavaScript XGBoost implementation');
    console.log('   3. Or use TensorFlow.js for neural network alternative\n');
    console.log(`💾 Model structure saved to: ${outputPath}\n`);
    console.log('✅ Model structure created!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

