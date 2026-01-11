#!/usr/bin/env node
/**
 * Schedule Retrain Threshold Check
 * 
 * Runs check-retrain-threshold.js on a schedule and alerts when ready
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_SCRIPT = path.join(__dirname, 'check-retrain-threshold.js');
const ALERT_FILE = path.join(__dirname, '../.beast-mode/retrain-alert.txt');

function runCheck() {
  console.log(`[${new Date().toISOString()}] Running retrain threshold check...`);
  
  // Set working directory and environment
  const cwd = path.join(__dirname, '..');
  const env = { ...process.env };
  
  exec(`node ${CHECK_SCRIPT}`, { cwd, env }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[${new Date().toISOString()}] Error:`, error.message);
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      return;
    }
    
    if (stderr && !stderr.includes('dotenv')) {
      console.error(`[${new Date().toISOString()}] Stderr:`, stderr);
    }
    
    if (stdout) {
      console.log(stdout);
    }
    
    // Check if alert file exists (means threshold reached)
    if (fs.existsSync(ALERT_FILE)) {
      try {
        const alert = JSON.parse(fs.readFileSync(ALERT_FILE, 'utf8'));
        console.log('\n🚨 ALERT: Retrain threshold reached!');
        console.log(`   Current: ${alert.current} examples`);
        console.log(`   Threshold: ${alert.threshold} examples`);
        console.log(`   Timestamp: ${alert.timestamp}`);
        console.log('\n💡 Run retrain workflow manually or wait for automated retrain');
      } catch (err) {
        // Ignore parse errors
      }
    }
  });
}

// Run immediately
runCheck();

// Then run on schedule
setInterval(runCheck, INTERVAL_MS);

console.log(`✅ Retrain threshold check scheduled (every ${INTERVAL_MS / 1000 / 60} minutes)`);
console.log('Press Ctrl+C to stop');
