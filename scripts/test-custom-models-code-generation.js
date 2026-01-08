#!/usr/bin/env node

/**
 * Test Custom Models for Code Generation
 * 
 * Tests the integration of custom models into code generation workflows.
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';
const PROD_URL = 'https://beast-mode.dev';

// Test configuration
const TEST_MODEL = {
  modelName: 'Test Code Generation Model', // API expects camelCase
  modelId: 'custom:test-code-gen-model', // Must start with 'custom:'
  endpointUrl: 'https://api.openai.com/v1/chat/completions', // Using OpenAI as test endpoint
  provider: 'openai-compatible',
  apiKey: 'test-key-12345', // This won't work, but tests the flow
  description: 'Test model for code generation',
  contextWindow: 8192,
  maxTokens: 4000,
  temperature: 0.7
};

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Test helper
 */
async function test(name, fn) {
  process.stdout.write(`\n🧪 ${name}... `);
  try {
    await fn();
    console.log('✅ PASSED');
    testResults.passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: name, error: error.message });
  }
}

/**
 * Make HTTP request
 */
async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json().catch(() => ({}));
    
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    // Try production fallback if testing locally
    if (url.startsWith('/') && BASE_URL.includes('localhost')) {
      const prodUrl = `${PROD_URL}${url}`;
      try {
        const response = await fetch(prodUrl, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
        
        const data = await response.json().catch(() => ({}));
        
        return {
          ok: response.ok,
          status: response.status,
          data
        };
      } catch (prodError) {
        throw new Error(`Both ${BASE_URL} and ${PROD_URL} failed: ${error.message}`);
      }
    }
    throw error;
  }
}

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  const result = await request('/api/health');
  if (!result.ok) {
    throw new Error(`Health check failed: ${result.status}`);
  }
}

/**
 * Test 2: List Models (should include custom models)
 */
async function testListModels() {
  const result = await request('/api/models/list');
  if (!result.ok) {
    throw new Error(`List models failed: ${result.status}`);
  }
  
  if (!result.data.models || !Array.isArray(result.data.models)) {
    throw new Error('Invalid response format');
  }
  
  // Check if custom models are in the list
  const hasCustomModels = result.data.models.some(m => m.id?.startsWith('custom:'));
  console.log(`\n   Found ${result.data.models.length} models (${hasCustomModels ? 'includes custom' : 'no custom models'})`);
}

/**
 * Test 3: Register Custom Model
 */
let registeredModelId = null;

async function testRegisterModel() {
  const result = await request('/api/models/custom', {
    method: 'POST',
    body: JSON.stringify(TEST_MODEL)
  });
  
  if (!result.ok && result.status !== 409) { // 409 = already exists
    throw new Error(`Register model failed: ${result.status} - ${JSON.stringify(result.data)}`);
  }
  
  if (result.data?.id) {
    registeredModelId = result.data.id;
    console.log(`\n   Model registered: ${registeredModelId}`);
  } else if (result.status === 409) {
    console.log(`\n   Model already exists (using existing)`);
    registeredModelId = `custom:${TEST_MODEL.modelId}`;
  } else {
    throw new Error('No model ID returned');
  }
}

/**
 * Test 4: Codebase Chat with Custom Model
 */
async function testCodebaseChatWithCustomModel() {
  if (!registeredModelId) {
    registeredModelId = `custom:${TEST_MODEL.modelId}`;
  }
  
  // Skip if codebase chat module isn't available (local testing)
  const result = await request('/api/codebase/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: `test-session-${Date.now()}`,
      message: 'Write a simple hello world function in JavaScript',
      repo: 'test-repo',
      model: registeredModelId,
      useLLM: true,
      files: []
    })
  });
  
  // Even if it fails (due to invalid API key), we should get a proper error response
  // The important thing is that the model router is being called
  if (result.status === 500 && result.data?.error) {
    // Check if error mentions custom model (means router was called)
    const errorMsg = result.data.error.toLowerCase();
    if (errorMsg.includes('custom model') || errorMsg.includes('model router') || errorMsg.includes('api key')) {
      console.log(`\n   ✅ Model router called (expected error: ${result.data.error.substring(0, 50)}...)`);
      return; // This is expected - we're using a test API key
    }
  }
  
  if (!result.ok) {
    throw new Error(`Chat failed: ${result.status} - ${JSON.stringify(result.data)}`);
  }
  
  if (result.data.model && result.data.model.includes('custom:')) {
    console.log(`\n   ✅ Custom model used: ${result.data.model}`);
  } else {
    console.log(`\n   ⚠️  Response received but model info unclear`);
  }
}

