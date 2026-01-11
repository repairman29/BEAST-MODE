#!/usr/bin/env node
/**
 * Schedule Continuous Training Pipeline
 * 
 * Runs the continuous training pipeline on a schedule
 * Checks threshold and retrains automatically when ready
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const PIPELINE_SCRIPT = path.join(__dirname, 'continuous-training-pipeline.js');
const STATE_FILE = path.join(__dirname, '../.beast-mode/training-state.json');

function runPipeline() {
  console.log(`[${new Date().toISOString()}] Running continuous training pipeline...`);
  
  const cwd = path.join(__dirname, '..');
  const env = { ...process.env };
  
  exec(`node ${PIPELINE_SCRIPT}`, { cwd, env }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[${new Date().toISOString()}] Pipeline error:`, error.message);
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('dotenv')) console.error(stderr);
      return;
    }
    
    if (stderr && !stderr.includes('dotenv')) {
      console.error(`[${new Date().toISOString()}] Stderr:`, stderr);
    }
    
    if (stdout) {
      console.log(stdout);
    }

    // Check if training was successful
    if (stdout.includes('Pipeline completed successfully')) {
      console.log('\n🎉 Training pipeline completed successfully!');
      
      // Show state
      try {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        console.log(`   Training #${state.trainingCount}`);
        console.log(`   Last training: ${state.lastTrainingDate}`);
        console.log(`   Model: ${state.lastModelVersion}`);
      } catch {
        // Ignore
      }
    } else if (stdout.includes('Threshold not reached')) {
      console.log('\n⏳ Threshold not reached - will check again later');
    }
  });
}

// Run immediately
runPipeline();

// Then run on schedule
setInterval(runPipeline, INTERVAL_MS);

console.log(`✅ Continuous training pipeline scheduled (every ${INTERVAL_MS / 1000 / 60} minutes)`);
console.log('Press Ctrl+C to stop');
