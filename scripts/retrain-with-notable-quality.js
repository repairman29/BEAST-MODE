#!/usr/bin/env node

/**
 * Retrain Model with Notable Quality Calculation
 * 
 * Uses improved quality calculation from analyze-high-quality-repos.js
 * Combines all scanned repos and retrains with better labels
 */

const fs = require('fs-extra');
const path = require('path');
const { calculateNotableQuality } = require('./analyze-high-quality-repos');
const { calculateSimpleQuality, calculateHybridQuality } = require('./simple-quality-calculation');
const { loadScannedRepos } = require('../lib/mlops/loadTrainingData');

const MODELS_DIR = path.join(__dirname, '../.beast-mode/models');
fs.ensureDirSync(MODELS_DIR);

/**
 * Load all scanned repositories (Storage-first pattern)
 */
async function loadAllScannedRepos() {
  // Load from Storage (or local fallback)
  const repos = await loadScannedRepos({ fromStorage: true });
  
  if (repos.length === 0) {
    throw new Error('No scanned repository files found in Storage or local');
  }

  const allRepos = [];
  const seenRepos = new Set();
  let notableRepos = 0;
  let existingRepos = 0;

  for (const repo of repos) {
    const repoKey = repo.repo || repo.url || JSON.stringify(repo.features || {});
    if (!seenRepos.has(repoKey)) {
      seenRepos.add(repoKey);
      allRepos.push(repo);
      
      // Identify notable repos (have discoveredAt or originalStars from discovery)
      if (repo.discoveredAt || repo.originalStars) {
        notableRepos++;
      } else {
        existingRepos++;
      }
    }
  }

  console.log(`✅ Loaded ${seenRepos.size} unique repositories from Storage (or local fallback)`);
  if (notableRepos > 0 || existingRepos > 0) {
    console.log(`   📊 Notable repos: ${notableRepos}`);
    console.log(`   📊 Existing repos: ${existingRepos}`);
  }
  
  return allRepos;
}

/**
 * Normalize feature structure (handle nested metadata)
 */
function normalizeFeatures(repo) {
  const features = repo.features || {};
  
  // If features have a metadata property, extract and merge it
  if (features.metadata) {
    // Merge metadata into features, keeping other properties
    const normalized = { ...features.metadata, ...features };
    delete normalized.metadata; // Remove the nested metadata
    return normalized;
  }
  
  return features;
}

/**
 * Prepare training data with improved quality labels
 */
function prepareTrainingData(repos) {
  console.log('\n📊 Calculating quality labels with improved algorithm...\n');
  
  const trainingData = repos.map(repo => {
    // Normalize features structure
    const normalizedFeatures = normalizeFeatures(repo);
    const normalizedRepo = { ...repo, features: normalizedFeatures };
    
    return {
      features: normalizedFeatures,
      quality: calculateNotableQuality(normalizedRepo),
      repo: repo.repo || repo.url,
    };
  });

  // Quality distribution
  const qualities = trainingData.map(d => d.quality);
  const mean = qualities.reduce((a, b) => a + b, 0) / qualities.length;
  const std = Math.sqrt(qualities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / qualities.length);
  const min = Math.min(...qualities);
  const max = Math.max(...qualities);
  
  // Quality buckets for better understanding
  const highQuality = qualities.filter(q => q >= 0.7).length;
  const mediumQuality = qualities.filter(q => q >= 0.4 && q < 0.7).length;
  const lowQuality = qualities.filter(q => q < 0.4).length;

  console.log('📊 Quality Label Distribution:');
  console.log(`   Min: ${min.toFixed(3)}`);
  console.log(`   Max: ${max.toFixed(3)}`);
  console.log(`   Mean: ${mean.toFixed(3)}`);
  console.log(`   Std Dev: ${std.toFixed(3)}`);
  console.log(`   Variance: ${(std * std).toFixed(3)}`);
  console.log(`\n   Quality Buckets:`);
  console.log(`   ⭐ High (≥0.7): ${highQuality} (${((highQuality / qualities.length) * 100).toFixed(1)}%)`);
  console.log(`   📊 Medium (0.4-0.7): ${mediumQuality} (${((mediumQuality / qualities.length) * 100).toFixed(1)}%)`);
  console.log(`   📉 Low (<0.4): ${lowQuality} (${((lowQuality / qualities.length) * 100).toFixed(1)}%)\n`);

  // Extract features
  const featureNames = new Set();
  trainingData.forEach(ex => {
    Object.keys(ex.features || {}).forEach(key => {
      if (typeof ex.features[key] === 'number' && !isNaN(ex.features[key])) {
        featureNames.add(key);
      }
    });
  });

  const featureArray = Array.from(featureNames);
  const X = trainingData.map(ex => featureArray.map(name => ex.features[name] || 0));
  const y = trainingData.map(ex => ex.quality);

  return { 
    X, 
    y, 
    featureNames: featureArray, 
    trainingData,
    qualityStats: { mean, std, min, max, variance: std * std }
  };
}

