#!/usr/bin/env node

/**
 * Rotate Secrets using Vercel CLI
 * 
 * Simpler alternative that uses Vercel CLI commands
 * 
 * Usage:
 *   node scripts/rotate-secrets-vercel-cli.js
 * 
 * Prerequisites:
 *   - Vercel CLI installed and authenticated
 *   - Run from website/ directory or set VERCEL_PROJECT
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function rotateWithVercelCLI() {
  log('\n🔒 Secret Rotation via Vercel CLI\n', 'cyan');

  // Check if Vercel CLI is available
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (err) {
    error('Vercel CLI not found. Install with: npm i -g vercel');
    process.exit(1);
  }

  const secrets = [];

  // 1. Stripe Webhook Secret
  info('\n1. Stripe Webhook Secret');
  warn('   You need to create a new webhook in Stripe Dashboard');
  warn('   URL: https://dashboard.stripe.com/webhooks');
  const stripeSecret = await prompt('   Enter new STRIPE_WEBHOOK_SECRET (whsec_...): ');
  if (stripeSecret && stripeSecret.trim()) {
    secrets.push({ key: 'STRIPE_WEBHOOK_SECRET', value: stripeSecret.trim() });
  }

  // 2. Supabase Service Role Key
  info('\n2. Supabase Service Role Key');
  warn('   Regenerate in Supabase Dashboard: Project Settings → API');
  warn('   URL: https://supabase.com/dashboard');
  const supabaseKey = await prompt('   Enter new SUPABASE_SERVICE_ROLE_KEY (sb_secret_...): ');
  if (supabaseKey && supabaseKey.trim()) {
    secrets.push({ key: 'SUPABASE_SERVICE_ROLE_KEY', value: supabaseKey.trim() });
  }

  // 3. GitHub OAuth Client Secret
  info('\n3. GitHub OAuth Client Secret');
  warn('   Regenerate in GitHub: Settings → Developer settings → OAuth Apps');
  warn('   URL: https://github.com/settings/developers');
  const githubSecret = await prompt('   Enter new GITHUB_CLIENT_SECRET: ');
  if (githubSecret && githubSecret.trim()) {
    secrets.push({ key: 'GITHUB_CLIENT_SECRET', value: githubSecret.trim() });
  }

  // 4. GitHub Token Encryption Key (auto-generate)
  info('\n4. GitHub Token Encryption Key');
  const newEncryptionKey = crypto.randomBytes(32).toString('hex');
  success(`   Generated: ${newEncryptionKey}`);
  warn('   ⚠️  Existing encrypted tokens will be invalid!');
  secrets.push({ key: 'GITHUB_TOKEN_ENCRYPTION_KEY', value: newEncryptionKey });

  // Update Vercel
  if (secrets.length === 0) {
    error('No secrets provided. Exiting.');
    process.exit(1);
  }

  log('\n📝 Updating Vercel Environment Variables...\n', 'cyan');

  for (const secret of secrets) {
    try {
      info(`Updating ${secret.key}...`);
      
      // Use Vercel CLI to set environment variable
      // Note: Vercel CLI doesn't have a direct way to update, so we'll use the API
      // Or we can provide instructions
      
      const command = `vercel env add ${secret.key} production preview development --yes`;
      log(`   Run: ${command}`, 'yellow');
      log(`   Value: ${secret.value}\n`, 'yellow');
    } catch (err) {
      error(`Failed to update ${secret.key}: ${err.message}`);
    }
  }

  log('\n✅ Manual Steps:\n', 'green');
  log('1. For each secret above, run the Vercel CLI command shown', 'yellow');
  log('2. Or update via Vercel Dashboard: https://vercel.com/dashboard', 'yellow');
  log('3. Redeploy: cd website && vercel --prod --yes\n', 'yellow');

  // Also save to a temporary file for reference
  const fs = require('fs');
  const tempFile = '/tmp/rotated-secrets.json';
  fs.writeFileSync(tempFile, JSON.stringify(secrets, null, 2));
  log(`📄 Secrets saved to: ${tempFile}`, 'cyan');
  warn('   ⚠️  Delete this file after updating Vercel!');
}

if (require.main === module) {
  rotateWithVercelCLI().catch(err => {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { rotateWithVercelCLI };
