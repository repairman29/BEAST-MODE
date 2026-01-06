#!/usr/bin/env node

/**
 * Check Scanning Progress
 * 
 * Monitors the progress of notable repository scanning
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const DISCOVERED_DIR = path.join(__dirname, '../.beast-mode/training-data/discovered-repos');
const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');

/**
 * Get process info
 */
function getProcessInfo() {
  try {
    const output = execSync('ps aux | grep "scan-notable-repos" | grep -v grep', { encoding: 'utf8' });
    if (output.trim()) {
      const parts = output.trim().split(/\s+/);
      return {
        running: true,
        pid: parts[1],
        cpu: parts[2],
        mem: parts[3],
        time: parts[9] || parts[8]
      };
    }
  } catch (e) {
    // Process not found
  }
  return { running: false };
}

/**
 * Get discovered repos count
 */
function getDiscoveredCount() {
  try {
    const files = fs.readdirSync(DISCOVERED_DIR)
      .filter(f => f.startsWith('notable-repos-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length > 0) {
      const data = JSON.parse(fs.readFileSync(path.join(DISCOVERED_DIR, files[0]), 'utf8'));
      return {
        total: data.metadata?.selected || data.metadata?.totalDiscovered || 0,
        discoveredAt: data.metadata?.discoveredAt
      };
    }
  } catch (e) {
    // File not found
  }
  return { total: 0 };
}

/**
 * Get scanned repos count
 */
function getScannedCount() {
  try {
    const files = fs.readdirSync(SCANNED_DIR)
      .filter(f => f.includes('notable') && f.endsWith('.json'));
    
    let totalScanned = 0;
    let latestFile = null;
    let latestTime = null;
    
    for (const file of files) {
      try {
        const filePath = path.join(SCANNED_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const scanned = data.metadata?.successful || (data.trainingData || []).length;
        totalScanned += scanned;
        
        const stats = fs.statSync(filePath);
        if (!latestTime || stats.mtime > latestTime) {
          latestTime = stats.mtime;
          latestFile = file;
        }
      } catch (e) {
        // Skip invalid files
      }
    }
    
    return {
      total: totalScanned,
      files: files.length,
      latestFile,
      latestTime
    };
  } catch (e) {
    return { total: 0, files: 0 };
  }
}

/**
 * Estimate progress
 */
function estimateProgress(discovered, scanned, processInfo) {
  if (!processInfo.running) {
    return { status: 'not_running', progress: 0 };
  }
  
  // Estimate based on time running
  // Each repo takes ~2 seconds + API time, so roughly 2-3 seconds per repo
  const avgTimePerRepo = 2.5; // seconds
  const totalTimeNeeded = discovered.total * avgTimePerRepo; // seconds
  
  // Get process runtime (format: MM:SS or HH:MM:SS)
  const timeStr = processInfo.time || '0:00';
  const timeParts = timeStr.split(':').map(Number);
  let secondsRunning = 0;
  
  if (timeParts.length === 2) {
    // MM:SS
    secondsRunning = timeParts[0] * 60 + timeParts[1];
  } else if (timeParts.length === 3) {
    // HH:MM:SS
    secondsRunning = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
  }
  
  // Estimate repos scanned based on time
  const estimatedScanned = Math.floor(secondsRunning / avgTimePerRepo);
  
  // Use actual scanned count if available, otherwise use estimate
  const currentScanned = scanned.total > 0 ? scanned.total : estimatedScanned;
  const progress = Math.min(100, (currentScanned / discovered.total) * 100);
  const remaining = discovered.total - currentScanned;
  const estimatedTimeRemaining = remaining * avgTimePerRepo; // seconds
  
  return {
    status: 'running',
    current: currentScanned,
    total: discovered.total,
    progress: Math.round(progress * 10) / 10,
    remaining,
    estimatedTimeRemaining: Math.round(estimatedTimeRemaining / 60), // minutes
    secondsRunning
  };
}

/**
 * Main function
 */
function main() {
  console.log('📊 Scanning Progress Report\n');
  console.log('='.repeat(60));
  
  // Check process
  const processInfo = getProcessInfo();
  const discovered = getDiscoveredCount();
  const scanned = getScannedCount();
  
  // Process status
  console.log('\n🔄 Process Status:');
  if (processInfo.running) {
    console.log(`   ✅ Running (PID: ${processInfo.pid})`);
    console.log(`   CPU: ${processInfo.cpu}%`);
    console.log(`   Memory: ${processInfo.mem}%`);
    console.log(`   Runtime: ${processInfo.time || 'N/A'}`);
  } else {
    console.log('   ❌ Not running');
  }
  
  // Discovery info
  console.log('\n🔍 Discovery:');
  console.log(`   Total Repos: ${discovered.total}`);
  if (discovered.discoveredAt) {
    const date = new Date(discovered.discoveredAt);
    console.log(`   Discovered: ${date.toLocaleString()}`);
  }
  
  // Scanning progress
  console.log('\n📡 Scanning Progress:');
  if (scanned.files > 0) {
    console.log(`   ✅ Scanned Files: ${scanned.files}`);
    console.log(`   ✅ Total Scanned: ${scanned.total} repos`);
    if (scanned.latestFile) {
      console.log(`   📄 Latest File: ${scanned.latestFile}`);
      if (scanned.latestTime) {
        console.log(`   🕐 Last Updated: ${scanned.latestTime.toLocaleString()}`);
      }
    }
  } else {
    console.log('   ⏳ No scan files created yet (saves at end)');
  }
  
  // Progress estimate
  if (processInfo.running && discovered.total > 0) {
    const progress = estimateProgress(discovered, scanned, processInfo);
    
    console.log('\n📈 Estimated Progress:');
    console.log(`   Current: ~${progress.current} repos`);
    console.log(`   Total: ${progress.total} repos`);
    console.log(`   Progress: ${progress.progress.toFixed(1)}%`);
    console.log(`   Remaining: ~${progress.remaining} repos`);
    console.log(`   Est. Time Remaining: ~${progress.estimatedTimeRemaining} minutes`);
    
    // Progress bar
    const barLength = 40;
    const filled = Math.floor((progress.progress / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    console.log(`   [${bar}] ${progress.progress.toFixed(1)}%`);
  }
  
  // Rate info
  if (processInfo.running) {
    console.log('\n⏱️  Rate Info:');
    console.log('   Delay: 2 seconds between scans');
    console.log('   Estimated: ~2.5 seconds per repo (including API time)');
    console.log('   Total Time: ~33 minutes for 986 repos');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Tip: The scan saves results at the end.');
  console.log('   Check back in a few minutes for progress updates.\n');
}

if (require.main === module) {
  main();
}

module.exports = { getProcessInfo, getDiscoveredCount, getScannedCount, estimateProgress };