/**
 * Train Random Forest (simplified)
 */
function trainRandomForest(X, y, featureNames, options = {}) {
  const { nTrees = 50, maxDepth = 10, minSamplesSplit = 10 } = options;
  
  console.log(`\n🌲 Training Random Forest (${nTrees} trees, max depth ${maxDepth})...\n`);
  
  const n = X.length;
  const m = X[0].length;
  const trees = [];
  
  for (let t = 0; t < nTrees; t++) {
    // Bootstrap sample
    const sampleIndices = [];
    for (let i = 0; i < n; i++) {
      sampleIndices.push(Math.floor(Math.random() * n));
    }
    
    const XSample = sampleIndices.map(i => X[i]);
    const ySample = sampleIndices.map(i => y[i]);
    
    // Train a simple decision tree
    const tree = trainDecisionTree(XSample, ySample, maxDepth, minSamplesSplit);
    trees.push(tree);
    
    if ((t + 1) % 10 === 0) {
      process.stdout.write(`   ${t + 1}/${nTrees} trees...\r`);
    }
  }
  
  console.log(`   ✅ Trained ${nTrees} trees\n`);
  
  // Predictions (average of all trees)
  const predictions = X.map((row, i) => {
    const treePredictions = trees.map(tree => predictTree(tree, row));
    return treePredictions.reduce((sum, p) => sum + p, 0) / trees.length;
  });
  
  // Calculate metrics
  const errors = y.map((actual, i) => actual - predictions[i]);
  const mae = errors.reduce((sum, e) => sum + Math.abs(e), 0) / n;
  const rmse = Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / n);
  
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  const ssRes = errors.reduce((sum, e) => sum + e * e, 0);
  const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : (ssRes === 0 ? 1 : -1);
  
  // Feature importance
  const featureImportance = calculateFeatureImportance(trees, m);
  
  return {
    algorithm: 'Random Forest',
    trees,
    metrics: { r2, mae, rmse },
    featureImportance,
    predictions
  };
}

/**
 * Simplified decision tree training
 */
