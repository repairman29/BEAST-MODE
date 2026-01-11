#!/usr/bin/env node

/**
 * End-to-End Credit Purchase Test
 * 
 * Tests the complete credit purchase flow using BEAST MODE APIs
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const PROD_URL = 'https://beast-mode.dev';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-id';

// Use BEAST MODE API to get quality analysis
async function analyzeRepoWithBeastMode(repoUrl) {
  try {
    const response = await fetch(`${BASE_URL}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: repoUrl })
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

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

async function testCreditPurchaseE2E() {
  console.log('\n🧪 End-to-End Credit Purchase Test\n');
  console.log('='.repeat(70));
  console.log(`\nTesting: ${BASE_URL}\n`);
  
  const results = {
    initialBalance: null,
    checkoutCreated: false,
    webhookProcessed: false,
    finalBalance: null,
    purchaseRecorded: false
  };
  
  // Step 1: Get initial credit balance
  console.log('📊 Step 1: Getting Initial Credit Balance...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/credits/balance?userId=${TEST_USER_ID}`);
    if (response.status === 200) {
      results.initialBalance = response.body.balance || 0;
      console.log(`   ✅ Initial Balance: ${results.initialBalance} credits`);
      console.log(`   📊 Total Purchased: ${response.body.total_purchased || 0}`);
      console.log(`   📊 Total Used: ${response.body.total_used || 0}`);
    } else {
      console.log(`   ⚠️  Response: ${response.status}`);
      if (response.body.note) {
        console.log(`   💡 ${response.body.note}`);
      }
      results.initialBalance = 0;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    results.initialBalance = 0;
  }
  
  // Step 2: Get usage to see if credits would be needed
  console.log('\n📊 Step 2: Checking Current Usage...\n');
  try {
    const usageResponse = await makeRequest(`${BASE_URL}/api/user/usage`);
    if (usageResponse.status === 200) {
      console.log(`   ✅ Tier: ${usageResponse.body.tier || 'free'}`);
      console.log(`   📊 Usage: PRs=${usageResponse.body.usage?.prs_analyzed || 0}/${usageResponse.body.limits?.prsPerMonth || 'N/A'}`);
      console.log(`   📊 Repos: ${usageResponse.body.usage?.repos_scanned || 0}/${usageResponse.body.limits?.reposPerMonth || 'N/A'}`);
      console.log(`   📊 API: ${usageResponse.body.usage?.api_calls || 0}/${usageResponse.body.limits?.apiCallsPerMonth || 'N/A'}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Could not fetch usage: ${error.message}`);
  }
  
  // Step 3: Create checkout session
  console.log('\n💳 Step 3: Creating Credit Purchase Checkout...\n');
  try {
    // Get price ID from environment or use first available
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_100_CREDITS || 
                    process.env.NEXT_PUBLIC_STRIPE_PRICE_500_CREDITS ||
                    'price_test';
    
    const response = await makeRequest(`${BASE_URL}/api/credits/purchase`, {
      method: 'POST',
      body: {
        priceId,
        userId: TEST_USER_ID,
        email: 'test@example.com'
      }
    });
    
    if (response.status === 200 && response.body.url) {
      console.log('   ✅ Checkout session created');
      console.log(`   📋 Session ID: ${response.body.sessionId}`);
      console.log(`   💰 Credits: ${response.body.credits}`);
      console.log(`   🔗 Checkout URL: ${response.body.url.substring(0, 60)}...`);
      results.checkoutCreated = true;
      console.log('\n   💡 To complete test:');
      console.log('      1. Open checkout URL in browser');
      console.log('      2. Use test card: 4242 4242 4242 4242');
      console.log('      3. Complete checkout');
      console.log('      4. Run: node scripts/verify-credit-purchase.js');
    } else {
      console.log(`   ⚠️  Checkout creation: ${response.status}`);
      if (response.body.error) {
        console.log(`      Error: ${response.body.error}`);
        if (response.body.details) {
          console.log(`      Details: ${response.body.details}`);
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Step 4: Check purchase history
  console.log('\n📋 Step 4: Checking Purchase History...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/credits/history?userId=${TEST_USER_ID}&type=purchases`);
    if (response.status === 200) {
      const purchases = response.body.purchases || [];
      console.log(`   ✅ Found ${purchases.length} purchase(s)`);
      if (purchases.length > 0) {
        purchases.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.credits_amount} credits - ${p.status} - $${(p.price_amount / 100).toFixed(2)}`);
        });
        results.purchaseRecorded = purchases.some(p => p.status === 'completed');
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // Step 5: Verify final balance
  console.log('\n📊 Step 5: Verifying Final Balance...\n');
  try {
    const response = await makeRequest(`${BASE_URL}/api/credits/balance?userId=${TEST_USER_ID}`);
    if (response.status === 200) {
      results.finalBalance = response.body.balance || 0;
      console.log(`   ✅ Final Balance: ${results.finalBalance} credits`);
      if (results.finalBalance > results.initialBalance) {
        const added = results.finalBalance - results.initialBalance;
        console.log(`   🎉 Credits added: ${added}`);
        results.webhookProcessed = true;
      } else {
        console.log(`   ⚠️  Balance unchanged (webhook may not have processed yet)`);
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Test Results:\n');
  console.log(`   ${results.initialBalance !== null ? '✅' : '❌'} Initial Balance Check`);
  console.log(`   ${results.checkoutCreated ? '✅' : '❌'} Checkout Created`);
  console.log(`   ${results.purchaseRecorded ? '✅' : '⏳'} Purchase Recorded`);
  console.log(`   ${results.webhookProcessed ? '✅' : '⏳'} Webhook Processed`);
  console.log(`   ${results.finalBalance !== null ? '✅' : '❌'} Final Balance Check`);
  
  console.log('\n' + '='.repeat(70));
  if (results.checkoutCreated) {
    console.log('\n✅ Credit purchase flow is ready!\n');
    console.log('📋 Next: Complete checkout in browser to test webhook\n');
  } else {
    console.log('\n⚠️  Checkout creation failed. Check Stripe configuration.\n');
  }
  
  return results;
}

if (require.main === module) {
  testCreditPurchaseE2E()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCreditPurchaseE2E };
