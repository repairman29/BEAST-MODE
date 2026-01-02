/**
 * Schedule Feedback Collection
 * Run auto-collection on a schedule
 */

const { exec } = require('child_process');
const path = require('path');

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SCRIPT_PATH = path.join(__dirname, 'auto-collect-feedback.js');

function runCollection() {
  console.log(`[${new Date().toISOString()}] Running auto feedback collection...`);
  
  exec(`node ${SCRIPT_PATH}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`[${new Date().toISOString()}] Error:`, error.message);
      return;
    }
    
    if (stderr) {
      console.error(`[${new Date().toISOString()}] Stderr:`, stderr);
    }
    
    console.log(`[${new Date().toISOString()}] Output:`, stdout);
  });
}

// Run immediately
runCollection();

// Then run on schedule
setInterval(runCollection, INTERVAL_MS);

console.log(`✅ Feedback collection scheduled (every ${INTERVAL_MS / 1000 / 60} minutes)`);
console.log('Press Ctrl+C to stop');