function trainDecisionTree(X, y, maxDepth, minSamplesSplit, depth = 0) {
  const n = X.length;
  
  // Base cases
  if (depth >= maxDepth || n < minSamplesSplit) {
    const avg = y.reduce((a, b) => a + b, 0) / n;
    return { type: 'leaf', value: avg };
  }
  
  // Find best split
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
      
      // Calculate variance reduction
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
  
  // Recursively build left and right subtrees
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
 * Predict using decision tree
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
 * Calculate variance
 */
function calculateVariance(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

/**
 * Calculate feature importance
 */
function calculateFeatureImportance(trees, numFeatures) {
  const featureCounts = new Array(numFeatures).fill(0);
  
  trees.forEach(tree => {
    countFeatures(tree, featureCounts);
  });
  
  const total = featureCounts.reduce((a, b) => a + b, 0);
  return featureCounts.map(count => total > 0 ? count / total : 0);
}

function countFeatures(tree, counts) {
  if (tree.type === 'split') {
    counts[tree.featureIdx]++;
    countFeatures(tree.left, counts);
    countFeatures(tree.right, counts);
  }
}

/**
 * Main training function
 */
async function retrainModel() {
  console.log('🚀 Retraining ML Model with Notable Quality Calculation\n');
  console.log('='.repeat(60));
  
  // Load all repos
  const repos = await loadAllScannedRepos();
  
  // Dataset statistics
  const avgStars = repos.reduce((sum, r) => sum + ((r.features || {}).stars || 0), 0) / repos.length;
  const maxStars = Math.max(...repos.map(r => (r.features || {}).stars || 0));
  const reposWithTests = repos.filter(r => (r.features || {}).hasTests).length;
  const reposWithCI = repos.filter(r => (r.features || {}).hasCI).length;
  
  console.log(`\n📊 Dataset Statistics:`);
  console.log(`   Total repositories: ${repos.length}`);
  console.log(`   Average stars: ${Math.round(avgStars).toLocaleString()}`);
  console.log(`   Max stars: ${maxStars.toLocaleString()}`);
  console.log(`   Repos with tests: ${reposWithTests} (${((reposWithTests / repos.length) * 100).toFixed(1)}%)`);
  console.log(`   Repos with CI: ${reposWithCI} (${((reposWithCI / repos.length) * 100).toFixed(1)}%)\n`);
  
  // Prepare training data
  const { X, y, featureNames, trainingData, qualityStats } = prepareTrainingData(repos);
  
  console.log(`📊 Training Configuration:`);
  console.log(`   Features: ${featureNames.length}`);
  console.log(`   Training samples: ${X.length}`);
  console.log(`   Quality calculation: calculateNotableQuality()\n`);
  
  // Train Random Forest
  const model = trainRandomForest(X, y, featureNames, { 
    nTrees: 50, 
    maxDepth: 10, 
    minSamplesSplit: 10 
  });
  
  console.log('📊 Model Performance:\n');
  console.log(`   R²: ${model.metrics.r2.toFixed(3)} ${model.metrics.r2 > 0.5 ? '✅' : model.metrics.r2 > 0 ? '⚠️' : '❌'}`);
  console.log(`   MAE: ${model.metrics.mae.toFixed(3)} ${model.metrics.mae < 0.2 ? '✅' : model.metrics.mae < 0.3 ? '⚠️' : '❌'}`);
  console.log(`   RMSE: ${model.metrics.rmse.toFixed(3)} ${model.metrics.rmse < 0.25 ? '✅' : model.metrics.rmse < 0.35 ? '⚠️' : '❌'}\n`);
  
  // Feature importance
  const importancePairs = model.featureImportance.map((imp, i) => ({
    name: featureNames[i],
    importance: imp
  }));
  importancePairs.sort((a, b) => b.importance - a.importance);
  
  console.log('🔍 Top 10 Features by Importance:\n');
  importancePairs.slice(0, 10).forEach((item, i) => {
    console.log(`   ${(i + 1).toString().padStart(2)}. ${item.name.padEnd(25)} ${(item.importance * 100).toFixed(2)}%`);
  });
  
  // Save model
  const modelPath = path.join(MODELS_DIR, `model-notable-quality-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`);
  fs.writeFileSync(modelPath, JSON.stringify({
    algorithm: model.algorithm,
    metrics: model.metrics,
    featureImportance: importancePairs,
    featureNames: featureNames,
    qualityStats,
    trainedAt: new Date().toISOString(),
    datasetSize: repos.length,
    model: model // Save simplified model (trees)
  }, null, 2));
  
  console.log(`\n💾 Model saved to: ${modelPath}\n`);
  
  // Performance summary
  console.log('='.repeat(60));
  if (model.metrics.r2 > 0.5) {
    console.log('✅ Excellent! Model shows strong predictive power (R² > 0.5)');
  } else if (model.metrics.r2 > 0) {
    console.log('✅ Good! Model performance improved! R² is now positive.');
  } else {
    console.log('⚠️  Model R² is still negative. Consider:');
    console.log('   - Collecting more training data (especially high-quality examples)');
    console.log('   - Improving feature engineering');
    console.log('   - Collecting real quality labels from users');
    console.log('   - Waiting for notable repo scanning to complete');
  }
  
  if (model.metrics.mae < 0.2) {
    console.log('✅ Low prediction error (MAE < 0.2)');
  }
  
  console.log(`\n💾 Model saved to: ${modelPath}`);
  console.log('='.repeat(60));
  
  return model;
}

if (require.main === module) {
  retrainModel()
    .then(() => {
      console.log('✅ Retraining complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { retrainModel };

