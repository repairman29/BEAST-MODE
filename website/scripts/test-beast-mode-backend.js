#!/usr/bin/env node

/**
 * Test BEAST MODE Backend API
 * 
 * Tests the full code generation flow using BEAST MODE's own infrastructure
 */

const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:7777';
const BEAST_MODE_API_KEY = process.env.BEAST_MODE_API_KEY || 'bm_live_w4fXAvRuXAs6AqAEOhv47boa3AIgTpOnI9IbpoSBS0g';

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-BEAST-MODE-API-KEY': BEAST_MODE_API_KEY,
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testHealth() {
  console.log('\n🏥 Testing BEAST MODE Backend Health...');
  try {
    const response = await makeRequest('/api/v1/health');
    console.log(`   Status: ${response.status}`);
    if (response.status === 200) {
      console.log(`   ✅ Health check passed`);
      console.log(`   Service: ${response.data.service}`);
      console.log(`   Models: ${response.data.models?.available ? '✅ Available' : '❌ Not configured'}`);
      return true;
    } else {
      console.log(`   ❌ Health check failed: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testCodeGeneration(prompt, language = 'typescript') {
  console.log(`\n🧪 Testing Code Generation: "${prompt.substring(0, 50)}..."`);
  try {
    const response = await makeRequest('/api/v1/code/generate', 'POST', {
      prompt,
      language,
      context: {},
    });

    console.log(`   Status: ${response.status}`);
    if (response.status === 200 && response.data.success) {
      const code = response.data.code || '';
      if (code && code.length > 50) {
        console.log(`   ✅ SUCCESS: Generated ${code.length} characters of code`);
        console.log(`   Model: ${response.data.model || 'unknown'}`);
        console.log(`   Language: ${response.data.language}`);
        console.log(`   Preview: ${code.substring(0, 100).replace(/\n/g, ' ')}...`);
        return { success: true, code, model: response.data.model };
      } else {
        console.log(`   ❌ FAILED: Code too short or missing`);
        return { success: false, error: 'Code too short' };
      }
    } else {
      console.log(`   ❌ FAILED: ${response.data.error || 'Unknown error'}`);
      console.log(`   Message: ${response.data.message || ''}`);
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testFullFlow() {
  console.log('🚀 BEAST MODE Backend API Test Suite');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${BEAST_MODE_API_KEY.substring(0, 20)}...`);
  console.log('='.repeat(60));

  // Test 1: Health check
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n⚠️  Health check failed. Backend may not be ready.');
    process.exit(1);
  }

  // Check if models are available before testing code generation
  const healthResponse = await makeRequest('/api/v1/health');
  const modelsAvailable = healthResponse.data?.models?.available || false;
  
  let test1, test2, test3;
  let modelsSkipped = false;

  if (!modelsAvailable) {
    console.log('\n⚠️  No models configured - skipping code generation tests');
    console.log('   Backend API is ready, but models need to be configured in Supabase');
    console.log('   To configure models, run: node scripts/setup-beast-mode-model.js');
    modelsSkipped = true;
    test1 = { success: true, skipped: true };
    test2 = { success: true, skipped: true };
    test3 = { success: true, skipped: true };
  } else {
    // Test 2: Simple component
    test1 = await testCodeGeneration('Create a React button component with onClick handler');

    // Test 3: API route
    test2 = await testCodeGeneration('Create a Next.js API route that handles POST requests');

    // Test 4: Complex feature
    test3 = await testCodeGeneration('Create a todo app with React, TypeScript, and state management');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Health Check', result: healthOk, skipped: false },
    { name: 'React Component', result: test1.success, skipped: test1.skipped },
    { name: 'API Route', result: test2.success, skipped: test2.skipped },
    { name: 'Complex Feature', result: test3.success, skipped: test3.skipped },
  ];

  tests.forEach((test, index) => {
    if (test.skipped) {
      console.log(`${index + 1}. ${test.name}: ⏭️  SKIPPED (models not configured)`);
    } else {
      console.log(`${index + 1}. ${test.name}: ${test.result ? '✅ PASSED' : '❌ FAILED'}`);
    }
  });

  const passed = tests.filter(t => t.result && !t.skipped).length;
  const skipped = tests.filter(t => t.skipped).length;
  const failed = tests.filter(t => !t.result && !t.skipped).length;
  const total = tests.length;
  
  console.log(`\n${passed}/${total} tests passed (${((passed / total) * 100).toFixed(1)}%)`);
  if (skipped > 0) {
    console.log(`${skipped} tests skipped (models not configured)`);
  }
  console.log('='.repeat(60));

  // If health check passed and either all tests passed OR models are just not configured, consider it success
  if (healthOk && (passed === total || (modelsSkipped && failed === 0))) {
    if (modelsSkipped) {
      console.log('\n✅ BACKEND API IS READY! 🌌');
      console.log('⚠️  Models need to be configured for code generation to work');
      console.log('   Run: node scripts/setup-beast-mode-model.js');
    } else {
      console.log('\n✅ ALL TESTS PASSED! BEAST MODE is ready! 🌌');
    }
    process.exit(0);
  } else if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('\n✅ Backend is ready!');
    process.exit(0);
  }
}

testFullFlow().catch(console.error);
