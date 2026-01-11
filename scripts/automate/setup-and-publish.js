#!/usr/bin/env node

/**
 * Setup and Publish VS Code Extension
 * Guides through setup and attempts to publish
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const EXTENSION_ROOT = path.join(__dirname, '../..', 'beast-mode-extension');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setupAndPublish() {
    console.log('🚀 BEAST MODE: Setup and Publish VS Code Extension');
    console.log('============================================================\n');

    // Check current status
    const packagePath = path.join(EXTENSION_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const publisher = pkg.publisher || 'beast-mode';

    console.log('📋 Current Status:');
    console.log(`   Publisher: ${publisher}`);
    console.log(`   Version: ${pkg.version}\n`);

    // Check if logged in
    console.log('🔍 Checking login status...\n');
    let isLoggedIn = false;
    try {
        const result = execSync('vsce ls-publishers', {
            cwd: EXTENSION_ROOT,
            encoding: 'utf8',
            stdio: 'pipe'
        });
        if (result.includes(publisher)) {
            isLoggedIn = true;
            console.log(`   ✅ Already logged in as ${publisher}\n`);
        }
    } catch (error) {
        console.log('   ⚠️  Not logged in\n');
    }

    // If not logged in, guide through setup
    if (!isLoggedIn) {
        console.log('📋 Publishing Setup Required\n');
        console.log('VS Code extensions are published to VS Code Marketplace (not npm).');
        console.log('You need:');
        console.log('  1. Microsoft/Azure account (can use existing)');
        console.log('  2. Publisher account on VS Code Marketplace');
        console.log('  3. Personal Access Token from Azure DevOps\n');

        const hasAccount = await question('Do you have a Microsoft/Azure account? (y/n): ');
        
        if (hasAccount.toLowerCase() === 'y') {
            console.log('\n✅ Great! Let\'s set up publishing:\n');
            console.log('Step 1: Create Publisher Account');
            console.log('---------------------------------');
            console.log('1. Go to: https://marketplace.visualstudio.com/manage');
            console.log('2. Sign in with your Microsoft account');
            console.log('3. Click "Create Publisher"');
            console.log(`4. Publisher ID: ${publisher}`);
            console.log('5. Publisher Name: BEAST MODE');
            console.log('6. Accept terms and create\n');

            const publisherCreated = await question('Have you created the publisher account? (y/n): ');
            
            if (publisherCreated.toLowerCase() === 'y') {
                console.log('\nStep 2: Get Personal Access Token');
                console.log('----------------------------------');
                console.log('1. Go to: https://dev.azure.com');
                console.log('2. Click your profile → Security');
                console.log('3. Click "Personal access tokens"');
                console.log('4. Click "New Token"');
                console.log('5. Name: "VS Code Marketplace"');
                console.log('6. Organization: All accessible organizations');
                console.log('7. Scopes: Select "Marketplace (Manage)"');
                console.log('8. Click "Create"');
                console.log('9. **Copy the token immediately** (you won\'t see it again!)\n');

                const hasToken = await question('Do you have the Personal Access Token? (y/n): ');
                
                if (hasToken.toLowerCase() === 'y') {
                    const token = await question('\nEnter your Personal Access Token: ');
                    
                    console.log('\n🔐 Logging in...');
                    try {
                        // Use vsce login with token
                        execSync(`echo "${token}" | vsce login ${publisher}`, {
                            cwd: EXTENSION_ROOT,
                            stdio: 'inherit'
                        });
                        console.log('\n✅ Logged in successfully!\n');
                        isLoggedIn = true;
                    } catch (error) {
                        console.error('\n❌ Login failed. Please try manually:');
                        console.log(`   vsce login ${publisher}`);
                        console.log('   (Enter token when prompted)\n');
                        rl.close();
                        return;
                    }
                } else {
                    console.log('\n⚠️  Please get the token and run this script again.');
                    console.log('   Or run manually: vsce login ' + publisher);
                    rl.close();
                    return;
                }
            } else {
                console.log('\n⚠️  Please create the publisher account first.');
                console.log('   Then run this script again or: vsce login ' + publisher);
                rl.close();
                return;
            }
        } else {
            console.log('\n📋 You\'ll need to:');
            console.log('   1. Create a Microsoft account (free)');
            console.log('   2. Follow the setup steps above');
            console.log('\n   Or use an existing Microsoft account if you have one.');
            rl.close();
            return;
        }
    }

    // If logged in, attempt to publish
    if (isLoggedIn) {
        console.log('📦 Publishing Extension...\n');
        
        const confirm = await question('Ready to publish? This will make the extension public. (y/n): ');
        
        if (confirm.toLowerCase() === 'y') {
            try {
                console.log('\n🚀 Publishing...\n');
                execSync('vsce publish', {
                    cwd: EXTENSION_ROOT,
                    stdio: 'inherit'
                });
                console.log('\n✅ Extension published successfully!');
                console.log('\n📋 Next Steps:');
                console.log('   1. Verify: https://marketplace.visualstudio.com');
                console.log('   2. Search for "BEAST MODE"');
                console.log('   3. Share the extension link');
                console.log('   4. Launch marketing campaign');
            } catch (error) {
                console.error('\n❌ Publishing failed:', error.message);
                console.log('\n💡 Common issues:');
                console.log('   • Version already exists - update version in package.json');
                console.log('   • Token expired - get a new token');
                console.log('   • Network error - try again');
            }
        } else {
            console.log('\n⚠️  Publishing cancelled.');
        }
    }

    rl.close();
}

setupAndPublish().catch(error => {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
});
