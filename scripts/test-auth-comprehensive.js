#!/usr/bin/env node

/**
 * Comprehensive Authentication Testing Script
 * 
 * Tests all authentication endpoints and flows
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
require('dotenv').config({ path: require('path').join(__dirname, '../website/.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Test User';

const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const body = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

function test(name, fn) {
  return async () => {
    try {
      console.log(`\n🧪 Testing: ${name}`);
      await fn();
      results.passed++;
      results.tests.push({ name, status: 'PASS' });
      console.log(`   ✅ PASSED`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: 'FAIL', error: error.message });
      console.log(`   ❌ FAILED: ${error.message}`);
    }
  };
}

async function runTests() {
  console.log('\n🔐 Authentication Comprehensive Test Suite');
  console.log('='.repeat(70));
  console.log(`\n📍 Base URL: ${BASE_URL}`);
  console.log(`📧 Test Email: ${TEST_EMAIL}\n`);

  // Test 1: Health Check
  await test('Health Check Endpoint', async () => {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  })();

  // Test 2: Sign Up
  let authToken = null;
  let userId = null;
  
  await test('User Sign Up', async () => {
    const response = await makeRequest(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME
      }
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.body)}`);
    }

    if (!response.body.token) {
      throw new Error('No token in response');
    }

    if (!response.body.user || !response.body.user.id) {
      throw new Error('No user in response');
    }

    authToken = response.body.token;
    userId = response.body.user.id;
    console.log(`   📝 User ID: ${userId}`);
    console.log(`   🔑 Token: ${authToken.substring(0, 20)}...`);
  })();

  // Test 3: Sign In
  await test('User Sign In', async () => {
    const response = await makeRequest(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.body)}`);
    }

    if (!response.body.token) {
      throw new Error('No token in response');
    }

    authToken = response.body.token; // Update token
  })();

  // Test 4: Invalid Credentials
  await test('Invalid Credentials Rejected', async () => {
    const response = await makeRequest(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: 'WrongPassword123!'
      }
    });

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  })();

  // Test 5: OAuth Authorize Endpoint
  await test('OAuth Authorize Endpoint', async () => {
    const response = await makeRequest(`${BASE_URL}/api/github/oauth/authorize`, {
      method: 'GET',
      headers: {
        'Cookie': `beastModeToken=${authToken}`
      }
    });

    // Should redirect to GitHub (302 or 307)
    if (response.status !== 302 && response.status !== 307) {
      throw new Error(`Expected redirect (302/307), got ${response.status}`);
    }

    const location = response.headers.location;
    if (!location || !location.includes('github.com')) {
      throw new Error('Redirect location does not point to GitHub');
    }

    console.log(`   🔗 Redirects to: ${location.substring(0, 60)}...`);
  })();

  // Test 6: OAuth Callback (with invalid state - should fail)
  await test('OAuth Callback with Invalid State', async () => {
    const response = await makeRequest(
      `${BASE_URL}/api/github/oauth/callback?code=test&state=invalid`
    );

    // Should redirect with error
    if (response.status !== 302 && response.status !== 307) {
      throw new Error(`Expected redirect (302/307), got ${response.status}`);
    }

    const location = response.headers.location;
    if (!location || !location.includes('error=oauth_state_mismatch')) {
      throw new Error('Should redirect with state mismatch error');
    }

    console.log(`   ✅ Correctly rejects invalid state`);
  })();

  // Test 7: Password Reset Request
  await test('Password Reset Request', async () => {
    const response = await makeRequest(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      body: {
        email: TEST_EMAIL
      }
    });

    // Should accept request (200 or 202)
    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`Expected 200/202, got ${response.status}: ${JSON.stringify(response.body)}`);
    }

    console.log(`   📧 Password reset email requested`);
  })();

  // Test 8: Input Validation - Invalid Email
  await test('Input Validation - Invalid Email', async () => {
    const response = await makeRequest(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      body: {
        email: 'not-an-email',
        password: TEST_PASSWORD,
        name: TEST_NAME
      }
    });

    // Should reject invalid email
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  })();

  // Test 9: Input Validation - Weak Password
  await test('Input Validation - Weak Password', async () => {
    const response = await makeRequest(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      body: {
        email: `test2-${Date.now()}@example.com`,
        password: '123', // Too short
        name: TEST_NAME
      }
    });

    // Should reject weak password
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  })();

  // Test 10: Missing Required Fields
  await test('Missing Required Fields', async () => {
    const response = await makeRequest(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      body: {
        email: TEST_EMAIL
        // Missing password
      }
    });

    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  })();

  // Print Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  console.log('\n📋 Test Results:\n');
  results.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${icon} ${test.name}`);
    if (test.error) {
      console.log(`      Error: ${test.error}`);
    }
  });

  console.log('\n' + '='.repeat(70));

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
