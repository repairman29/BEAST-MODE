#!/usr/bin/env node

/**
 * Setup Resend Email Addresses for BEAST MODE
 * 
 * Configures all email addresses in Supabase
 * Stores API key and email service configuration
 * 
 * Usage:
 *   node scripts/setup-resend-addresses.js re_YOUR_API_KEY
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.argv[2];

const DOMAIN = 'beastmode.dev';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Email addresses configuration
const EMAIL_ADDRESSES = {
  primary: {
    address: 'notifications@beastmode.dev',
    name: 'BEAST MODE',
    purpose: 'Primary sending address for all transactional emails',
    replyTo: 'support@beastmode.dev',
    type: 'sending'
  },
  support: {
    address: 'support@beastmode.dev',
    name: 'BEAST MODE Support',
    purpose: 'Customer support inquiries and reply-to address',
    type: 'receiving'
  },
  security: {
    address: 'security@beastmode.dev',
    name: 'BEAST MODE Security',
    purpose: 'Security-related inquiries and vulnerability reports',
    type: 'receiving'
  },
  admin: {
    address: 'admin@beastmode.dev',
    name: 'BEAST MODE Admin',
    purpose: 'Administrative communications (optional)',
    type: 'receiving'
  }
};

/**
 * Encrypt API key
 */
function encryptApiKey(apiKey, encryptionKey) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Main function
 */
async function main() {
  log('\n📧 BEAST MODE Resend Email Setup\n', 'cyan');
  log('='.repeat(60) + '\n');

  if (!API_KEY) {
    log('❌ Resend API key required!', 'red');
    log('   Usage: node scripts/setup-resend-addresses.js re_YOUR_API_KEY', 'yellow');
    process.exit(1);
  }

  if (!API_KEY.startsWith('re_')) {
    log('⚠️  Warning: API key should start with "re_"', 'yellow');
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    log('❌ Missing Supabase credentials!', 'red');
    log('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local', 'yellow');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || 'default_key_change_in_production';

  try {
    // Encrypt API key
    log('1. Encrypting API key...', 'cyan');
    const encrypted = encryptApiKey(API_KEY, encryptionKey);
    const encryptedKey = JSON.stringify(encrypted);

    // Store in user_api_keys table
    log('2. Storing API key in Supabase...', 'cyan');
    const { data: existingKey } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('provider', 'resend')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (existingKey) {
      // Update existing key
      const { error } = await supabase
        .from('user_api_keys')
        .update({
          encrypted_key: encryptedKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingKey.id);

      if (error) throw error;
      log('   ✅ Updated existing Resend API key', 'green');
    } else {
      // Insert new key
      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          provider: 'resend',
          encrypted_key: encryptedKey,
          is_active: true,
          user_id: null // System key
        });

      if (error) throw error;
      log('   ✅ Stored new Resend API key', 'green');
    }

    // Configure email service
    log('3. Configuring email service...', 'cyan');
    const { data: existingConfig } = await supabase
      .from('email_service_config')
      .select('id')
      .eq('provider', 'resend')
      .limit(1)
      .maybeSingle();

    const emailConfig = {
      provider: 'resend',
      api_key_encrypted: encryptedKey,
      from_email: EMAIL_ADDRESSES.primary.address,
      from_name: EMAIL_ADDRESSES.primary.name,
      reply_to_email: EMAIL_ADDRESSES.primary.replyTo,
      is_active: true
    };

    if (existingConfig) {
      const { error } = await supabase
        .from('email_service_config')
        .update(emailConfig)
        .eq('id', existingConfig.id);

      if (error) throw error;
      log('   ✅ Updated email service configuration', 'green');
    } else {
      const { error } = await supabase
        .from('email_service_config')
        .insert(emailConfig);

      if (error) throw error;
      log('   ✅ Created email service configuration', 'green');
    }

    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('\n✅ Setup Complete!\n', 'green');
    log('📋 Configured Email Addresses:', 'cyan');
    log(`   📤 Sending: ${EMAIL_ADDRESSES.primary.address}`, 'green');
    log(`   📥 Receiving: ${EMAIL_ADDRESSES.support.address}`, 'blue');
    log(`   📥 Receiving: ${EMAIL_ADDRESSES.security.address}`, 'blue');
    log(`   📥 Receiving: ${EMAIL_ADDRESSES.admin.address} (optional)`, 'blue');
    
    log('\n📋 Next Steps:', 'cyan');
    log('   1. Add domain to Resend: https://resend.com/domains', 'yellow');
    log('   2. Add DNS records (DKIM, SPF, DMARC)', 'yellow');
    log('   3. Verify domain in Resend dashboard', 'yellow');
    log('   4. Test email sending:', 'yellow');
    log('      node scripts/test-email-sending.js your-email@example.com', 'yellow');
    
    log('\n📚 Documentation:', 'cyan');
    log('   - docs/RESEND_EMAIL_SETUP.md', 'blue');
    log('   - docs/RESEND_EXPERT_ONBOARDING.md', 'blue');
    
    log('\n');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    if (error.details) {
      log(`   Details: ${error.details}`, 'red');
    }
    process.exit(1);
  }
}

main();

