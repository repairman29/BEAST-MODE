#!/usr/bin/env node

/**
 * Test All IDE Projects
 * Runs tests for both VS Code Extension and Electron IDE
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const VSCODE_EXT = path.join(ROOT, 'beast-mode-extension');
const ELECTRON_IDE = path.join(ROOT, 'beast-mode-ide');

console.log('🧪 Testing All BEAST MODE IDE Projects');
console.log('============================================================\n');

async function runTest(projectPath, projectName) {
    return new Promise((resolve) => {
        console.log(`\n📦 Testing ${projectName}...`);
        console.log('-'.repeat(60));
        
        const test = spawn('npm', ['test'], {
            cwd: projectPath,
            stdio: 'inherit',
            shell: true
        });
        
        test.on('close', (code) => {
            resolve(code === 0);
        });
        
        test.on('error', (error) => {
            console.error(`❌ Failed to run tests: ${error.message}`);
            resolve(false);
        });
    });
}

async function main() {
    const results = {
        vscode: false,
        electron: false
    };
    
    // Test VS Code Extension
    if (fs.existsSync(VSCODE_EXT)) {
        results.vscode = await runTest(VSCODE_EXT, 'VS Code Extension');
    } else {
        console.log('⚠️  VS Code Extension directory not found');
    }
    
    // Test Electron IDE
    if (fs.existsSync(ELECTRON_IDE)) {
        results.electron = await runTest(ELECTRON_IDE, 'Electron IDE');
    } else {
        console.log('⚠️  Electron IDE directory not found');
    }
    
    // Summary
    console.log('\n============================================================');
    console.log('📊 Final Test Results');
    console.log('============================================================\n');
    
    console.log(`VS Code Extension: ${results.vscode ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Electron IDE: ${results.electron ? '✅ PASSED' : '❌ FAILED'}`);
    
    const allPassed = results.vscode && results.electron;
    
    if (allPassed) {
        console.log('\n🎉 All IDE projects passed tests!');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some projects failed tests.');
        process.exit(1);
    }
}

main();
