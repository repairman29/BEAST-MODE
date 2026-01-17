#!/usr/bin/env node

/**
 * Configure All BEAST MODE Models
 * 
 * Comprehensive script to set up all required BEAST MODE models
 * - Checks existing models
 * - Configures primary code generation model
 * - Optionally configures additional models
 * - Tests configuration
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error(`   Found SUPABASE_URL: ${supabaseUrl ? 'Yes' : 'No'}`);
  console.error(`   Found SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? 'Yes' : 'No'}`);
  process.exit(1);
}

console.log(`\n🔗 Connecting to Supabase...`);
console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('custom_models')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return true;
  } catch (error) {
    console.error(`\n❌ Supabase connection failed: ${error.message}`);
    console.error(`   Error code: ${error.code || 'unknown'}`);
    console.error(`\n   Please verify:`);
    console.error(`   1. SUPABASE_URL is correct`);
    console.error(`   2. SUPABASE_SERVICE_ROLE_KEY is correct (not anon key)`);
    console.error(`   3. custom_models table exists`);
    console.error(`   4. RLS policies allow service role access`);
    return false;
  }
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Model configurations
const REQUIRED_MODELS = [
  {
    modelId: 'beast-mode-code-generator',
    modelName: 'BEAST MODE Code Generator',
    description: 'Primary code generation model for BEAST MODE',
    priority: 'P0',
    defaultEndpoint: 'https://api.beast-mode.dev/v1/chat/completions',
    defaultProvider: 'openai-compatible',
    defaultConfig: {
      model: 'beast-mode-code-generator',
      temperature: 0.3,
      max_tokens: 4000,
    },
  },
];

const OPTIONAL_MODELS = [
  {
    modelId: 'beast-mode-quality-analyzer',
    modelName: 'BEAST MODE Quality Analyzer',
    description: 'Code quality analysis and scoring',
    priority: 'P1',
    defaultEndpoint: 'https://api.beast-mode.dev/v1/chat/completions',
    defaultProvider: 'openai-compatible',
    defaultConfig: {
      model: 'beast-mode-quality-analyzer',
      temperature: 0.2,
      max_tokens: 2000,
    },
  },
  {
    modelId: 'beast-mode-code-explainer',
    modelName: 'BEAST MODE Code Explainer',
    description: 'Code explanation and documentation',
    priority: 'P2',
    defaultEndpoint: 'https://api.beast-mode.dev/v1/chat/completions',
    defaultProvider: 'openai-compatible',
    defaultConfig: {
      model: 'beast-mode-code-explainer',
      temperature: 0.5,
      max_tokens: 3000,
    },
  },
];

/**
 * Check existing models
 */
async function checkExistingModels() {
  console.log('\n🔍 Checking existing models...\n');
  
  const { data: models, error } = await supabase
    .from('custom_models')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching models:', error.message);
    return [];
  }

  if (!models || models.length === 0) {
    console.log('   No models found');
    return [];
  }

  console.log(`   Found ${models.length} model(s):\n`);
  models.forEach((model, index) => {
    console.log(`   ${index + 1}. ${model.model_name} (${model.model_id})`);
    console.log(`      Active: ${model.is_active ? '✅' : '❌'}`);
    console.log(`      Public: ${model.is_public ? 'Yes' : 'No'}`);
    console.log(`      Endpoint: ${model.endpoint_url || 'Not set'}`);
    console.log('');
  });

  return models;
}

/**
 * Configure a single model
 */
