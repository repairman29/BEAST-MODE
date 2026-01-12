#!/usr/bin/env node

/**
 * Store Rotated Secrets in Supabase
 * Saves all rotated secrets to the Supabase secrets table
 */

require('dotenv').config({ path: require('path').join(__dirname, '../website/.env.local') });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const secretsFile = path.join(__dirname, '../.rotated-secrets.json');

if (!fs.existsSync(secretsFile)) {
  console.error('❌ .rotated-secrets.json not found');
  process.exit(1);
}

const secrets = JSON.parse(fs.readFileSync(secretsFile, 'utf8'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = secrets.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function storeSecret(key, value, description) {
  try {
    // Upsert secret (update if exists, insert if not)
    // Note: category and environment fields may not exist if migration not applied
    const { data, error } = await supabase
      .from('secrets')
      .upsert({
        key,
        value,
        description,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to store ${key}:`, error.message);
      return false;
    }

    console.log(`✅ Stored ${key}`);
    return true;
  } catch (err) {
    console.error(`❌ Error storing ${key}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🔒 Storing Rotated Secrets in Supabase\n');
  console.log('======================================================================\n');

  const secretsToStore = [
    {
      key: 'stripe_webhookSecret',
      value: secrets.STRIPE_WEBHOOK_SECRET,
      description: 'Stripe Webhook Signing Secret (rotated 2026-01-12)',
      category: 'stripe',
    },
    {
      key: 'supabase_serviceRoleKey',
      value: secrets.SUPABASE_SERVICE_ROLE_KEY,
      description: 'Supabase Service Role Key (rotated 2026-01-12)',
      category: 'supabase',
    },
    {
      key: 'github_clientSecret',
      value: secrets.GITHUB_CLIENT_SECRET,
      description: 'GitHub OAuth Client Secret (rotated 2026-01-12)',
      category: 'github',
    },
    {
      key: 'github_clientId',
      value: secrets.GITHUB_CLIENT_ID,
      description: 'GitHub OAuth Client ID (rotated 2026-01-12)',
      category: 'github',
    },
    {
      key: 'github_tokenEncryptionKey',
      value: secrets.GITHUB_TOKEN_ENCRYPTION_KEY,
      description: 'GitHub Token Encryption Key (rotated 2026-01-12)',
      category: 'encryption',
    },
  ];

  let successCount = 0;
  for (const secret of secretsToStore) {
    if (secret.value) {
      const success = await storeSecret(
        secret.key,
        secret.value,
        secret.description
      );
      if (success) successCount++;
    }
  }

  console.log('\n======================================================================\n');
  console.log(`✅ Stored ${successCount}/${secretsToStore.length} secrets in Supabase\n`);

  if (successCount === secretsToStore.length) {
    console.log('🎉 All secrets stored successfully!');
    console.log('📝 Next: Update Vercel environment variables');
    console.log('   (Secrets are now in Supabase for reference)\n');
  } else {
    console.log('⚠️  Some secrets failed to store. Check errors above.\n');
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
