#!/usr/bin/env node
/**
 * Test ML Model Loading
 * Diagnoses why models aren't loading
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Testing ML Model Loading...\n');

// Test 1: Check model files exist
console.log('1️⃣ Checking model files...');
const rootDir = process.cwd().includes('website') 
  ? path.join(process.cwd(), '..')
  : process.cwd();
const modelsDir = path.join(rootDir, '.beast-mode/models');

console.log(`   Root dir: ${rootDir}`);
console.log(`   Models dir: ${modelsDir}`);
console.log(`   Models dir exists: ${fs.existsSync(modelsDir)}`);

if (fs.existsSync(modelsDir)) {
  const files = fs.readdirSync(modelsDir);
  const xgboostDirs = files.filter(f => f.startsWith('model-xgboost-'));
  console.log(`   XGBoost model directories: ${xgboostDirs.length}`);
  if (xgboostDirs.length > 0) {
    const latest = xgboostDirs.sort().reverse()[0];
    const modelPath = path.join(modelsDir, latest);
    console.log(`   Latest model: ${latest}`);
    console.log(`   Model path: ${modelPath}`);
    console.log(`   Model path exists: ${fs.existsSync(modelPath)}`);
    
    const modelJson = path.join(modelPath, 'model.json');
    const metadataJson = path.join(modelPath, 'model-metadata.json');
    console.log(`   model.json exists: ${fs.existsSync(modelJson)}`);
    console.log(`   model-metadata.json exists: ${fs.existsSync(metadataJson)}`);
  }
}

// Test 2: Check Python script
console.log('\n2️⃣ Checking Python script...');
const scriptPath = path.join(__dirname, 'predict_xgboost.py');
console.log(`   Script path: ${scriptPath}`);
console.log(`   Script exists: ${fs.existsSync(scriptPath)}`);

// Test 3: Test Python execution
console.log('\n3️⃣ Testing Python execution...');
const { spawn } = require('child_process');
const python = spawn('python3', ['--version']);
python.stdout.on('data', (data) => {
  console.log(`   Python version: ${data.toString().trim()}`);
});
python.on('close', (code) => {
  if (code === 0) {
    console.log('   ✅ Python is available');
  } else {
    console.log('   ❌ Python not working');
  }
  
  // Test 4: Test XGBoost import
  console.log('\n4️⃣ Testing XGBoost import...');
  const xgbTest = spawn('python3', ['-c', 'import xgboost; print(xgboost.__version__)']);
  xgbTest.stdout.on('data', (data) => {
    console.log(`   XGBoost version: ${data.toString().trim()}`);
    console.log('   ✅ XGBoost is available');
  });
  xgbTest.stderr.on('data', (data) => {
    console.log(`   ❌ XGBoost error: ${data.toString().trim()}`);
  });
  xgbTest.on('close', (code) => {
    if (code === 0) {
      // Test 5: Try loading ML integration
      console.log('\n5️⃣ Testing ML Integration loading...');
      try {
        const { MLModelIntegration } = require('../lib/mlops/mlModelIntegration');
        const mlIntegration = new MLModelIntegration();
        
        console.log('   Initializing ML Integration...');
        mlIntegration.initialize().then(() => {
          console.log('   ✅ ML Integration initialized');
          console.log(`   Model available: ${mlIntegration.isMLModelAvailable()}`);
          console.log(`   Model path: ${mlIntegration.modelPath || 'none'}`);
          
          if (mlIntegration.isMLModelAvailable()) {
            console.log('\n6️⃣ Testing prediction...');
            const testFeatures = {
              stars: 100,
              forks: 50,
              issues: 10,
              hasReadme: 1,
              hasLicense: 1,
              hasCI: 1,
              hasTests: 1,
              fileCount: 50,
              languageCount: 2
            };
            
            mlIntegration.predictQuality({ features: testFeatures }).then((result) => {
              console.log(`   ✅ Prediction successful!`);
              console.log(`   Quality: ${(result.predictedQuality * 100).toFixed(1)}%`);
              console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
              console.log(`   Source: ${result.source}`);
              process.exit(0);
            }).catch((error) => {
              console.log(`   ❌ Prediction failed: ${error.message}`);
              console.log(`   Stack: ${error.stack}`);
              process.exit(1);
            });
          } else {
            console.log('   ❌ Model not available after initialization');
            process.exit(1);
          }
        }).catch((error) => {
          console.log(`   ❌ Initialization failed: ${error.message}`);
          console.log(`   Stack: ${error.stack}`);
          process.exit(1);
        });
      } catch (error) {
        console.log(`   ❌ Failed to load MLModelIntegration: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
        process.exit(1);
      }
    } else {
      console.log('   ❌ XGBoost not working');
      process.exit(1);
    }
  });
});

