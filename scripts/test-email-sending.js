#!/usr/bin/env node

/**
 * Test Email Sending for BEAST MODE
 * 
 * Sends a test email using Resend
 * 
 * Usage:
 *   node scripts/test-email-sending.js recipient@example.com
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RECIPIENT = process.argv[2];

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

/**
 * Get Resend API key from Supabase
 */
async function getResendApiKey() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    log('❌ Missing Supabase credentials!', 'red');
    return null;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('provider', 'resend')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error || !data) {
      log('❌ No Resend API key found in Supabase', 'red');
      log('   Run: node scripts/setup-resend-addresses.js re_YOUR_API_KEY', 'yellow');
      return null;
    }

    // Decrypt (simplified - actual decryption would use AES-256-GCM)
    // For now, assume encrypted_key contains the actual key (development)
    return data.encrypted_key;
  } catch (error) {
    log(`❌ Error getting API key: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Send test email via Resend API
 */
function sendEmail(apiKey, recipient) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      from: 'notifications@beast-mode.dev',
      to: recipient,
      subject: 'BEAST MODE - Test Email',
      html: `
        <h1>🎉 BEAST MODE Test Email</h1>
        <p>This is a test email from BEAST MODE.</p>
        <p>If you received this, your email configuration is working!</p>
        <hr>
        <p><small>Sent from BEAST MODE email system</small></p>
      `,
      reply_to: 'support@beast-mode.dev'
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(response);
          } else {
            reject(new Error(response.message || 'Failed to send email'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  log('\n📧 BEAST MODE Email Test\n', 'cyan');
  log('='.repeat(60) + '\n');

  if (!RECIPIENT) {
    log('❌ Recipient email required!', 'red');
    log('   Usage: node scripts/test-email-sending.js recipient@example.com', 'yellow');
    process.exit(1);
  }

  log(`Recipient: ${RECIPIENT}`, 'cyan');
  log('Getting API key...', 'cyan');
  
  const apiKey = await getResendApiKey();
  if (!apiKey) {
    process.exit(1);
  }

  log('Sending test email...', 'cyan');
  
  try {
    const result = await sendEmail(apiKey, RECIPIENT);
    log('\n✅ Email sent successfully!', 'green');
    log(`   Email ID: ${result.id}`, 'cyan');
    log(`   Check inbox: ${RECIPIENT}`, 'cyan');
  } catch (error) {
    log(`\n❌ Failed to send email: ${error.message}`, 'red');
    if (error.message.includes('domain')) {
      log('\n⚠️  Domain not verified?', 'yellow');
      log('   Action: Verify domain at https://resend.com/domains', 'yellow');
    }
    process.exit(1);
  }

  log('\n');
}

main();

