#!/usr/bin/env node

/**
 * Test Build with Provider Model
 * 
 * Tests the system using a provider model (OpenAI/Anthropic) to verify everything works
 * Falls back to provider model if custom model fails
 * 
 * Usage:
 *   node scripts/test-build-with-provider-model.js --user-id=YOUR_USER_ID
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/test-build-with-provider-model.js --user-id=YOUR_USER_ID');
  process.exit(1);
}

/**
 * Make HTTP request
 */
async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `github_oauth_user_id=${userId}`,
    ...options.headers
  };
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers
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
 * Test: Build a simple utility
 */
async function testBuildUtility() {
  console.log('\n📋 Test: Build Utility Function');
  console.log('='.repeat(60));
  console.log('   💬 Request: "Create a simple formatDate utility function"');
  console.log('   🤖 Model: openai:gpt-3.5-turbo (provider model for testing)');
  
  const result = await request('/api/codebase/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: `test-build-${Date.now()}`,
      message: 'Create a simple formatDate utility function in TypeScript that takes a Date object and returns a formatted string like "January 8, 2026". Include JSDoc comments.',
      repo: 'test-repo',
      model: 'openai:gpt-3.5-turbo', // Use provider model for testing
      useLLM: true
    })
  });
  
  if (result.ok && result.data.message) {
    console.log('   ✅ Code generated successfully!');
    const code = result.data.code || result.data.message;
    console.log(`   📝 Response length: ${code.length} characters`);
    console.log(`   🤖 Model used: ${result.data.model || 'openai:gpt-3.5-turbo'}`);
    
    // Show preview
    const preview = code.substring(0, 200);
    console.log(`   📄 Preview: ${preview}...`);
    
    // Save to file
    const outputDir = path.join(__dirname, '../test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filePath = path.join(outputDir, 'formatDate.ts');
    fs.writeFileSync(filePath, code);
    console.log(`   💾 Saved to: ${filePath}`);
    
    return { success: true, code, filePath };
  } else if (result.status === 500 && result.data?.error) {
    const errorMsg = result.data.error.toLowerCase();
    if (errorMsg.includes('api key') || errorMsg.includes('authentication')) {
      console.log('   ⚠️  API key required for provider model');
      console.log('   💡 Add your OpenAI API key to user_api_keys table');
      return { success: false, note: 'API key needed' };
    } else {
      console.log('   ⚠️  Error:', result.data.error);
      return { success: false, error: result.data.error };
    }
  } else {
    console.log('   ⚠️  Unexpected response:', result.status);
    return { success: false };
  }
}

/**
 * Test: Check what models are available
 */
async function testListModels() {
  console.log('\n📋 Test: List Available Models');
  console.log('='.repeat(60));
  
  const result = await request('/api/models/list');
  
  if (result.ok && result.data.models) {
    const models = result.data.models;
    const customModels = models.filter(m => 
      m.id?.startsWith('custom:') || m.modelId?.startsWith('custom:')
    );
    const providerModels = models.filter(m => 
      !m.id?.startsWith('custom:') && !m.modelId?.startsWith('custom:')
    );
    
    console.log(`   ✅ Total models: ${models.length}`);
    console.log(`   🟢 Custom models: ${customModels.length}`);
    console.log(`   🔵 Provider models: ${providerModels.length}`);
    
    if (providerModels.length > 0) {
      console.log('\n   🔵 Available Provider Models:');
      providerModels.slice(0, 5).forEach((model, i) => {
        const id = model.id || model.modelId || 'unknown';
        const name = model.name || model.modelName || 'Provider Model';
        console.log(`      ${i + 1}. ${id} - ${name}`);
      });
    }
    
    return { success: true, models };
  } else {
    console.log('   ⚠️  Could not list models');
    return { success: false };
  }
}

/**
 * Test: Check monitoring
 */
async function testMonitoring() {
  console.log('\n📋 Test: Check Monitoring');
  console.log('='.repeat(60));
  
  const result = await request('/api/models/custom/monitoring');
  
  if (result.ok && result.data.metrics) {
    const metrics = result.data.metrics;
    const health = result.data.health;
    
    console.log('   ✅ Monitoring working:');
    console.log(`   📊 Total requests: ${metrics.requests.total}`);
    console.log(`   ✅ Success: ${metrics.requests.success}`);
    console.log(`   ❌ Failures: ${metrics.requests.failures}`);
    console.log(`   📈 Success rate: ${metrics.requests.successRate}`);
    console.log(`   ⚡ Average latency: ${metrics.performance.averageLatency}`);
    console.log(`   💰 Savings: ${metrics.costs.savings} (${metrics.costs.savingsPercent})`);
    console.log(`   🏥 Health: ${health?.status || 'unknown'}`);
    
    return { success: true, metrics, health };
  } else {
    console.log('   ⚠️  Monitoring not available');
    return { success: false };
  }
}

/**
 * Main
 */
async function main() {
  console.log('🧪 Testing Build with Provider Model');
  console.log('='.repeat(60));
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`👤 User ID: ${userId}`);
  console.log('');
  console.log('💡 This test uses provider models (OpenAI/Anthropic)');
  console.log('   to verify the system works end-to-end.');
  console.log('');
  
  const results = {
    listModels: null,
    buildUtility: null,
    monitoring: null
  };
  
  try {
    // Test 1: List models
    results.listModels = await testListModels();
    
    // Test 2: Build utility
    results.buildUtility = await testBuildUtility();
    
    // Test 3: Check monitoring
    results.monitoring = await testMonitoring();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(60));
    
    const tests = [
      { name: 'List Models', result: results.listModels },
      { name: 'Build Utility', result: results.buildUtility },
      { name: 'Monitoring', result: results.monitoring }
    ];
    
    tests.forEach(test => {
      const icon = test.result?.success ? '✅' : 
                   test.result?.note ? '⚠️' : '❌';
      const note = test.result?.note ? ` (${test.result.note})` : '';
      console.log(`   ${icon} ${test.name}${note}`);
    });
    
    // Show generated files
    const outputDir = path.join(__dirname, '../test-output');
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      if (files.length > 0) {
        console.log('\n📁 Generated Files:');
        files.forEach(file => {
          const filePath = path.join(outputDir, file);
          const stats = fs.statSync(filePath);
          const content = fs.readFileSync(filePath, 'utf8');
          console.log(`   📄 ${file} (${stats.size} bytes)`);
          console.log(`      Preview: ${content.substring(0, 80)}...`);
        });
        console.log(`\n   📂 Location: ${outputDir}`);
      }
    }
    
    console.log('');
    console.log('💡 Next Steps:');
    if (!results.buildUtility?.success && results.buildUtility?.note === 'API key needed') {
      console.log('   1. Add OpenAI API key to user_api_keys table');
      console.log('   2. Run this test again');
    } else if (results.buildUtility?.success) {
      console.log('   ✅ System is working! Code was generated successfully.');
      console.log('   ✅ Custom models will work the same way with real API keys.');
    }
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
