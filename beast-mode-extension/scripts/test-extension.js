#!/usr/bin/env node

/**
 * Test BEAST MODE VS Code Extension
 * Validates extension structure, compilation, and functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXTENSION_ROOT = __dirname + '/..';
const OUT_DIR = path.join(EXTENSION_ROOT, 'out');
const SRC_DIR = path.join(EXTENSION_ROOT, 'src');

let testsPassed = 0;
let testsFailed = 0;
const results = [];

function test(name, fn) {
    try {
        fn();
        testsPassed++;
        results.push({ name, status: '✅ PASSED' });
        console.log(`✅ ${name}`);
    } catch (error) {
        testsFailed++;
        results.push({ name, status: '❌ FAILED', error: error.message });
        console.log(`❌ ${name}: ${error.message}`);
    }
}

console.log('🧪 Testing BEAST MODE VS Code Extension');
console.log('============================================================\n');

// Test 1: Check package.json
test('package.json exists and valid', () => {
    const packagePath = path.join(EXTENSION_ROOT, 'package.json');
    if (!fs.existsSync(packagePath)) {
        throw new Error('package.json not found');
    }
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (!pkg.name || !pkg.displayName || !pkg.version) {
        throw new Error('package.json missing required fields');
    }
    if (pkg.main !== './out/extension.js') {
        throw new Error('package.json main field incorrect');
    }
});

// Test 2: Check TypeScript compilation
test('TypeScript compiles successfully', () => {
    try {
        execSync('npm run compile', { 
            cwd: EXTENSION_ROOT,
            stdio: 'pipe'
        });
    } catch (error) {
        throw new Error('TypeScript compilation failed');
    }
});

// Test 3: Check output files
test('Output files generated', () => {
    const extensionJs = path.join(OUT_DIR, 'extension.js');
    if (!fs.existsSync(extensionJs)) {
        throw new Error('out/extension.js not found');
    }
    
    // Check other key files
    const files = [
        'interceptor/interceptorService.js',
        'architecture/enforcer.js',
        'quality/tracker.js',
        'oracle/oracleService.js',
        'panels/qualityPanel.js',
        'panels/interceptorPanel.js',
        'panels/oraclePanel.js'
    ];
    
    files.forEach(file => {
        const filePath = path.join(OUT_DIR, file);
        if (!fs.existsSync(filePath)) {
            throw new Error(`${file} not compiled`);
        }
    });
});

// Test 4: Check source files structure
test('Source files structure correct', () => {
    const requiredFiles = [
        'extension.ts',
        'interceptor/interceptorService.ts',
        'architecture/enforcer.ts',
        'quality/tracker.ts',
        'oracle/oracleService.ts',
        'panels/qualityPanel.ts',
        'panels/interceptorPanel.ts',
        'panels/oraclePanel.ts'
    ];
    
    requiredFiles.forEach(file => {
        const filePath = path.join(SRC_DIR, file);
        if (!fs.existsSync(filePath)) {
            throw new Error(`${file} not found`);
        }
    });
});

// Test 5: Check package.json commands
test('package.json commands defined', () => {
    const packagePath = path.join(EXTENSION_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredCommands = [
        'beast-mode.interceptor.check',
        'beast-mode.interceptor.install',
        'beast-mode.architecture.check',
        'beast-mode.quality.show',
        'beast-mode.oracle.chat'
    ];
    
    const commands = pkg.contributes?.commands || [];
    const commandIds = commands.map(cmd => cmd.command);
    
    requiredCommands.forEach(cmd => {
        if (!commandIds.includes(cmd)) {
            throw new Error(`Command ${cmd} not defined`);
        }
    });
});

// Test 6: Check configuration settings
test('Configuration settings defined', () => {
    const packagePath = path.join(EXTENSION_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const config = pkg.contributes?.configuration;
    if (!config || !config.properties) {
        throw new Error('Configuration not defined');
    }
    
    const requiredSettings = [
        'beast-mode.enabled',
        'beast-mode.interceptor.enabled',
        'beast-mode.architecture.enabled',
        'beast-mode.quality.enabled'
    ];
    
    requiredSettings.forEach(setting => {
        if (!config.properties[setting]) {
            throw new Error(`Setting ${setting} not defined`);
        }
    });
});

// Test 7: Check extension can be packaged
test('Extension can be packaged', () => {
    try {
        execSync('vsce package --out test-package.vsix', {
            cwd: EXTENSION_ROOT,
            stdio: 'pipe'
        });
        
        const vsixPath = path.join(EXTENSION_ROOT, 'test-package.vsix');
        if (!fs.existsSync(vsixPath)) {
            throw new Error('.vsix file not created');
        }
        
        // Clean up test package
        fs.unlinkSync(vsixPath);
    } catch (error) {
        throw new Error(`Packaging failed: ${error.message}`);
    }
});

// Test 8: Check README exists
test('README.md exists', () => {
    const readmePath = path.join(EXTENSION_ROOT, 'README.md');
    if (!fs.existsSync(readmePath)) {
        throw new Error('README.md not found');
    }
    
    const content = fs.readFileSync(readmePath, 'utf8');
    if (content.length < 100) {
        throw new Error('README.md too short');
    }
});

// Test 9: Check icon exists
test('Icon file exists', () => {
    const iconPath = path.join(EXTENSION_ROOT, 'icon.svg');
    if (!fs.existsSync(iconPath)) {
        throw new Error('icon.svg not found');
    }
});

// Test 10: Check .vscodeignore
test('.vscodeignore exists', () => {
    const ignorePath = path.join(EXTENSION_ROOT, '.vscodeignore');
    if (!fs.existsSync(ignorePath)) {
        throw new Error('.vscodeignore not found');
    }
});

console.log('\n============================================================');
console.log('📊 Test Results Summary');
console.log('============================================================\n');

results.forEach(result => {
    console.log(`${result.status} ${result.name}`);
    if (result.error) {
        console.log(`   Error: ${result.error}`);
    }
});

console.log(`\n✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Extension is ready to publish.');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Fix issues before publishing.');
    process.exit(1);
}
