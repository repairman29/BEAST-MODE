#!/usr/bin/env node

/**
 * Test Payment Flow
 * 
 * Tests the complete payment flow from pricing page to checkout
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
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

async function testPaymentFlow() {
  console.log('\n💳 Testing Payment Flow\n');
  console.log('='.repeat(60));
  console.log(`\nTesting: ${BASE_URL}\n`);
  
  const results = {
    pricingPage: false,
    checkoutCreation: false,
    webhookConfig: false
  };
  
  // Test 1: Pricing Page
  console.log('1️⃣  Testing Pricing Page...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/pricing`);
    if (response.status === 200) {
      console.log('   ✅ Pricing page loads');
      results.pricingPage = true;
    } else {
      console.log(`   ❌ Pricing page failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Create Checkout Session
  console.log('\n2️⃣  Testing Checkout Session Creation...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/stripe/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        planId: 'pro'
      }
    });
    
    if (response.status === 200 && response.body.url) {
      console.log('   ✅ Checkout session created');
      console.log(`   📋 Checkout URL: ${response.body.url}`);
      results.checkoutCreation = true;
    } else if (response.status === 500 && response.body.error) {
      console.log(`   ⚠️  Checkout creation failed: ${response.body.error}`);
      if (response.body.message) {
        console.log(`      ${response.body.message}`);
      }
    } else {
      console.log(`   ❌ Unexpected response: ${response.status}`);
      console.log(`      Body: ${JSON.stringify(response.body).substring(0, 100)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 3: Verify Stripe Configuration
  console.log('\n3️⃣  Verifying Stripe Configuration...\n');
  if (STRIPE_SECRET_KEY) {
    console.log('   ✅ STRIPE_SECRET_KEY is set');
    if (STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      console.log('   ✅ Using test key (correct for testing)');
    } else if (STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      console.log('   ⚠️  Using LIVE key (be careful!)');
    }
    results.webhookConfig = true;
  } else {
    console.log('   ❌ STRIPE_SECRET_KEY not found');
    console.log('   💡 Set STRIPE_SECRET_KEY in environment');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results:\n');
  console.log(`   ${results.pricingPage ? '✅' : '❌'} Pricing Page`);
  console.log(`   ${results.checkoutCreation ? '✅' : '❌'} Checkout Creation`);
  console.log(`   ${results.webhookConfig ? '✅' : '❌'} Stripe Configuration`);
  
  const allPassed = Object.values(results).every(Boolean);
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('\n✅ Payment flow is ready for testing!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Visit pricing page in browser');
    console.log('   2. Click "Upgrade to Pro"');
    console.log('   3. Complete checkout with test card: 4242 4242 4242 4242');
    console.log('   4. Verify redirect back to dashboard');
    console.log('   5. Check Stripe dashboard for webhook event\n');
  } else {
    console.log('\n⚠️  Some tests failed. Fix issues above.\n');
  }
  
  return allPassed;
}

if (require.main === module) {
  testPaymentFlow()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPaymentFlow };
