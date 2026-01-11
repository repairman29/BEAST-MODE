#!/usr/bin/env node

/**
 * Test BEAST MODE Electron IDE
 * Validates IDE structure and functionality
 */

const fs = require('fs');
const path = require('path');

const IDE_ROOT = __dirname + '/..';
const MAIN_DIR = path.join(IDE_ROOT, 'main');
const RENDERER_DIR = path.join(IDE_ROOT, 'renderer');
const SRC_DIR = path.join(IDE_ROOT, 'src');

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

console.log('🧪 Testing BEAST MODE Electron IDE');
console.log('============================================================\n');

// Test 1: Check package.json
test('package.json exists and valid', () => {
    const packagePath = path.join(IDE_ROOT, 'package.json');
    if (!fs.existsSync(packagePath)) {
        throw new Error('package.json not found');
    }
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (!pkg.name || !pkg.main) {
        throw new Error('package.json missing required fields');
    }
    if (pkg.main !== 'main/main.js') {
        throw new Error('package.json main field incorrect');
    }
});

// Test 2: Check main process files
test('Main process files exist', () => {
    const files = ['main.js', 'preload.js'];
    files.forEach(file => {
        const filePath = path.join(MAIN_DIR, file);
        if (!fs.existsSync(filePath)) {
            throw new Error(`${file} not found`);
        }
    });
});

// Test 3: Check renderer files
test('Renderer files exist', () => {
    const files = ['index.html', 'app.js'];
    files.forEach(file => {
        const filePath = path.join(RENDERER_DIR, file);
        if (!fs.existsSync(filePath)) {
            throw new Error(`${file} not found`);
        }
    });
});

// Test 4: Check source files
test('Source files exist', () => {
    const editorPath = path.join(SRC_DIR, 'editor', 'monacoEditor.ts');
    if (!fs.existsSync(editorPath)) {
        throw new Error('monacoEditor.ts not found');
    }
});

// Test 5: Check dependencies installed
test('Dependencies installed', () => {
    const nodeModules = path.join(IDE_ROOT, 'node_modules');
    if (!fs.existsSync(nodeModules)) {
        throw new Error('node_modules not found - run npm install');
    }
    
    const requiredPackages = ['electron', 'monaco-editor', 'xterm'];
    requiredPackages.forEach(pkg => {
        const pkgPath = path.join(nodeModules, pkg);
        if (!fs.existsSync(pkgPath)) {
            throw new Error(`Package ${pkg} not installed`);
        }
    });
});

// Test 6: Check HTML structure
test('HTML structure valid', () => {
    const htmlPath = path.join(RENDERER_DIR, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    const requiredElements = [
        'monaco-editor',
        'terminal',
        'sidebar',
        'panels',
        'statusbar'
    ];
    
    requiredElements.forEach(element => {
        if (!html.includes(element)) {
            throw new Error(`HTML missing ${element} element`);
        }
    });
});

// Test 7: Check app.js structure
test('app.js structure valid', () => {
    const appPath = path.join(RENDERER_DIR, 'app.js');
    const app = fs.readFileSync(appPath, 'utf8');
    
    const requiredFunctions = [
        'initializeMonacoEditor',
        'initializeTerminal',
        'initializePanels',
        'checkSecrets',
        'checkArchitecture'
    ];
    
    requiredFunctions.forEach(func => {
        if (!app.includes(func)) {
            throw new Error(`app.js missing ${func} function`);
        }
    });
});

// Test 8: Check main.js structure
test('main.js structure valid', () => {
    const mainPath = path.join(MAIN_DIR, 'main.js');
    const main = fs.readFileSync(mainPath, 'utf8');
    
    const requiredElements = [
        'createWindow',
        'createMenu',
        'BrowserWindow',
        'ipcMain'
    ];
    
    requiredElements.forEach(element => {
        if (!main.includes(element)) {
            throw new Error(`main.js missing ${element}`);
        }
    });
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
    console.log('\n🎉 All tests passed! IDE foundation is solid.');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Fix issues before continuing.');
    process.exit(1);
}
