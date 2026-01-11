#!/usr/bin/env node
/**
 * Continuous Training Pipeline
 * 
 * Automates the entire ML model retraining workflow:
 * 1. Check if threshold reached (500+ real feedback examples)
 * 2. Export real feedback data
 * 3. Prepare data for Python training
 * 4. Train XGBoost model
 * 5. Log training results
 * 6. Deploy new model
 * 7. Verify deployment
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const execAsync = promisify(exec);

const SCRIPTS_DIR = path.join(__dirname);
const MODELS_DIR = path.join(__dirname, '../.beast-mode/models');
const TRAINING_DATA_DIR = path.join(__dirname, '../.beast-mode/training-data');

class ContinuousTrainingPipeline {
  constructor() {
    this.logFile = path.join(__dirname, '../.beast-mode/training-pipeline.log');
    this.stateFile = path.join(__dirname, '../.beast-mode/training-state.json');
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    console.log(logMessage.trim());
    try {
      await fs.appendFile(this.logFile, logMessage);
    } catch (error) {
      // Ignore log file errors
    }
  }

  async loadState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {
        lastTrainingDate: null,
        lastModelVersion: null,
        trainingCount: 0
      };
    }
  }

  async saveState(state) {
    await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
  }

  async checkThreshold() {
    await this.log('Step 1: Checking retrain threshold...');
    try {
      // Check for alert file first (fastest check)
      const alertFile = path.join(__dirname, '../.beast-mode/retrain-alert.txt');
      try {
        await fs.access(alertFile);
        const alert = JSON.parse(await fs.readFile(alertFile, 'utf8'));
        await this.log(`✅ Alert file found - threshold reached! (${alert.current} examples)`, 'SUCCESS');
        return true;
      } catch {
        // Alert file doesn't exist, continue with script check
      }

      // Run threshold check script
      try {
        const { stdout, stderr } = await execAsync(
          `node ${path.join(SCRIPTS_DIR, 'check-retrain-threshold.js')}`,
          { cwd: path.join(__dirname, '..') }
        );

        if (stdout.includes('READY TO RETRAIN') || stdout.includes('THRESHOLD REACHED')) {
          await this.log('✅ Threshold reached! Ready to retrain.', 'SUCCESS');
          return true;
        }

        if (stdout.includes('Not yet ready')) {
          const match = stdout.match(/need (\d+) more/);
          if (match) {
            await this.log(`⏳ Not ready yet - need ${match[1]} more examples`, 'INFO');
          }
          return false;
        }
      } catch (error) {
        // Script exits with code 1 when threshold not reached - this is expected
        // Check stdout for the actual status
        if (error.stdout) {
          if (error.stdout.includes('READY TO RETRAIN') || error.stdout.includes('THRESHOLD REACHED')) {
            await this.log('✅ Threshold reached! Ready to retrain.', 'SUCCESS');
            return true;
          }
          if (error.stdout.includes('Not yet ready')) {
            const match = error.stdout.match(/need (\d+) more/);
            if (match) {
              await this.log(`⏳ Not ready yet - need ${match[1]} more examples`, 'INFO');
            }
            return false;
          }
        }
        // If we can't determine, assume not ready
        await this.log(`⚠️  Could not determine threshold status, assuming not ready`, 'WARN');
        return false;
      }

      return false;
    } catch (error) {
      await this.log(`❌ Error checking threshold: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async exportData() {
    await this.log('Step 2: Exporting real feedback data...');
    try {
      const { stdout, stderr } = await execAsync(
        `node ${path.join(SCRIPTS_DIR, 'export-predictions-real-only.js')}`,
        { cwd: path.join(__dirname, '..') }
      );

      if (stdout.includes('Export Complete') || stdout.includes('✅')) {
        await this.log('✅ Data exported successfully', 'SUCCESS');
        return true;
      }

      await this.log(`⚠️  Export may have issues: ${stdout.substring(0, 200)}`, 'WARN');
      return true; // Continue anyway
    } catch (error) {
      await this.log(`❌ Error exporting data: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async preparePythonData() {
    await this.log('Step 3: Preparing data for Python training...');
    try {
      const realDataPath = path.join(TRAINING_DATA_DIR, 'all-repos-real-only.json');
      const pythonDataPath = path.join(TRAINING_DATA_DIR, 'all-repos-for-python.json');

      const data = JSON.parse(await fs.readFile(realDataPath, 'utf8'));
      await fs.writeFile(pythonDataPath, JSON.stringify(data, null, 2));

      await this.log(`✅ Prepared ${data.repositories?.length || 0} repos for Python training`, 'SUCCESS');
      return true;
    } catch (error) {
      await this.log(`❌ Error preparing Python data: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async trainModel() {
    await this.log('Step 4: Training XGBoost model...');
    try {
      const { stdout, stderr } = await execAsync(
        `python3 ${path.join(SCRIPTS_DIR, 'train_xgboost_improved.py')}`,
        { 
          cwd: path.join(__dirname, '..'),
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large output
        }
      );

      // Check for success indicators
      if (stdout.includes('Model saved to:') || stdout.includes('Model Performance:')) {
        // Extract model path
        const match = stdout.match(/Model saved to: (.+)/);
        if (match) {
          this.latestModelPath = match[1].trim();
          await this.log(`✅ Model trained successfully: ${this.latestModelPath}`, 'SUCCESS');
          
          // Extract metrics
          const r2Match = stdout.match(/R² \(train\): ([\d.-]+)/);
          if (r2Match) {
            await this.log(`   R² Train: ${r2Match[1]}`, 'INFO');
          }
          return true;
        }
      }

      await this.log(`⚠️  Training output unclear: ${stdout.substring(0, 300)}`, 'WARN');
      return true; // Continue anyway
    } catch (error) {
      await this.log(`❌ Error training model: ${error.message}`, 'ERROR');
      if (error.stdout) {
        await this.log(`   Output: ${error.stdout.substring(0, 500)}`, 'ERROR');
      }
      return false;
    }
  }

  async findLatestModel() {
    try {
      const entries = await fs.readdir(MODELS_DIR, { withFileTypes: true });
      const modelDirs = entries
        .filter(e => e.isDirectory() && e.name.startsWith('model-xgboost-improved-'))
        .map(e => e.name)
        .sort()
        .reverse();

      if (modelDirs.length > 0) {
        return path.join(MODELS_DIR, modelDirs[0]);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async logResults() {
    await this.log('Step 5: Logging training results to database...');
    try {
      const { stdout, stderr } = await execAsync(
        `node ${path.join(SCRIPTS_DIR, 'log-training-results.js')}`,
        { cwd: path.join(__dirname, '..') }
      );

      if (stdout.includes('Logged') || stdout.includes('✅')) {
        await this.log('✅ Results logged successfully', 'SUCCESS');
        return true;
      }

      await this.log(`⚠️  Logging may have issues: ${stdout.substring(0, 200)}`, 'WARN');
      return true; // Continue anyway
    } catch (error) {
      await this.log(`❌ Error logging results: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async deployModel() {
    await this.log('Step 6: Deploying model to production...');
    try {
      const latestModelDir = await this.findLatestModel();
      if (!latestModelDir) {
        await this.log('❌ Could not find latest model directory', 'ERROR');
        return false;
      }

      const modelJsonPath = path.join(latestModelDir, 'model.json');
      const metadataPath = path.join(latestModelDir, 'model-metadata.json');
      const targetPath = path.join(MODELS_DIR, 'model-notable-quality-latest.json');

      const model = JSON.parse(await fs.readFile(modelJsonPath, 'utf8'));
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
      const combined = { ...model, metadata };

      await fs.writeFile(targetPath, JSON.stringify(combined, null, 2));

      await this.log(`✅ Model deployed: ${path.basename(targetPath)}`, 'SUCCESS');
      await this.log(`   R² Train: ${metadata.metrics?.r2_train?.toFixed(3) || 'N/A'}`, 'INFO');
      await this.log(`   R² Test: ${metadata.metrics?.r2_test?.toFixed(3) || 'N/A'}`, 'INFO');
      
      return true;
    } catch (error) {
      await this.log(`❌ Error deploying model: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async verifyDeployment() {
    await this.log('Step 7: Verifying deployment...');
    try {
      const targetPath = path.join(MODELS_DIR, 'model-notable-quality-latest.json');
      await fs.access(targetPath);
      
      const model = JSON.parse(await fs.readFile(targetPath, 'utf8'));
      if (model.metadata && model.metadata.training_date) {
        await this.log('✅ Deployment verified - model is accessible', 'SUCCESS');
        return true;
      }
      
      await this.log('⚠️  Model file exists but may be incomplete', 'WARN');
      return true;
    } catch (error) {
      await this.log(`❌ Deployment verification failed: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async run() {
    await this.log('🚀 Starting Continuous Training Pipeline');
    await this.log('='.repeat(70));

    const state = await this.loadState();
    const startTime = Date.now();

    try {
      // Step 1: Check threshold
      const shouldRetrain = await this.checkThreshold();
      if (!shouldRetrain) {
        await this.log('⏭️  Threshold not reached - skipping training', 'INFO');
        return { success: false, reason: 'threshold_not_reached' };
      }

      // Step 2: Export data
      if (!(await this.exportData())) {
        return { success: false, reason: 'export_failed' };
      }

      // Step 3: Prepare Python data
      if (!(await this.preparePythonData())) {
        return { success: false, reason: 'prepare_failed' };
      }

      // Step 4: Train model
      if (!(await this.trainModel())) {
        return { success: false, reason: 'training_failed' };
      }

      // Step 5: Log results
      await this.logResults(); // Non-critical, continue even if fails

      // Step 6: Deploy model
      if (!(await this.deployModel())) {
        return { success: false, reason: 'deployment_failed' };
      }

      // Step 7: Verify deployment
      await this.verifyDeployment(); // Non-critical

      // Update state
      const latestModelDir = await this.findLatestModel();
      state.lastTrainingDate = new Date().toISOString();
      state.lastModelVersion = latestModelDir ? path.basename(latestModelDir) : null;
      state.trainingCount = (state.trainingCount || 0) + 1;
      await this.saveState(state);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      await this.log(`✅ Pipeline completed successfully in ${duration}s`, 'SUCCESS');
      await this.log(`   Training #${state.trainingCount}`, 'INFO');

      // Remove alert file
      const alertFile = path.join(__dirname, '../.beast-mode/retrain-alert.txt');
      try {
        await fs.unlink(alertFile);
      } catch {
        // Ignore
      }

      return { success: true, trainingCount: state.trainingCount };
    } catch (error) {
      await this.log(`❌ Pipeline failed: ${error.message}`, 'ERROR');
      await this.log(error.stack, 'ERROR');
      return { success: false, reason: 'pipeline_error', error: error.message };
    }
  }
}

// Run if called directly
if (require.main === module) {
  const pipeline = new ContinuousTrainingPipeline();
  pipeline.run().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { ContinuousTrainingPipeline };
