#!/usr/bin/env node

/**
 * Credit Purchase API Test
 * 
 * Tests the credit purchase flow via API (no browser needed)
 * This is simpler than Playwright for testing the backend logic
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../website/.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://beast-mode.dev';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-id';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : require('http');
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testCreditPurchaseAPI() {
  console.log('\n🧪 Credit Purchase API Test\n');
  console.log('='.repeat(70));
  console.log(`\nTesting: ${BASE_URL}\n`);
  
  const results = {
    apiAccessible: false,
    checkoutCreated: false,
    webhookEndpoint: false
  };
  
  // Step 1: Test API endpoint accessibility
  console.log('📋 Step 1: Testing API endpoint...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/credits/purchase`, {
      method: 'POST',
      body: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_100_CREDITS || 'price_test',
        userId: TEST_USER_ID,
        email: TEST_EMAIL
      }
    });
    
    if (response.status === 400 || response.status === 401) {
      // Expected - means endpoint is working, just needs valid data
      results.apiAccessible = true;
      console.log(`   ✅ API endpoint accessible (${response.status})`);
      if (response.body.error) {
        console.log(`   📋 Response: ${response.body.error}`);
      }
    } else if (response.status === 200) {
      results.apiAccessible = true;
      results.checkoutCreated = true;
      console.log('   ✅ Checkout session created!');
      console.log(`   📋 Session ID: ${response.body.sessionId}`);
      console.log(`   💰 Credits: ${response.body.credits}`);
      console.log(`   🔗 Checkout URL: ${response.body.url?.substring(0, 60)}...`);
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Step 2: Test webhook endpoint
  console.log('\n📋 Step 2: Testing webhook endpoint...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/stripe/webhook`, {
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature'
      },
      body: { test: true }
    });
    
    // Webhook should return 400 or 401 (invalid signature) but endpoint should exist
    if (response.status < 500) {
      results.webhookEndpoint = true;
      console.log(`   ✅ Webhook endpoint accessible (${response.status})`);
    } else {
      console.log(`   ⚠️  Webhook endpoint: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Step 3: Test credit balance endpoint
  console.log('\n📋 Step 3: Testing credit balance endpoint...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/credits/balance?userId=${TEST_USER_ID}`);
    if (response.status === 200 || response.status === 401) {
      console.log(`   ✅ Balance endpoint accessible (${response.status})`);
      if (response.status === 200) {
        console.log(`   💰 Balance: ${response.body.balance || 0} credits`);
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Test Results:\n');
  console.log(`   ${results.apiAccessible ? '✅' : '❌'} API Endpoint`);
  console.log(`   ${results.checkoutCreated ? '✅' : '⏳'} Checkout Creation`);
  console.log(`   ${results.webhookEndpoint ? '✅' : '❌'} Webhook Endpoint`);
  
  console.log('\n' + '='.repeat(70));
  
  if (results.apiAccessible && results.webhookEndpoint) {
    console.log('\n✅ API endpoints are working!\n');
    console.log('💡 Next steps for full E2E test:');
    console.log('   1. Manually log in to beast-mode.dev');
    console.log('   2. Navigate to /dashboard/customer?tab=billing');
    console.log('   3. Click "Buy Credits"');
    console.log('   4. Complete Stripe checkout with test card: 4242 4242 4242 4242');
    console.log('   5. Verify webhook in Stripe dashboard');
    console.log('   6. Run: node scripts/monitor-production.js\n');
  } else {
    console.log('\n⚠️  Some endpoints need attention\n');
  }
  
  return results;
}

if (require.main === module) {
  testCreditPurchaseAPI()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCreditPurchaseAPI };
