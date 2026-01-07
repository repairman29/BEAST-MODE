#!/usr/bin/env node

/**
 * Check Resend Status for BEAST MODE
 * 
 * Checks:
 * - Domain verification status
 * - API key availability
 * - Email addresses configuration
 * - Supabase configuration
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DOMAIN = 'beast-mode.dev';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Get Resend API key from Supabase
 */
async function getResendApiKey() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    log('❌ Missing Supabase credentials!', 'red');
    log('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local', 'yellow');
    return null;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get Resend API key from user_api_keys table
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('provider', 'resend')
      .limit(1)
      .single();

    if (error || !data) {
      log('⚠️  No Resend API key found in Supabase', 'yellow');
      return null;
    }

    // Decrypt API key (simplified - actual decryption would use AES-256-GCM)
    log('✅ Resend API key found in Supabase', 'green');
    return data.encrypted_key; // In production, decrypt this
  } catch (error) {
    log(`❌ Error getting API key: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Check domain status in Resend
 */
async function checkDomainStatus(apiKey) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.resend.com',
      path: '/domains',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const domain = response.data?.find((d) => d.name === DOMAIN);
          resolve(domain || null);
        } catch (error) {
          log(`❌ Error parsing response: ${error.message}`, 'red');
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      log(`❌ Error checking domain: ${error.message}`, 'red');
      resolve(null);
    });

    req.end();
  });
}

/**
 * Check email service configuration in Supabase
 */
async function checkEmailConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data, error } = await supabase
      .from('email_service_config')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  log('\n📧 BEAST MODE Resend Status Check\n', 'cyan');
  log('Domain: beastmode.dev', 'blue');
  log('='.repeat(60) + '\n');

  // Check API key
  log('1. Checking Resend API Key...', 'cyan');
  const apiKey = await getResendApiKey();
  if (!apiKey) {
    log('   ⚠️  No API key found. Store it with:', 'yellow');
    log('      node scripts/store-resend-key.js re_YOUR_API_KEY', 'yellow');
  }

  // Check domain status
  if (apiKey) {
    log('\n2. Checking Domain Status...', 'cyan');
    const domain = await checkDomainStatus(apiKey);
    if (domain) {
      log(`   ✅ Domain found: ${domain.name}`, 'green');
      log(`   Status: ${domain.status}`, domain.status === 'verified' ? 'green' : 'yellow');
      if (domain.records) {
        log(`   DNS Records:`, 'cyan');
        domain.records.forEach((record) => {
          const status = record.valid ? '✅' : '❌';
          log(`      ${status} ${record.type}: ${record.name}`, record.valid ? 'green' : 'red');
        });
      }
    } else {
      log(`   ❌ Domain ${DOMAIN} not found in Resend`, 'red');
      log('   Action: Add domain at https://resend.com/domains', 'yellow');
    }
  }

  // Check email config
  log('\n3. Checking Email Service Configuration...', 'cyan');
  const emailConfig = await checkEmailConfig();
  if (emailConfig) {
    log('   ✅ Email service configured', 'green');
    log(`   From: ${emailConfig.from_email || 'Not set'}`, 'cyan');
    log(`   Reply-To: ${emailConfig.reply_to_email || 'Not set'}`, 'cyan');
    log(`   Provider: ${emailConfig.provider || 'Not set'}`, 'cyan');
  } else {
    log('   ⚠️  No email service configuration found', 'yellow');
    log('   Action: Configure email service', 'yellow');
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📋 Required Email Addresses:', 'cyan');
  log('   - notifications@beastmode.dev (sending)', 'blue');
  log('   - support@beastmode.dev (receiving)', 'blue');
  log('   - security@beastmode.dev (receiving)', 'blue');
  log('   - admin@beastmode.dev (optional)', 'blue');
  
  log('\n📚 Documentation:', 'cyan');
  log('   - docs/RESEND_EMAIL_SETUP.md', 'blue');
  log('   - docs/RESEND_EXPERT_ONBOARDING.md', 'blue');
  
  log('\n');
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

