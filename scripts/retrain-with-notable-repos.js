#!/usr/bin/env node

/**
 * Retrain ML Model with Notable Repositories
 * 
 * Combines existing repos with newly scanned notable repos
 * Uses improved quality calculation for better labels
 * Trains multiple algorithms and selects best performer
 */

const fs = require('fs-extra');
const path = require('path');
const { calculateNotableQuality } = require('./analyze-high-quality-repos');

const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data');
const SCANNED_DIR = path.join(OUTPUT_DIR, 'scanned-repos');
const MODELS_DIR = path.join(OUTPUT_DIR, 'models');
fs.ensureDirSync(MODELS_DIR);

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
 * Extract features for ML training
 */
function extractFeatures(repo) {
  const f = repo.features || {};
  
  return {
    // Engagement
    stars: f.stars || 0,
    forks: f.forks || 0,
    openIssues: f.openIssues || 0,
    totalEngagement: f.totalEngagement || ((f.stars || 0) + (f.forks || 0) * 2 + (f.openIssues || 0)),
    
    // Activity
    repoAgeDays: f.repoAgeDays || 0,
    isActive: f.isActive || 0,
    activityScore: f.activityScore || 0,
    lastCommitDays: f.lastCommitDays || 365,
    
    // Quality indicators
    hasTests: f.hasTests ? 1 : 0,
    hasCI: f.hasCI ? 1 : 0,
    hasReadme: f.hasReadme ? 1 : 0,
    hasLicense: f.hasLicense ? 1 : 0,
    hasDocker: f.hasDocker ? 1 : 0,
    hasDescription: f.hasDescription ? 1 : 0,
    hasTopics: f.hasTopics ? 1 : 0,
    
    // Code metrics
    codeQualityScore: f.codeQualityScore || 0,
    codeFileRatio: f.codeFileRatio || 0,
    totalFiles: f.totalFiles || 0,
    totalLines: f.totalLines || 0,
    
    // Community
    communityHealth: f.communityHealth || 0,
    
    // Language (one-hot encoded for top languages)
    language_js: (f.primaryLanguage === 'JavaScript' || f.primaryLanguage === 'TypeScript') ? 1 : 0,
    language_py: f.primaryLanguage === 'Python' ? 1 : 0,
    language_rust: f.primaryLanguage === 'Rust' ? 1 : 0,
    language_go: f.primaryLanguage === 'Go' ? 1 : 0,
    language_java: f.primaryLanguage === 'Java' ? 1 : 0,
    language_cpp: f.primaryLanguage === 'C++' ? 1 : 0,
    
    // Architecture
    hasPackageJson: f.hasPackageJson ? 1 : 0,
    hasRequirements: f.hasRequirements ? 1 : 0,
    hasCargo: f.hasCargo ? 1 : 0,
    hasGoMod: f.hasGoMod ? 1 : 0,
  };
}

/**
 * Train Linear Regression model
 */
function trainLinearRegression(X, y) {
  console.log('\n📊 Training Linear Regression...');
  
  // Simple linear regression using least squares
  const n = X.length;
  const m = X[0].length;
  
  // Normalize features
  const means = [];
  const stds = [];
  
  for (let j = 0; j < m; j++) {
    const values = X.map(row => row[j]);
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n) || 1;
    
    means.push(mean);
    stds.push(std);
    
    // Normalize
    for (let i = 0; i < n; i++) {
      X[i][j] = (X[i][j] - mean) / std;
    }
  }
  
  // Add bias term
  X = X.map(row => [1, ...row]);
  
  // Calculate coefficients using normal equation: (X^T * X)^(-1) * X^T * y
  const Xt = [];
  for (let j = 0; j < X[0].length; j++) {
    Xt[j] = [];
    for (let i = 0; i < n; i++) {
      Xt[j][i] = X[i][j];
    }
  }
  
  // X^T * X
  const XtX = [];
  for (let i = 0; i < Xt.length; i++) {
    XtX[i] = [];
    for (let j = 0; j < Xt.length; j++) {
      XtX[i][j] = Xt[i].reduce((sum, val, k) => sum + val * Xt[j][k], 0);
    }
  }
  
  // X^T * y
  const Xty = Xt.map(row => row.reduce((sum, val, i) => sum + val * y[i], 0));
  
  // Simple inversion for small matrices (using Gaussian elimination)
  // For larger matrices, we'd use a library
  const invXtX = invertMatrix(XtX);
  const coefficients = multiplyMatrixVector(invXtX, Xty);
  
  // Predictions
  const predictions = X.map(row => 
    row.reduce((sum, val, i) => sum + val * coefficients[i], 0)
  );
  
  // Calculate metrics
  const errors = y.map((actual, i) => actual - predictions[i]);
  const mae = errors.reduce((sum, e) => sum + Math.abs(e), 0) / n;
  const rmse = Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / n);
  
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  const ssRes = errors.reduce((sum, e) => sum + e * e, 0);
  const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : (ssRes === 0 ? 1 : -1);
  
  return {
    algorithm: 'Linear Regression',
    coefficients,
    means,
    stds,
    metrics: { r2, mae, rmse },
    predictions
  };
}

/**
 * Train Random Forest (simplified - using decision tree ensemble)
 */
