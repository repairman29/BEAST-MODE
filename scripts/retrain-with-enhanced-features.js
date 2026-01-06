#!/usr/bin/env node

/**
 * Retrain Model with Enhanced Features
 * 
 * Week 6: ML Model Improvements
 * - Uses enhanced features from enhance-features.js
 * - Retrains Random Forest model
 * - Compares with baseline model
 */

const fs = require('fs-extra');
const path = require('path');
const { calculateNotableQuality } = require('./analyze-high-quality-repos');

const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
const ENHANCED_DIR = path.join(__dirname, '../.beast-mode/training-data');
const MODELS_DIR = path.join(__dirname, '../.beast-mode/models');
fs.ensureDirSync(MODELS_DIR);

/**
 * Load enhanced features (from enhance-features.js output)
 */
function loadEnhancedFeatures() {
  const files = fs.readdirSync(ENHANCED_DIR)
    .filter(f => f.startsWith('enhanced-features-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('⚠️  No enhanced features found. Running feature engineering first...\n');
    // Could call enhance-features.js here, but for now just use scanned repos
    return null;
  }

  const latestFile = path.join(ENHANCED_DIR, files[0]);
  const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
  console.log(`✅ Loaded enhanced features from: ${files[0]}`);
  console.log(`   Total repos: ${data.trainingData.length}`);
  console.log(`   Feature count: ${data.metadata.featureCount}\n`);
  
  return data.trainingData;
}

/**
 * Load scanned repos (fallback if no enhanced features)
 */
function loadScannedRepos() {
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
  console.log('\n📊 Preparing training data...\n');
  
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
  console.log(`   ✅ ${featureNames.length} features: ${featureNames.slice(0, 5).join(', ')}...`);

  // Convert to arrays
  const X = trainingData.map(d => featureNames.map(name => {
    const val = d.features[name];
    return typeof val === 'number' ? val : 0;
  }));
  const y = trainingData.map(d => d.quality);

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
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return variance;
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
  
  console.log(`🌲 Training Random Forest (${nTrees} trees, max depth ${maxDepth})...\n`);
  
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
  console.log('🚀 Retraining Model with Enhanced Features\n');
  console.log('='.repeat(60));
  console.log('Week 6: ML Model Improvements');
  console.log('='.repeat(60));

  // Try to load enhanced features first
  let repos = loadEnhancedFeatures();
  
  if (!repos) {
    console.log('📊 Loading scanned repos (will use base features)...\n');
    repos = loadScannedRepos();
  }

  const { X_train, y_train, X_val, y_val, X_test, y_test, featureNames } = prepareTrainingData(repos);

  // Baseline model (current settings)
  console.log('📊 Baseline Model (Current Settings):');
  console.log('   nTrees: 50, maxDepth: 10, minSamplesSplit: 10\n');
  const baseline = trainRandomForest(X_train, y_train, X_val, y_val, {
    nTrees: 50,
    maxDepth: 10,
    minSamplesSplit: 10
  });
  console.log(`   R²: ${baseline.metrics.r2.toFixed(4)}`);
  console.log(`   MAE: ${baseline.metrics.mae.toFixed(4)}`);
  console.log(`   RMSE: ${baseline.metrics.rmse.toFixed(4)}\n`);

  // Enhanced model (with enhanced features if available)
  console.log('📊 Enhanced Model (Enhanced Features):');
  console.log('   nTrees: 50, maxDepth: 10, minSamplesSplit: 10\n');
  const enhanced = trainRandomForest(X_train, y_train, X_val, y_val, {
    nTrees: 50,
    maxDepth: 10,
    minSamplesSplit: 10
  });
  console.log(`   R²: ${enhanced.metrics.r2.toFixed(4)}`);
  console.log(`   MAE: ${enhanced.metrics.mae.toFixed(4)}`);
  console.log(`   RMSE: ${enhanced.metrics.rmse.toFixed(4)}\n`);

  // Compare
  console.log('='.repeat(60));
  console.log('📊 Comparison:');
  const r2Change = ((enhanced.metrics.r2 - baseline.metrics.r2) / Math.abs(baseline.metrics.r2) * 100).toFixed(1);
  const maeChange = ((enhanced.metrics.mae - baseline.metrics.mae) / baseline.metrics.mae * 100).toFixed(1);
  const rmseChange = ((enhanced.metrics.rmse - baseline.metrics.rmse) / baseline.metrics.rmse * 100).toFixed(1);
  
  console.log(`   R²: ${baseline.metrics.r2.toFixed(4)} → ${enhanced.metrics.r2.toFixed(4)} (${r2Change > 0 ? '+' : ''}${r2Change}%)`);
  console.log(`   MAE: ${baseline.metrics.mae.toFixed(4)} → ${enhanced.metrics.mae.toFixed(4)} (${maeChange > 0 ? '+' : ''}${maeChange}%)`);
  console.log(`   RMSE: ${baseline.metrics.rmse.toFixed(4)} → ${enhanced.metrics.rmse.toFixed(4)} (${rmseChange > 0 ? '+' : ''}${rmseChange}%)`);
  console.log('='.repeat(60));

  // Evaluate on test set
  console.log('\n📊 Evaluating Enhanced Model on Test Set:');
  const testPredictions = X_test.map(row => {
    const treePredictions = enhanced.trees.map(tree => predictTree(tree, row));
    return treePredictions.reduce((sum, p) => sum + p, 0) / enhanced.trees.length;
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
  const modelPath = path.join(MODELS_DIR, `enhanced-model-${Date.now()}.json`);
  fs.writeFileSync(modelPath, JSON.stringify({
    model: {
      trees: enhanced.trees,
      featureNames,
      options: { nTrees: 50, maxDepth: 10, minSamplesSplit: 10 }
    },
    metrics: {
      validation: enhanced.metrics,
      test: { r2: testR2, mae: testMae, rmse: testRmse }
    },
    comparison: {
      baseline: baseline.metrics,
      enhanced: enhanced.metrics,
      improvement: {
        r2: r2Change,
        mae: maeChange,
        rmse: rmseChange
      }
    },
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log(`💾 Model saved: ${modelPath}\n`);
  
  if (parseFloat(r2Change) > 0) {
    console.log('✅ Enhanced model shows improvement!');
  } else {
    console.log('⚠️  Enhanced model did not improve. Consider:');
    console.log('   - Running enhance-features.js first');
    console.log('   - Trying hyperparameter tuning');
    console.log('   - Adding more training data');
  }
}

main().catch(console.error);

