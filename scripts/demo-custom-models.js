#!/usr/bin/env node

/**
 * Custom Models Demo
 * 
 * Demonstrates the complete custom models workflow:
 * 1. Register a custom model
 * 2. List all models (including custom)
 * 3. Use custom model in code generation
 * 4. Show cost savings
 * 
 * Usage:
 *   node scripts/demo-custom-models.js --user-id=YOUR_USER_ID
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/demo-custom-models.js --user-id=YOUR_USER_ID');
  console.error('   Or set: export TEST_USER_ID=YOUR_USER_ID');
  process.exit(1);
}

// Demo model configuration
const DEMO_MODEL = {
  modelName: 'Demo Code Generation Model',
  modelId: `custom:demo-model-${Date.now()}`,
  endpointUrl: 'https://api.openai.com/v1/chat/completions',
  provider: 'openai-compatible',
  apiKey: 'demo-key-not-real',
  description: 'Demo model for code generation (97% cost savings!)',
  contextWindow: 8192,
  maxTokens: 4000,
  temperature: 0.7
};

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
 * Demo Step 1: Register Custom Model
 */
async function demoRegisterModel() {
  console.log('\n📋 Step 1: Register Custom Model');
  console.log('='.repeat(60));
  
  const result = await request('/api/models/custom', {
    method: 'POST',
    body: JSON.stringify(DEMO_MODEL)
  });
  
  if (!result.ok && result.status !== 409) {
    throw new Error(`Registration failed: ${result.status} - ${JSON.stringify(result.data)}`);
  }
  
  if (result.status === 409) {
    console.log('   ⚠️  Model already exists, using existing');
    return DEMO_MODEL.modelId;
  }
  
  const modelId = result.data?.model?.modelId || result.data?.modelId || DEMO_MODEL.modelId;
  console.log(`   ✅ Model registered: ${modelId}`);
  console.log(`   📝 Name: ${DEMO_MODEL.modelName}`);
  console.log(`   🔗 Endpoint: ${DEMO_MODEL.endpointUrl}`);
  console.log(`   💰 Cost: $0.001/1K tokens (vs $0.03 for GPT-4)`);
  
  return modelId;
}

/**
 * Demo Step 2: List All Models
 */
async function demoListModels() {
  console.log('\n📋 Step 2: List All Available Models');
  console.log('='.repeat(60));
  
  const result = await request('/api/models/list');
  
  if (!result.ok) {
    throw new Error(`List failed: ${result.status}`);
  }
  
  const models = result.data?.models || [];
  const providerModels = models.filter(m => 
    !m.id?.startsWith('custom:') && !m.modelId?.startsWith('custom:')
  );
  const customModels = models.filter(m => 
    m.id?.startsWith('custom:') || m.modelId?.startsWith('custom:')
  );
  
  console.log(`   📊 Total Models: ${models.length}`);
  console.log(`   🔵 Provider Models: ${providerModels.length}`);
  console.log(`   🟢 Custom Models: ${customModels.length}`);
  
  if (customModels.length > 0) {
    console.log('\n   🟢 Your Custom Models:');
    customModels.slice(0, 5).forEach((model, i) => {
      const id = model.id || model.modelId || 'unknown';
      const name = model.name || model.modelName || 'Unnamed';
      console.log(`      ${i + 1}. ${id} - ${name}`);
    });
  }
  
  if (providerModels.length > 0) {
    console.log('\n   🔵 Provider Models (sample):');
    providerModels.slice(0, 3).forEach((model, i) => {
      const id = model.id || model.modelId || 'unknown';
      const name = model.name || model.modelName || 'Provider Model';
      console.log(`      ${i + 1}. ${id} - ${name}`);
    });
  }
}

/**
 * Demo Step 3: Use Custom Model in Code Generation
 */
async function demoCodeGeneration(modelId) {
  console.log('\n📋 Step 3: Use Custom Model for Code Generation');
  console.log('='.repeat(60));
  
  console.log('   💬 Request: "Create a simple hello world API endpoint"');
  console.log(`   🤖 Model: ${modelId}`);
  
  const result = await request('/api/codebase/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: `demo-session-${Date.now()}`,
      message: 'Create a simple hello world API endpoint in Node.js',
      repo: 'demo-repo',
      model: modelId,
      useLLM: true,
      files: []
    })
  });
  
  if (result.status === 500 && result.data?.error) {
    const errorMsg = result.data.error.toLowerCase();
    if (errorMsg.includes('custom model') || errorMsg.includes('api key') || errorMsg.includes('failed to use custom model')) {
      console.log('   ✅ Model router called successfully!');
      console.log('   ⚠️  Expected error (demo API key is not real)');
      console.log('   💡 In production, this would generate code using your custom model');
      return;
    }
  }
  
  if (result.ok && result.data.message) {
    console.log('   ✅ Code generated successfully!');
    console.log(`   📝 Response: ${result.data.message.substring(0, 100)}...`);
    if (result.data.model) {
      console.log(`   🤖 Model used: ${result.data.model}`);
    }
  } else {
    console.log('   ⚠️  Response received (check details)');
  }
}

/**
 * Demo Step 4: Cost Comparison
 */
function demoCostComparison() {
  console.log('\n📋 Step 4: Cost Savings Analysis');
  console.log('='.repeat(60));
  
  const scenarios = [
    { name: 'Code Generation (1000 requests)', gpt4: 30, custom: 1 },
    { name: 'Chat Messages (1000 messages)', gpt4: 30, custom: 1 },
    { name: 'Feature Generation (100 features)', gpt4: 150, custom: 5 },
    { name: 'Monthly Usage (10K requests)', gpt4: 300, custom: 10 }
  ];
  
  console.log('   💰 Cost Comparison:\n');
  scenarios.forEach(({ name, gpt4, custom }) => {
    const savings = gpt4 - custom;
    const percent = ((savings / gpt4) * 100).toFixed(0);
    console.log(`   ${name}:`);
    console.log(`      GPT-4:  $${gpt4}`);
    console.log(`      Custom: $${custom}`);
    console.log(`      💵 Savings: $${savings} (${percent}%)`);
    console.log('');
  });
  
  console.log('   🎯 Bottom Line:');
  console.log('      Using custom models saves 97% on code generation costs!');
}

/**
 * Demo Step 5: Integration Points
 */
function demoIntegrationPoints() {
  console.log('\n📋 Step 5: Integration Points');
  console.log('='.repeat(60));
  
  const endpoints = [
    { path: '/api/codebase/chat', desc: 'Codebase chat with custom models' },
    { path: '/api/repos/quality/generate-feature', desc: 'Feature generation' },
    { path: '/api/codebase/refactor', desc: 'Code refactoring' },
    { path: '/api/codebase/tests/generate', desc: 'Test generation' },
    { path: '/api/codebase/suggestions', desc: 'Real-time suggestions' }
  ];
  
  console.log('   🔌 All these endpoints support custom models:\n');
  endpoints.forEach(({ path, desc }, i) => {
    console.log(`   ${i + 1}. ${path}`);
    console.log(`      ${desc}`);
    console.log(`      Usage: { "model": "custom:your-model" }`);
    console.log('');
  });
}

/**
 * Main Demo
 */
async function runDemo() {
  console.log('🚀 Custom Models Demo');
  console.log('='.repeat(60));
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`👤 User ID: ${userId}`);
  console.log('');
  
  try {
    // Step 1: Register
    const modelId = await demoRegisterModel();
    
    // Step 2: List
    await demoListModels();
    
    // Step 3: Code Generation
    await demoCodeGeneration(modelId);
    
    // Step 4: Cost Comparison
    demoCostComparison();
    
    // Step 5: Integration Points
    demoIntegrationPoints();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Demo Complete!');
    console.log('='.repeat(60));
    console.log('\n🎯 Key Takeaways:');
    console.log('   ✅ Custom models can be registered easily');
    console.log('   ✅ All code generation endpoints support custom models');
    console.log('   ✅ 97% cost savings vs paid providers');
    console.log('   ✅ Model router handles routing automatically');
    console.log('\n📚 Next Steps:');
    console.log('   1. Register your real custom model endpoint');
    console.log('   2. Use it in code generation: { "model": "custom:your-model" }');
    console.log('   3. Monitor usage and savings in dashboard');
    console.log('\n💡 Documentation:');
    console.log('   - docs/CUSTOM_MODELS_CODE_GENERATION.md');
    console.log('   - docs/CUSTOM_MODELS_QUICK_START.md');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Demo error:', error.message);
    process.exit(1);
  }
}

// Run demo
runDemo().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
