#!/usr/bin/env node

/**
 * Apply Model Configuration Directly via Supabase REST API
 * 
 * Uses the service role key to execute SQL directly via REST API
 * Bypasses migration history conflicts
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL to execute
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

async function main() {
  console.log('🚀 Applying BEAST MODE Model Configuration');
  console.log('='.repeat(60));
  console.log('\nUsing Supabase REST API with service role key\n');

  try {
    // Try using exec_sql RPC first
    console.log('📝 Attempting via exec_sql RPC...');
    const { data: execData, error: execError } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });

    if (!execError) {
      console.log('   ✅ SQL executed via exec_sql RPC');
      console.log('   Verifying with direct query...\n');
    } else {
      console.log(`   ⚠️  exec_sql not available: ${execError.message}`);
      console.log('   Trying direct insert...\n');
    }
    
    // Always try direct insert to ensure it works
    {
      // Fallback to direct insert
      // First check if model exists
      const { data: existing } = await supabase
        .from('custom_models')
        .select('model_id')
        .eq('model_id', 'beast-mode-code-generator')
        .is('user_id', null)
        .single();

      let data, error;
      
      if (existing) {
        // Update existing
        ({ data, error } = await supabase
          .from('custom_models')
          .update({
            model_name: 'BEAST MODE Code Generator',
            endpoint_url: 'https://api.beast-mode.dev/v1/chat/completions',
            provider: 'openai-compatible',
            is_active: true,
            is_public: true,
            config: {
              model: 'beast-mode-code-generator',
              temperature: 0.3,
              max_tokens: 4000,
            },
            description: 'Primary code generation model for BEAST MODE - the galaxy best vibe-coder oasis',
          })
          .eq('model_id', 'beast-mode-code-generator')
          .is('user_id', null)
          .select()
          .single());
      } else {
        // Insert new
        ({ data, error } = await supabase
          .from('custom_models')
          .insert({
            model_id: 'beast-mode-code-generator',
            model_name: 'BEAST MODE Code Generator',
            endpoint_url: 'https://api.beast-mode.dev/v1/chat/completions',
            provider: 'openai-compatible',
            is_active: true,
            is_public: true,
            config: {
              model: 'beast-mode-code-generator',
              temperature: 0.3,
              max_tokens: 4000,
            },
            description: 'Primary code generation model for BEAST MODE - the galaxy best vibe-coder oasis',
            user_id: null,
          })
          .select()
          .single());
      }

      if (error) {
        if (error.code === '42501') {
          console.error('   ❌ Permission denied - RLS blocking');
          console.error('   Service role key may not have proper permissions');
        } else {
          console.error(`   ❌ Error: ${error.message}`);
        }
        throw error;
      }

      console.log('   ✅ Model configured via direct insert');
      console.log(`   Model ID: ${data.model_id}`);
      console.log(`   Name: ${data.model_name}`);
    }

    // Verify
    console.log('\n🔍 Verifying model...\n');
    const { data: models, error: verifyError } = await supabase
      .from('custom_models')
      .select('model_id, model_name, endpoint_url, is_active, is_public, provider')
      .eq('model_id', 'beast-mode-code-generator')
      .single();

    if (verifyError) {
      console.error(`   ❌ Verification failed: ${verifyError.message}`);
    } else {
      console.log('   ✅ Model verified:');
      console.log(`      ID: ${models.model_id}`);
      console.log(`      Name: ${models.model_name}`);
      console.log(`      Endpoint: ${models.endpoint_url}`);
      console.log(`      Active: ${models.is_active ? 'Yes' : 'No'}`);
      console.log(`      Public: ${models.is_public ? 'Yes' : 'No'}`);
      console.log(`      Provider: ${models.provider}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Configuration Complete!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Test models: node scripts/check-beast-mode-models.js');
    console.log('2. Test code generation: node scripts/test-beast-mode-backend.js');

  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message);
    console.error('\nAlternative: Execute SQL in Supabase Dashboard → SQL Editor:');
    console.error('\n' + '='.repeat(60));
    console.error(sql);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

main();
