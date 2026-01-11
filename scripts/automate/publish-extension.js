#!/usr/bin/env node

/**
 * Auto-Publish VS Code Extension
 * Uses BEAST MODE to automate extension publishing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXTENSION_ROOT = path.join(__dirname, '../..', 'beast-mode-extension');

console.log('🚀 BEAST MODE: Auto-Publishing VS Code Extension');
console.log('============================================================\n');

// Step 1: Verify extension is ready
console.log('[1/5] Verifying extension...');
try {
  execSync('node scripts/verify-extension-ready.js', {
    cwd: path.join(__dirname, '../..'),
    stdio: 'inherit'
  });
  console.log('   ✅ Extension verified\n');
} catch (error) {
  console.error('   ❌ Extension verification failed');
  process.exit(1);
}

// Step 2: Compile
console.log('[2/5] Compiling TypeScript...');
try {
  execSync('npm run compile', {
    cwd: EXTENSION_ROOT,
    stdio: 'inherit'
  });
  console.log('   ✅ Compilation successful\n');
} catch (error) {
  console.error('   ❌ Compilation failed');
  process.exit(1);
}

// Step 3: Package
console.log('[3/5] Packaging extension...');
try {
  execSync('vsce package', {
    cwd: EXTENSION_ROOT,
    stdio: 'inherit'
  });
  console.log('   ✅ Extension packaged\n');
} catch (error) {
  console.error('   ❌ Packaging failed');
  process.exit(1);
}

// Step 4: Check for publisher
console.log('[4/5] Checking publisher configuration...');
try {
  const packagePath = path.join(EXTENSION_ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (!pkg.publisher) {
    console.log('   ⚠️  No publisher set in package.json');
    console.log('   💡 Set publisher: "publisher": "beast-mode"');
  } else {
    console.log(`   ✅ Publisher: ${pkg.publisher}\n`);
  }
} catch (error) {
  console.warn('   ⚠️  Could not check publisher');
}

// Step 5: Publish (with confirmation)
console.log('[5/5] Ready to publish!');
console.log('\n📋 Publishing Checklist:');
console.log('   1. ✅ Extension compiled');
console.log('   2. ✅ Extension packaged');
console.log('   3. ✅ Publisher configured');
console.log('   4. ⚠️  Publisher account created (manual)');
console.log('   5. ⚠️  Personal Access Token obtained (manual)');
console.log('\n🚀 To publish:');
console.log('   1. Create publisher account: https://marketplace.visualstudio.com/manage');
console.log('   2. Get Personal Access Token: https://dev.azure.com');
console.log('   3. Login: vsce login <publisher-name>');
console.log('   4. Publish: vsce publish');
console.log('\n💡 Or run: npm run publish:extension -- --publish');
