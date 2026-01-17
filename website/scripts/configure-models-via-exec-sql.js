#!/usr/bin/env node

/**
 * Configure BEAST MODE Models via exec_sql
 * 
 * Uses Supabase exec_sql RPC function to bypass RLS and configure models
 * This is the most reliable method for system-level model configuration
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
  console.error('❌ Supabase credentials not found');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Model configurations
const MODELS = [
  {
    model_id: 'beast-mode-code-generator',
    model_name: 'BEAST MODE Code Generator',
    description: 'Primary code generation model for BEAST MODE',
    endpoint_url: 'https://api.beast-mode.dev/v1/chat/completions',
    provider: 'openai-compatible',
    is_active: true,
    is_public: true,
    config: {
      model: 'beast-mode-code-generator',
      temperature: 0.3,
      max_tokens: 4000,
    },
  },
];

/**
 * Check if exec_sql function exists
 */
async function checkExecSQLExists() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: 'SELECT 1' 
    });
    
    if (!error) {
      return true;
    }
    
    if (error.message?.includes('does not exist') || error.code === '42883') {
      return false;
    }
    
    return null;
  } catch (e) {
    return false;
  }
}

/**
 * Configure models using exec_sql (following pattern from existing scripts)
 */
async function configureModelsViaExecSQL() {
  console.log('🚀 Configuring BEAST MODE Models via exec_sql');
  console.log('='.repeat(60));
  
  // Check if exec_sql exists
  console.log('\n🔍 Checking if exec_sql function exists...');
  const execSQLExists = await checkExecSQLExists();
  
  if (!execSQLExists) {
    console.log('   ⚠️  exec_sql function not found');
    console.log('   Using direct insert method instead...\n');
    return false;
  }
  
  console.log('   ✅ exec_sql function found\n');

  // Use upsert SQL (works whether model exists or not)
  const sql = `
    INSERT INTO custom_models (
      model_id,
      model_name,
      endpoint_url,
      provider,
      is_active,
      is_public,
      config,
      description,
      user_id
    ) VALUES (
      'beast-mode-code-generator',
      'BEAST MODE Code Generator',
      'https://api.beast-mode.dev/v1/chat/completions',
      'openai-compatible',
      true,
      true,
      '{"model": "beast-mode-code-generator", "temperature": 0.3, "max_tokens": 4000}'::jsonb,
      'Primary code generation model for BEAST MODE - the galaxy''s best vibe-coder''s oasis',
      NULL
    )
    ON CONFLICT (model_id) DO UPDATE SET
      model_name = EXCLUDED.model_name,
      endpoint_url = EXCLUDED.endpoint_url,
      provider = EXCLUDED.provider,
      is_active = EXCLUDED.is_active,
      is_public = EXCLUDED.is_public,
      config = EXCLUDED.config,
      description = EXCLUDED.description,
      updated_at = NOW();
  `;

  try {
    console.log('📝 Executing SQL via exec_sql RPC...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return false;
    }

    console.log('   ✅ Model configured successfully');
    return true;
  } catch (error) {
    console.error(`   ❌ Unexpected error: ${error.message}`);
    return false;
  }
}

/**
 * Alternative: Direct insert using service role (bypasses RLS)
 */
async function configureModelsDirect() {
  console.log('🚀 Configuring BEAST MODE Models (Direct Insert)');
  console.log('='.repeat(60));
  console.log('\nUsing service role to bypass RLS\n');

  for (const model of MODELS) {
    console.log(`\n📝 Configuring: ${model.model_name}`);

    // Use upsert to create or update
    const { data, error } = await supabase
      .from('custom_models')
      .upsert({
        model_id: model.model_id,
        model_name: model.model_name,
        endpoint_url: model.endpoint_url,
        provider: model.provider,
        is_active: model.is_active,
        is_public: model.is_public,
        config: model.config,
        description: model.description,
        user_id: null, // System model
      }, {
        onConflict: 'model_id',
      })
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      if (error.code === '42501') {
        console.error(`   ⚠️  Permission denied - RLS policy blocking`);
        console.error(`   Try using exec_sql method instead`);
      }
    } else {
      console.log(`   ✅ Model configured: ${data.model_name}`);
    }
  }

  // Verify
  const { data: models, error } = await supabase
    .from('custom_models')
    .select('*')
    .in('model_id', MODELS.map(m => m.model_id));

  if (error) {
    console.error(`\n❌ Error verifying: ${error.message}`);
  } else {
    console.log(`\n✅ Verified ${models?.length || 0} model(s) configured`);
  }
}

async function main() {
  try {
    console.log('🚀 BEAST MODE Model Configuration');
    console.log('='.repeat(60));
    
    // Try exec_sql first (preferred method per cursorrules)
    const execSQLSuccess = await configureModelsViaExecSQL();
    
    if (!execSQLSuccess) {
      console.log('\n📝 Falling back to direct insert method...\n');
      await configureModelsDirect();
    }
    
    // Verify models
    console.log('\n' + '='.repeat(60));
    console.log('✅ Verifying configured models...\n');
    
    const { data: models, error } = await supabase
      .from('custom_models')
      .select('model_id, model_name, endpoint_url, is_active, is_public, provider')
      .in('model_id', MODELS.map(m => m.model_id));

    if (error) {
      console.error(`❌ Error verifying: ${error.message}`);
    } else {
      console.log(`Found ${models?.length || 0} model(s):\n`);
      if (models && models.length > 0) {
        models.forEach((model) => {
          console.log(`  ✅ ${model.model_name} (${model.model_id})`);
          console.log(`     Endpoint: ${model.endpoint_url}`);
          console.log(`     Active: ${model.is_active ? 'Yes' : 'No'}`);
          console.log(`     Public: ${model.is_public ? 'Yes' : 'No'}`);
          console.log(`     Provider: ${model.provider}`);
          console.log('');
        });
      } else {
        console.log('  ⚠️  No models found - configuration may have failed');
      }
    }
    
    console.log('='.repeat(60));
    console.log('✅ Configuration Complete');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Test models: node scripts/check-beast-mode-models.js');
    console.log('2. Test code generation: node scripts/test-beast-mode-backend.js');
    
  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
