#!/usr/bin/env node

/**
 * Master Automation Script
 * Runs all automation: fix, test, quality, deploy
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '../..');

console.log('🤖 BEAST MODE Master Automation');
console.log('============================================================\n');

const steps = [
  { name: 'Fix All Issues', command: 'npm run fix:all', critical: false },
  { name: 'Run Tests', command: 'npm test', critical: true },
  { name: 'Run E2E Tests', command: 'npm run test:e2e', critical: false },
  { name: 'Self-Healing', command: 'node scripts/dogfood-self-heal.js', critical: false },
  { name: 'Build', command: 'npm run build:website', critical: true },
  { name: 'Quality Check', command: 'node scripts/verify-extension-ready.js', critical: false },
];

let passed = 0;
let failed = 0;
let warnings = 0;

steps.forEach((step, index) => {
  console.log(`\n[${index + 1}/${steps.length}] ${step.name}...`);
  console.log('-'.repeat(60));
  
  try {
    execSync(step.command, {
      cwd: ROOT,
      stdio: 'inherit'
    });
    console.log(`✅ ${step.name} passed`);
    passed++;
  } catch (error) {
    if (step.critical) {
      console.log(`❌ ${step.name} failed (CRITICAL)`);
      failed++;
    } else {
      console.log(`⚠️  ${step.name} had issues (non-critical)`);
      warnings++;
    }
  }
});

console.log('\n============================================================');
console.log('📊 Automation Summary');
console.log('============================================================\n');

console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);

if (failed === 0) {
  console.log('\n🎉 All critical steps passed!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Review warnings (if any)');
  console.log('   2. Deploy: npm run deploy:staging');
  console.log('   3. Test in staging');
  console.log('   4. Deploy to production: npm run deploy:prod');
  process.exit(0);
} else {
  console.log('\n⚠️  Critical steps failed. Fix issues before deploying.');
  process.exit(1);
}