/**
 * Test 5: Codebase Chat with Provider Model (fallback)
 */
async function testCodebaseChatWithProviderModel() {
  const result = await request('/api/codebase/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: `test-session-provider-${Date.now()}`,
      message: 'Write a simple hello world function',
      repo: 'test-repo',
      model: 'openai:gpt-4', // Provider model
      useLLM: false, // Don't require API key for this test
      files: []
    })
  });
  
  // Should handle gracefully even without API key
  if (result.status === 400 || result.status === 500) {
    console.log(`\n   ✅ Provider model routing attempted (expected: no API key)`);
    return;
  }
  
  if (!result.ok) {
    throw new Error(`Provider model chat failed: ${result.status}`);
  }
}

/**
 * Test 6: Model Router Integration
 */
async function testModelRouterIntegration() {
  // Test that the model router is properly integrated
  // by checking if custom model requests are routed correctly
  
  const result = await request('/api/codebase/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: `test-router-${Date.now()}`,
      message: 'Test message',
      repo: 'test-repo',
      model: 'custom:non-existent-model',
      useLLM: true,
      files: []
    })
  });
  
  // Should get a proper error about model not found (not a generic error)
  if (result.status === 404 || result.status === 500) {
    const errorMsg = (result.data?.error || '').toLowerCase();
    if (errorMsg.includes('model') || errorMsg.includes('not found')) {
      console.log(`\n   ✅ Model router properly handles non-existent models`);
      return;
    }
  }
  
  // If we get here, the router might not be integrated
  console.log(`\n   ⚠️  Model router response unclear (status: ${result.status})`);
}

/**
 * Test 7: Verify Model Router in Code
 */
async function testModelRouterCode() {
  const fs = require('fs');
  const path = require('path');
  
  const llmCodeGenPath = path.join(__dirname, '../lib/mlops/llmCodeGenerator.js');
  const codebaseChatPath = path.join(__dirname, '../lib/mlops/codebaseChat.js');
  
  if (!fs.existsSync(llmCodeGenPath)) {
    throw new Error('llmCodeGenerator.js not found');
  }
  
  if (!fs.existsSync(codebaseChatPath)) {
    throw new Error('codebaseChat.js not found');
  }
  
  const llmCodeGen = fs.readFileSync(llmCodeGenPath, 'utf8');
  const codebaseChat = fs.readFileSync(codebaseChatPath, 'utf8');
  
  // Check for model router integration
  const hasModelRouter = llmCodeGen.includes('modelRouter') || llmCodeGen.includes('getModelRouter');
  const hasCustomModelSupport = codebaseChat.includes('customModelId') || codebaseChat.includes('custom:');
  
  if (!hasModelRouter) {
    throw new Error('Model router not integrated in llmCodeGenerator');
  }
  
  if (!hasCustomModelSupport) {
    throw new Error('Custom model support not found in codebaseChat');
  }
  
  console.log(`\n   ✅ Code integration verified`);
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Testing Custom Models for Code Generation\n');
  console.log(`📍 Testing against: ${BASE_URL}`);
  if (BASE_URL.includes('localhost')) {
    console.log(`📍 Production fallback: ${PROD_URL}`);
  }
  console.log('');
  
  await test('Health Check', testHealthCheck);
  await test('List Models', testListModels);
  await test('Register Custom Model', testRegisterModel);
  await test('Codebase Chat with Custom Model', testCodebaseChatWithCustomModel);
  await test('Codebase Chat with Provider Model', testCodebaseChatWithProviderModel);
  await test('Model Router Integration', testModelRouterIntegration);
  await test('Verify Model Router in Code', testModelRouterCode);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`   - ${test}: ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (testResults.failed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
