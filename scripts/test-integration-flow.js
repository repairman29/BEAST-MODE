#!/usr/bin/env node

/**
 * Test Integration Flow
 * 
 * Tests GitHub App, payment flow, and usage tracking
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

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

async function testIntegrationFlow() {
  console.log('\n🔗 Testing Integration Flow\n');
  console.log('='.repeat(60));
  console.log(`\nTesting: ${BASE_URL}\n`);
  
  const results = {
    githubWebhook: false,
    paymentCheckout: false,
    subscription: false,
    usage: false
  };
  
  // Test 1: GitHub Webhook
  console.log('1️⃣  Testing GitHub Webhook Endpoint...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/github/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-github-event': 'ping'
      },
      body: { action: 'ping' }
    });
    
    if (response.status === 200) {
      console.log('   ✅ GitHub webhook endpoint accessible');
      results.githubWebhook = true;
    } else {
      console.log(`   ⚠️  Response: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Payment Checkout
  console.log('\n2️⃣  Testing Payment Checkout...\n');
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
      console.log(`   📋 URL: ${response.body.url.substring(0, 50)}...`);
      results.paymentCheckout = true;
    } else {
      console.log(`   ⚠️  Response: ${response.status}`);
      if (response.body.error) {
        console.log(`      Error: ${response.body.error}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 3: Subscription API
  console.log('\n3️⃣  Testing Subscription API...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/user/subscription`, {
      headers: {
        'x-user-id': 'test-user'
      }
    });
    
    if (response.status === 200) {
      console.log('   ✅ Subscription API works');
      console.log(`   📊 Tier: ${response.body.subscription?.tier || 'free'}`);
      results.subscription = true;
    } else {
      console.log(`   ⚠️  Response: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 4: Usage API
  console.log('\n4️⃣  Testing Usage API...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/user/usage`, {
      headers: {
        'x-user-id': 'test-user'
      }
    });
    
    if (response.status === 200) {
      console.log('   ✅ Usage API works');
      console.log(`   📊 Tier: ${response.body.tier || 'free'}`);
      results.usage = true;
    } else {
      console.log(`   ⚠️  Response: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results:\n');
  console.log(`   ${results.githubWebhook ? '✅' : '❌'} GitHub Webhook`);
  console.log(`   ${results.paymentCheckout ? '✅' : '❌'} Payment Checkout`);
  console.log(`   ${results.subscription ? '✅' : '❌'} Subscription API`);
  console.log(`   ${results.usage ? '✅' : '❌'} Usage API`);
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📈 Pass Rate: ${passed}/${total} (${Math.round(passed/total*100)}%)\n`);
  
  return passed === total;
}

if (require.main === module) {
  testIntegrationFlow()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testIntegrationFlow };
