#!/usr/bin/env node

/**
 * Test Model Predictions
 * 
 * Tests the trained Random Forest model on sample repositories
 */

const fs = require('fs-extra');
const path = require('path');
const { calculateNotableQuality } = require('./analyze-high-quality-repos');

const MODELS_DIR = path.join(__dirname, '../.beast-mode/models');
const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');

/**
 * Load the latest trained model
 */
function loadLatestModel() {
  const files = fs.readdirSync(MODELS_DIR)
    .filter(f => f.startsWith('model-notable-quality-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No trained models found');
  }

  const modelPath = path.join(MODELS_DIR, files[0]);
  const model = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
  
  console.log(`✅ Loaded model: ${files[0]}`);
  console.log(`   Algorithm: ${model.algorithm}`);
  console.log(`   R²: ${model.metrics.r2.toFixed(3)}`);
  console.log(`   MAE: ${model.metrics.mae.toFixed(3)}`);
  console.log(`   RMSE: ${model.metrics.rmse.toFixed(3)}`);
  console.log(`   Trained on: ${model.datasetSize} repos\n`);
  
  return model;
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
 * Predict using Random Forest
 */
function predictRandomForest(model, features, featureNames) {
  const featureArray = model.featureNames;
  const X = featureArray.map(name => features[name] || 0);
  
  // Get predictions from all trees
  const treePredictions = model.model.trees.map(tree => predictTree(tree, X));
  
  // Average predictions
  const prediction = treePredictions.reduce((sum, p) => sum + p, 0) / treePredictions.length;
  
  return prediction;
}

/**
 * Get sample repositories for testing
 */
function getTestRepos() {
  const files = fs.readdirSync(SCANNED_DIR)
    .filter(f => f.startsWith('scanned-repos-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No scanned repositories found');
  }

  // Load latest file
  const filePath = path.join(SCANNED_DIR, files[0]);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const repos = data.trainingData || [];
  
  // Select diverse test samples
  const testRepos = [];
  
  // High stars repo
  const highStars = repos.reduce((max, r) => 
    (r.features?.stars || 0) > (max.features?.stars || 0) ? r : max, repos[0]);
  testRepos.push({ ...highStars, label: 'High Stars' });
  
  // Medium stars repo
  const sorted = repos.sort((a, b) => (b.features?.stars || 0) - (a.features?.stars || 0));
  const midIdx = Math.floor(sorted.length / 2);
  testRepos.push({ ...sorted[midIdx], label: 'Medium Stars' });
  
  // Low stars but has tests
  const withTests = repos.filter(r => r.features?.hasTests).sort((a, b) => 
    (a.features?.stars || 0) - (b.features?.stars || 0));
  if (withTests.length > 0) {
    testRepos.push({ ...withTests[0], label: 'Low Stars, Has Tests' });
  }
  
  // High quality indicators
  const highQuality = repos.filter(r => 
    r.features?.hasTests && r.features?.hasCI && r.features?.hasLicense
  ).sort((a, b) => (b.features?.stars || 0) - (a.features?.stars || 0));
  if (highQuality.length > 0) {
    testRepos.push({ ...highQuality[0], label: 'High Quality Indicators' });
  }
  
  return testRepos.slice(0, 5);
}

/**
 * Test model predictions
 */
function testModel() {
  console.log('🧪 Testing Model Predictions\n');
  console.log('='.repeat(60));
  
  // Load model
  const model = loadLatestModel();
  
  // Get test repos
  const testRepos = getTestRepos();
  
  console.log(`📊 Testing on ${testRepos.length} sample repositories:\n`);
  
  const results = [];
  
  for (const repo of testRepos) {
    const features = repo.features || {};
    
    // Get actual quality (ground truth)
    const actualQuality = calculateNotableQuality(repo);
    
    // Get model prediction
    const predictedQuality = predictRandomForest(model, features, model.featureNames);
    
    // Calculate error
    const error = Math.abs(predictedQuality - actualQuality);
    const errorPercent = (error / actualQuality) * 100;
    
    results.push({
      repo: repo.repo || repo.url,
      label: repo.label,
      stars: features.stars || 0,
      forks: features.forks || 0,
      hasTests: features.hasTests || 0,
      hasCI: features.hasCI || 0,
      actualQuality,
      predictedQuality,
      error,
      errorPercent
    });
  }
  
  // Display results
  console.log('📊 Prediction Results:\n');
  results.forEach((result, i) => {
    console.log(`${i + 1}. ${result.label}`);
    console.log(`   Repo: ${result.repo}`);
    console.log(`   Stars: ${result.stars.toLocaleString()}, Forks: ${result.forks.toLocaleString()}`);
    console.log(`   Tests: ${result.hasTests ? '✅' : '❌'}, CI: ${result.hasCI ? '✅' : '❌'}`);
    console.log(`   Actual Quality: ${result.actualQuality.toFixed(3)}`);
    console.log(`   Predicted Quality: ${result.predictedQuality.toFixed(3)}`);
    console.log(`   Error: ${result.error.toFixed(3)} (${result.errorPercent.toFixed(1)}%)\n`);
  });
  
  // Summary statistics
  const avgError = results.reduce((sum, r) => sum + r.error, 0) / results.length;
  const maxError = Math.max(...results.map(r => r.error));
  const minError = Math.min(...results.map(r => r.error));
  
  console.log('📈 Summary Statistics:');
  console.log(`   Average Error: ${avgError.toFixed(3)}`);
  console.log(`   Max Error: ${maxError.toFixed(3)}`);
  console.log(`   Min Error: ${minError.toFixed(3)}`);
  console.log(`   Model MAE (from training): ${model.metrics.mae.toFixed(3)}`);
  
  // Compare
  if (avgError <= model.metrics.mae * 1.5) {
    console.log('\n✅ Model is performing well on test data!');
  } else {
    console.log('\n⚠️  Model error is higher than expected. Consider:');
    console.log('   - More training data');
    console.log('   - Better feature engineering');
    console.log('   - Hyperparameter tuning');
  }
  
  console.log('\n' + '='.repeat(60));
  
  return results;
}

if (require.main === module) {
  try {
    testModel();
    console.log('✅ Testing complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = { testModel, loadLatestModel, predictRandomForest };

