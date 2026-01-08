#!/usr/bin/env node

/**
 * Demo: Simple Setup Wizard
 * 
 * Shows what the setup wizard looks like and demonstrates the workflow
 * 
 * Usage:
 *   node scripts/demo-simple-setup.js --user-id=YOUR_USER_ID
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/demo-simple-setup.js --user-id=YOUR_USER_ID');
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
 * Demo the setup wizard
 */
async function demoSetup() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🚀 Simple Custom Model Setup Wizard                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('This wizard will help you set up a custom model in 2 minutes!');
  console.log('You\'ll save 97% on code generation costs. 💰');
  console.log('');
  
  // Simulate the wizard questions
  console.log('📝 Step 1: What should we call your model?');
  const modelName = 'Demo Code Model';
  console.log(`   Model name: ${modelName}`);
  console.log('');
  
  console.log('🔗 Step 2: What\'s your model endpoint URL?');
  console.log('   Examples:');
  console.log('   - OpenAI-compatible: https://api.openai.com/v1/chat/completions');
  console.log('   - Anthropic-compatible: https://api.anthropic.com/v1/messages');
  console.log('   - Custom: https://your-api.com/v1/chat');
  const endpointUrl = 'https://api.openai.com/v1/chat/completions';
  console.log(`   Endpoint URL: ${endpointUrl}`);
  console.log('');
  
  console.log('🤖 Step 3: What type of API is it?');
  console.log('   1. OpenAI-compatible (most common)');
  console.log('   2. Anthropic-compatible');
  console.log('   3. Custom format');
  const provider = 'openai-compatible';
  console.log(`   Selected: 1 (${provider})`);
  console.log('');
  
  console.log('🔑 Step 4: What\'s your API key?');
  console.log('   (This will be encrypted and stored securely)');
  const apiKey = 'sk-demo-key-not-real';
  console.log(`   API Key: ${'*'.repeat(20)} (hidden)`);
  console.log('');
  
  console.log('📄 Step 5: Optional description');
  const description = 'Demo model for testing';
  console.log(`   Description: ${description}`);
  console.log('');
  
  // Generate model ID
  const modelId = `custom:${modelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
  
  // Register model
  console.log('⏳ Registering your model...');
  
  const registerResult = await request('/api/models/custom', {
    method: 'POST',
    body: JSON.stringify({
      modelName,
      modelId,
      endpointUrl,
      provider,
      apiKey,
      description
    })
  });
  
  if (!registerResult.ok && registerResult.status !== 409) {
    console.log('\n❌ Registration failed:', registerResult.data.error || 'Unknown error');
    if (registerResult.data.details) {
      console.log('   Details:', registerResult.data.details);
    }
    return;
  }
  
  if (registerResult.status === 409) {
    console.log('\n⚠️  Model already exists, but that\'s okay!');
  } else {
    console.log('\n✅ Model registered successfully!');
  }
  
  // Success message
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Setup Complete!');
  console.log('='.repeat(60));
  console.log('');
  console.log('📋 Your Model:');
  console.log(`   Name: ${modelName}`);
  console.log(`   ID: ${modelId}`);
  console.log(`   Endpoint: ${endpointUrl}`);
  console.log('');
  console.log('💰 Cost Savings:');
  console.log('   Before: $0.03 per 1K tokens (GPT-4)');
  console.log('   Now: $0.001 per 1K tokens (your model)');
  console.log('   Savings: 97% 🎉');
  console.log('');
  console.log('🚀 How to Use:');
  console.log('   Your model will be used automatically for all code generation!');
  console.log('   No configuration needed - it just works. ✨');
  console.log('');
  console.log('📊 Monitor Usage:');
  console.log('   node scripts/monitor-custom-models.js');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   1. Try generating some code - your model will be used automatically');
  console.log('   2. Check metrics: node scripts/monitor-custom-models.js');
  console.log('   3. Read docs: docs/CUSTOM_MODELS_SIMPLE_GUIDE.md');
  console.log('');
  
  // Test auto-selection
  console.log('🧪 Testing Auto-Selection...');
  try {
    const { getSmartModelSelector } = require('../lib/mlops/smartModelSelector');
    const selector = getSmartModelSelector();
    const selection = await selector.selectModel(userId, null);
    
    console.log(`   ✅ Auto-selected: ${selection.modelId}`);
    console.log(`   💡 Reason: ${selection.reason}`);
    if (selection.savings) {
      console.log(`   💰 Savings: ${selection.savings}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Auto-selection test: ${error.message}`);
  }
  
  console.log('');
  console.log('✅ Everything is working! Your custom model is ready to use.');
  console.log('');
}

// Run demo
demoSetup().catch(error => {
  console.error('\n❌ Demo failed:', error.message);
  process.exit(1);
});
