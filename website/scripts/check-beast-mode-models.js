#!/usr/bin/env node

/**
 * Check BEAST MODE Custom Models
 * 
 * Lists all available BEAST MODE custom models
 */

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

async function checkModels() {
  try {
    // Use the same path resolution as the API routes
    const supabaseModule = require('../lib/supabase.ts');
    const getSupabaseClientOrNull = supabaseModule.getSupabaseClientOrNull || supabaseModule.default?.getSupabaseClientOrNull;
    const supabase = await getSupabaseClientOrNull();
    
    if (!supabase) {
      console.log('❌ Supabase client not available');
      console.log('   Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
      process.exit(1);
    }

    console.log('🔍 Checking BEAST MODE Custom Models...\n');

    // Get all active models
    const { data: models, error } = await supabase
      .from('custom_models')
      .select('model_id, model_name, endpoint_url, provider, is_active, is_public, user_id, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching models:', error.message);
      process.exit(1);
    }

    if (!models || models.length === 0) {
      console.log('⚠️  No active custom models found');
      console.log('\nTo create a model, run:');
      console.log('  node scripts/setup-beast-mode-model.js');
      process.exit(0);
    }

    console.log(`✅ Found ${models.length} active custom model(s):\n`);
    console.log('='.repeat(60));

    models.forEach((model, index) => {
      console.log(`\n${index + 1}. ${model.model_name}`);
      console.log(`   ID: ${model.model_id}`);
      console.log(`   Endpoint: ${model.endpoint_url || 'Not configured'}`);
      console.log(`   Provider: ${model.provider || 'Not specified'}`);
      console.log(`   Public: ${model.is_public ? 'Yes' : 'No'}`);
      console.log(`   User: ${model.user_id || 'System'}`);
      console.log(`   Created: ${model.created_at ? new Date(model.created_at).toLocaleDateString() : 'Unknown'}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ BEAST MODE has ${models.length} model(s) ready for code generation!`);
    console.log('\nTest code generation:');
    console.log('  node scripts/test-beast-mode-backend.js');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkModels();
