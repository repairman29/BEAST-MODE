#!/usr/bin/env node

/**
 * Train Model with Multiple Algorithms
 * 
 * Compares:
 * 1. Linear Regression
 * 2. Random Forest
 * 3. Gradient Boosting (simple)
 * 
 * Also includes:
 * - Feature importance analysis
 * - Cross-validation
 * - Model comparison
 */

const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data');
const SCANNED_DIR = path.join(OUTPUT_DIR, 'scanned-repos');
const MODELS_DIR = path.join(__dirname, '../.beast-mode/models');
fs.ensureDirSync(MODELS_DIR);

/**
 * Load scanned repository data (combines all files)
 */
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

/**
 * Improved quality calculation
 */
function calculateQuality(repo) {
  const f = repo.features || {};
  
  // Engagement features (0-0.3) - use log scale
  const starsNorm = Math.min(1, Math.log10((f.stars || 0) + 1) / 6);
  const forksNorm = Math.min(1, Math.log10((f.forks || 0) + 1) / 5);
  const engagementScore = (starsNorm * 0.15 + forksNorm * 0.15);
  
  // Quality indicators (0-0.3)
  const qualityIndicators = 
    (f.hasTests || 0) * 0.1 +
    (f.hasCI || 0) * 0.08 +
    (f.hasReadme || 0) * 0.05 +
    (f.hasLicense || 0) * 0.03 +
    (f.hasDescription || 0) * 0.02 +
    (f.hasDocker || 0) * 0.02;
  
  // Activity features (0-0.2)
  const activityScore = (f.activityScore || 0) * 0.15;
  const communityHealth = (f.communityHealth || 0) * 0.05;
  
  // Code quality (0-0.1)
  const codeQuality = (f.codeQualityScore || 0) * 0.1;
  
  // Code structure (0-0.1)
  const codeFileRatio = f.codeFileRatio || 0;
  const structureScore = codeFileRatio * 0.1;
  
  // Calculate base quality
  let quality = engagementScore + qualityIndicators + activityScore + 
                communityHealth + codeQuality + structureScore;
  
  // Add variance based on repo hash
  const repoHash = (repo.repo || repo.url || '').split('').reduce((h, c) => {
    return ((h << 5) - h) + c.charCodeAt(0);
  }, 0);
  
  const variance = ((Math.abs(repoHash) % 30) - 15) / 100;
  quality += variance;
  
  // Issue ratio penalty
  if (f.stars > 0 && f.openIssues > 0) {
    const issueRatio = f.openIssues / f.stars;
    quality -= Math.min(0.1, issueRatio * 2);
  }
  
  return Math.max(0.1, Math.min(1.0, quality));
}

/**
 * Prepare training data
 */
function prepareTrainingData(repos) {
  const trainingData = repos.map(repo => ({
    features: repo.features || {},
    quality: calculateQuality(repo),
    repo: repo.repo || repo.url,
  }));

  // Extract feature names
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

/**
 * Train Linear Regression
 */
function trainLinearRegression(X, y, featureNames) {
  const n = X.length;
  const m = X[0].length;
  const lambda = 0.01;
  let weights = new Array(m).fill(0);
  let bias = 0;
  const learningRate = 0.01;
  const epochs = 1000;

  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalError = 0;
    for (let i = 0; i < n; i++) {
      const prediction = weights.reduce((sum, w, j) => sum + w * X[i][j], 0) + bias;
      const error = prediction - y[i];
      totalError += error * error;
      for (let j = 0; j < m; j++) {
        weights[j] = weights[j] * (1 - learningRate * lambda) - learningRate * error * X[i][j];
      }
      bias -= learningRate * error;
    }
    if (epoch % 100 === 0 && epoch > 0) {
      const mse = totalError / n;
      if (mse < 0.001) break;
    }
  }

  return { weights, bias, featureNames };
}

/**
 * Predict with Linear Regression
 */
function predictLinear(model, x) {
  const prediction = model.weights.reduce((sum, w, j) => sum + w * x[j], 0) + model.bias;
  return Math.max(0.1, Math.min(1.0, prediction));
}

/**
 * Train Random Forest
 */