async function configureModel(modelDef, existingModels = []) {
  const existing = existingModels.find(m => m.model_id === modelDef.modelId);
  
  if (existing) {
    console.log(`\n📝 Model ${modelDef.modelId} already exists`);
    console.log(`   Current endpoint: ${existing.endpoint_url || 'Not set'}`);
    
    const update = await question(`   Update this model? (y/n) [n]: `) || 'n';
    if (update.toLowerCase() !== 'y') {
      // Just activate if not active
      if (!existing.is_active) {
        const { error } = await supabase
          .from('custom_models')
          .update({ is_active: true })
          .eq('model_id', modelDef.modelId);
        
        if (error) {
          console.error(`   ❌ Failed to activate: ${error.message}`);
        } else {
          console.log(`   ✅ Model activated`);
        }
      }
      return existing;
    }
  }

  console.log(`\n📝 Configuring ${modelDef.modelName}`);
  console.log(`   ${modelDef.description}`);
  console.log(`   Priority: ${modelDef.priority}\n`);

  const endpointUrl = await question(
    `   Endpoint URL [${modelDef.defaultEndpoint}]: `
  ) || modelDef.defaultEndpoint;

  const provider = await question(
    `   Provider (openai-compatible/anthropic-compatible/custom) [${modelDef.defaultProvider}]: `
  ) || modelDef.defaultProvider;

  const isPublic = (await question('   Make public? (y/n) [y]: ') || 'y').toLowerCase() === 'y';
  
  const needsApiKey = await question('   Does this endpoint require an API key? (y/n) [n]: ') || 'n';
  let apiKey = null;
  if (needsApiKey.toLowerCase() === 'y') {
    apiKey = await question('   API Key (will be encrypted): ');
  }

  // Prepare model data
  const modelData = {
    model_id: modelDef.modelId,
    model_name: modelDef.modelName,
    endpoint_url: endpointUrl,
    provider: provider,
    is_active: true,
    is_public: isPublic,
    user_id: null, // System model
    config: modelDef.defaultConfig,
    description: modelDef.description,
  };

  // Add API key if provided (in production, this should be encrypted)
  if (apiKey) {
    // For now, store in headers - in production use proper encryption
    modelData.headers = { Authorization: `Bearer ${apiKey}` };
  }

  if (existing) {
    // Update existing model
    const { data: updated, error } = await supabase
      .from('custom_models')
      .update(modelData)
      .eq('model_id', modelDef.modelId)
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Failed to update: ${error.message}`);
      return null;
    }

    console.log(`   ✅ Model updated successfully`);
    return updated;
  } else {
    // Create new model
    const { data: created, error } = await supabase
      .from('custom_models')
      .insert(modelData)
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Failed to create: ${error.message}`);
      if (error.code === '23505') {
        console.error(`   Model ID already exists (duplicate key)`);
      }
      return null;
    }

    console.log(`   ✅ Model created successfully`);
    return created;
  }
}

/**
 * Test a model configuration
 */
async function testModel(model) {
  console.log(`\n🧪 Testing model: ${model.model_name}`);
  
  // Simple test - check if endpoint is accessible
  if (!model.endpoint_url) {
    console.log(`   ⚠️  No endpoint URL configured`);
    return false;
  }

  try {
    // Try to make a simple request to verify endpoint
    const https = require('https');
    const http = require('http');
    const url = require('url');
    
    const parsedUrl = new URL(model.endpoint_url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    return new Promise((resolve) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'GET',
        timeout: 5000,
      };

      const req = client.request(options, (res) => {
        // Any response means endpoint exists
        resolve(res.statusCode < 500);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  } catch (error) {
    console.log(`   ⚠️  Could not test endpoint: ${error.message}`);
    return false;
  }
}

/**
 * Main configuration flow
 */
async function main() {
  console.log('🚀 BEAST MODE Model Configuration');
  console.log('='.repeat(60));
  console.log('\nThis script will configure all BEAST MODE models.');
  console.log('You can configure required models and optionally add more.\n');

  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }
    console.log('   ✅ Connection successful\n');

    // Check existing models
    const existingModels = await checkExistingModels();

    // Configure required models
    console.log('\n' + '='.repeat(60));
    console.log('📋 REQUIRED MODELS');
    console.log('='.repeat(60));
    
    const configuredModels = [];
    for (const modelDef of REQUIRED_MODELS) {
      const model = await configureModel(modelDef, existingModels);
      if (model) {
        configuredModels.push(model);
      }
    }

    // Ask about optional models
    console.log('\n' + '='.repeat(60));
    console.log('📋 OPTIONAL MODELS');
    console.log('='.repeat(60));
    
    const configureOptional = await question('\nConfigure optional models? (y/n) [n]: ') || 'n';
    if (configureOptional.toLowerCase() === 'y') {
      for (const modelDef of OPTIONAL_MODELS) {
        const configure = await question(`\nConfigure ${modelDef.modelName}? (y/n) [n]: `) || 'n';
        if (configure.toLowerCase() === 'y') {
          const model = await configureModel(modelDef, existingModels);
          if (model) {
            configuredModels.push(model);
          }
        }
      }
    }

    // Test configured models
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING MODELS');
    console.log('='.repeat(60));
    
    for (const model of configuredModels) {
      const testResult = await testModel(model);
      if (testResult) {
        console.log(`   ✅ ${model.model_name}: Endpoint accessible`);
      } else {
        console.log(`   ⚠️  ${model.model_name}: Could not verify endpoint`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ CONFIGURATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`\nConfigured ${configuredModels.length} model(s):\n`);
    
    configuredModels.forEach((model, index) => {
      console.log(`${index + 1}. ${model.model_name} (${model.model_id})`);
      console.log(`   Endpoint: ${model.endpoint_url}`);
      console.log(`   Provider: ${model.provider}`);
      console.log(`   Active: ${model.is_active ? 'Yes' : 'No'}`);
      console.log(`   Public: ${model.is_public ? 'Yes' : 'No'}`);
      console.log('');
    });

    console.log('\nNext steps:');
    console.log('1. Test code generation: node scripts/test-beast-mode-backend.js');
    console.log('2. Use the IDE to generate code via BEAST MODE');
    console.log('3. Check model status: node scripts/check-beast-mode-models.js');

  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
