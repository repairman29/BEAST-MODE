#!/usr/bin/env node
/**
 * Fix Monitoring Gaps
 * 
 * High Priority: Track ALL requests (success + failure) in monitoring
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Monitoring Gaps\n');
console.log('='.repeat(70));
console.log();

const filesToCheck = [
  '../lib/mlops/modelRouter.js',
  '../lib/mlops/smartModelSelector.js',
  '../website/app/api/repos/quality/route.ts',
];

const issues = [];
const recommendations = [];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    issues.push({ file, issue: 'File not found' });
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if monitoring is called before errors
  const hasMonitoring = content.includes('monitoring') || content.includes('track') || content.includes('log');
  const hasErrorHandling = content.includes('catch') || content.includes('error');
  const hasThrow = content.includes('throw');
  
  if (hasThrow && !hasMonitoring) {
    issues.push({
      file,
      issue: 'Errors thrown but no monitoring before throw',
      recommendation: 'Add monitoring.track() before throwing errors'
    });
  }
  
  if (hasErrorHandling && !hasMonitoring) {
    recommendations.push({
      file,
      recommendation: 'Add monitoring to error handlers'
    });
  }
});

console.log('📊 Analysis Results:');
console.log();

if (issues.length === 0 && recommendations.length === 0) {
  console.log('✅ No monitoring gaps found!');
  console.log();
} else {
  if (issues.length > 0) {
    console.log('❌ Critical Issues:');
    issues.forEach(({ file, issue, recommendation }) => {
      console.log(`   ${file}`);
      console.log(`   Issue: ${issue}`);
      if (recommendation) {
        console.log(`   Fix: ${recommendation}`);
      }
      console.log();
    });
  }
  
  if (recommendations.length > 0) {
    console.log('💡 Recommendations:');
    recommendations.forEach(({ file, recommendation }) => {
      console.log(`   ${file}: ${recommendation}`);
    });
    console.log();
  }
}

console.log('='.repeat(70));
console.log('🎯 Next Steps:');
console.log('='.repeat(70));
console.log();
console.log('1. Review monitoring in modelRouter.js');
console.log('2. Ensure ALL requests tracked (success + failure)');
console.log('3. Add enhanced error messages with actionable tips');
console.log('4. Set up real-time monitoring dashboard');
console.log('5. Target: 100% request coverage');
console.log();
