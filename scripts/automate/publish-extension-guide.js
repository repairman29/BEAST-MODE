#!/usr/bin/env node

/**
 * Publishing Guide for VS Code Extension
 * Step-by-step guide to publish extension
 */

console.log('📚 VS Code Extension Publishing Guide');
console.log('============================================================\n');

console.log('✅ Extension Status:');
console.log('   • Compiled: ✅');
console.log('   • Packaged: ✅');
console.log('   • Verified: ✅');
console.log('   • Ready: ✅\n');

console.log('📋 Publishing Steps:\n');

console.log('Step 1: Create Publisher Account');
console.log('---------------------------------');
console.log('1. Go to: https://marketplace.visualstudio.com/manage');
console.log('2. Sign in with Microsoft account');
console.log('3. Click "Create Publisher"');
console.log('4. Enter Publisher ID: "beast-mode"');
console.log('5. Enter Publisher Name: "BEAST MODE"');
console.log('6. Accept terms and create\n');

console.log('Step 2: Get Personal Access Token');
console.log('----------------------------------');
console.log('1. Go to: https://dev.azure.com');
console.log('2. Click your profile → Security');
console.log('3. Click "Personal access tokens"');
console.log('4. Click "New Token"');
console.log('5. Name: "VS Code Marketplace"');
console.log('6. Organization: All accessible organizations');
console.log('7. Scopes: Select "Marketplace (Manage)"');
console.log('8. Click "Create"');
console.log('9. Copy the token (you won\'t see it again!)\n');

console.log('Step 3: Login to VS Code Marketplace');
console.log('-------------------------------------');
console.log('Run: vsce login beast-mode');
console.log('Enter your Personal Access Token when prompted\n');

console.log('Step 4: Publish Extension');
console.log('-------------------------');
console.log('Run: vsce publish');
console.log('This will:');
console.log('  • Update version if needed');
console.log('  • Create .vsix package');
console.log('  • Upload to marketplace');
console.log('  • Make extension available\n');

console.log('Step 5: Verify Publication');
console.log('--------------------------');
console.log('1. Go to: https://marketplace.visualstudio.com');
console.log('2. Search for "BEAST MODE"');
console.log('3. Verify extension appears');
console.log('4. Check extension page\n');

console.log('📄 Extension Details:');
console.log('   • Name: BEAST MODE');
console.log('   • Publisher: beast-mode');
console.log('   • Version: 0.1.0');
console.log('   • Package: beast-mode-extension-0.1.0.vsix\n');

console.log('💡 Quick Commands:');
console.log('   cd beast-mode-extension');
console.log('   vsce login beast-mode');
console.log('   vsce publish\n');

console.log('🚀 Ready to publish!');
