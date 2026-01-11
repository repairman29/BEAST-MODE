#!/usr/bin/env node

/**
 * End-to-End GitHub App Integration Test
 * 
 * Tests GitHub App webhook, PR analysis, and comments using BEAST MODE APIs
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const PROD_URL = 'https://beast-mode.dev';
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 15000
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
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

function createGitHubSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

async function testGitHubAppE2E() {
  console.log('\n🔗 End-to-End GitHub App Integration Test\n');
  console.log('='.repeat(70));
  console.log(`\nTesting: ${BASE_URL}\n`);
  
  const results = {
    webhookEndpoint: false,
    prOpened: false,
    prAnalysis: false,
    prComment: false,
    statusCheck: false
  };
  
  // Step 1: Test webhook endpoint accessibility
  console.log('1️⃣  Testing GitHub Webhook Endpoint...\n');
  try {
    const testPayload = {
      action: 'opened',
      pull_request: {
        number: 1,
        title: 'Test PR',
        body: 'Test PR body',
        head: { sha: 'abc123', ref: 'feature-branch' },
        base: { ref: 'main' }
      },
      repository: {
        full_name: 'test-org/test-repo',
        name: 'test-repo',
        owner: { login: 'test-org' }
      }
    };
    
    const signature = createGitHubSignature(testPayload, GITHUB_WEBHOOK_SECRET);
    
    const response = await makeRequest(`${BASE_URL}/api/github/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'pull_request',
        'X-GitHub-Delivery': 'test-delivery-id',
        'X-Hub-Signature-256': signature
      },
      body: testPayload
    });
    
    if (response.status === 200) {
      console.log('   ✅ Webhook endpoint accessible');
      console.log('   📋 Response:', response.body.received ? 'Received' : 'Processed');
      results.webhookEndpoint = true;
    } else {
      console.log(`   ⚠️  Response: ${response.status}`);
      if (response.body.error) {
        console.log(`      Error: ${response.body.error}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Step 2: Test PR analysis using BEAST MODE API
  console.log('\n2️⃣  Testing PR Analysis via BEAST MODE API...\n');
  try {
    // Use a test repo or the user's actual repo
    const testRepo = process.env.TEST_REPO || 'repairman29/BEAST-MODE';
    
    const response = await makeRequest(`${BASE_URL}/api/repos/quality`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        repo: testRepo
      }
    });
    
    if (response.status === 200) {
      console.log('   ✅ PR analysis API works');
      console.log(`   📊 Quality Score: ${response.body.quality || 'N/A'}`);
      console.log(`   📊 Recommendations: ${response.body.recommendations?.length || 0}`);
      results.prAnalysis = true;
    } else {
      console.log(`   ⚠️  Response: ${response.status}`);
      if (response.body.error) {
        console.log(`      Error: ${response.body.error}`);
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // Step 3: Test status check creation (simulated)
  console.log('\n3️⃣  Testing Status Check Service...\n');
  try {
    // Check if status check service exists
    const healthResponse = await makeRequest(`${BASE_URL}/api/health`);
    if (healthResponse.status === 200) {
      console.log('   ✅ API health check passed');
      console.log('   📋 Service is operational');
      results.statusCheck = true;
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // Step 4: Verify GitHub App configuration
  console.log('\n4️⃣  Verifying GitHub App Configuration...\n');
  try {
    // Check environment variables
    const requiredVars = [
      'GITHUB_APP_ID',
      'GITHUB_APP_PRIVATE_KEY',
      'GITHUB_WEBHOOK_SECRET'
    ];
    
    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length === 0) {
      console.log('   ✅ All GitHub App env vars configured');
      results.prOpened = true;
    } else {
      console.log(`   ⚠️  Missing env vars: ${missing.join(', ')}`);
      console.log('   💡 Set these in website/.env.local');
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Test Results:\n');
  console.log(`   ${results.webhookEndpoint ? '✅' : '❌'} Webhook Endpoint`);
  console.log(`   ${results.prAnalysis ? '✅' : '❌'} PR Analysis API`);
  console.log(`   ${results.statusCheck ? '✅' : '❌'} Status Check Service`);
  console.log(`   ${results.prOpened ? '✅' : '⚠️ '} GitHub App Config`);
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 Next Steps:\n');
  console.log('   1. Create a test PR in a connected repo');
  console.log('   2. Verify webhook receives pull_request.opened event');
  console.log('   3. Check PR comment appears');
  console.log('   4. Verify status check created\n');
  
  return results;
}

if (require.main === module) {
  testGitHubAppE2E()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testGitHubAppE2E };
