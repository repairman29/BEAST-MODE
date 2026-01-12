#!/usr/bin/env node

/**
 * Update Vercel Environment Variables with Rotated Secrets
 * Uses Vercel CLI to update all secrets
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const secretsFile = path.join(__dirname, '../.rotated-secrets.json');

if (!fs.existsSync(secretsFile)) {
  console.error('❌ .rotated-secrets.json not found');
  console.error('   Run the rotation script first or create the file manually');
  process.exit(1);
}

const secrets = JSON.parse(fs.readFileSync(secretsFile, 'utf8'));

console.log('🚀 Updating Vercel Environment Variables\n');
console.log('======================================================================\n');

// Check if Vercel CLI is available
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (err) {
  console.error('❌ Vercel CLI not found');
  console.error('   Install with: npm i -g vercel');
  console.error('   Or update manually at: https://vercel.com/dashboard\n');
  process.exit(1);
}

const secretsToUpdate = [
  { key: 'STRIPE_WEBHOOK_SECRET', value: secrets.STRIPE_WEBHOOK_SECRET },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', value: secrets.SUPABASE_SERVICE_ROLE_KEY },
  { key: 'GITHUB_CLIENT_SECRET', value: secrets.GITHUB_CLIENT_SECRET },
  { key: 'GITHUB_CLIENT_ID', value: secrets.GITHUB_CLIENT_ID },
  { key: 'GITHUB_TOKEN_ENCRYPTION_KEY', value: secrets.GITHUB_TOKEN_ENCRYPTION_KEY },
];

console.log('📋 Secrets to Update:\n');
secretsToUpdate.forEach(s => {
  if (s.value) {
    console.log(`   ✅ ${s.key}: ${s.value.substring(0, 20)}...`);
  } else {
    console.log(`   ⚠️  ${s.key}: MISSING`);
  }
});

console.log('\n======================================================================\n');
console.log('⚠️  Vercel CLI requires interactive input for security.\n');
console.log('📝 Run these commands manually:\n');

secretsToUpdate.forEach(secret => {
  if (secret.value) {
    console.log(`vercel env add ${secret.key} production preview development --yes`);
    console.log(`(When prompted, paste: ${secret.value})\n`);
  }
});

console.log('======================================================================\n');
console.log('💡 Alternative: Update via Vercel Dashboard');
console.log('   1. Go to: https://vercel.com/dashboard');
console.log('   2. Select project: beast-mode-website');
console.log('   3. Settings → Environment Variables');
console.log('   4. Update each variable with the values from .rotated-secrets.json\n');
