#!/usr/bin/env node

/**
 * List All BEAST MODE Models
 * 
 * Shows all models (active and inactive) to help debug
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

async function listAllModels() {
  try {
    // Use dynamic import for TypeScript module
    const supabaseModule = await import('../lib/supabase.ts').catch(() => {
      // Fallback to require
      try {
        return require('../lib/supabase');
      } catch (e) {
        return null;
      }
    });
    
    if (!supabaseModule) {
      console.log('❌ Could not load Supabase module');
      process.exit(1);
    }
    
    const getSupabaseClientOrNull = supabaseModule.getSupabaseClientOrNull || supabaseModule.default?.getSupabaseClientOrNull;
    const supabase = await getSupabaseClientOrNull();
    
    if (!supabase) {
      console.log('❌ Supabase client not available');
      console.log('   Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
      process.exit(1);
    }

    console.log('🔍 Listing ALL BEAST MODE Models (active and inactive)...\n');

    // Get all models (not just active)
    const { data: allModels, error } = await supabase
      .from('custom_models')
      .select('model_id, model_name, endpoint_url, provider, is_active, is_public, user_id, created_at')
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching models:', error.message);
      process.exit(1);
    }

    if (!allModels || allModels.length === 0) {
      console.log('⚠️  No models found in custom_models table');
      console.log('\nTo create a model, run:');
      console.log('  node scripts/setup-beast-mode-model.js');
      process.exit(0);
    }

    const activeModels = allModels.filter(m => m.is_active);
    const inactiveModels = allModels.filter(m => !m.is_active);

    console.log(`📊 Total Models: ${allModels.length}`);
    console.log(`   ✅ Active: ${activeModels.length}`);
    console.log(`   ❌ Inactive: ${inactiveModels.length}`);
    console.log('\n' + '='.repeat(60));

    if (activeModels.length > 0) {
      console.log('\n✅ ACTIVE MODELS:\n');
      activeModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.model_name || model.model_id}`);
        console.log(`   ID: ${model.model_id}`);
        console.log(`   Endpoint: ${model.endpoint_url || '❌ Not configured'}`);
        console.log(`   Provider: ${model.provider || 'Not specified'}`);
        console.log(`   Public: ${model.is_public ? 'Yes' : 'No'}`);
        console.log(`   User: ${model.user_id || 'System'}`);
        console.log('');
      });
    }

    if (inactiveModels.length > 0) {
      console.log('\n❌ INACTIVE MODELS:\n');
      inactiveModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.model_name || model.model_id}`);
        console.log(`   ID: ${model.model_id}`);
        console.log(`   Endpoint: ${model.endpoint_url || 'Not configured'}`);
        console.log(`   Status: INACTIVE (is_active = false)`);
        console.log('');
      });
    }

    console.log('='.repeat(60));
    
    if (activeModels.length === 0) {
      console.log('\n⚠️  No active models found!');
      console.log('   Activate a model by setting is_active = true in Supabase');
    } else {
      console.log(`\n✅ BEAST MODE has ${activeModels.length} active model(s) ready!`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

listAllModels();
