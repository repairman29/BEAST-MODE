#!/usr/bin/env node

/**
 * Store GitHub OAuth Config in Supabase
 * 
 * This script stores the GitHub OAuth credentials in Supabase app_config table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use unified config if available
let getUnifiedConfig = null;
try {
  const path = require('path');
  const configPath = path.join(__dirname, '../../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

// Helper function to get config value
async function getConfigValue(key, defaultValue = null) {
  if (getUnifiedConfig) {
    try {
      const config = await getUnifiedConfig();
      const value = config.get(key);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    } catch (error) {
      // Fallback to process.env
    }
  }
  // Fallback to process.env for backward compatibility
  return process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : defaultValue;
}

// Config values (will be loaded async)
let GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI, GITHUB_TOKEN_ENCRYPTION_KEY;
let supabaseUrl, supabaseServiceKey;

async function storeInSupabase() {
  // Load config values
  GITHUB_CLIENT_ID = await getConfigValue('GITHUB_CLIENT_ID', 'Ov23lidLvmp68FVMEqEB');
  GITHUB_CLIENT_SECRET = await getConfigValue('GITHUB_CLIENT_SECRET', 'df4c598018de45ce8cb90313489eeb21448aedcf');
  GITHUB_REDIRECT_URI = await getConfigValue('GITHUB_REDIRECT_URI', 'http://localhost:7777/api/github/oauth/callback');
  GITHUB_TOKEN_ENCRYPTION_KEY = await getConfigValue('GITHUB_TOKEN_ENCRYPTION_KEY', '20abb6f3b973e2fdeea6e2c417ce93824e7b64962f9fee4bfd6339264c8e792c');
  supabaseUrl = await getConfigValue('NEXT_PUBLIC_SUPABASE_URL', null);
  supabaseServiceKey = await getConfigValue('SUPABASE_SERVICE_ROLE_KEY', null);

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('⚠️  Supabase not configured');
    console.log('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.log('');
    console.log('   For now, values are stored in .env.local and will work locally.');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📦 Storing GitHub OAuth config in Supabase...');

    // First, check if app_config table exists
    const { error: checkError } = await supabase
      .from('app_config')
      .select('key')
      .limit(1);

    if (checkError && checkError.code === 'PGRST116') {
      console.log('❌ app_config table does not exist');
      console.log('');
      console.log('📋 Run this SQL in Supabase SQL Editor:');
      console.log('');
      console.log(require('fs').readFileSync(
        require('path').join(__dirname, '..', 'supabase', 'migrations', '20250101000000_create_app_config.sql'),
        'utf8'
      ));
      return false;
    }

    // Store GitHub OAuth config
    const { data, error } = await supabase
      .from('app_config')
      .upsert({
        key: 'github_oauth',
        value: {
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          redirect_uri: GITHUB_REDIRECT_URI,
          encryption_key: GITHUB_TOKEN_ENCRYPTION_KEY,
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error storing in Supabase:', error.message);
      return false;
    }

    console.log('✅ GitHub OAuth config stored in Supabase');
    console.log('   Key: github_oauth');
    console.log('   Client ID:', GITHUB_CLIENT_ID);
    return true;
  } catch (error) {
    console.error('❌ Supabase error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Storing GitHub OAuth Config in Supabase...\n');

  const success = await storeInSupabase();

  if (success) {
    console.log('\n✅ Complete! GitHub OAuth config is now in Supabase');
  } else {
    console.log('\n⚠️  Config stored in .env.local (works for local development)');
    console.log('   To enable Supabase storage, set Supabase credentials and run migration');
  }
}

main().catch(console.error);

