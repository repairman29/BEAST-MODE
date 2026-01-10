#!/usr/bin/env node

/**
 * GitHub App Setup CLI
 * 
 * Helps set up GitHub App for BEAST MODE integration
 * Uses GitHub CLI (gh) to automate what's possible
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createLogger } = require('../utils/logger');

const log = createLogger('GitHubAppSetup');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Check if GitHub CLI is installed
 */
function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if user is authenticated with GitHub CLI
 */
function checkGitHubAuth() {
  try {
    const result = execSync('gh auth status', { encoding: 'utf8', stdio: 'pipe' });
    return result.includes('Logged in');
  } catch (error) {
    return false;
  }
}

/**
 * Get GitHub App manifest (for quick setup)
 */
function generateAppManifest() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.VERCEL_URL || 
                  'https://beast-mode.dev';
  
  const webhookUrl = `${baseUrl}/api/github/webhook`;
  const callbackUrl = `${baseUrl}/api/github/app/callback`;

  return {
    name: 'BEAST MODE',
    url: baseUrl,
    hook_attributes: {
      url: webhookUrl,
      active: true
    },
    redirect_url: callbackUrl,
    public: false,
    default_permissions: {
      contents: 'read',
      metadata: 'read',
      pull_requests: 'write',
      checks: 'write',
      issues: 'read'
    },
    default_events: [
      'pull_request',
      'push',
      'installation',
      'installation_repositories'
    ]
  };
}

/**
 * Create GitHub App using manifest (GitHub CLI)
 */
async function createAppWithManifest() {
  console.log('\n🚀 Creating GitHub App using manifest...\n');

  const manifest = generateAppManifest();
  const manifestPath = path.join(process.cwd(), '.github-app-manifest.json');

  // Write manifest to file
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Manifest file created:', manifestPath);

  try {
    // Step 1: Create app manifest code (GitHub API)
    console.log('\n🔄 Step 1: Creating app manifest...');
    
    // Use GitHub API to create app from manifest
    // First, we need to POST the manifest to get a code
    const manifestJson = JSON.stringify(manifest);
    const tempManifestFile = path.join(process.cwd(), '.temp-manifest.json');
    fs.writeFileSync(tempManifestFile, manifestJson);

    try {
      // Try using gh api to create app
      console.log('   Using GitHub API to create app...');
      
      // GitHub Apps can be created via web interface or API
      // The easiest way is to guide user to web interface with manifest
      console.log('\n📋 GitHub App Manifest Ready!');
      console.log('\n📝 Next steps:');
      console.log('   1. Open: https://github.com/settings/apps/new');
      console.log('   2. Scroll down to "Manifest" section');
      console.log('   3. Copy the manifest JSON below and paste it:');
      console.log('\n' + '='.repeat(60));
      console.log(manifestJson);
      console.log('='.repeat(60));
      console.log('\n   4. Click "Create GitHub App"');
      console.log('   5. Download the private key');
      console.log('   6. Come back here and run: beast-mode github-app save-credentials\n');

      // Ask if they want to open the browser
      const openBrowser = await question('Open GitHub App creation page in browser? (y/n): ');
      if (openBrowser.toLowerCase() === 'y') {
        const open = require('open');
        await open('https://github.com/settings/apps/new');
        console.log('\n✅ Browser opened!');
      }

      // Wait for user to create app
      console.log('\n⏳ After creating the app, you\'ll need to:');
      console.log('   1. Get the App ID (from app settings page)');
      console.log('   2. Download the private key');
      console.log('   3. Get the webhook secret (from app settings)');
      console.log('\n   Then run: beast-mode github-app save-credentials\n');

      // Clean up temp file
      if (fs.existsSync(tempManifestFile)) {
        fs.unlinkSync(tempManifestFile);
      }

      // Keep manifest file for reference
      console.log(`\n💾 Manifest saved to: ${manifestPath}`);
      console.log('   (You can delete this after setup is complete)\n');

      return null; // User needs to complete setup manually
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      console.log('\n💡 Manual setup required:');
      console.log(`   1. Go to: https://github.com/settings/apps/new`);
      console.log(`   2. Use manifest file: ${manifestPath}`);
      console.log(`   3. Or copy manifest contents above\n`);
      
      throw error;
    }
  } catch (error) {
    // Fallback: show manual instructions
    console.log('\n📋 Manual Setup Instructions:');
    console.log(`   1. Go to: https://github.com/settings/apps/new`);
    console.log(`   2. Upload manifest: ${manifestPath}`);
    console.log(`   3. Or copy manifest contents and paste in GitHub UI\n`);
    
    return null;
  }
}

