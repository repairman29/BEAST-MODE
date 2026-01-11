#!/usr/bin/env node

/**
 * Auto-Fix All Issues
 * Runs all auto-fixers: lint, types, format, imports
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '../..');

console.log('🔧 Auto-Fixing All Issues');
console.log('============================================================\n');

const fixes = [
  { name: 'Linting', command: 'npm run lint -- --fix' },
  { name: 'TypeScript', command: 'npm run compile' },
  { name: 'Formatting', command: 'npm run format' },
  { name: 'Import Sorting', command: 'npm run sort-imports' },
];

let fixed = 0;
let failed = 0;

fixes.forEach(fix => {
  try {
    console.log(`🔨 Fixing ${fix.name}...`);
    execSync(fix.command, { 
      cwd: ROOT,
      stdio: 'pipe'
    });
    console.log(`   ✅ ${fix.name} fixed\n`);
    fixed++;
  } catch (error) {
    console.log(`   ⚠️  ${fix.name} had issues (may need manual review)\n`);
    failed++;
  }
});

// Run self-healing
console.log('🔄 Running BEAST MODE Self-Healing...');
try {
  execSync('node scripts/dogfood-self-heal.js', {
    cwd: ROOT,
    stdio: 'inherit'
  });
  console.log('   ✅ Self-healing complete\n');
} catch (error) {
  console.log('   ⚠️  Self-healing had issues\n');
}

console.log('============================================================');
console.log('📊 Auto-Fix Summary');
console.log('============================================================\n');
console.log(`✅ Fixed: ${fixed}`);
console.log(`⚠️  Issues: ${failed}`);
console.log(`\n🎉 Auto-fix complete!`);
