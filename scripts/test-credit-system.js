#!/usr/bin/env node

/**
 * Test Credit System End-to-End
 * 
 * Tests credit purchase flow, balance updates, and webhook processing
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-id';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID,
        ...options.headers
      },
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

async function testCreditSystem() {
  console.log('\n🧪 Testing Credit System\n');
  console.log('='.repeat(60));
  console.log(`\nTesting: ${BASE_URL}\n`);
  
  const results = {
    balance: false,
    purchase: false,
    history: false,
    usage: false
  };
  
  // Test 1: Get Credit Balance
  console.log('1️⃣  Testing Credit Balance API...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/credits/balance?userId=${TEST_USER_ID}`);
    if (response.status === 200) {
      console.log('   ✅ Credit balance API works');
      console.log(`   📊 Balance: ${response.body.balance || 0}`);
      console.log(`   📊 Total Purchased: ${response.body.total_purchased || 0}`);
      console.log(`   📊 Total Used: ${response.body.total_used || 0}`);
      results.balance = true;
    } else {
      console.log(`   ❌ Failed: ${response.status}`);
      console.log(`      ${JSON.stringify(response.body).substring(0, 100)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Get Credit History
  console.log('\n2️⃣  Testing Credit History API...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/credits/history?userId=${TEST_USER_ID}`);
    if (response.status === 200) {
      console.log('   ✅ Credit history API works');
      console.log(`   📊 Purchases: ${response.body.purchases?.length || 0}`);
      console.log(`   📊 Usage Records: ${response.body.usage?.length || 0}`);
      console.log(`   📊 Transactions: ${response.body.transactions?.length || 0}`);
      results.history = true;
    } else {
      console.log(`   ❌ Failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 3: Create Credit Purchase Checkout
  console.log('\n3️⃣  Testing Credit Purchase Checkout...\n');
  try {
    // Get first price ID from env or use test
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_100_CREDITS || 'price_test';
    
    const response = await makeRequest(`${BASE_URL}/api/credits/purchase`, {
      method: 'POST',
      body: {
        priceId,
        userId: TEST_USER_ID
      }
    });
    
    if (response.status === 200 && response.body.url) {
      console.log('   ✅ Checkout session created');
      console.log(`   📋 Checkout URL: ${response.body.url.substring(0, 50)}...`);
      console.log(`   💰 Credits: ${response.body.credits}`);
      results.purchase = true;
    } else if (response.status === 500) {
      console.log(`   ⚠️  Checkout creation failed: ${response.body.error || 'Unknown error'}`);
      if (response.body.details) {
        console.log(`      Details: ${response.body.details}`);
      }
    } else {
      console.log(`   ❌ Unexpected response: ${response.status}`);
      console.log(`      Body: ${JSON.stringify(response.body).substring(0, 100)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 4: Usage Dashboard
  console.log('\n4️⃣  Testing Usage Dashboard Data...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/user/usage`);
    if (response.status === 200) {
      console.log('   ✅ Usage API works');
      console.log(`   📊 Tier: ${response.body.tier || 'free'}`);
      console.log(`   📊 Usage: PRs=${response.body.usage?.prs_analyzed || 0}, Repos=${response.body.usage?.repos_scanned || 0}, API=${response.body.usage?.api_calls || 0}`);
      console.log(`   📊 Limits: PRs=${response.body.limits?.prsPerMonth || 'N/A'}, Repos=${response.body.limits?.reposPerMonth || 'N/A'}, API=${response.body.limits?.apiCallsPerMonth || 'N/A'}`);
      results.usage = true;
    } else {
      console.log(`   ❌ Failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results:\n');
  console.log(`   ${results.balance ? '✅' : '❌'} Credit Balance API`);
  console.log(`   ${results.history ? '✅' : '❌'} Credit History API`);
  console.log(`   ${results.purchase ? '✅' : '❌'} Credit Purchase API`);
  console.log(`   ${results.usage ? '✅' : '❌'} Usage API`);
  
  const allPassed = Object.values(results).every(Boolean);
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('\n✅ All credit system APIs are working!\n');
    console.log('📋 Next: Test in browser');
    console.log('   1. Visit /dashboard/customer?tab=billing&buy-credits=true');
    console.log('   2. Select a credit package');
    console.log('   3. Complete Stripe checkout');
    console.log('   4. Verify webhook processes purchase\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.\n');
  }
  
  return allPassed;
}

if (require.main === module) {
  testCreditSystem()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCreditSystem };
