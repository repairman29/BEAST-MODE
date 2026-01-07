#!/usr/bin/env node

/**
 * GitHub OAuth CLI Setup
 * Handles configuration for development and production
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Development credentials
const DEV_CREDENTIALS = {
  clientId: 'Ov23lidLvmp68FVMEqEB',
  clientSecret: process.env.SECRET || '',
  redirectUri: 'http://localhost:7777/api/github/oauth/callback',
  url: 'http://localhost:7777',
};

// Production credentials
const PROD_CREDENTIALS = {
  clientId: 'Ov23liDKFkIrnPneWwny',
  clientSecret: process.env.SECRET || '',
  redirectUri: 'https://beastmode.dev/api/github/oauth/callback',
  url: 'https://beastmode.dev',
};

// Encryption key (generate if needed)
const ENCRYPTION_KEY = '20abb6f3b973e2fdeea6e2c417ce93824e7b64962f9fee4bfd6339264c8e792c';

/**
 * Setup development environment (.env.local)
 */
async function setupDev() {
  console.log('\n🔧 Setting up GitHub OAuth for Development...\n');

  const envLocalPath = path.join(process.cwd(), 'website', '.env.local');
  const envDir = path.dirname(envLocalPath);

  // Ensure directory exists
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  // Read existing .env.local or create new
  let envContent = '';
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
  }

  // Update or add GitHub OAuth variables
  const lines = envContent.split('\n');
  const newLines = [];
  let foundGitHub = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('GITHUB_CLIENT_ID=') || 
        line.startsWith('GITHUB_CLIENT_SECRET: process.env.SECRET || ''GITHUB_REDIRECT_URI=') ||
        line.startsWith('GITHUB_TOKEN_ENCRYPTION_KEY=') ||
        line.startsWith('NEXT_PUBLIC_URL=')) {
      if (!foundGitHub) {
        newLines.push('# GitHub OAuth (Development)');
        foundGitHub = true;
      }
      // Skip old values, we'll add new ones
      continue;
    }
    newLines.push(line);
  }

  if (!foundGitHub) {
    newLines.push('');
    newLines.push('# GitHub OAuth (Development)');
  }

  newLines.push(`GITHUB_CLIENT_ID=${DEV_CREDENTIALS.clientId}`);
  newLines.push(`GITHUB_CLIENT_SECRET=${DEV_CREDENTIALS.clientSecret}`);
  newLines.push(`GITHUB_REDIRECT_URI=${DEV_CREDENTIALS.redirectUri}`);
  newLines.push(`GITHUB_TOKEN_ENCRYPTION_KEY=${ENCRYPTION_KEY}`);
  newLines.push(`NEXT_PUBLIC_URL=${DEV_CREDENTIALS.url}`);

  fs.writeFileSync(envLocalPath, newLines.join('\n') + '\n');

  console.log('✅ Development environment configured!');
  console.log(`   File: ${envLocalPath}`);
  console.log(`   Client ID: ${DEV_CREDENTIALS.clientId}`);
  console.log(`   Callback: ${DEV_CREDENTIALS.redirectUri}\n`);
}

/**
 * Setup production environment (Vercel)
 */
async function setupProd() {
  console.log('\n🌐 Setting up GitHub OAuth for Production (Vercel)...\n');

  // Check if vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('❌ Vercel CLI not found. Install it with: npm i -g vercel');
    console.log('\n   Or manually add these to Vercel Dashboard:');
    console.log('   Settings → Environment Variables → Production\n');
    printProdEnvVars();
    return;
  }

  console.log('📋 Adding environment variables to Vercel...\n');

  const envVars = [
    { key: 'GITHUB_CLIENT_ID', value: PROD_CREDENTIALS.clientId },
    { key: 'GITHUB_CLIENT_SECRET', value: PROD_CREDENTIALS.clientSecret },
    { key: 'GITHUB_REDIRECT_URI', value: PROD_CREDENTIALS.redirectUri },
    { key: 'NEXT_PUBLIC_URL', value: PROD_CREDENTIALS.url },
  ];

  for (const { key, value } of envVars) {
    try {
      console.log(`   Setting ${key}...`);
      execSync(
        `vercel env add ${key} production <<< "${value}"`,
        { stdio: 'pipe' }
      );
      console.log(`   ✅ ${key} set\n`);
    } catch (error) {
      // Try alternative method
      try {
        execSync(
          `echo "${value}" | vercel env add ${key} production`,
          { stdio: 'pipe' }
        );
        console.log(`   ✅ ${key} set\n`);
      } catch (err) {
        console.log(`   ⚠️  Failed to set ${key} automatically`);
        console.log(`   Manual: vercel env add ${key} production`);
        console.log(`   Value: ${value}\n`);
      }
    }
  }

  console.log('✅ Production environment configured!');
  console.log('   Environment: Production');
  console.log(`   Client ID: ${PROD_CREDENTIALS.clientId}`);
  console.log(`   Callback: ${PROD_CREDENTIALS.redirectUri}\n`);
  console.log('💡 Run: vercel --prod to deploy with new variables\n');
}

