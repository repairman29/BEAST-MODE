#!/usr/bin/env node

/**
 * Test GitHub App Webhook
 * 
 * Simulates a GitHub webhook event to test the webhook handler
 */

const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;
const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/github/webhook';

if (!webhookSecret) {
  console.error('❌ GITHUB_APP_WEBHOOK_SECRET not set in .env.local');
  process.exit(1);
}

/**
 * Generate webhook signature
 */
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return digest;
}

/**
 * Create test PR event payload
 */
function createTestPREvent() {
  return {
    action: 'opened',
    pull_request: {
      number: 123,
      head: {
        sha: 'abc123def456',
        ref: 'feature/test-pr'
      },
      base: {
        ref: 'main'
      },
      title: 'Test PR for BEAST MODE',
      body: 'This is a test PR to verify GitHub App integration',
      user: {
        login: 'test-user',
        id: 12345
      }
    },
    repository: {
      id: 123456,
      name: 'test-repo',
      full_name: 'test-org/test-repo',
      owner: {
        login: 'test-org',
        id: 67890
      }
    },
    installation: {
      id: 11111
    }
  };
}

/**
 * Send test webhook
 */
async function sendTestWebhook() {
  console.log('\n🧪 Testing GitHub App Webhook\n');
  console.log('='.repeat(50));
  
  const payload = createTestPREvent();
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, webhookSecret);
  
  console.log('\n📋 Test Event:');
  console.log(`   Event: pull_request`);
  console.log(`   Action: ${payload.action}`);
  console.log(`   PR #: ${payload.pull_request.number}`);
  console.log(`   Repo: ${payload.repository.full_name}`);
  console.log(`   SHA: ${payload.pull_request.head.sha}`);
  console.log(`\n📡 Webhook URL: ${webhookUrl}`);
  
  try {
    const fetch = require('node-fetch');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'pull_request',
        'X-GitHub-Delivery': `test-${Date.now()}`,
        'X-Hub-Signature-256': signature
      },
      body: payloadString
    });
    
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    console.log(`\n📊 Response:`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Body: ${JSON.stringify(responseData, null, 2)}`);
    
    if (response.ok) {
      console.log('\n✅ Webhook test successful!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Check webhook logs for processing');
      console.log('   2. Verify PR comment was posted (if app is installed)');
      console.log('   3. Verify status check was created (if app is installed)');
      console.log('   4. Test with real GitHub repository\n');
    } else {
      console.log('\n⚠️  Webhook returned error status');
      console.log('   Check server logs for details\n');
    }
    
    return response.ok;
  } catch (error) {
    console.error('\n❌ Error sending webhook:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Development server is running (npm run dev)');
    console.log('   2. Webhook URL is correct');
    console.log('   3. GITHUB_APP_WEBHOOK_SECRET is set correctly\n');
    return false;
  }
}

if (require.main === module) {
  sendTestWebhook()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { sendTestWebhook, createTestPREvent };
