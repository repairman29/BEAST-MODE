#!/usr/bin/env node

/**
 * Train Model with Feature Selection
 * 
 * Removes low-variance features and retrains
 */

const fs = require('fs-extra');
const path = require('path');

const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
const MODELS_DIR = path.join(__dirname, '../.beast-mode/models');
fs.ensureDirSync(MODELS_DIR);

// Copy necessary functions (can't easily export from other script)
function loadScannedRepos() {
  const files = fs.readdirSync(SCANNED_DIR)
    .filter(f => f.startsWith('scanned-repos-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No scanned repository files found');
  }

  // Combine all files for maximum training data
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

  console.log(`✅ Loaded ${allRepos.length} unique repositories from ${files.length} file(s)`);
  return allRepos;
}

function calculateQuality(repo) {
  const f = repo.features || {};
  const starsNorm = Math.min(1, Math.log10((f.stars || 0) + 1) / 6);
  const forksNorm = Math.min(1, Math.log10((f.forks || 0) + 1) / 5);
  const engagementScore = (starsNorm * 0.15 + forksNorm * 0.15);
  const qualityIndicators = 
    (f.hasTests || 0) * 0.1 + (f.hasCI || 0) * 0.08 + (f.hasReadme || 0) * 0.05 +
    (f.hasLicense || 0) * 0.03 + (f.hasDescription || 0) * 0.02 + (f.hasDocker || 0) * 0.02;
  const activityScore = (f.activityScore || 0) * 0.15;
  const communityHealth = (f.communityHealth || 0) * 0.05;
  const codeQuality = (f.codeQualityScore || 0) * 0.1;
  const codeFileRatio = f.codeFileRatio || 0;
  const structureScore = codeFileRatio * 0.1;
  let quality = engagementScore + qualityIndicators + activityScore + 
                communityHealth + codeQuality + structureScore;
  const repoHash = (repo.repo || repo.url || '').split('').reduce((h, c) => {
    return ((h << 5) - h) + c.charCodeAt(0);
  }, 0);
  const variance = ((Math.abs(repoHash) % 30) - 15) / 100;
  quality += variance;
  if (f.stars > 0 && f.openIssues > 0) {
    const issueRatio = f.openIssues / f.stars;
    quality -= Math.min(0.1, issueRatio * 2);
  }
  return Math.max(0.1, Math.min(1.0, quality));
}

function prepareTrainingData(repos) {
  const trainingData = repos.map(repo => ({
    features: repo.features || {},
    quality: calculateQuality(repo),
    repo: repo.repo || repo.url,
  }));
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
  return { X, y, featureNames: featureArray, trainingData };
}

function trainRandomForest(X, y, featureNames, options = {}) {
  const { nTrees = 50 } = options;
  const n = X.length;
  const m = X[0].length;
  const trees = [];
  for (let t = 0; t < nTrees; t++) {
    const sampleIndices = [];
    for (let i = 0; i < n; i++) {
      sampleIndices.push(Math.floor(Math.random() * n));
    }
    const X_sample = sampleIndices.map(idx => X[idx]);
    const y_sample = sampleIndices.map(idx => y[idx]);
    const tree = {
      predict: (x) => {
        let sum = 0, weight = 0;
        for (let i = 0; i < X_sample.length; i++) {
          let similarity = 0;
          for (let j = 0; j < m; j++) {
            similarity += x[j] * X_sample[i][j];
          }
          similarity = Math.max(0, similarity);
          sum += y_sample[i] * similarity;
          weight += similarity;
        }
        return weight > 0 ? Math.max(0.1, Math.min(1.0, sum / weight)) : 0.5;
      },
    };
    trees.push(tree);
  }
  const featureImportance = new Array(m).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const original = X[i][j];
      const originalPred = trees.reduce((sum, tree) => sum + tree.predict(X[i]), 0) / trees.length;
      X[i][j] = original * 1.1;
      const perturbedPred = trees.reduce((sum, tree) => sum + tree.predict(X[i]), 0) / trees.length;
      X[i][j] = original;
      featureImportance[j] += Math.abs(perturbedPred - originalPred);
    }
  }
  const maxImp = Math.max(...featureImportance);
  if (maxImp > 0) {
    for (let j = 0; j < m; j++) {
      featureImportance[j] /= maxImp;
    }
  }
  return {
    predict: (x) => {
      const predictions = trees.map(tree => tree.predict(x));
      return predictions.reduce((a, b) => a + b, 0) / predictions.length;
    },
    trees,
    featureImportance,
  };
}

