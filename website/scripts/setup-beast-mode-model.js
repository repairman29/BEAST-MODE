#!/usr/bin/env node

/**
 * Setup BEAST MODE Custom Model
 * 
 * Creates a default BEAST MODE code generation model in Supabase
 * This enables code generation using BEAST MODE's own infrastructure
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

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
  console.error('❌ Supabase credentials not found in environment variables');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBeastModeModel() {
  console.log('🚀 Setting up BEAST MODE Custom Model');
  console.log('='.repeat(60));

  const modelId = 'beast-mode-code-generator';
  const modelName = 'BEAST MODE Code Generator';
  
  // Check if model already exists
  const { data: existing, error: checkError } = await supabase
    .from('custom_models')
    .select('*')
    .eq('model_id', modelId)
    .single();

  if (existing) {
    console.log(`✅ Model ${modelId} already exists`);
    console.log(`   Name: ${existing.model_name}`);
    console.log(`   Active: ${existing.is_active ? 'Yes' : 'No'}`);
    console.log(`   Public: ${existing.is_public ? 'Yes' : 'No'}`);
    
    if (!existing.is_active) {
      console.log('\n⚠️  Model exists but is not active. Activating...');
      const { error: updateError } = await supabase
        .from('custom_models')
        .update({ is_active: true })
        .eq('model_id', modelId);
      
      if (updateError) {
        console.error('❌ Failed to activate model:', updateError.message);
        process.exit(1);
      }
      console.log('✅ Model activated');
    }
    
    return existing;
  }

  console.log(`\n📝 Creating BEAST MODE model: ${modelId}`);
  console.log('   Note: You will need to configure the endpoint URL and API key');
  console.log('   This script creates the model record - you must configure the actual model endpoint separately\n');

  // Prompt for model configuration
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    const endpointUrl = await question('Model Endpoint URL (e.g., https://api.beast-mode.dev/v1/chat/completions): ');
    const provider = await question('Provider type (openai-compatible/anthropic-compatible/custom) [openai-compatible]: ') || 'openai-compatible';
    const isPublic = (await question('Make model public? (y/n) [y]: ') || 'y').toLowerCase() === 'y';

    if (!endpointUrl) {
      console.log('\n⚠️  No endpoint URL provided. Creating model with placeholder - you can update it later.');
    }

    // Create model
    const { data: newModel, error: createError } = await supabase
      .from('custom_models')
      .insert({
        model_id: modelId,
        model_name: modelName,
        endpoint_url: endpointUrl || 'https://api.beast-mode.dev/v1/chat/completions',
        provider: provider,
        is_active: true,
        is_public: isPublic,
        user_id: null, // System model
        config: {
          model: 'beast-mode-code-generator',
          temperature: 0.3,
          max_tokens: 4000,
        },
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create model:', createError.message);
      if (createError.code === '23505') {
        console.error('   Model already exists (duplicate key)');
      }
      process.exit(1);
    }

    console.log('\n✅ BEAST MODE model created successfully!');
    console.log(`   Model ID: ${newModel.model_id}`);
    console.log(`   Name: ${newModel.model_name}`);
    console.log(`   Endpoint: ${newModel.endpoint_url}`);
    console.log(`   Provider: ${newModel.provider}`);
    console.log(`   Public: ${newModel.is_public ? 'Yes' : 'No'}`);
    console.log(`   Active: ${newModel.is_active ? 'Yes' : 'No'}`);

    if (!endpointUrl) {
      console.log('\n⚠️  IMPORTANT: Update the endpoint URL to point to your actual BEAST MODE model endpoint');
      console.log('   You can do this via Supabase dashboard or by running this script again');
    }

    return newModel;
  } finally {
    rl.close();
  }
}

async function main() {
  try {
    const model = await setupBeastModeModel();
    console.log('\n' + '='.repeat(60));
    console.log('✅ BEAST MODE model setup complete!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Ensure your model endpoint is running and accessible');
    console.log('2. Test code generation: node scripts/test-beast-mode-backend.js');
    console.log('3. Use the IDE to generate code via BEAST MODE');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
