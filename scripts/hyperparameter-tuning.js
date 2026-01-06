#!/usr/bin/env node

/**
 * Hyperparameter Tuning for Random Forest Model
 * Tests different combinations of nTrees, maxDepth, and minSamplesSplit
 * 
 * Week 5: ML Model Improvements
 */

const fs = require('fs-extra');
const path = require('path');
const { calculateNotableQuality } = require('./analyze-high-quality-repos');

const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
const RESULTS_DIR = path.join(__dirname, '../.beast-mode/hyperparameter-results');
fs.ensureDirSync(RESULTS_DIR);

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
  }
  
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
    nTrees,
    maxDepth,
    minSamplesSplit,
    metrics: { r2, mae, rmse },
    predictions
  };
}

/**
 * Main function
 */
async function main() {
  console.log('🔬 Hyperparameter Tuning for Random Forest Model\n');
  console.log('='.repeat(60));
  console.log('Week 5: ML Model Improvements');
  console.log('='.repeat(60));

  // Load data
  const repos = loadAllScannedRepos();
  const { X_train, y_train, X_val, y_val, X_test, y_test } = prepareTrainingData(repos);

  // Baseline (current settings)
  console.log('\n📊 Baseline Model (Current Settings):');
  console.log('   nTrees: 50, maxDepth: 10, minSamplesSplit: 10\n');
  const baseline = trainRandomForest(X_train, y_train, X_val, y_val, {
    nTrees: 50,
    maxDepth: 10,
    minSamplesSplit: 10
  });
  console.log(`   R²: ${baseline.metrics.r2.toFixed(4)}`);
  console.log(`   MAE: ${baseline.metrics.mae.toFixed(4)}`);
  console.log(`   RMSE: ${baseline.metrics.rmse.toFixed(4)}\n`);

  // Test different hyperparameter combinations
  const experiments = [
    // Tree count variations
    { nTrees: 100, maxDepth: 10, minSamplesSplit: 10 },
    { nTrees: 200, maxDepth: 10, minSamplesSplit: 10 },
    
    // Max depth variations
    { nTrees: 50, maxDepth: 15, minSamplesSplit: 10 },
    { nTrees: 50, maxDepth: 20, minSamplesSplit: 10 },
    
    // Min samples split variations
    { nTrees: 50, maxDepth: 10, minSamplesSplit: 5 },
    { nTrees: 50, maxDepth: 10, minSamplesSplit: 20 },
    
    // Combined best (if we find improvements)
    { nTrees: 100, maxDepth: 15, minSamplesSplit: 10 },
    { nTrees: 200, maxDepth: 15, minSamplesSplit: 10 },
  ];

  console.log('🧪 Running Hyperparameter Experiments...\n');
  const results = [baseline];

  for (let i = 0; i < experiments.length; i++) {
    const exp = experiments[i];
    console.log(`\n${i + 1}/${experiments.length}. Testing: nTrees=${exp.nTrees}, maxDepth=${exp.maxDepth}, minSamplesSplit=${exp.minSamplesSplit}`);
    
    const result = trainRandomForest(X_train, y_train, X_val, y_val, exp);
    results.push(result);
    
    const r2Change = ((result.metrics.r2 - baseline.metrics.r2) / Math.abs(baseline.metrics.r2) * 100).toFixed(1);
    const maeChange = ((result.metrics.mae - baseline.metrics.mae) / baseline.metrics.mae * 100).toFixed(1);
    
    console.log(`   R²: ${result.metrics.r2.toFixed(4)} (${r2Change > 0 ? '+' : ''}${r2Change}%)`);
    console.log(`   MAE: ${result.metrics.mae.toFixed(4)} (${maeChange > 0 ? '+' : ''}${maeChange}%)`);
    console.log(`   RMSE: ${result.metrics.rmse.toFixed(4)}`);
  }

  // Find best model
  const bestModel = results.reduce((best, current) => {
    // Prioritize R², then MAE
    if (current.metrics.r2 > best.metrics.r2) return current;
    if (current.metrics.r2 === best.metrics.r2 && current.metrics.mae < best.metrics.mae) return current;
    return best;
  });

  console.log('\n' + '='.repeat(60));
  console.log('🏆 Best Model:');
  console.log(`   nTrees: ${bestModel.nTrees}`);
  console.log(`   maxDepth: ${bestModel.maxDepth}`);
  console.log(`   minSamplesSplit: ${bestModel.minSamplesSplit}`);
  console.log(`   R²: ${bestModel.metrics.r2.toFixed(4)}`);
  console.log(`   MAE: ${bestModel.metrics.mae.toFixed(4)}`);
  console.log(`   RMSE: ${bestModel.metrics.rmse.toFixed(4)}`);
  
  const r2Improvement = ((bestModel.metrics.r2 - baseline.metrics.r2) / Math.abs(baseline.metrics.r2) * 100).toFixed(1);
  const maeImprovement = ((bestModel.metrics.mae - baseline.metrics.mae) / baseline.metrics.mae * 100).toFixed(1);
  console.log(`\n   Improvement: R² ${r2Improvement > 0 ? '+' : ''}${r2Improvement}%, MAE ${maeImprovement > 0 ? '+' : ''}${maeImprovement}%`);
  console.log('='.repeat(60));

  // Save results
  const resultsFile = path.join(RESULTS_DIR, `hyperparameter-tuning-${Date.now()}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify({
    baseline,
    experiments: results.slice(1),
    bestModel,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${resultsFile}\n`);
}

main().catch(console.error);

