#!/usr/bin/env node
/**
 * Store Porkbun credentials in app_config table via SQL
 */

const path = require('path');
const fs = require('fs');

// Load .env.local
try {
  const envPath = path.join(__dirname, '../website/.env.local');
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
} catch (e) {}

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PORKBUN_API_KEY = 'pk1_7cad269a0c08c304bdeef027a8c77b4593b251ce0202f022cd4ff11b04962b7d';
const PORKBUN_SECRET_KEY = 'sk1_21538a7e248a1beb603511a1d6b721980333ddd9f29cc0cd29a0704135e5fb3b';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function storeInAppConfig() {
  console.log('🔐 Storing Porkbun credentials in app_config...\n');
  
  // Use RPC or direct SQL to ensure table exists and insert
  const configValue = {
    api_key: PORKBUN_API_KEY,
    secret_key: PORKBUN_SECRET_KEY,
    stored_at: new Date().toISOString()
  };
  
  // Try upsert via SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      INSERT INTO app_config (key, value, updated_at)
      VALUES ('porkbun_api', '${JSON.stringify(configValue)}'::jsonb, NOW())
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = NOW()
      RETURNING *;
    `
  }).catch(async () => {
    // RPC might not exist, try direct upsert
    return await supabase
      .from('app_config')
      .upsert({
        key: 'porkbun_api',
        value: configValue,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })
      .select()
      .single();
  });
  
  if (error) {
    console.log('   ⚠️  Could not store in app_config:', error.message);
    console.log('   💡 You may need to create the app_config table first');
    console.log('   Run the migration: website/supabase/migrations/20250101000000_create_app_config.sql');
    return false;
  }
  
  console.log('✅ Stored Porkbun credentials in app_config table');
  console.log('   Key: porkbun_api');
  console.log('   Contains: api_key, secret_key');
  return true;
}

storeInAppConfig().then(success => {
  if (success) {
    console.log('\n✅ All done! Credentials are now in Supabase.');
  } else {
    console.log('\n⚠️  Credentials are configured in the script but not yet in Supabase.');
    console.log('   The DNS setup will still work using the hardcoded values.');
  }
}).catch(error => {
  console.error('❌ Error:', error.message);
});