function printProdEnvVars() {
  console.log('   GITHUB_CLIENT_ID=' + PROD_CREDENTIALS.clientId);
  console.log('   GITHUB_CLIENT_SECRET: process.env.SECRET || ''   GITHUB_REDIRECT_URI=' + PROD_CREDENTIALS.redirectUri);
  console.log('   NEXT_PUBLIC_URL=' + PROD_CREDENTIALS.url);
  console.log('');
}

/**
 * Verify configuration
 */
async function verify() {
  console.log('\n🔍 Verifying GitHub OAuth Configuration...\n');

  // Check dev
  const envLocalPath = path.join(process.cwd(), 'website', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const hasClientId = content.includes(DEV_CREDENTIALS.clientId);
    const hasSecret = content.includes(DEV_CREDENTIALS.clientSecret);
    const hasRedirect = content.includes(DEV_CREDENTIALS.redirectUri);

    console.log('📁 Development (.env.local):');
    console.log(`   ${hasClientId ? '✅' : '❌'} Client ID`);
    console.log(`   ${hasSecret ? '✅' : '❌'} Client Secret`);
    console.log(`   ${hasRedirect ? '✅' : '❌'} Redirect URI\n`);
  } else {
    console.log('📁 Development (.env.local): ❌ Not found\n');
  }

  // Check prod (Vercel)
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    console.log('🌐 Production (Vercel):');
    console.log('   Run: vercel env ls');
    console.log('   Or check: https://vercel.com/dashboard\n');
  } catch (error) {
    console.log('🌐 Production (Vercel): ⚠️  Vercel CLI not installed\n');
  }
}

/**
 * Test connection
 */
async function test() {
  console.log('\n🧪 Testing GitHub OAuth Connection...\n');

  const envLocalPath = path.join(process.cwd(), 'website', '.env.local');
  if (!fs.existsSync(envLocalPath)) {
    console.log('❌ .env.local not found. Run: beast-mode github-oauth setup-dev\n');
    return;
  }

  // Check if dev server is running
  try {
    // Use node-fetch or https module for Node.js
    const https = require('https');
    const http = require('http');
    
    return new Promise((resolve) => {
      const req = http.get('http://localhost:7777/api/github/config', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const config = JSON.parse(data);
            console.log('✅ Dev server is running');
            console.log(`   Client ID: ${config.client_id ? '✅' : '❌'}`);
            console.log(`   Redirect URI: ${config.redirect_uri || 'Not set'}\n`);
            resolve();
          } catch (err) {
            console.log('⚠️  Dev server responded but config invalid');
            console.log('   Start it with: cd website && npm run dev\n');
            resolve();
          }
        });
      });
      
      req.on('error', () => {
        console.log('⚠️  Dev server not running');
        console.log('   Start it with: cd website && npm run dev\n');
        resolve();
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        console.log('⚠️  Dev server not responding');
        console.log('   Start it with: cd website && npm run dev\n');
        resolve();
      });
    });
  } catch (error) {
    console.log('⚠️  Dev server not running');
    console.log('   Start it with: cd website && npm run dev\n');
  }
}

/**
 * Show current configuration
 */
function show() {
  console.log('\n📋 GitHub OAuth Configuration\n');

  console.log('🔧 Development:');
  console.log(`   Client ID: ${DEV_CREDENTIALS.clientId}`);
  console.log(`   Client Secret: ${DEV_CREDENTIALS.clientSecret.substring(0, 8)}...`);
  console.log(`   Redirect URI: ${DEV_CREDENTIALS.redirectUri}`);
  console.log(`   URL: ${DEV_CREDENTIALS.url}\n`);

  console.log('🌐 Production:');
  console.log(`   Client ID: ${PROD_CREDENTIALS.clientId}`);
  console.log(`   Client Secret: ${PROD_CREDENTIALS.clientSecret.substring(0, 8)}...`);
  console.log(`   Redirect URI: ${PROD_CREDENTIALS.redirectUri}`);
  console.log(`   URL: ${PROD_CREDENTIALS.url}\n`);
}

// CLI Commands
const commands = {
  'setup-dev': setupDev,
  'setup-prod': setupProd,
  'setup': async () => {
    await setupDev();
    const answer = await question('\n🌐 Setup production too? (y/n): ');
    if (answer.toLowerCase() === 'y') {
      await setupProd();
    }
  },
  'verify': verify,
  'test': test,
  'show': show,
};

async function main() {
  const command = process.argv[2] || 'show';

  if (commands[command]) {
    try {
      await commands[command]();
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  } else {
    console.log('\n📖 GitHub OAuth CLI Commands:\n');
    console.log('   beast-mode github-oauth setup-dev   Setup development (.env.local)');
    console.log('   beast-mode github-oauth setup-prod   Setup production (Vercel)');
    console.log('   beast-mode github-oauth setup       Setup both (interactive)');
    console.log('   beast-mode github-oauth verify      Verify configuration');
    console.log('   beast-mode github-oauth test          Test connection');
    console.log('   beast-mode github-oauth show        Show current config\n');
  }

  rl.close();
}

if (require.main === module) {
  main();
}

module.exports = { setupDev, setupProd, verify, test, show };