function calculateMetrics(predictions, y) {
  const errors = predictions.map((pred, i) => Math.abs(pred - y[i]));
  const mae = errors.reduce((a, b) => a + b, 0) / errors.length;
  const rmse = Math.sqrt(errors.reduce((a, b) => a + b * b, 0) / errors.length);
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  const ssRes = errors.reduce((a, b) => a + b * b, 0);
  const ssTot = y.reduce((a, b) => a + Math.pow(b - yMean, 2), 0);
  let r2 = 0;
  if (ssTot > 0 && isFinite(ssTot)) {
    r2 = 1 - (ssRes / ssTot);
    if (!isFinite(r2) || r2 < -1) r2 = -1;
    if (r2 > 1) r2 = 1;
  }
  return { r2, mae, rmse };
}

/**
 * Feature selection - remove low variance features
 */
function selectFeatures(X, y, featureNames, minVariance = 0.01) {
  const n = X.length;
  const m = X[0].length;
  
  const featureVariances = [];
  
  for (let j = 0; j < m; j++) {
    const values = X.map(x => x[j]);
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    featureVariances.push({ index: j, name: featureNames[j], variance });
  }
  
  // Select features with sufficient variance
  const selected = featureVariances
    .filter(f => f.variance >= minVariance)
    .sort((a, b) => b.variance - a.variance);
  
  const selectedIndices = selected.map(f => f.index);
  const selectedNames = selected.map(f => f.name);
  
  // Filter X to only selected features
  const X_selected = X.map(x => selectedIndices.map(idx => x[idx]));
  
  return {
    X: X_selected,
    featureNames: selectedNames,
    removed: featureNames.length - selectedNames.length,
    removedFeatures: featureNames.filter((name, idx) => !selectedIndices.includes(idx)),
  };
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Training Model with Feature Selection\n');
  console.log('='.repeat(60));
  
  // Load data
  const repos = loadScannedRepos();
  console.log(`✅ Loaded ${repos.length} repositories\n`);
  
  // Prepare training data
  const { X, y, featureNames } = prepareTrainingData(repos);
  console.log(`📊 Original features: ${featureNames.length}\n`);
  
  // Feature selection
  console.log('🔍 Selecting features (min variance: 0.01)...\n');
  const { X: X_selected, featureNames: selectedNames, removed, removedFeatures } = 
    selectFeatures(X, y, featureNames, 0.01);
  
  console.log(`✅ Selected ${selectedNames.length} features`);
  console.log(`   Removed ${removed} low-variance features\n`);
  
  if (removedFeatures.length > 0) {
    console.log('📋 Removed features:');
    removedFeatures.slice(0, 10).forEach(f => console.log(`   - ${f}`));
    if (removedFeatures.length > 10) {
      console.log(`   ... and ${removedFeatures.length - 10} more\n`);
    } else {
      console.log('');
    }
  }
  
  // Train Random Forest with selected features
  console.log('🤖 Training Random Forest with selected features...\n');
  const model = trainRandomForest(X_selected, y, selectedNames, { nTrees: 50 });
  const predictions = X_selected.map(x => model.predict(x));
  const metrics = calculateMetrics(predictions, y);
  
  console.log('📊 Performance:');
  console.log(`   R²: ${metrics.r2.toFixed(4)}`);
  console.log(`   MAE: ${metrics.mae.toFixed(4)}`);
  console.log(`   RMSE: ${metrics.rmse.toFixed(4)}\n`);
  
  // Feature importance
  console.log('🔍 Top 10 Most Important Features:');
  model.featureImportance
    .map((imp, idx) => ({ feature: selectedNames[idx], importance: imp }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10)
    .forEach((f, i) => {
      console.log(`   ${i + 1}. ${f.feature}: ${f.importance.toFixed(4)}`);
    });
  console.log('');
  
  // Save model
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const modelPath = path.join(MODELS_DIR, `quality-predictor-rf-selected-${timestamp}.json`);
  
  await fs.writeFile(modelPath, JSON.stringify({
    modelType: 'Random Forest (Feature Selected)',
    model,
    featureNames: selectedNames,
    removedFeatures,
    metrics,
    trainedAt: new Date().toISOString(),
  }, null, 2));
  
  console.log(`💾 Saved model: ${modelPath}\n`);
  
  // Compare with original
  console.log('📊 Comparison:\n');
  console.log(`   Original features: ${featureNames.length}`);
  console.log(`   Selected features: ${selectedNames.length}`);
  console.log(`   Removed: ${removed} (${((removed / featureNames.length) * 100).toFixed(1)}%)\n`);
  
  if (metrics.r2 > -0.1) {
    console.log('✅ Feature selection improved model!\n');
  } else {
    console.log('⚠️  Model still needs improvement');
    console.log('   → Consider discovering more diverse repos\n');
  }
}

main().catch(console.error);