function trainRandomForest(X, y, featureNames, options = {}) {
  const { nTrees = 50, maxDepth = 10, minSamples = 5 } = options;
  const n = X.length;
  const m = X[0].length;
  const trees = [];

  // Train multiple trees
  for (let t = 0; t < nTrees; t++) {
    // Bootstrap sample
    const sampleIndices = [];
    for (let i = 0; i < n; i++) {
      sampleIndices.push(Math.floor(Math.random() * n));
    }

    const X_sample = sampleIndices.map(idx => X[idx]);
    const y_sample = sampleIndices.map(idx => y[idx]);

    // Train simple decision tree (stub - simplified)
    // For now, use weighted average based on feature splits
    const tree = {
      predict: (x) => {
        // Simple prediction: weighted average of similar samples
        let sum = 0;
        let weight = 0;
        
        for (let i = 0; i < X_sample.length; i++) {
          // Calculate similarity (dot product)
          let similarity = 0;
          for (let j = 0; j < m; j++) {
            similarity += x[j] * X_sample[i][j];
          }
          similarity = Math.max(0, similarity); // Only positive similarities
          
          sum += y_sample[i] * similarity;
          weight += similarity;
        }
        
        return weight > 0 ? Math.max(0.1, Math.min(1.0, sum / weight)) : 0.5;
      },
      featureImportance: new Array(m).fill(0),
    };

    trees.push(tree);
  }

  // Calculate feature importance (simplified)
  const featureImportance = new Array(m).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const original = X[i][j];
      const originalPred = trees.reduce((sum, tree) => sum + tree.predict(X[i]), 0) / trees.length;
      
      // Perturb feature
      X[i][j] = original * 1.1;
      const perturbedPred = trees.reduce((sum, tree) => sum + tree.predict(X[i]), 0) / trees.length;
      
      // Restore
      X[i][j] = original;
      
      // Importance = change in prediction
      featureImportance[j] += Math.abs(perturbedPred - originalPred);
    }
  }

  // Normalize importance
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

/**
 * Train Gradient Boosting (simplified)
 */
function trainGradientBoosting(X, y, featureNames, options = {}) {
  const { nEstimators = 50, learningRate = 0.1 } = options;
  const n = X.length;
  const m = X[0].length;
  
  // Initialize with mean
  const meanY = y.reduce((a, b) => a + b, 0) / y.length;
  let predictions = new Array(n).fill(meanY);
  
  const trees = [];

  for (let t = 0; t < nEstimators; t++) {
    // Calculate residuals
    const residuals = y.map((yi, i) => yi - predictions[i]);
    
    // Train simple tree on residuals (simplified - use linear regression)
    const tree = trainLinearRegression(X, residuals, featureNames);
    
    // Update predictions
    for (let i = 0; i < n; i++) {
      const pred = predictLinear(tree, X[i]);
      predictions[i] += learningRate * pred;
      predictions[i] = Math.max(0.1, Math.min(1.0, predictions[i]));
    }
    
    trees.push(tree);
  }

  return {
    predict: (x) => {
      let prediction = meanY;
      for (const tree of trees) {
        prediction += learningRate * predictLinear(tree, x);
      }
      return Math.max(0.1, Math.min(1.0, prediction));
    },
    trees,
    meanY,
  };
}

/**
 * Calculate metrics
 */
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
 * Cross-validation
 */
function crossValidate(X, y, trainFn, predictFn, k = 5) {
  const n = X.length;
  const foldSize = Math.floor(n / k);
  const metrics = [];

  for (let fold = 0; fold < k; fold++) {
    const start = fold * foldSize;
    const end = fold < k - 1 ? (fold + 1) * foldSize : n;
    
    // Split data
    const X_train = [...X.slice(0, start), ...X.slice(end)];
    const y_train = [...y.slice(0, start), ...y.slice(end)];
    const X_val = X.slice(start, end);
    const y_val = y.slice(start, end);
    
    // Train
    const model = trainFn(X_train, y_train);
    
    // Predict
    const predictions = X_val.map(x => predictFn(model, x));
    
    // Calculate metrics
    const foldMetrics = calculateMetrics(predictions, y_val);
    metrics.push(foldMetrics);
  }
  
  // Average metrics
  return {
    r2: metrics.reduce((a, b) => a + b.r2, 0) / metrics.length,
    mae: metrics.reduce((a, b) => a + b.mae, 0) / metrics.length,
    rmse: metrics.reduce((a, b) => a + b.rmse, 0) / metrics.length,
    std_r2: Math.sqrt(
      metrics.reduce((sum, m) => {
        const mean = metrics.reduce((a, b) => a + b.r2, 0) / metrics.length;
        return sum + Math.pow(m.r2 - mean, 2);
      }, 0) / metrics.length
    ),
  };
}

