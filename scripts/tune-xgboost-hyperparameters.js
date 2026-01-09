#!/usr/bin/env node
/**
 * Tune XGBoost Hyperparameters
 * 
 * Tests different hyperparameter combinations to reduce overfitting
 * and improve generalization
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

const PYTHON_SCRIPT = path.join(__dirname, 'train_xgboost.py');
const RESULTS_DIR = path.join(__dirname, '../.beast-mode/hyperparameter-tuning');

// Hyperparameter combinations to test
const HYPERPARAMETER_GRID = [
  // Lower complexity (reduce overfitting)
  { max_depth: 3, learning_rate: 0.1, n_estimators: 50, reg_alpha: 0.1, reg_lambda: 1.0 },
  { max_depth: 4, learning_rate: 0.1, n_estimators: 50, reg_alpha: 0.1, reg_lambda: 1.0 },
  { max_depth: 3, learning_rate: 0.05, n_estimators: 100, reg_alpha: 0.1, reg_lambda: 1.0 },
  
  // Medium complexity
  { max_depth: 4, learning_rate: 0.1, n_estimators: 100, reg_alpha: 0.1, reg_lambda: 1.5 },
  { max_depth: 5, learning_rate: 0.1, n_estimators: 75, reg_alpha: 0.2, reg_lambda: 1.0 },
  
  // Higher regularization
  { max_depth: 3, learning_rate: 0.1, n_estimators: 100, reg_alpha: 0.5, reg_lambda: 2.0 },
  { max_depth: 4, learning_rate: 0.1, n_estimators: 100, reg_alpha: 0.3, reg_lambda: 1.5 },
];

async function tuneHyperparameters() {
  console.log('🔧 XGBoost Hyperparameter Tuning\n');
  console.log('='.repeat(50));
  console.log();

  await fs.mkdir(RESULTS_DIR, { recursive: true });

  const results = [];

  for (let i = 0; i < HYPERPARAMETER_GRID.length; i++) {
    const params = HYPERPARAMETER_GRID[i];
    console.log(`📊 Testing combination ${i + 1}/${HYPERPARAMETER_GRID.length}:`);
    console.log(`   max_depth: ${params.max_depth}`);
    console.log(`   learning_rate: ${params.learning_rate}`);
    console.log(`   n_estimators: ${params.n_estimators}`);
    console.log(`   reg_alpha: ${params.reg_alpha}`);
    console.log(`   reg_lambda: ${params.reg_lambda}`);
    console.log();

    // Modify Python script temporarily (or pass params via env)
    // For now, we'll create a wrapper script
    const wrapperScript = `
import sys
sys.path.insert(0, '${path.dirname(PYTHON_SCRIPT)}')
from train_xgboost import train_xgboost_model, prepare_training_data, load_training_data
import json

repos = load_training_data()
X, y, feature_names, training_data = prepare_training_data(repos)

params = {
    'max_depth': ${params.max_depth},
    'learning_rate': ${params.learning_rate},
    'n_estimators': ${params.n_estimators},
    'reg_alpha': ${params.reg_alpha},
    'reg_lambda': ${params.reg_lambda},
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'min_child_weight': 1,
    'gamma': 0,
    'random_state': 42,
    'eval_metric': 'rmse'
}

result = train_xgboost_model(X, y, feature_names, params)
print(json.dumps({
    'r2_train': result['metrics']['r2_train'],
    'r2_test': result['metrics']['r2'],
    'mae': result['metrics']['mae'],
    'rmse': result['metrics']['rmse']
}))
`;

    try {
      const wrapperPath = path.join(RESULTS_DIR, `tune_${i}.py`);
      await fs.writeFile(wrapperPath, wrapperScript);

      const output = execSync(`python3 "${wrapperPath}"`, {
        cwd: path.dirname(PYTHON_SCRIPT),
        encoding: 'utf-8',
        timeout: 300000 // 5 minutes
      });

      const metrics = JSON.parse(output.trim());
      results.push({
        params,
        metrics,
        score: metrics.r2_test // Use test R² as score
      });

      console.log(`   ✅ R² (test): ${metrics.r2_test.toFixed(3)}`);
      console.log(`   ✅ MAE: ${metrics.mae.toFixed(4)}`);
      console.log(`   ✅ RMSE: ${metrics.rmse.toFixed(4)}\n`);

    } catch (error) {
      console.warn(`   ⚠️  Failed: ${error.message}\n`);
      results.push({
        params,
        metrics: null,
        score: -Infinity
      });
    }
  }

  // Find best combination
  const validResults = results.filter(r => r.metrics !== null);
  if (validResults.length === 0) {
    console.log('❌ No valid results');
    return;
  }

  validResults.sort((a, b) => b.score - a.score);
  const best = validResults[0];

  console.log('='.repeat(50));
  console.log('🏆 Best Hyperparameters:\n');
  console.log(`   max_depth: ${best.params.max_depth}`);
  console.log(`   learning_rate: ${best.params.learning_rate}`);
  console.log(`   n_estimators: ${best.params.n_estimators}`);
  console.log(`   reg_alpha: ${best.params.reg_alpha}`);
  console.log(`   reg_lambda: ${best.params.reg_lambda}`);
  console.log();
  console.log('📊 Performance:');
  console.log(`   R² (test): ${best.metrics.r2_test.toFixed(3)}`);
  console.log(`   MAE: ${best.metrics.mae.toFixed(4)}`);
  console.log(`   RMSE: ${best.metrics.rmse.toFixed(4)}`);
  console.log();

  // Save results
  const resultsFile = path.join(RESULTS_DIR, 'tuning-results.json');
  await fs.writeFile(resultsFile, JSON.stringify({
    best: best,
    all: results,
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log(`💾 Results saved to: ${resultsFile}`);
  console.log();
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

async function main() {
  await tuneHyperparameters();
}
