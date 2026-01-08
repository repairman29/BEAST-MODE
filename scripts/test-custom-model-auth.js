#!/usr/bin/env node
/**
 * Test Custom Model Registration with Authentication
 * Simulates authenticated requests
 */

const axios = require('axios');
const readline = require('readline');

const API_URL = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';
const LOCAL_URL = 'http://localhost:3000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testWithAuth() {
  console.log('🔐 Testing Custom Model Registration with Authentication\n');
  console.log('='.repeat(60));
  
  console.log('\n📋 Step 1: Get GitHub OAuth Token');
  console.log('   You need to be logged into BEAST MODE at https://beast-mode.dev');
  console.log('   Then get your token from browser cookies or API');
  
  const token = await question('\nEnter your GitHub OAuth token (or press Enter to skip): ');
  
  if (!token || token.trim() === '') {
    console.log('\n⚠️  Skipping authenticated tests');
    console.log('   To test registration:');
    console.log('   1. Log into https://beast-mode.dev');
    console.log('   2. Get github_oauth_token from cookies');
    console.log('   3. Run: GITHUB_TOKEN=your_token node scripts/test-custom-model-auth.js');
    rl.close();
    return;
  }

  const baseUrl = API_URL;
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `github_oauth_token=${token}`
  };

  console.log('\n📋 Step 2: List Available Models');
  try {
    const response = await axios.get(`${baseUrl}/api/models/list`, { headers });
    console.log('   ✅ Success!');
    console.log(`   Found ${response.data.models?.length || 0} models`);
    if (response.data.models && response.data.models.length > 0) {
      console.log('   Models:');
      response.data.models.slice(0, 5).forEach(model => {
        console.log(`     - ${model.modelName} (${model.modelId})`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.status || error.message}`);
  }

  console.log('\n📋 Step 3: Register Custom Model');
  const modelName = await question('Enter model name (or press Enter to skip): ');
  
  if (!modelName || modelName.trim() === '') {
    console.log('\n⚠️  Skipping model registration');
    rl.close();
    return;
  }

  const modelId = await question('Enter model ID (must start with "custom:"): ');
  if (!modelId || !modelId.startsWith('custom:')) {
    console.log('   ❌ Model ID must start with "custom:"');
    rl.close();
    return;
  }

  const endpointUrl = await question('Enter endpoint URL: ');
  if (!endpointUrl) {
    console.log('   ❌ Endpoint URL required');
    rl.close();
    return;
  }

  const provider = await question('Enter provider (openai-compatible/anthropic-compatible/custom): ') || 'openai-compatible';
  const apiKey = await question('Enter API key (optional, press Enter to skip): ') || undefined;

  try {
    console.log('\n   Registering model...');
    const response = await axios.post(
      `${baseUrl}/api/models/custom`,
      {
        modelName,
        modelId,
        endpointUrl,
        provider,
        apiKey
      },
      { headers }
    );

    if (response.data.success) {
      console.log('   ✅ Model registered successfully!');
      console.log(`   Model ID: ${response.data.modelId}`);
    } else {
      console.log(`   ❌ Registration failed: ${response.data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`   Details: ${JSON.stringify(error.response.data)}`);
    }
  }

  console.log('\n📋 Step 4: List Your Custom Models');
  try {
    const response = await axios.get(`${baseUrl}/api/models/custom`, { headers });
    console.log('   ✅ Success!');
    console.log(`   Found ${response.data.models?.length || 0} custom models`);
    if (response.data.models && response.data.models.length > 0) {
      response.data.models.forEach(model => {
        console.log(`     - ${model.modelName} (${model.modelId})`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.status || error.message}`);
  }

  rl.close();
}

if (require.main === module) {
  testWithAuth().catch(console.error);
}

module.exports = { testWithAuth };
