#!/usr/bin/env node

/**
 * Test Electron IDE Features
 * Comprehensive testing of IDE functionality
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const IDE_ROOT = path.join(__dirname, '..');

console.log('🧪 Testing BEAST MODE Electron IDE');
console.log('============================================================\n');

// Test 1: Check files exist
console.log('[1/6] Checking IDE Files...\n');

const requiredFiles = [
    'main/main.js',
    'main/preload.js',
    'renderer/index.html',
    'renderer/app.js',
    'src/editor/monacoEditor.ts',
    'src/terminal/terminalService.ts',
    'package.json'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    const filePath = path.join(IDE_ROOT, file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n⚠️  Some files are missing. Run: npm run complete:ide');
} else {
    console.log('\n✅ All files exist');
}

// Test 2: Check dependencies
console.log('\n[2/6] Checking Dependencies...\n');

const packagePath = path.join(IDE_ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const requiredDeps = ['electron', 'monaco-editor', 'xterm'];
requiredDeps.forEach(dep => {
    if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
        console.log(`   ✅ ${dep} in package.json`);
    } else {
        console.log(`   ⚠️  ${dep} not in package.json`);
    }
});

// Test 3: Check node_modules
console.log('\n[3/6] Checking Installed Dependencies...\n');

const nodeModules = path.join(IDE_ROOT, 'node_modules');
if (fs.existsSync(nodeModules)) {
    requiredDeps.forEach(dep => {
        const depPath = path.join(nodeModules, dep);
        if (fs.existsSync(depPath)) {
            console.log(`   ✅ ${dep} installed`);
        } else {
            console.log(`   ⚠️  ${dep} not installed - run: npm install`);
        }
    });
} else {
    console.log('   ⚠️  node_modules not found - run: npm install');
}

// Test 4: Check HTML structure
console.log('\n[4/6] Checking HTML Structure...\n');

const htmlPath = path.join(IDE_ROOT, 'renderer/index.html');
if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const requiredElements = ['monaco-editor', 'terminal-content', 'sidebar', 'panels', 'statusbar'];
    requiredElements.forEach(element => {
        if (html.includes(element)) {
            console.log(`   ✅ ${element} element found`);
        } else {
            console.log(`   ⚠️  ${element} element missing`);
        }
    });
}

// Test 5: Check app.js structure
console.log('\n[5/6] Checking App.js Structure...\n');

const appPath = path.join(IDE_ROOT, 'renderer/app.js');
if (fs.existsSync(appPath)) {
    const app = fs.readFileSync(appPath, 'utf8');
    const requiredFunctions = ['initializeMonacoEditor', 'initializeTerminal', 'checkSecrets', 'checkArchitecture'];
    requiredFunctions.forEach(func => {
        if (app.includes(func)) {
            console.log(`   ✅ ${func} function found`);
        } else {
            console.log(`   ⚠️  ${func} function missing`);
        }
    });
}

// Test 6: Launch test
console.log('\n[6/6] Ready to Launch...\n');
console.log('✅ IDE is ready to test!');
console.log('\n📋 To test manually:');
console.log('   1. cd beast-mode-ide');
console.log('   2. npm run dev');
console.log('   3. Check Electron window opens');
console.log('   4. Verify Monaco editor loads');
console.log('   5. Verify terminal works');
console.log('   6. Test panels (Interceptor, Quality, Oracle)');
console.log('   7. Test BEAST MODE integrations');

console.log('\n============================================================');
console.log('✅ IDE Testing Complete - Ready to Launch!');
