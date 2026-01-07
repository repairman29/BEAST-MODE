#!/usr/bin/env node

/**
 * Retrain Model with Normalized Features
 * 
 * Fixes negative R² by normalizing features before training
 * Complementary work while other agents add new data
 */

const fs = require('fs-extra');
const path = require('path');
const { calculateNotableQuality } = require('./analyze-high-quality-repos');

const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
const ENHANCED_DIR = path.join(__dirname, '../.beast-mode/training-data');
const MODELS_DIR = path.join(__dirname, '../.beast-mode/models');
fs.ensureDirSync(MODELS_DIR);

/**
 * Load enhanced features or scanned repos
 */
function loadData() {
  // Try enhanced features first
  const enhancedFiles = fs.readdirSync(ENHANCED_DIR)
    .filter(f => f.startsWith('enhanced-features-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (enhancedFiles.length > 0) {
    const latestFile = path.join(ENHANCED_DIR, enhancedFiles[0]);
    const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    console.log(`✅ Loaded enhanced features: ${enhancedFiles[0]} (${data.trainingData.length} repos)\n`);
    return data.trainingData;
  }

  // Fallback to scanned repos
  const scannedFiles = fs.readdirSync(SCANNED_DIR)
    .filter(f => f.startsWith('scanned-repos-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (scannedFiles.length === 0) {
    throw new Error('No training data found');
  }

  const allRepos = [];
  const seenRepos = new Set();

  for (const file of scannedFiles) {
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

  console.log(`✅ Loaded ${seenRepos.size} scanned repositories\n`);
  return allRepos;
}

/**
 * Normalize features
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
 * Prepare training data with normalization
 */
function prepareTrainingData(repos, normalize = true) {
  console.log('📊 Preparing training data...\n');
  
  const trainingData = repos.map(repo => {
    const normalizedFeatures = normalizeFeatures(repo);
    const normalizedRepo = { ...repo, features: normalizedFeatures };
    
    return {
      features: normalizedFeatures,
      quality: calculateNotableQuality(normalizedRepo),
      repo: repo.repo || repo.url,
    };
  });

  // Extract feature names
  const featureNames = Object.keys(trainingData[0].features).sort();
  console.log(`   ✅ ${featureNames.length} features\n`);

  // Convert to arrays
  let X = trainingData.map(d => featureNames.map(name => {
    const val = d.features[name];
    return typeof val === 'number' ? val : 0;
  }));
  const y = trainingData.map(d => d.quality);

  // Normalize features (min-max scaling to [0, 1])
  if (normalize) {
    console.log('🔧 Normalizing features (min-max scaling)...\n');
    const nFeatures = X[0].length;
    const mins = new Array(nFeatures).fill(Infinity);
    const maxs = new Array(nFeatures).fill(-Infinity);

    // Find min and max for each feature
    for (let i = 0; i < X.length; i++) {
      for (let j = 0; j < nFeatures; j++) {
        mins[j] = Math.min(mins[j], X[i][j]);
        maxs[j] = Math.max(maxs[j], X[i][j]);
      }
    }

    // Normalize
    X = X.map(row => row.map((val, idx) => {
      const range = maxs[idx] - mins[idx];
      return range > 0 ? (val - mins[idx]) / range : 0;
    }));

    console.log(`   ✅ Features normalized to [0, 1] range\n`);
  }

  // Split into train/val/test (70/15/15)
  const n = X.length;
  const trainEnd = Math.floor(n * 0.7);
  const valEnd = trainEnd + Math.floor(n * 0.15);

  const X_train = X.slice(0, trainEnd);
  const y_train = y.slice(0, trainEnd);
  const X_val = X.slice(trainEnd, valEnd);
  const y_val = y.slice(trainEnd, valEnd);
  const X_test = X.slice(valEnd);
  const y_test = y.slice(valEnd);

  console.log(`   ✅ Train: ${X_train.length}, Val: ${X_val.length}, Test: ${X_test.length}\n`);

  return { X_train, y_train, X_val, y_val, X_test, y_test, featureNames };
}

/**
 * Calculate variance
 */
function calculateVariance(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

/**
 * Train decision tree
 */
function trainDecisionTree(X, y, maxDepth, minSamplesSplit, depth = 0) {
  const n = X.length;
  
  if (depth >= maxDepth || n < minSamplesSplit) {
    const avg = y.reduce((a, b) => a + b, 0) / n;
    return { type: 'leaf', value: avg };
  }
  
  let bestSplit = null;
  let bestScore = Infinity;
  
  for (let featureIdx = 0; featureIdx < X[0].length; featureIdx++) {
    const values = X.map(row => row[featureIdx]).sort((a, b) => a - b);
    
    for (let i = 1; i < values.length; i++) {
      const threshold = (values[i - 1] + values[i]) / 2;
      
      const left = [];
      const right = [];
      
      for (let j = 0; j < n; j++) {
        if (X[j][featureIdx] <= threshold) {
          left.push(j);
        } else {
          right.push(j);
        }
      }
      
      if (left.length === 0 || right.length === 0) continue;
      
      const leftY = left.map(idx => y[idx]);
      const rightY = right.map(idx => y[idx]);
      
      const leftVar = calculateVariance(leftY);
      const rightVar = calculateVariance(rightY);
      const totalVar = calculateVariance(y);
      
      const score = totalVar - (left.length / n) * leftVar - (right.length / n) * rightVar;
      
      if (score < bestScore) {
        bestScore = score;
        bestSplit = { featureIdx, threshold, left, right };
      }
    }
  }
  
  if (!bestSplit) {
    const avg = y.reduce((a, b) => a + b, 0) / n;
    return { type: 'leaf', value: avg };
  }
  
  const leftX = bestSplit.left.map(idx => X[idx]);
  const leftY = bestSplit.left.map(idx => y[idx]);
  const rightX = bestSplit.right.map(idx => X[idx]);
  const rightY = bestSplit.right.map(idx => y[idx]);
  
  return {
    type: 'split',
    featureIdx: bestSplit.featureIdx,
    threshold: bestSplit.threshold,
    left: trainDecisionTree(leftX, leftY, maxDepth, minSamplesSplit, depth + 1),
    right: trainDecisionTree(rightX, rightY, maxDepth, minSamplesSplit, depth + 1)
  };
}

/**
 * Predict using tree
 */
function predictTree(tree, row) {
  if (tree.type === 'leaf') {
    return tree.value;
  }
  
  if (row[tree.featureIdx] <= tree.threshold) {
    return predictTree(tree.left, row);
  } else {
    return predictTree(tree.right, row);
  }
}

/**
 * Train Random Forest
 */
function trainRandomForest(X_train, y_train, X_val, y_val, options = {}) {
  const { nTrees = 50, maxDepth = 10, minSamplesSplit = 10 } = options;
  
  const n = X_train.length;
  const trees = [];
  
  for (let t = 0; t < nTrees; t++) {
    const sampleIndices = [];
    for (let i = 0; i < n; i++) {
      sampleIndices.push(Math.floor(Math.random() * n));
    }
    
    const XSample = sampleIndices.map(i => X_train[i]);
    const ySample = sampleIndices.map(i => y_train[i]);
    
    const tree = trainDecisionTree(XSample, ySample, maxDepth, minSamplesSplit);
    trees.push(tree);
    
    if ((t + 1) % 10 === 0) {
      process.stdout.write(`   ${t + 1}/${nTrees} trees...\r`);
    }
  }
  
  console.log(`   ✅ Trained ${nTrees} trees\n`);
  
  // Evaluate on validation set
  const predictions = X_val.map(row => {
    const treePredictions = trees.map(tree => predictTree(tree, row));
    return treePredictions.reduce((sum, p) => sum + p, 0) / trees.length;
  });
  
  const errors = y_val.map((actual, i) => actual - predictions[i]);
  const mae = errors.reduce((sum, e) => sum + Math.abs(e), 0) / y_val.length;
  const rmse = Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / y_val.length);
  
  const yMean = y_val.reduce((a, b) => a + b, 0) / y_val.length;
  const ssRes = errors.reduce((sum, e) => sum + e * e, 0);
  const ssTot = y_val.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : (ssRes === 0 ? 1 : -1);
  
  return {
    trees,
    metrics: { r2, mae, rmse },
    predictions
  };
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Retraining Model with Normalized Features\n');
  console.log('='.repeat(60));
  console.log('Complementary Work: Feature Normalization');
  console.log('='.repeat(60));

  const repos = loadData();
  const { X_train, y_train, X_val, y_val, X_test, y_test, featureNames } = prepareTrainingData(repos, true);

  // Baseline (non-normalized)
  console.log('📊 Baseline Model (Non-Normalized):');
  const { X_train: X_train_base, y_train: y_train_base, X_val: X_val_base, y_val: y_val_base } = prepareTrainingData(repos, false);
  console.log('   nTrees: 50, maxDepth: 10, minSamplesSplit: 10\n');
  const baseline = trainRandomForest(X_train_base, y_train_base, X_val_base, y_val_base, {
    nTrees: 50,
    maxDepth: 10,
    minSamplesSplit: 10
  });
  console.log(`   R²: ${baseline.metrics.r2.toFixed(4)}`);
  console.log(`   MAE: ${baseline.metrics.mae.toFixed(4)}`);
  console.log(`   RMSE: ${baseline.metrics.rmse.toFixed(4)}\n`);

  // Normalized model
  console.log('📊 Normalized Model:');
  console.log('   nTrees: 50, maxDepth: 10, minSamplesSplit: 10\n');
  const normalized = trainRandomForest(X_train, y_train, X_val, y_val, {
    nTrees: 50,
    maxDepth: 10,
    minSamplesSplit: 10
  });
  console.log(`   R²: ${normalized.metrics.r2.toFixed(4)}`);
  console.log(`   MAE: ${normalized.metrics.mae.toFixed(4)}`);
  console.log(`   RMSE: ${normalized.metrics.rmse.toFixed(4)}\n`);

  // Compare
  console.log('='.repeat(60));
  console.log('📊 Comparison:');
  const r2Change = ((normalized.metrics.r2 - baseline.metrics.r2) / Math.abs(baseline.metrics.r2) * 100).toFixed(1);
  const maeChange = ((normalized.metrics.mae - baseline.metrics.mae) / baseline.metrics.mae * 100).toFixed(1);
  const rmseChange = ((normalized.metrics.rmse - baseline.metrics.rmse) / baseline.metrics.rmse * 100).toFixed(1);
  
  console.log(`   R²: ${baseline.metrics.r2.toFixed(4)} → ${normalized.metrics.r2.toFixed(4)} (${r2Change > 0 ? '+' : ''}${r2Change}%)`);
  console.log(`   MAE: ${baseline.metrics.mae.toFixed(4)} → ${normalized.metrics.mae.toFixed(4)} (${maeChange > 0 ? '+' : ''}${maeChange}%)`);
  console.log(`   RMSE: ${baseline.metrics.rmse.toFixed(4)} → ${normalized.metrics.rmse.toFixed(4)} (${rmseChange > 0 ? '+' : ''}${rmseChange}%)`);
  console.log('='.repeat(60));

  // Test set evaluation
  console.log('\n📊 Evaluating Normalized Model on Test Set:');
  const testPredictions = X_test.map(row => {
    const treePredictions = normalized.trees.map(tree => predictTree(tree, row));
    return treePredictions.reduce((sum, p) => sum + p, 0) / normalized.trees.length;
  });
  
  const testErrors = y_test.map((actual, i) => actual - testPredictions[i]);
  const testMae = testErrors.reduce((sum, e) => sum + Math.abs(e), 0) / y_test.length;
  const testRmse = Math.sqrt(testErrors.reduce((sum, e) => sum + e * e, 0) / y_test.length);
  
  const testYMean = y_test.reduce((a, b) => a + b, 0) / y_test.length;
  const testSsRes = testErrors.reduce((sum, e) => sum + e * e, 0);
  const testSsTot = y_test.reduce((sum, val) => sum + Math.pow(val - testYMean, 2), 0);
  const testR2 = testSsTot > 0 ? 1 - (testSsRes / testSsTot) : (testSsRes === 0 ? 1 : -1);
  
  console.log(`   R²: ${testR2.toFixed(4)}`);
  console.log(`   MAE: ${testMae.toFixed(4)}`);
  console.log(`   RMSE: ${testRmse.toFixed(4)}\n`);

  // Save model
  const modelPath = path.join(MODELS_DIR, `normalized-model-${Date.now()}.json`);
  fs.writeFileSync(modelPath, JSON.stringify({
    model: {
      trees: normalized.trees,
      featureNames,
      options: { nTrees: 50, maxDepth: 10, minSamplesSplit: 10 },
      normalized: true
    },
    metrics: {
      validation: normalized.metrics,
      test: { r2: testR2, mae: testMae, rmse: testRmse }
    },
    comparison: {
      baseline: baseline.metrics,
      normalized: normalized.metrics,
      improvement: {
        r2: r2Change,
        mae: maeChange,
        rmse: rmseChange
      }
    },
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log(`💾 Model saved: ${modelPath}\n`);
  
  if (parseFloat(r2Change) > 0 || normalized.metrics.r2 > baseline.metrics.r2) {
    console.log('✅ Normalized model shows improvement!');
    if (normalized.metrics.r2 > 0) {
      console.log('🎉 R² is now positive - normalization fixed the issue!');
    }
  } else {
    console.log('⚠️  Normalization did not improve model. May need:');
    console.log('   - Different normalization method (standardization)');
    console.log('   - Feature selection');
    console.log('   - More training data');
  }
}

main().catch(console.error);

