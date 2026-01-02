/**
 * Setup MLflow for Experiment Tracking
 * Installs and configures MLflow for ML training
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔧 Setting Up MLflow for Experiment Tracking\n');
  console.log('='.repeat(60));

  // Check if MLflow is installed
  let mlflowInstalled = false;
  try {
    execSync('mlflow --version', { stdio: 'ignore' });
    mlflowInstalled = true;
    console.log('✅ MLflow CLI already installed');
  } catch (error) {
    console.log('⚠️  MLflow CLI not found');
  }

  // Check if Python MLflow package is installed
  let pythonMLflowInstalled = false;
  try {
    execSync('python3 -c "import mlflow"', { stdio: 'ignore' });
    pythonMLflowInstalled = true;
    console.log('✅ Python MLflow package installed');
  } catch (error) {
    console.log('⚠️  Python MLflow package not found');
  }

  // Installation instructions
  console.log('\n📦 Installation Options:\n');

  if (!mlflowInstalled || !pythonMLflowInstalled) {
    console.log('Option 1: Install MLflow CLI (Recommended)');
    console.log('  pip install mlflow');
    console.log('  mlflow ui --port 5000');
    console.log('');

    console.log('Option 2: Use MLflow REST API (No installation needed)');
    console.log('  Our service will use REST API if MLflow server is running');
    console.log('  Set MLFLOW_TRACKING_URI=http://localhost:5000');
    console.log('');

    console.log('Option 3: Use MLflow in Docker');
    console.log('  docker run -p 5000:5000 ghcr.io/mlflow/mlflow:v2.8.1');
    console.log('');
  }

  // Create .env.example entry
  const envExample = `
# MLflow Configuration
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_EXPERIMENT_NAME=beast-mode-ml
`;

  console.log('📝 Add to .env.local:');
  console.log(envExample);

  // Create setup script
  const setupScript = `#!/bin/bash
# MLflow Setup Script

echo "🔧 Setting up MLflow..."

# Install MLflow
pip install mlflow

# Start MLflow UI
echo "🚀 Starting MLflow UI on http://localhost:5000"
mlflow ui --port 5000 --host 0.0.0.0
`;

  const scriptPath = path.join(__dirname, '../scripts/start-mlflow.sh');
  fs.writeFileSync(scriptPath, setupScript);
  fs.chmodSync(scriptPath, '755');

  console.log(`\n✅ Created setup script: ${scriptPath}`);
  console.log('   Run: ./scripts/start-mlflow.sh');

  // Test connection
  console.log('\n🧪 Testing MLflow Connection...');
  try {
    const { getMLflowService } = require('../lib/mlops/mlflowService');
    const mlflow = await getMLflowService();
    
    if (mlflow.isAvailable()) {
      console.log('✅ MLflow service initialized');
      
      // Try to start a test run
      const run = await mlflow.startRun('test-run', { test: 'true' });
      await mlflow.logMetric(run.info.run_id, 'test_metric', 1.0);
      await mlflow.logParam(run.info.run_id, 'test_param', 'test_value');
      await mlflow.endRun(run.info.run_id);
      
      console.log('✅ MLflow connection test successful!');
      console.log(`   Run ID: ${run.info.run_id}`);
    } else {
      console.log('⚠️  MLflow not available (server may not be running)');
      console.log('   Start MLflow: mlflow ui --port 5000');
    }
  } catch (error) {
    console.log('⚠️  MLflow test failed:', error.message);
    console.log('   This is okay - service will use REST API when server is available');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ MLflow setup complete!\n');
  console.log('📚 Next Steps:');
  console.log('   1. Install MLflow: pip install mlflow');
  console.log('   2. Start server: mlflow ui --port 5000');
  console.log('   3. Set MLFLOW_TRACKING_URI in .env.local');
  console.log('   4. Start training models!\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