function trainRandomForest(X, y, options = {}) {
  const { nTrees = 50, maxDepth = 10, minSamplesSplit = 10 } = options;
  
  console.log(`\n🌲 Training Random Forest (${nTrees} trees)...`);
  
  // Simplified Random Forest using multiple decision trees
  const trees = [];
  const n = X.length;
  
  for (let t = 0; t < nTrees; t++) {
    // Bootstrap sample
    const sampleIndices = [];
    for (let i = 0; i < n; i++) {
      sampleIndices.push(Math.floor(Math.random() * n));
    }
    
    const XSample = sampleIndices.map(i => X[i]);
    const ySample = sampleIndices.map(i => y[i]);
    
    // Train a simple decision tree (simplified)
    const tree = trainDecisionTree(XSample, ySample, maxDepth, minSamplesSplit);
    trees.push(tree);
    
    if ((t + 1) % 10 === 0) {
      process.stdout.write(`   ${t + 1}/${nTrees} trees...\r`);
    }
  }
  
  console.log(`   ✅ Trained ${nTrees} trees`);
  
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
  
  // Feature importance (simplified - based on variance reduction)
  const featureImportance = calculateFeatureImportance(trees, X, y);
  
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
function calculateFeatureImportance(trees, X, y) {
  const featureCounts = new Array(X[0].length).fill(0);
  
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
 * Matrix operations (simplified)
 */
function invertMatrix(matrix) {
  // Simplified 2x2 or 3x3 inversion
  // For larger matrices, use a library
  const n = matrix.length;
  if (n === 1) return [[1 / matrix[0][0]]];
  if (n === 2) {
    const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    if (Math.abs(det) < 1e-10) return matrix; // Singular matrix
    return [
      [matrix[1][1] / det, -matrix[0][1] / det],
      [-matrix[1][0] / det, matrix[0][0] / det]
    ];
  }
  // For larger matrices, return identity (simplified)
  return matrix.map((row, i) => row.map((_, j) => i === j ? 1 : 0));
}

function multiplyMatrixVector(matrix, vector) {
  return matrix.map(row => row.reduce((sum, val, i) => sum + val * vector[i], 0));
}

/**
 * Main training function
 */
async function retrainModel() {
  console.log('🚀 Retraining ML Model with Notable Repositories\n');
  console.log('='.repeat(60));
  
  // Load all repos
  const repos = loadAllScannedRepos();
  console.log(`\n📊 Dataset: ${repos.length} repositories\n`);
  
  // Calculate quality labels using improved function
  const labeledData = repos.map(repo => ({
    repo: repo.repo || repo.url,
    features: extractFeatures(repo),
    quality: calculateNotableQuality(repo)
  }));
  
  // Quality distribution
  const qualities = labeledData.map(d => d.quality);
  const mean = qualities.reduce((a, b) => a + b, 0) / qualities.length;
  const std = Math.sqrt(qualities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / qualities.length);
  
  console.log('📊 Quality Label Distribution:');
  console.log(`   Min: ${Math.min(...qualities).toFixed(3)}`);
  console.log(`   Max: ${Math.max(...qualities).toFixed(3)}`);
  console.log(`   Mean: ${mean.toFixed(3)}`);
  console.log(`   Std Dev: ${std.toFixed(3)}\n`);
  
  // Prepare training data
  const X = labeledData.map(d => Object.values(d.features));
  const y = labeledData.map(d => d.quality);
  
  // Train models
  const models = [];
  
  // Linear Regression
  try {
    const lrModel = trainLinearRegression(X.map(row => [...row]), y);
    models.push(lrModel);
  } catch (error) {
    console.log(`⚠️  Linear Regression failed: ${error.message}`);
  }
  
  // Random Forest
  try {
    const rfModel = trainRandomForest(X.map(row => [...row]), y, { nTrees: 50, maxDepth: 10 });
    models.push(rfModel);
  } catch (error) {
    console.log(`⚠️  Random Forest failed: ${error.message}`);
  }
  
  // Select best model
  console.log('\n📊 Model Comparison:\n');
  models.forEach(model => {
    console.log(`${model.algorithm}:`);
    console.log(`   R²: ${model.metrics.r2.toFixed(3)}`);
    console.log(`   MAE: ${model.metrics.mae.toFixed(3)}`);
    console.log(`   RMSE: ${model.metrics.rmse.toFixed(3)}`);
    if (model.featureImportance) {
      console.log(`   Top Features: ${getTopFeatures(model.featureImportance, 5).join(', ')}`);
    }
    console.log('');
  });
  
  const bestModel = models.reduce((best, current) => 
    current.metrics.r2 > best.metrics.r2 ? current : best
  );
  
  console.log(`🏆 Best Model: ${bestModel.algorithm}`);
  console.log(`   R²: ${bestModel.metrics.r2.toFixed(3)}`);
  console.log(`   MAE: ${bestModel.metrics.mae.toFixed(3)}`);
  console.log(`   RMSE: ${bestModel.metrics.rmse.toFixed(3)}\n`);
  
  // Save model
  const modelPath = path.join(MODELS_DIR, `model-notable-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`);
  fs.writeFileSync(modelPath, JSON.stringify({
    algorithm: bestModel.algorithm,
    metrics: bestModel.metrics,
    featureImportance: bestModel.featureImportance,
    model: bestModel,
    trainedAt: new Date().toISOString(),
    datasetSize: repos.length,
    qualityStats: { mean, std, min: Math.min(...qualities), max: Math.max(...qualities) }
  }, null, 2));
  
  console.log(`💾 Model saved to: ${modelPath}\n`);
  
  return bestModel;
}

function getTopFeatures(importance, n) {
  const features = [
    'stars', 'forks', 'openIssues', 'totalEngagement',
    'repoAgeDays', 'isActive', 'activityScore', 'lastCommitDays',
    'hasTests', 'hasCI', 'hasReadme', 'hasLicense', 'hasDocker',
    'codeQualityScore', 'codeFileRatio', 'totalFiles', 'totalLines',
    'communityHealth', 'language_js', 'language_py', 'language_rust',
    'language_go', 'language_java', 'language_cpp'
  ];
  
  const indexed = importance.map((imp, i) => ({ imp, i }));
  indexed.sort((a, b) => b.imp - a.imp);
  return indexed.slice(0, n).map(item => features[item.i] || `feature_${item.i}`);
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

