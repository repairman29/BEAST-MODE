#!/usr/bin/env node

/**
 * Monitor Vercel Builds
 * 
 * Continuously monitors Vercel deployment status
 */

const { execSync } = require('child_process');
const path = require('path');

function checkBuildStatus() {
  try {
    const output = execSync('cd website && vercel list 2>&1', { 
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..')
    });
    
    const lines = output.split('\n');
    const statusLine = lines.find(line => line.includes('Status') || line.includes('●'));
    
    if (statusLine) {
      if (statusLine.includes('● Ready')) {
        console.log('✅ Build succeeded!');
        return 'success';
      } else if (statusLine.includes('● Error')) {
        console.log('❌ Build failed');
        return 'error';
      } else if (statusLine.includes('● Building')) {
        console.log('⏳ Build in progress...');
        return 'building';
      }
    }
    
    // Parse deployment list
    const deployments = lines
      .filter(line => line.includes('https://beast-mode-website'))
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          age: parts[0],
          url: parts[1],
          status: parts[2] || 'unknown'
        };
      });
    
    if (deployments.length > 0) {
      const latest = deployments[0];
      console.log(`\n📊 Latest Deployment:`);
      console.log(`   Age: ${latest.age}`);
      console.log(`   Status: ${latest.status}`);
      console.log(`   URL: ${latest.url}`);
      
      if (latest.status.includes('Ready')) {
        return 'success';
      } else if (latest.status.includes('Error')) {
        return 'error';
      } else if (latest.status.includes('Building')) {
        return 'building';
      }
    }
    
    return 'unknown';
  } catch (error) {
    console.error('Error checking build status:', error.message);
    return 'error';
  }
}

function monitor() {
  console.log('\n🔍 Monitoring Vercel Builds\n');
  console.log('='.repeat(50));
  console.log();
  
  let checkCount = 0;
  const maxChecks = 20; // Check for 10 minutes (30s intervals)
  
  const interval = setInterval(() => {
    checkCount++;
    console.log(`\n[Check ${checkCount}/${maxChecks}] ${new Date().toLocaleTimeString()}`);
    console.log('-'.repeat(50));
    
    const status = checkBuildStatus();
    
    if (status === 'success') {
      console.log('\n✅ Build completed successfully!');
      clearInterval(interval);
      process.exit(0);
    } else if (status === 'error') {
      console.log('\n❌ Build failed. Check logs for details.');
      clearInterval(interval);
      process.exit(1);
    } else if (checkCount >= maxChecks) {
      console.log('\n⏱️  Timeout: Build taking longer than expected');
      clearInterval(interval);
      process.exit(2);
    }
  }, 30000); // Check every 30 seconds
  
  // Initial check
  checkBuildStatus();
}

if (require.main === module) {
  monitor();
}

module.exports = { checkBuildStatus, monitor };