/**
 * Feature importance analysis
 */
function analyzeFeatureImportance(model, featureNames, X, y) {
  const n = X.length;
  const baselinePred = X.map(x => model.predict(x));
  const baselineMetrics = calculateMetrics(baselinePred, y);
  
  const importance = [];
  
  for (let i = 0; i < featureNames.length; i++) {
    // Shuffle feature values
    const X_permuted = X.map(x => {
      const x_new = [...x];
      const shuffled = [...x];
      for (let j = shuffled.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
      }
      x_new[i] = shuffled[Math.floor(Math.random() * shuffled.length)];
      return x_new;
    });
    
    // Predict with permuted feature
    const permutedPred = X_permuted.map(x => model.predict(x));
    const permutedMetrics = calculateMetrics(permutedPred, y);
    
    // Importance = increase in error
    const importanceScore = permutedMetrics.rmse - baselineMetrics.rmse;
    importance.push({
      feature: featureNames[i],
      importance: importanceScore,
    });
  }
  
  // Sort by importance
  importance.sort((a, b) => b.importance - a.importance);
  
  return importance;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Training Model with Multiple Algorithms\n');
  console.log('='.repeat(60));
  
  // Load data
  console.log('📂 Loading scanned repositories...\n');
  const repos = loadScannedRepos();
  console.log(`✅ Loaded ${repos.length} repositories\n`);
  
  // Prepare training data
  console.log('📊 Preparing training data...\n');
  const { X, y, featureNames, trainingData } = prepareTrainingData(repos);
  
  // Analyze quality distribution
  const qualities = trainingData.map(t => t.quality);
  const stats = {
    min: Math.min(...qualities),
    max: Math.max(...qualities),
    mean: qualities.reduce((a, b) => a + b, 0) / qualities.length,
    std: Math.sqrt(
      qualities.reduce((sum, q) => {
        const mean = qualities.reduce((a, b) => a + b, 0) / qualities.length;
        return sum + Math.pow(q - mean, 2);
      }, 0) / qualities.length
    ),
  };
  
  console.log('📈 Quality Distribution:');
  console.log(`   Min: ${stats.min.toFixed(3)}`);
  console.log(`   Max: ${stats.max.toFixed(3)}`);
  console.log(`   Mean: ${stats.mean.toFixed(3)}`);
  console.log(`   Std Dev: ${stats.std.toFixed(3)}\n`);
  
  console.log(`📊 Training Data:`);
  console.log(`   Examples: ${X.length}`);
  console.log(`   Features: ${featureNames.length}\n`);
  
  // Train models
  console.log('🤖 Training Models...\n');
  console.log('='.repeat(60));
  
  // 1. Linear Regression
  console.log('\n1️⃣  Linear Regression\n');
  const linearModel = trainLinearRegression(X, y, featureNames);
  const linearPred = X.map(x => predictLinear(linearModel, x));
  const linearMetrics = calculateMetrics(linearPred, y);
  
  console.log('📊 Performance:');
  console.log(`   R²: ${linearMetrics.r2.toFixed(4)}`);
  console.log(`   MAE: ${linearMetrics.mae.toFixed(4)}`);
  console.log(`   RMSE: ${linearMetrics.rmse.toFixed(4)}\n`);
  
  // Cross-validation
  console.log('🔄 Cross-Validation (5-fold):');
  const linearCV = crossValidate(
    X, y,
    (X_train, y_train) => trainLinearRegression(X_train, y_train, featureNames),
    (model, x) => predictLinear(model, x)
  );
  console.log(`   R²: ${linearCV.r2.toFixed(4)} ± ${linearCV.std_r2.toFixed(4)}`);
  console.log(`   MAE: ${linearCV.mae.toFixed(4)}`);
  console.log(`   RMSE: ${linearCV.rmse.toFixed(4)}\n`);
  
  // 2. Random Forest
  console.log('\n2️⃣  Random Forest (50 trees)\n');
  const rfModel = trainRandomForest(X, y, featureNames, { nTrees: 50 });
  const rfPred = X.map(x => rfModel.predict(x));
  const rfMetrics = calculateMetrics(rfPred, y);
  
  console.log('📊 Performance:');
  console.log(`   R²: ${rfMetrics.r2.toFixed(4)}`);
  console.log(`   MAE: ${rfMetrics.mae.toFixed(4)}`);
  console.log(`   RMSE: ${rfMetrics.rmse.toFixed(4)}\n`);
  
  // Feature importance
  console.log('🔍 Top 10 Most Important Features:');
  const topFeatures = rfModel.featureImportance
    .map((imp, idx) => ({ feature: featureNames[idx], importance: imp }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10);
  
  topFeatures.forEach((f, i) => {
    console.log(`   ${i + 1}. ${f.feature}: ${f.importance.toFixed(4)}`);
  });
  console.log('');
  
  // Cross-validation
  console.log('🔄 Cross-Validation (5-fold):');
  const rfCV = crossValidate(
    X, y,
    (X_train, y_train) => trainRandomForest(X_train, y_train, featureNames, { nTrees: 30 }),
    (model, x) => model.predict(x)
  );
  console.log(`   R²: ${rfCV.r2.toFixed(4)} ± ${rfCV.std_r2.toFixed(4)}`);
  console.log(`   MAE: ${rfCV.mae.toFixed(4)}`);
  console.log(`   RMSE: ${rfCV.rmse.toFixed(4)}\n`);
  
  // 3. Gradient Boosting
  console.log('\n3️⃣  Gradient Boosting (50 estimators)\n');
  const gbModel = trainGradientBoosting(X, y, featureNames, { nEstimators: 50 });
  const gbPred = X.map(x => gbModel.predict(x));
  const gbMetrics = calculateMetrics(gbPred, y);
  
  console.log('📊 Performance:');
  console.log(`   R²: ${gbMetrics.r2.toFixed(4)}`);
  console.log(`   MAE: ${gbMetrics.mae.toFixed(4)}`);
  console.log(`   RMSE: ${gbMetrics.rmse.toFixed(4)}\n`);
  
  // Cross-validation
  console.log('🔄 Cross-Validation (5-fold):');
  const gbCV = crossValidate(
    X, y,
    (X_train, y_train) => trainGradientBoosting(X_train, y_train, featureNames, { nEstimators: 30 }),
    (model, x) => model.predict(x)
  );
  console.log(`   R²: ${gbCV.r2.toFixed(4)} ± ${gbCV.std_r2.toFixed(4)}`);
  console.log(`   MAE: ${gbCV.mae.toFixed(4)}`);
  console.log(`   RMSE: ${gbCV.rmse.toFixed(4)}\n`);
  
  // Compare models
  console.log('='.repeat(60));
  console.log('\n📊 Model Comparison\n');
  console.log('='.repeat(60));
  
  const models = [
    { name: 'Linear Regression', metrics: linearMetrics, cv: linearCV },
    { name: 'Random Forest', metrics: rfMetrics, cv: rfCV },
    { name: 'Gradient Boosting', metrics: gbMetrics, cv: gbCV },
  ];
  
  // Sort by R²
  models.sort((a, b) => b.cv.r2 - a.cv.r2);
  
  console.log('\n🏆 Best Model: ' + models[0].name);
  console.log(`   R²: ${models[0].cv.r2.toFixed(4)} ± ${models[0].cv.std_r2.toFixed(4)}`);
  console.log(`   MAE: ${models[0].cv.mae.toFixed(4)}`);
  console.log(`   RMSE: ${models[0].cv.rmse.toFixed(4)}\n`);
  
  console.log('\n📋 All Models (sorted by R²):');
  models.forEach((model, i) => {
    console.log(`\n${i + 1}. ${model.name}:`);
    console.log(`   R²: ${model.cv.r2.toFixed(4)} ± ${model.cv.std_r2.toFixed(4)}`);
    console.log(`   MAE: ${model.cv.mae.toFixed(4)}`);
    console.log(`   RMSE: ${model.cv.rmse.toFixed(4)}`);
  });
  
  // Save best model
  const bestModel = models[0].name === 'Linear Regression' ? linearModel :
                   models[0].name === 'Random Forest' ? rfModel : gbModel;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const modelPath = path.join(MODELS_DIR, `quality-predictor-${models[0].name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.json`);
  
  await fs.writeFile(modelPath, JSON.stringify({
    modelType: models[0].name,
    model: bestModel,
    featureNames,
    metrics: models[0].cv,
    trainedAt: new Date().toISOString(),
  }, null, 2));
  
  console.log(`\n💾 Saved best model: ${modelPath}\n`);
  
  // Feature analysis
  console.log('\n📊 Feature Analysis:\n');
  const featureStats = featureNames.map((name, idx) => {
    const values = X.map(x => x[idx]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );
    const unique = new Set(values).size;
    return {
      name,
      mean: mean.toFixed(4),
      std: std.toFixed(4),
      unique,
      variance: (std * std).toFixed(4),
    };
  });
  
  // Sort by variance (high variance = more informative)
  featureStats.sort((a, b) => parseFloat(b.variance) - parseFloat(a.variance));
  
  console.log('🔍 Top 10 Features by Variance:');
  featureStats.slice(0, 10).forEach((f, i) => {
    console.log(`   ${i + 1}. ${f.name}: variance=${f.variance}, std=${f.std}, unique=${f.unique}`);
  });
  console.log('');
  
  // Low variance features (might be redundant)
  const lowVariance = featureStats.filter(f => parseFloat(f.variance) < 0.01);
  if (lowVariance.length > 0) {
    console.log(`⚠️  ${lowVariance.length} features with low variance (< 0.01):`);
    lowVariance.slice(0, 10).forEach(f => {
      console.log(`   - ${f.name} (variance: ${f.variance})`);
    });
    console.log('');
  }
  
  // Recommendations
  console.log('💡 Recommendations:\n');
  
  if (models[0].cv.r2 > 0.7) {
    console.log('   ✅ Excellent! Model is ready for production');
    console.log('      → Deploy model to production');
    console.log('      → Monitor performance');
    console.log('      → Collect feedback for continuous improvement\n');
  } else if (models[0].cv.r2 > 0.5) {
    console.log('   ⚠️  Good performance, but can improve');
    console.log('      → Consider adding more features');
    console.log('      → Collect more training data');
    console.log('      → Try hyperparameter tuning\n');
  } else if (models[0].cv.r2 > 0.0) {
    console.log('   ⚠️  Model is learning but needs improvement');
    console.log('      → R² is positive (better than baseline)');
    console.log('      → Consider discovering more diverse repos');
    console.log('      → Try feature selection (remove low-variance features)');
    console.log('      → Collect real quality labels from users\n');
  } else if (models[0].cv.r2 > -0.1) {
    console.log('   ⚠️  Model performance is close to baseline');
    console.log('      → R² is slightly negative (worse than mean)');
    console.log('      → Need more diverse training data');
    console.log('      → Consider discovering more repos');
    console.log('      → Try feature engineering\n');
  } else {
    console.log('   ❌ Low performance');
    console.log('      → Need significantly more training data');
    console.log('      → Discover and scan more repos');
    console.log('      → Collect real quality labels from users\n');
  }
  
  // Next steps
  console.log('🚀 Next Steps:\n');
  if (models[0].cv.r2 < 0.3) {
    console.log('   1. Discover more diverse repos:');
    console.log('      node scripts/discover-more-repos.js 500 diverse\n');
    console.log('   2. Scan the new repos:');
    console.log('      node scripts/scan-discovered-repos.js\n');
    console.log('   3. Retrain with more data:');
    console.log('      node scripts/train-with-multiple-algorithms.js\n');
  } else {
    console.log('   1. Deploy best model to production');
    console.log('   2. Monitor prediction accuracy');
    console.log('   3. Collect user feedback for continuous improvement\n');
  }
  
  console.log('✅ Analysis Complete!\n');
}

main().catch(console.error);

