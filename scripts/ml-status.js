/**
 * ML System Status Check
 * Checks MLflow, training data, and model status
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('🤖 ML System Status Check\n');
  console.log('='.repeat(60));

  // Check MLflow
  console.log('\n📊 MLflow Status:');
  try {
    const response = await fetch('http://localhost:5000/health');
    if (response.ok) {
      console.log('   ✅ MLflow UI running on http://localhost:5000');
    } else {
      console.log('   ⚠️  MLflow UI not responding');
    }
  } catch (error) {
    console.log('   ❌ MLflow UI not running');
    console.log('   💡 Start with: npm run mlflow:start');
  }

  // Check PID file
  const pidFile = path.join(__dirname, '../mlflow.pid');
  if (fs.existsSync(pidFile)) {
    const pid = fs.readFileSync(pidFile, 'utf8').trim();
    try {
      execSync(`ps -p ${pid}`, { stdio: 'ignore' });
      console.log(`   ✅ MLflow process running (PID: ${pid})`);
    } catch (error) {
      console.log(`   ⚠️  PID file exists but process not running`);
    }
  }

  // Check training data
  console.log('\n📊 Training Data Status:');
  try {
    const { getFeedbackMonitor } = require('../lib/mlops/feedbackMonitor');
    const monitor = await getFeedbackMonitor();
    const status = await monitor.checkStatus();
    
    if (status.available) {
      console.log(`   ✅ Total predictions: ${status.stats.totalPredictions}`);
      console.log(`   ✅ With actual values: ${status.stats.withActuals}`);
      console.log(`   ✅ Feedback rate: ${(status.stats.feedbackRate * 100).toFixed(2)}%`);
      
      if (status.stats.withActuals < 50) {
        console.log(`   ⚠️  Need ${50 - status.stats.withActuals} more examples for training`);
      } else {
        console.log(`   ✅ Enough data for training (${status.stats.withActuals} examples)`);
      }
    } else {
      console.log('   ⚠️  Feedback monitor not available');
    }
  } catch (error) {
    console.log('   ⚠️  Could not check training data:', error.message);
  }

  // Check models
  console.log('\n📊 Model Status:');
  const modelsDir = path.join(__dirname, '../.beast-mode/models');
  if (fs.existsSync(modelsDir)) {
    const models = fs.readdirSync(modelsDir).filter(f => f.endsWith('.json'));
    if (models.length > 0) {
      console.log(`   ✅ ${models.length} model(s) found:`);
      models.forEach(model => {
        const modelPath = path.join(modelsDir, model);
        const stats = fs.statSync(modelPath);
        console.log(`      - ${model} (${(stats.size / 1024).toFixed(1)} KB)`);
      });
    } else {
      console.log('   ⚠️  No trained models found');
      console.log('   💡 Train with: npm run train:model');
    }
  } else {
    console.log('   ⚠️  Models directory not found');
  }

  // Check environment
  console.log('\n📊 Environment:');
  console.log(`   MLFLOW_TRACKING_URI: ${process.env.MLFLOW_TRACKING_URI || 'not set'}`);
  console.log(`   MLFLOW_EXPERIMENT_NAME: ${process.env.MLFLOW_EXPERIMENT_NAME || 'not set'}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Status check complete!\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