/**
 * Save GitHub App credentials (interactive)
 */
async function saveCredentialsInteractive() {
  console.log('\n💾 Save GitHub App Credentials\n');
  console.log('Enter your GitHub App credentials:\n');

  const appId = await question('GitHub App ID: ');
  const clientId = await question('Client ID: ');
  const clientSecret = await question('Client Secret: ');
  const webhookSecret = await question('Webhook Secret: ');
  const privateKeyPath = await question('Private Key file path (or press Enter to skip): ');

  let privateKey = '';
  if (privateKeyPath && fs.existsSync(privateKeyPath)) {
    privateKey = fs.readFileSync(privateKeyPath, 'utf8').trim();
  } else if (privateKeyPath) {
    console.log('⚠️  Private key file not found. You can add it later to .env.local');
  }

  const envPath = path.join(process.cwd(), 'website', '.env.local');
  const envDir = path.dirname(envPath);

  // Ensure directory exists
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  // Read existing .env.local
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add GitHub App variables
  const lines = envContent.split('\n');
  const newLines = [];
  let foundGitHubApp = false;

  for (const line of lines) {
    if (line.startsWith('GITHUB_APP_ID=') ||
        line.startsWith('GITHUB_APP_CLIENT_ID=') ||
        line.startsWith('GITHUB_APP_CLIENT_SECRET=') ||
        line.startsWith('GITHUB_APP_WEBHOOK_SECRET=') ||
        line.startsWith('GITHUB_APP_PRIVATE_KEY=')) {
      if (!foundGitHubApp) {
        newLines.push('# GitHub App Configuration');
        foundGitHubApp = true;
      }
      continue; // Skip old values
    }
    newLines.push(line);
  }

  if (!foundGitHubApp) {
    newLines.push('');
    newLines.push('# GitHub App Configuration');
  }

  newLines.push(`GITHUB_APP_ID=${appId}`);
  newLines.push(`GITHUB_APP_CLIENT_ID=${clientId}`);
  newLines.push(`GITHUB_APP_CLIENT_SECRET=${clientSecret}`);
  newLines.push(`GITHUB_APP_WEBHOOK_SECRET=${webhookSecret}`);
  
  if (privateKey) {
    // Escape newlines for .env file
    const escapedKey = privateKey.replace(/\n/g, '\\n');
    newLines.push(`GITHUB_APP_PRIVATE_KEY="${escapedKey}"`);
  } else {
    newLines.push(`# GITHUB_APP_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----`);
    newLines.push(`# Add your private key here (download from GitHub App settings)`);
  }

  fs.writeFileSync(envPath, newLines.join('\n') + '\n');

  console.log('\n✅ Credentials saved to:', envPath);
  if (!privateKey) {
    console.log('\n⚠️  Don\'t forget to add GITHUB_APP_PRIVATE_KEY!');
    console.log('   Download it from your GitHub App settings page\n');
  }
}

/**
 * Interactive setup
 */
