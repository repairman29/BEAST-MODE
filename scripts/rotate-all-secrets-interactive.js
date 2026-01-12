#!/usr/bin/env node

/**
 * Interactive Secret Rotation Script
 * Guides you through rotating all exposed secrets
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
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

async function rotateStripeWebhook() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('1️⃣  STRIPE WEBHOOK SECRET', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  info('Option A: Use automated script (recommended)');
  log('   Run: node scripts/rotate-stripe-webhook-secret.js\n', 'yellow');

  info('Option B: Manual rotation');
  log('   1. Go to: https://dashboard.stripe.com/webhooks', 'yellow');
  log('   2. Find your webhook endpoint', 'yellow');
  log('   3. Click "Add endpoint" to create a new one', 'yellow');
  log('   4. Copy the new signing secret (whsec_...)\n', 'yellow');

  const secret = await prompt('Enter new STRIPE_WEBHOOK_SECRET (or press Enter to skip): ');
  return secret.trim() || null;
}

async function rotateSupabaseKey() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('2️⃣  SUPABASE SERVICE ROLE KEY', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  warn('⚠️  CRITICAL: This key has full database access!');
  log('   Regenerate immediately if exposed.\n', 'yellow');

  info('Steps:');
  log('   1. Go to: https://supabase.com/dashboard', 'yellow');
  log('   2. Select your project', 'yellow');
  log('   3. Settings → API', 'yellow');
  log('   4. Find "service_role" key (⚠️ Secret, not anon key)', 'yellow');
  log('   5. Click "Reset" to regenerate', 'yellow');
  log('   6. Copy the new key (sb_secret_...)\n', 'yellow');

  const key = await prompt('Enter new SUPABASE_SERVICE_ROLE_KEY (or press Enter to skip): ');
  return key.trim() || null;
}

async function rotateGitHubOAuth() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('3️⃣  GITHUB OAUTH CLIENT SECRET', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  info('Steps:');
  log('   1. Go to: https://github.com/settings/developers', 'yellow');
  log('   2. Click on your OAuth App', 'yellow');
  log('   3. Click "Generate a new client secret"', 'yellow');
  log('   4. Copy the new secret\n', 'yellow');

  const secret = await prompt('Enter new GITHUB_CLIENT_SECRET (or press Enter to skip): ');
  return secret.trim() || null;
}

function generateEncryptionKey() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('4️⃣  GITHUB TOKEN ENCRYPTION KEY', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  const newKey = crypto.randomBytes(32).toString('hex');
  success(`Generated new encryption key: ${newKey}\n`);
  warn('⚠️  WARNING: Existing encrypted tokens will be invalid!');
  log('   Users will need to re-authenticate with GitHub.\n', 'yellow');

  return newKey;
}

async function updateVercelEnvVar(key, value) {
  log(`\n📝 Updating ${key} in Vercel...\n`, 'cyan');

  // Check if Vercel CLI is available
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (err) {
    warn('Vercel CLI not found. Install with: npm i -g vercel');
    log('\n📋 Manual Update Steps:', 'yellow');
    log('   1. Go to: https://vercel.com/dashboard', 'yellow');
    log('   2. Select project: beast-mode-website', 'yellow');
    log('   3. Settings → Environment Variables', 'yellow');
    log(`   4. Update ${key} with value: ${value.substring(0, 20)}...\n`, 'yellow');
    return false;
  }

  try {
    // Use Vercel CLI to add/update env var
    // Note: Vercel CLI doesn't support direct value input, so we'll use echo
    const command = `echo "${value}" | vercel env add ${key} production preview development --yes`;
    log(`Running: vercel env add ${key}`, 'yellow');
    log('When prompted, paste the value shown above\n', 'yellow');
    
    // Actually, Vercel CLI requires interactive input, so we'll just show instructions
    log('📋 Vercel CLI Command:', 'cyan');
    log(`   vercel env add ${key} production preview development --yes`, 'yellow');
    log(`   (When prompted, paste: ${value})\n`, 'yellow');
    
    return true;
  } catch (err) {
    error(`Failed to update ${key}: ${err.message}`);
    return false;
  }
}

async function main() {
  log('\n🔒 Interactive Secret Rotation Script\n', 'cyan');
  log('This script will guide you through rotating all exposed secrets.\n', 'yellow');

  const secrets = {};

  // 1. Stripe
  const stripeSecret = await rotateStripeWebhook();
  if (stripeSecret) {
    secrets.STRIPE_WEBHOOK_SECRET = stripeSecret;
  }

  // 2. Supabase
  const supabaseKey = await rotateSupabaseKey();
  if (supabaseKey) {
    secrets.SUPABASE_SERVICE_ROLE_KEY = supabaseKey;
  }

  // 3. GitHub OAuth
  const githubSecret = await rotateGitHubOAuth();
  if (githubSecret) {
    secrets.GITHUB_CLIENT_SECRET = githubSecret;
  }

  // 4. Encryption Key (auto-generated)
  secrets.GITHUB_TOKEN_ENCRYPTION_KEY = generateEncryptionKey();

  // Summary
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('📋 ROTATION SUMMARY', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  for (const [key, value] of Object.entries(secrets)) {
    if (value) {
      success(`${key}: ${value.substring(0, 20)}...`);
    }
  }

  // Update Vercel
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('🚀 UPDATING VERCEL', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  for (const [key, value] of Object.entries(secrets)) {
    if (value) {
      await updateVercelEnvVar(key, value);
    }
  }

  // Save to file for reference
  const tempFile = path.join(__dirname, '../.rotated-secrets.json');
  fs.writeFileSync(tempFile, JSON.stringify(secrets, null, 2));
  log(`\n📄 Secrets saved to: ${tempFile}`, 'cyan');
  warn('   ⚠️  Delete this file after updating Vercel!\n');

  // Final instructions
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
  log('✅ ROTATION COMPLETE', 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'green');

  log('📝 Final Steps:', 'yellow');
  log('   1. Update all secrets in Vercel (use commands shown above)', 'yellow');
  log('   2. Redeploy: cd website && vercel --prod --yes', 'yellow');
  log('   3. Test all services:', 'yellow');
  log('      • GitHub OAuth login', 'yellow');
  log('      • Stripe webhooks', 'yellow');
  log('      • Supabase connections', 'yellow');
  log('   4. Delete .rotated-secrets.json file\n', 'yellow');
}

if (require.main === module) {
  main().catch(err => {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };
