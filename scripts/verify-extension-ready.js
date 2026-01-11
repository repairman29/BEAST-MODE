#!/usr/bin/env node

/**
 * Verify VS Code Extension is Ready for Publishing
 * Comprehensive check of all requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXTENSION_ROOT = path.join(__dirname, '..', 'beast-mode-extension');

let issues = [];
let warnings = [];

function check(condition, message, isWarning = false) {
    if (!condition) {
        if (isWarning) {
            warnings.push(message);
        } else {
            issues.push(message);
        }
    }
}

console.log('🔍 Verifying VS Code Extension Readiness');
console.log('============================================================\n');

// Check 1: Package.json
console.log('📦 Checking package.json...');
const packagePath = path.join(EXTENSION_ROOT, 'package.json');
if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    check(pkg.name, 'package.json: name field required');
    check(pkg.displayName, 'package.json: displayName required');
    check(pkg.version, 'package.json: version required');
    check(pkg.publisher, 'package.json: publisher required');
    check(pkg.engines?.vscode, 'package.json: engines.vscode required');
    check(pkg.main === './out/extension.js', 'package.json: main must be ./out/extension.js');
    check(pkg.repository, 'package.json: repository field missing (warning)', true);
    check(pkg.license, 'package.json: license field missing (warning)', true);
    
    // Check commands
    const commands = pkg.contributes?.commands || [];
    check(commands.length > 0, 'package.json: No commands defined');
    
    // Check configuration
    const config = pkg.contributes?.configuration;
    check(config, 'package.json: Configuration not defined');
    
    console.log('   ✅ package.json valid');
} else {
    issues.push('package.json not found');
}

// Check 2: Compilation
console.log('\n🔨 Checking compilation...');
try {
    execSync('npm run compile', { 
        cwd: EXTENSION_ROOT,
        stdio: 'pipe'
    });
    console.log('   ✅ TypeScript compiles successfully');
} catch (error) {
    issues.push('TypeScript compilation failed');
    console.log('   ❌ Compilation failed');
}

// Check 3: Output files
console.log('\n📁 Checking output files...');
const outDir = path.join(EXTENSION_ROOT, 'out');
const extensionJs = path.join(outDir, 'extension.js');
check(fs.existsSync(extensionJs), 'out/extension.js not found');
if (fs.existsSync(extensionJs)) {
    const stats = fs.statSync(extensionJs);
    check(stats.size > 0, 'out/extension.js is empty');
    console.log('   ✅ Output files exist');
}

// Check 4: README
console.log('\n📖 Checking README...');
const readmePath = path.join(EXTENSION_ROOT, 'README.md');
check(fs.existsSync(readmePath), 'README.md not found');
if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, 'utf8');
    check(readme.length > 500, 'README.md too short (should be comprehensive)');
    console.log('   ✅ README.md exists');
}

// Check 5: Icon
console.log('\n🎨 Checking icon...');
const iconSvg = path.join(EXTENSION_ROOT, 'icon.svg');
const iconPng = path.join(EXTENSION_ROOT, 'icon.png');
check(fs.existsSync(iconSvg) || fs.existsSync(iconPng), 'Icon file not found (icon.svg or icon.png)');
if (fs.existsSync(iconSvg) || fs.existsSync(iconPng)) {
    console.log('   ✅ Icon exists');
}

// Check 6: .vscodeignore
console.log('\n🚫 Checking .vscodeignore...');
const ignorePath = path.join(EXTENSION_ROOT, '.vscodeignore');
check(fs.existsSync(ignorePath), '.vscodeignore not found');
if (fs.existsSync(ignorePath)) {
    console.log('   ✅ .vscodeignore exists');
}

// Check 7: Package size
console.log('\n📦 Checking package size...');
try {
    execSync('vsce package --out test-verify.vsix', {
        cwd: EXTENSION_ROOT,
        stdio: 'pipe'
    });
    
    const vsixPath = path.join(EXTENSION_ROOT, 'test-verify.vsix');
    if (fs.existsSync(vsixPath)) {
        const stats = fs.statSync(vsixPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`   ✅ Package created: ${sizeMB}MB`);
        
        // Clean up
        fs.unlinkSync(vsixPath);
        
        // Warn if too large
        if (stats.size > 10 * 1024 * 1024) { // 10MB
            warnings.push(`Package size is ${sizeMB}MB (consider bundling)`);
        }
    }
} catch (error) {
    issues.push('Failed to create package');
    console.log('   ❌ Packaging failed');
}

// Summary
console.log('\n============================================================');
console.log('📊 Verification Summary');
console.log('============================================================\n');

if (issues.length === 0 && warnings.length === 0) {
    console.log('🎉 Extension is ready to publish!');
    console.log('\n✅ All checks passed');
    console.log('\n📋 Next Steps:');
    console.log('   1. Test extension in VS Code (F5)');
    console.log('   2. Create publisher account (if needed)');
    console.log('   3. Get Personal Access Token');
    console.log('   4. Run: vsce publish');
} else {
    if (issues.length > 0) {
        console.log('❌ Issues found (must fix before publishing):');
        issues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    if (warnings.length > 0) {
        console.log('\n⚠️  Warnings (recommended to fix):');
        warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    console.log('\n⚠️  Fix issues before publishing');
}

process.exit(issues.length > 0 ? 1 : 0);
