#!/usr/bin/env node

/**
 * Test BEAST MODE License Validation API
 * Tests the /api/auth/validate endpoint
 */

const https = require('https');
const http = require('http');

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ENDPOINT = '/api/auth/validate';

async function testValidation(apiKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT, API_URL);
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: json
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: { error: 'Invalid JSON', raw: data }
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing BEAST MODE License Validation API\n');
  console.log(`📍 Endpoint: ${API_URL}${ENDPOINT}\n`);

  // Test 1: Missing API key
  console.log('Test 1: Missing Authorization header');
  try {
    const result = await testValidation('');
    if (result.status === 401 && result.data.error) {
      console.log('✅ PASS: Returns 401 with error message\n');
    } else {
      console.log('❌ FAIL: Expected 401, got', result.status);
      console.log('Response:', result.data, '\n');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
  }

  // Test 2: Invalid API key
  console.log('Test 2: Invalid API key');
  try {
    const result = await testValidation('invalid_key_12345');
    if (result.status === 200 && result.data.valid === false && result.data.tier === 'free') {
      console.log('✅ PASS: Returns free tier for invalid key\n');
    } else {
      console.log('⚠️  Response:', result.status, result.data, '\n');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
  }

  // Test 3: Valid API key (if you have one)
  console.log('Test 3: Valid API key (requires actual key)');
  const testKey = process.env.BEAST_MODE_TEST_API_KEY;
  if (testKey) {
    try {
      const result = await testValidation(testKey);
      console.log('Response:', result.status, result.data);
      if (result.status === 200 && result.data.valid === true) {
        console.log('✅ PASS: Valid API key returns subscription info\n');
      } else {
        console.log('⚠️  Response indicates key is not valid or not in database\n');
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message, '\n');
    }
  } else {
    console.log('⏭️  SKIP: Set BEAST_MODE_TEST_API_KEY env var to test with real key\n');
  }

  console.log('\n📋 To test with a real API key:');
  console.log('1. Create an API key via /api/auth/api-keys endpoint');
  console.log('2. Set BEAST_MODE_TEST_API_KEY environment variable');
  console.log('3. Run this script again');
  console.log('\n💡 Note: This tests the endpoint structure. Full testing requires:');
  console.log('   - Database with test user and API key');
  console.log('   - Active subscription (for paid tiers)');
  console.log('   - Usage tracking data');
}

runTests().catch(console.error);

