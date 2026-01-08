#!/usr/bin/env node
/**
 * Test Custom Models API
 * Tests all custom model endpoints
 */

const axios = require('axios');

const API_URL = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';
const PRODUCTION_URL = 'https://beast-mode.dev';

// Test configuration
const TEST_MODEL = {
  modelName: 'Test Custom Model',
  modelId: 'custom:test-model',
  endpointUrl: 'https://api.openai.com/v1/chat/completions', // Using OpenAI as test endpoint
  provider: 'openai-compatible',
  description: 'Test model for validation'
};

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
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`   ✅ Success: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2).substring(0, 200));
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ Error: ${error.response.status}`);
      console.log(`   Message:`, error.response.data?.error || error.message);
      return { success: false, error: error.response.data };
    } else {
      console.log(`   ❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

async function main() {
  console.log('🚀 Testing Custom Models API\n');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Production URL: ${PRODUCTION_URL}\n`);

  // Try localhost first, then production
  let baseUrl = API_URL;
  let testResults = [];

  // Test 1: List models (no auth required for public models)
  console.log('\n📋 Test 1: List Available Models');
  const listResult = await testEndpoint(
    'List Models',
    'GET',
    `${baseUrl}/api/models/list`
  );
  testResults.push({ test: 'List Models', ...listResult });

  // Test 2: Health check
  console.log('\n📋 Test 2: Cursor Proxy Health Check');
  const healthResult = await testEndpoint(
    'Health Check',
    'GET',
    `${baseUrl}/api/cursor/proxy`
  );
  testResults.push({ test: 'Health Check', ...healthResult });

  // Note: Registration tests require authentication
  console.log('\n⚠️  Note: Registration tests require authentication');
  console.log('   To test registration, you need:');
  console.log('   1. Be logged into BEAST MODE');
  console.log('   2. Have github_oauth_user_id cookie');
  console.log('   3. Run: curl with Cookie header');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  const passed = testResults.filter(r => r.success).length;
  const total = testResults.length;
  console.log(`   Passed: ${passed}/${total}`);
  
  testResults.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`   ${icon} ${result.test}`);
  });

  console.log('\n💡 Next Steps:');
  console.log('   1. Test registration with authentication');
  console.log('   2. Test chat with custom model');
  console.log('   3. Test Cursor proxy with actual requests');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
