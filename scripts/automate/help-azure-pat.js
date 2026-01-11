#!/usr/bin/env node

/**
 * Help with Azure Personal Access Token
 * Interactive guide to help get the PAT
 */

const readline = require('readline');
const { execSync } = require('child_process');
const { exec } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function helpWithAzurePAT() {
    console.log('🔍 Azure Personal Access Token Helper');
    console.log('============================================================\n');

    console.log('Let me help you get your Personal Access Token step by step.\n');

    // Step 1: Check if they have Azure DevOps account
    const hasAccount = await question('Do you have a Microsoft/Azure account? (y/n): ');
    
    if (hasAccount.toLowerCase() !== 'y') {
        console.log('\n📋 Create Microsoft Account (Free):');
        console.log('   1. Go to: https://account.microsoft.com');
        console.log('   2. Click "Create account"');
        console.log('   3. Follow the steps');
        console.log('   4. Come back and run this script again\n');
        rl.close();
        return;
    }

    // Step 2: Check if they can access Azure DevOps
    console.log('\n📋 Step 1: Access Azure DevOps');
    console.log('   → Open: https://dev.azure.com');
    console.log('   → Sign in with your Microsoft account\n');
    
    const canAccess = await question('Can you access Azure DevOps? (y/n): ');
    
    if (canAccess.toLowerCase() !== 'y') {
        console.log('\n💡 You might need to create an organization:');
        console.log('   1. Go to: https://dev.azure.com');
        console.log('   2. Click "Create organization" (free)');
        console.log('   3. Follow the steps');
        console.log('   4. Come back and try again\n');
        rl.close();
        return;
    }

    // Step 3: Guide to tokens page
    console.log('\n📋 Step 2: Find Personal Access Tokens');
    console.log('   Option A (Direct Link):');
    console.log('   → Go to: https://dev.azure.com/_usersSettings/tokens');
    console.log('');
    console.log('   Option B (Manual):');
    console.log('   → Click your profile (top right)');
    console.log('   → Click "Security" or "User settings"');
    console.log('   → Click "Personal access tokens"\n');
    
    const foundTokens = await question('Can you see the Personal Access Tokens page? (y/n): ');
    
    if (foundTokens.toLowerCase() !== 'y') {
        console.log('\n💡 Try the direct link:');
        console.log('   https://dev.azure.com/_usersSettings/tokens\n');
        console.log('Or:');
        console.log('   1. Click your profile picture');
        console.log('   2. Look for "Security" or "User settings"');
        console.log('   3. Find "Personal access tokens" section\n');
        rl.close();
        return;
    }

    // Step 4: Guide to create token
    console.log('\n📋 Step 3: Create New Token');
    console.log('   1. Click "New Token" button (usually top right)');
    console.log('   2. Fill in:');
    console.log('      • Name: VS Code Marketplace');
    console.log('      • Organization: All accessible organizations');
    console.log('      • Expiration: 90 days (or your preference)');
    console.log('      • Scopes: Find "Marketplace" section');
    console.log('      • Check "Manage" checkbox\n');
    
    const creatingToken = await question('Are you creating the token now? (y/n): ');
    
    if (creatingToken.toLowerCase() === 'y') {
        console.log('\n⏳ Take your time...');
        console.log('   Make sure to:');
        console.log('   • Name it: "VS Code Marketplace"');
        console.log('   • Select "Marketplace (Manage)" scope');
        console.log('   • Copy the token immediately after creating!\n');
        
        const hasToken = await question('Do you have the token copied? (y/n): ');
        
        if (hasToken.toLowerCase() === 'y') {
            const token = await question('\nPaste your token here: ');
            
            console.log('\n🔐 Logging in to VS Code Marketplace...\n');
            
            try {
                // Try to login
                const { spawn } = require('child_process');
                const vsce = spawn('vsce', ['login', 'beast-mode'], {
                    cwd: path.join(__dirname, '../..', 'beast-mode-extension'),
                    stdio: 'inherit'
                });
                
                // Send token to stdin
                vsce.stdin.write(token + '\n');
                vsce.stdin.end();
                
                vsce.on('close', (code) => {
                    if (code === 0) {
                        console.log('\n✅ Successfully logged in!');
                        console.log('\n📦 Ready to publish:');
                        console.log('   cd beast-mode-extension');
                        console.log('   vsce publish\n');
                    } else {
                        console.log('\n❌ Login failed. Please try manually:');
                        console.log('   cd beast-mode-extension');
                        console.log('   vsce login beast-mode');
                        console.log('   (Paste token when prompted)\n');
                    }
                    rl.close();
                });
            } catch (error) {
                console.error('\n❌ Error:', error.message);
                console.log('\n💡 Try manually:');
                console.log('   cd beast-mode-extension');
                console.log('   vsce login beast-mode');
                console.log('   (Paste token when prompted)\n');
                rl.close();
            }
        } else {
            console.log('\n⚠️  Please create the token first, then run this script again.');
            rl.close();
        }
    } else {
        console.log('\n📋 When you\'re ready:');
        console.log('   1. Create the token');
        console.log('   2. Copy it');
        console.log('   3. Run: cd beast-mode-extension && vsce login beast-mode');
        console.log('   4. Paste token when prompted\n');
        rl.close();
    }
}

const path = require('path');
helpWithAzurePAT().catch(error => {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
});
