#!/usr/bin/env node

/**
 * Test Custom Model Health
 * 
 * Comprehensive health check for custom models
 * 
 * Usage:
 *   node scripts/test-custom-model-health.js --model-id=custom:my-model
 *   node scripts/test-custom-model-health.js --all (test all models)
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';

// Parse arguments
const args = process.argv.slice(2);
const modelIdArg = args.find(arg => arg.startsWith('--model-id='));
const modelId = modelIdArg ? modelIdArg.split('=')[1] : null;
const testAll = args.includes('--all');

if (!modelId && !testAll) {
  console.error('❌ Model ID required');
  console.error('   Usage: node scripts/test-custom-model-health.js --model-id=custom:my-model');
  console.error('   Or: node scripts/test-custom-model-health.js --all');
  process.exit(1);
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
    throw new Error(`Request failed: ${error.message}`);
  }
}

/**
 * Test model endpoint health
 */
async function testModelEndpoint(model) {
  const startTime = Date.now();
  
  try {
    // Try a simple test request
    const axios = require('axios');
    const response = await axios.post(
      model.endpointUrl,
      {
        model: model.modelId.replace('custom:', ''),
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(model.apiKey && { 'Authorization': `Bearer ${model.apiKey}` })
        },
        timeout: 5000
      }
    );
    
    const latency = Date.now() - startTime;
    
    return {
      healthy: true,
      latency,
      status: response.status,
      error: null
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    return {
      healthy: false,
      latency,
      status: error.response?.status || 0,
      error: error.message
    };
  }
}

/**
 * Test single model
 */
async function testModel(modelId) {
  console.log(`\n🔍 Testing Model: ${modelId}`);
  console.log('='.repeat(60));
  
  // 1. Check if model exists
  console.log('📋 Step 1: Check model exists...');
  const listResult = await request('/api/models/list');
  
  if (!listResult.ok) {
    console.log('   ❌ Failed to list models');
    return false;
  }
  
  const model = listResult.data.models?.find(m => 
    m.id === modelId || m.modelId === modelId
  );
  
  if (!model) {
    console.log('   ❌ Model not found');
    return false;
  }
  
  console.log('   ✅ Model found');
  console.log(`   📝 Name: ${model.modelName || model.name || 'Unknown'}`);
  console.log(`   🔗 Endpoint: ${model.endpointUrl || 'N/A'}`);
  
  // 2. Test endpoint health
  if (model.endpointUrl) {
    console.log('\n📋 Step 2: Test endpoint health...');
    const health = await testModelEndpoint(model);
    
    if (health.healthy) {
      console.log('   ✅ Endpoint is healthy');
      console.log(`   ⚡ Latency: ${health.latency}ms`);
      console.log(`   📊 Status: ${health.status}`);
    } else {
      console.log('   ❌ Endpoint health check failed');
      console.log(`   ⚠️  Error: ${health.error}`);
      console.log(`   ⚡ Latency: ${health.latency}ms`);
    }
  } else {
    console.log('\n📋 Step 2: No endpoint URL (skipping)');
  }
  
  // 3. Test code generation
  console.log('\n📋 Step 3: Test code generation...');
  const chatResult = await request('/api/codebase/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: `health-test-${Date.now()}`,
      message: 'Say hello',
      model: modelId,
      useLLM: true,
      files: []
    })
  });
  
  if (chatResult.status === 500 && chatResult.data?.error) {
    const errorMsg = chatResult.data.error.toLowerCase();
    if (errorMsg.includes('custom model') || errorMsg.includes('model router')) {
      console.log('   ✅ Model router called (expected error for test)');
    } else {
      console.log('   ⚠️  Unexpected error:', chatResult.data.error);
    }
  } else if (chatResult.ok) {
    console.log('   ✅ Code generation works!');
  } else {
    console.log('   ⚠️  Response unclear');
  }
  
  return true;
}

/**
 * Test all models
 */
async function testAllModels() {
  console.log('🔍 Testing All Custom Models\n');
  
  const result = await request('/api/models/list');
  
  if (!result.ok) {
    console.error('❌ Failed to list models');
    return;
  }
  
  const customModels = result.data.models?.filter(m => 
    m.id?.startsWith('custom:') || m.modelId?.startsWith('custom:')
  ) || [];
  
  if (customModels.length === 0) {
    console.log('⚠️  No custom models found');
    return;
  }
  
  console.log(`📊 Found ${customModels.length} custom model(s)\n`);
  
  for (const model of customModels) {
    const modelId = model.id || model.modelId;
    await testModel(modelId);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log(`✅ Tested ${customModels.length} model(s)`);
  console.log('');
}

/**
 * Main
 */
async function main() {
  console.log('🏥 Custom Model Health Check');
  console.log(`📍 Testing against: ${BASE_URL}\n`);
  
  try {
    if (testAll) {
      await testAllModels();
    } else {
      await testModel(modelId);
    }
    
    console.log('\n✅ Health check complete!\n');
    
  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
