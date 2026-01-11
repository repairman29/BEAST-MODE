#!/usr/bin/env node

/**
 * Auto-Deploy Script
 * Automates deployment to staging/production
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const ENV = process.argv[2] || 'staging';

console.log(`🚀 Auto-Deploying to ${ENV}`);
console.log('============================================================\n');

// Pre-deployment checks
console.log('🔍 Running pre-deployment checks...\n');

const checks = [
  { name: 'Tests', command: 'npm test' },
  { name: 'Build', command: 'npm run build' },
  { name: 'Lint', command: 'npm run lint' },
];

let allPassed = true;

checks.forEach(check => {
  try {
    console.log(`   Checking ${check.name}...`);
    execSync(check.command, { 
      cwd: ROOT,
      stdio: 'pipe'
    });
    console.log(`   ✅ ${check.name} passed\n`);
  } catch (error) {
    console.log(`   ❌ ${check.name} failed\n`);
    allPassed = false;
  }
});

if (!allPassed) {
  console.log('❌ Pre-deployment checks failed. Aborting deployment.');
  process.exit(1);
}

// Deploy
console.log(`📦 Deploying to ${ENV}...\n`);

try {
  if (ENV === 'production') {
    // Production requires confirmation
    console.log('⚠️  Production deployment requires manual confirmation.');
    console.log('   Run: vercel --prod --yes');
  } else {
    // Staging deployment
    execSync('vercel --yes', {
      cwd: ROOT,
      stdio: 'inherit'
    });
    console.log('\n✅ Deployment complete!');
  }
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
}
