#!/usr/bin/env node

/**
 * Check Publishing Status
 * Checks if we can publish the extension
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXTENSION_ROOT = path.join(__dirname, '../..', 'beast-mode-extension');

console.log('🔍 Checking Publishing Status');
console.log('============================================================\n');

// Check 1: Package exists
console.log('[1/4] Checking Package...');
const vsixFiles = fs.readdirSync(EXTENSION_ROOT).filter(f => f.endsWith('.vsix'));
if (vsixFiles.length > 0) {
    const latest = vsixFiles.sort().reverse()[0];
    const stats = fs.statSync(path.join(EXTENSION_ROOT, latest));
    console.log(`   ✅ Package found: ${latest} (${(stats.size / 1024).toFixed(1)}KB)\n`);
} else {
    console.log('   ⚠️  No .vsix package found\n');
}

// Check 2: Publisher in package.json
console.log('[2/4] Checking Publisher Configuration...');
const packagePath = path.join(EXTENSION_ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
if (pkg.publisher) {
    console.log(`   ✅ Publisher: ${pkg.publisher}\n`);
} else {
    console.log('   ❌ No publisher set in package.json\n');
}

// Check 3: Check if logged in
console.log('[3/4] Checking Login Status...');
try {
    const result = execSync('vsce ls-publishers', {
        cwd: EXTENSION_ROOT,
        encoding: 'utf8',
        stdio: 'pipe'
    });
    if (result.includes(pkg.publisher || 'beast-mode')) {
        console.log(`   ✅ Logged in as publisher\n`);
    } else {
        console.log('   ⚠️  Not logged in or publisher not found\n');
        console.log('   Available publishers:');
        console.log(result);
    }
} catch (error) {
    console.log('   ⚠️  Not logged in to VS Code Marketplace\n');
    console.log('   To login:');
    console.log('   1. Create publisher account: https://marketplace.visualstudio.com/manage');
    console.log('   2. Get Personal Access Token: https://dev.azure.com');
    console.log('   3. Run: vsce login <publisher-name>');
}

// Check 4: Ready to publish
console.log('[4/4] Publishing Readiness...');
if (pkg.publisher && vsixFiles.length > 0) {
    console.log('   ✅ Extension is ready to publish!\n');
    console.log('📋 To publish:');
    console.log('   1. Ensure you\'re logged in: vsce login ' + pkg.publisher);
    console.log('   2. Publish: vsce publish');
    console.log('   3. Or use: npm run publish:extension\n');
} else {
    console.log('   ⚠️  Extension needs setup before publishing\n');
}