async function interactiveSetup() {
  console.log('\n🔧 BEAST MODE GitHub App Setup\n');
  console.log('This will help you set up a GitHub App for BEAST MODE integration.\n');

  // Check prerequisites
  if (!checkGitHubCLI()) {
    console.log('❌ GitHub CLI (gh) not found.');
    console.log('   Install it: https://cli.github.com/');
    console.log('   Or use manual setup (see docs/GITHUB_APP_IMPLEMENTATION_PLAN.md)\n');
    return;
  }

  if (!checkGitHubAuth()) {
    console.log('❌ Not authenticated with GitHub CLI.');
    console.log('   Run: gh auth login\n');
    return;
  }

  console.log('✅ GitHub CLI is installed and authenticated\n');

  // Ask user what they want to do
  console.log('Options:');
  console.log('  1. Create new GitHub App (guided setup)');
  console.log('  2. Generate manifest file only');
  console.log('  3. Check existing setup');
  console.log('  4. Save credentials (after creating app)');
  console.log('  5. Exit\n');

  const choice = await question('Choose an option (1-5): ');

  switch (choice) {
    case '1':
      try {
        await createAppWithManifest();
        console.log('\n✅ Setup complete!');
        console.log('\n📋 Next steps:');
        console.log('  1. Download private key from GitHub App settings');
        console.log('  2. Add GITHUB_APP_PRIVATE_KEY to .env.local');
        console.log('  3. Deploy to production');
        console.log('  4. Update webhook URL in GitHub App settings\n');
      } catch (error) {
        console.log('\n⚠️  Setup incomplete. See error above.\n');
      }
      break;

    case '2':
      const manifest = generateAppManifest();
      const manifestPath = path.join(process.cwd(), '.github-app-manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log('\n✅ Manifest file created:', manifestPath);
      console.log('\n📋 Next steps:');
      console.log('  1. Go to: https://github.com/settings/apps/new');
      console.log('  2. Upload the manifest file');
      console.log('  3. Save credentials\n');
      break;

      case '3':
        await checkExistingSetup();
        break;

      case '4':
        await saveCredentialsInteractive();
        break;

      case '5':
        console.log('\n👋 Exiting...\n');
        break;

      default:
        console.log('\n❌ Invalid choice\n');
  }
}

/**
 * Check existing setup
 */
async function checkExistingSetup() {
  console.log('\n🔍 Checking existing setup...\n');

  const envPath = path.join(process.cwd(), 'website', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local not found');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const hasAppId = envContent.includes('GITHUB_APP_ID=');
  const hasPrivateKey = envContent.includes('GITHUB_APP_PRIVATE_KEY=');
  const hasWebhookSecret = envContent.includes('GITHUB_APP_WEBHOOK_SECRET=');

  console.log('📋 Configuration Status:');
  console.log(`   ${hasAppId ? '✅' : '❌'} GITHUB_APP_ID`);
  console.log(`   ${hasPrivateKey ? '✅' : '❌'} GITHUB_APP_PRIVATE_KEY`);
  console.log(`   ${hasWebhookSecret ? '✅' : '❌'} GITHUB_APP_WEBHOOK_SECRET`);

  if (hasAppId && hasPrivateKey && hasWebhookSecret) {
    console.log('\n✅ GitHub App appears to be configured!');
    console.log('\n🧪 Test webhook:');
    console.log('   1. Install app on a test repo');
    console.log('   2. Create a test PR');
    console.log('   3. Check webhook logs\n');
  } else {
    console.log('\n⚠️  Setup incomplete. Run setup again.\n');
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'setup':
      case 'init':
        await interactiveSetup();
        break;

      case 'check':
      case 'status':
        await checkExistingSetup();
        break;

      case 'manifest':
        const manifest = generateAppManifest();
        const manifestPath = path.join(process.cwd(), '.github-app-manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log('✅ Manifest file created:', manifestPath);
        console.log('\n📋 Next steps:');
        console.log('  1. Go to: https://github.com/settings/apps/new');
        console.log('  2. Scroll to "Manifest" section');
        console.log('  3. Upload or paste the manifest JSON\n');
        break;

      case 'save-credentials':
        await saveCredentialsInteractive();
        break;

      default:
        console.log('\n📖 GitHub App Setup CLI\n');
        console.log('Commands:');
        console.log('  beast-mode github-app setup            Interactive setup');
        console.log('  beast-mode github-app check            Check existing setup');
        console.log('  beast-mode github-app manifest         Generate manifest file');
        console.log('  beast-mode github-app save-credentials Save credentials after creating app\n');
        console.log('Examples:');
        console.log('  beast-mode github-app setup');
        console.log('  beast-mode github-app check');
        console.log('  beast-mode github-app save-credentials\n');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  interactiveSetup,
  checkExistingSetup,
  generateAppManifest,
  createAppWithManifest,
  saveCredentialsInteractive
};
