#!/usr/bin/env node

/**
 * Publish Extension Now
 * Attempts to publish, guides through setup if needed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXTENSION_ROOT = path.join(__dirname, '../..', 'beast-mode-extension');

console.log('🚀 Publishing VS Code Extension');
console.log('============================================================\n');

// Check if we can publish directly
console.log('🔍 Checking if ready to publish...\n');

try {
    // Try to list publishers (checks if logged in)
    execSync('vsce ls-publishers', {
        cwd: EXTENSION_ROOT,
        stdio: 'pipe',
        encoding: 'utf8'
    });
    
    console.log('✅ Appears to be logged in\n');
    console.log('📦 Attempting to publish...\n');
    
    try {
        execSync('vsce publish', {
            cwd: EXTENSION_ROOT,
            stdio: 'inherit'
        });
        console.log('\n✅ Extension published successfully!');
        console.log('\n📋 Next Steps:');
        console.log('   1. Verify: https://marketplace.visualstudio.com');
        console.log('   2. Search for "BEAST MODE"');
        console.log('   3. Share extension link');
    } catch (error) {
        console.error('\n❌ Publishing failed');
        console.log('\n💡 Common issues:');
        console.log('   • Version already exists - update version in package.json');
        console.log('   • Not logged in - run: vsce login beast-mode');
        console.log('   • Token expired - get new token from Azure DevOps');
    }
} catch (error) {
    console.log('⚠️  Not logged in to VS Code Marketplace\n');
    console.log('📋 Setup Required:\n');
    console.log('VS Code extensions publish to VS Code Marketplace (not npm).');
    console.log('You need a Microsoft/Azure account.\n');
    console.log('Quick Setup (5 minutes):\n');
    console.log('1. Create Publisher Account:');
    console.log('   → Go to: https://marketplace.visualstudio.com/manage');
    console.log('   → Sign in (or create free Microsoft account)');
    console.log('   → Click "Create Publisher"');
    console.log('   → Publisher ID: "beast-mode"');
    console.log('   → Publisher Name: "BEAST MODE"');
    console.log('   → Accept terms and create\n');
    console.log('2. Get Personal Access Token:');
    console.log('   → Go to: https://dev.azure.com');
    console.log('   → Click your profile → Security');
    console.log('   → Click "Personal access tokens"');
    console.log('   → Click "New Token"');
    console.log('   → Name: "VS Code Marketplace"');
    console.log('   → Organization: All accessible organizations');
    console.log('   → Scopes: Select "Marketplace (Manage)"');
    console.log('   → Click "Create"');
    console.log('   → **Copy token immediately** (won\'t see it again!)\n');
    console.log('3. Login and Publish:');
    console.log('   → cd beast-mode-extension');
    console.log('   → vsce login beast-mode');
    console.log('   → (Enter token when prompted)');
    console.log('   → vsce publish\n');
    console.log('💡 Tip: You can use any Microsoft account (free to create)');
    console.log('   It doesn\'t need to be the same as your npm account.\n');
}
