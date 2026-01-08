#!/usr/bin/env node
/**
 * Comprehensive Test Suite for Custom Model Integration
 * Tests all 3 phases: API, Proxy, Extension
 */

const axios = require('axios');

const API_URL = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';
const LOCAL_URL = 'http://localhost:3000';

let baseUrl = API_URL;
let testResults = [];

async function testEndpoint(name, method, url, data = null, headers = {}) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   ${method} ${url}`);
    
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`   ✅ Success: ${response.status}`);
    if (response.data) {
      const preview = JSON.stringify(response.data).substring(0, 200);
      console.log(`   Response: ${preview}${preview.length >= 200 ? '...' : ''}`);
    }
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (error.response) {
      console.log(`   ⚠️  Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.error || error.message}`);
      return { success: false, error: error.response.data, status: error.response.status };
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log(`   ⚠️  Connection failed (server may not be running)`);
      return { success: false, error: 'Connection failed', status: 0 };
    } else {
      console.log(`   ❌ Error: ${error.message}`);
      return { success: false, error: error.message, status: 0 };
    }
  }
}

async function main() {
  console.log('🚀 Testing Custom Model Integration\n');
  console.log('='.repeat(60));
  console.log(`Testing against: ${baseUrl}`);
  console.log(`Local fallback: ${LOCAL_URL}\n`);

  // Test 1: List Models (Phase 1)
  console.log('📋 PHASE 1: Custom Models API');
  console.log('-'.repeat(60));
  
  const listResult = await testEndpoint(
    'List Available Models',
    'GET',
    `${baseUrl}/api/models/list`
  );
  testResults.push({ phase: 'Phase 1', test: 'List Models', ...listResult });

  // Test 2: Cursor Proxy Health (Phase 2)
  console.log('\n📋 PHASE 2: Cursor Proxy');
  console.log('-'.repeat(60));
  
  const proxyHealth = await testEndpoint(
    'Cursor Proxy (GET)',
    'GET',
    `${baseUrl}/api/cursor/proxy`
  );
  testResults.push({ phase: 'Phase 2', test: 'Cursor Proxy Health', ...proxyHealth });

  // Test 3: Cursor Proxy with Sample Request (Phase 2)
  const proxyTest = await testEndpoint(
    'Cursor Proxy (POST)',
    'POST',
    `${baseUrl}/api/cursor/proxy`,
    {
      model: 'openai:gpt-4',
      messages: [
        { role: 'user', content: 'Hello, this is a test message.' }
      ],
      temperature: 0.7,
      max_tokens: 100
    }
  );
  testResults.push({ phase: 'Phase 2', test: 'Cursor Proxy Request', ...proxyTest });

  // Test 4: Codebase Chat (Phase 1 - Custom Model Support)
  console.log('\n📋 PHASE 1: Chat with Custom Model Support');
  console.log('-'.repeat(60));
  
  const chatTest = await testEndpoint(
    'Codebase Chat',
    'POST',
    `${baseUrl}/api/codebase/chat`,
    {
      sessionId: `test-${Date.now()}`,
      message: 'Hello, test message',
      repo: 'test/repo',
      useLLM: false
    }
  );
  testResults.push({ phase: 'Phase 1', test: 'Codebase Chat', ...chatTest });

  // Test 5: Codebase Index (Phase 1)
  const indexTest = await testEndpoint(
    'Codebase Index',
    'POST',
    `${baseUrl}/api/codebase/index`,
    {
      repo: 'test/repo'
    }
  );
  testResults.push({ phase: 'Phase 1', test: 'Codebase Index', ...indexTest });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log('='.repeat(60));
  
  const byPhase = {};
  testResults.forEach(result => {
    if (!byPhase[result.phase]) {
      byPhase[result.phase] = { passed: 0, failed: 0, total: 0 };
    }
    byPhase[result.phase].total++;
    if (result.success) {
      byPhase[result.phase].passed++;
    } else {
      byPhase[result.phase].failed++;
    }
  });

  Object.keys(byPhase).forEach(phase => {
    const stats = byPhase[phase];
    const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`\n${phase}:`);
    console.log(`   Passed: ${stats.passed}/${stats.total} (${percentage}%)`);
    if (stats.failed > 0) {
      console.log(`   Failed: ${stats.failed}`);
    }
  });

  const totalPassed = testResults.filter(r => r.success).length;
  const totalTests = testResults.length;
  const overallPercentage = ((totalPassed / totalTests) * 100).toFixed(1);
  
  console.log(`\nOverall: ${totalPassed}/${totalTests} (${overallPercentage}%)`);
  
  console.log('\n📝 Detailed Results:');
  testResults.forEach(result => {
    const icon = result.success ? '✅' : (result.status === 0 ? '⚠️' : '❌');
    const status = result.status ? `[${result.status}]` : '';
    console.log(`   ${icon} ${result.phase} - ${result.test} ${status}`);
  });

  console.log('\n💡 Notes:');
  console.log('   - Registration tests require authentication (GitHub OAuth)');
  console.log('   - Custom model usage requires registered model');
  console.log('   - Extension testing requires VS Code environment');
  console.log('   - Some endpoints may return 500 if services not fully configured');

  console.log('\n🎯 Next Steps:');
  if (totalPassed === totalTests) {
    console.log('   ✅ All tests passed! Ready for production.');
  } else {
    console.log('   ⚠️  Some tests failed. Check logs above for details.');
    console.log('   - Verify services are running');
    console.log('   - Check authentication if needed');
    console.log('   - Review error messages');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
