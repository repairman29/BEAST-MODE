#!/usr/bin/env node

/**
 * Store GitHub OAuth Config in Supabase
 * 
 * This script stores the GitHub OAuth credentials in Supabase app_config table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23lidLvmp68FVMEqEB';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'df4c598018de45ce8cb90313489eeb21448aedcf';
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:7777/api/github/oauth/callback';
const GITHUB_TOKEN_ENCRYPTION_KEY = process.env.GITHUB_TOKEN_ENCRYPTION_KEY || '20abb6f3b973e2fdeea6e2c417ce93824e7b64962f9fee4bfd6339264c8e792c';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function storeInSupabase() {
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

