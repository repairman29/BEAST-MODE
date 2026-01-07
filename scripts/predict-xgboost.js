#!/usr/bin/env node

/**
 * XGBoost Prediction Script
 * 
 * Called by mlModelIntegration to make predictions using XGBoost model
 * Uses Python XGBoost for predictions
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Predict quality using XGBoost model
 */
function predictQuality(features, modelPath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'predict_xgboost.py');
    const featuresJson = JSON.stringify(features);
    
    const python = spawn('python3', [scriptPath, modelPath, featuresJson]);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result.predictedQuality);
      } catch (error) {
        reject(new Error(`Failed to parse prediction result: ${error.message}`));
      }
    });
  });
}

if (require.main === module) {
  const features = JSON.parse(process.argv[2] || '{}');
  const modelPath = process.argv[3];
  
  if (!modelPath) {
    console.error('Usage: node predict-xgboost.js <features-json> <model-path>');
    process.exit(1);
  }
  
  predictQuality(features, modelPath)
    .then(quality => {
      console.log(JSON.stringify({ predictedQuality: quality }));
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

module.exports = { predictQuality };

