#!/usr/bin/env node
/**
 * Add porkbun to allowed providers and store credentials in user_api_keys
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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
const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || 'default_key_change_in_production';

const PORKBUN_API_KEY = 'pk1_7cad269a0c08c304bdeef027a8c77b4593b251ce0202f022cd4ff11b04962b7d';
const PORKBUN_SECRET_KEY = 'sk1_21538a7e248a1beb603511a1d6b721980333ddd9f29cc0cd29a0704135e5fb3b';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function encryptKey(text) {
  try {
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption error:', error.message);
    return null;
  }
}

async function addPorkbunAndStore() {
  console.log('🔐 Adding porkbun provider and storing credentials...\n');
  
  // Create migration SQL to add porkbun to allowed providers
  const migrationSQL = `
-- Add porkbun to allowed providers in user_api_keys table
ALTER TABLE user_api_keys 
DROP CONSTRAINT IF EXISTS user_api_keys_provider_check;

ALTER TABLE user_api_keys 
ADD CONSTRAINT user_api_keys_provider_check 
CHECK (provider IN ('openai', 'mistral', 'gemini', 'groq', 'anthropic', 'together', 'porkbun'));
`;
  
  // Store credentials as JSON
  const credentials = JSON.stringify({
    api_key: PORKBUN_API_KEY,
    secret_key: PORKBUN_SECRET_KEY
  });
  
  const encrypted = encryptKey(credentials);
  if (!encrypted) {
    console.error('❌ Failed to encrypt credentials');
    process.exit(1);
  }
  
  // Save migration file
  const migrationPath = path.join(__dirname, '../website/supabase/migrations/20250101000002_add_porkbun_provider.sql');
  const migrationsDir = path.dirname(migrationPath);
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  fs.writeFileSync(migrationPath, migrationSQL);
  console.log('✅ Created migration file: website/supabase/migrations/20250101000002_add_porkbun_provider.sql');
  console.log('   This will add "porkbun" to allowed providers\n');
  
  // Try to execute migration via SQL (if possible)
  console.log('🚀 Attempting to run migration...');
  try {
    // Try using postgrest or direct SQL execution
    // For now, we'll need manual execution
    console.log('   ⚠️  Migration needs to be run manually in Supabase SQL Editor');
    console.log('   After running migration, credentials will be stored automatically\n');
  } catch (e) {
    console.log('   ⚠️  Could not execute automatically');
  }
  
  // Get user_id
  const { data: existingUser } = await supabase
    .from('user_api_keys')
    .select('user_id')
    .limit(1)
    .single();
  
  const userId = existingUser?.user_id || '00000000-0000-0000-0000-000000000000';
  
  // Try to store (will fail until migration is run)
  console.log('📝 Attempting to store credentials...');
  const { data: existing } = await supabase
    .from('user_api_keys')
    .select('*')
    .eq('provider', 'porkbun')
    .limit(1);
  
  if (existing && existing.length > 0) {
    // Update existing
    const { data, error } = await supabase
      .from('user_api_keys')
      .update({
        encrypted_key: encrypted,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing[0].id)
      .select()
      .single();
    
    if (!error) {
      console.log('✅ Updated existing Porkbun credentials!');
      return true;
    }
  } else {
    // Try to insert
    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: userId,
        provider: 'porkbun',
        encrypted_key: encrypted,
        key_name: 'Porkbun DNS API',
        is_active: true
      })
      .select()
      .single();
    
    if (!error) {
      console.log('✅ Stored Porkbun credentials in user_api_keys!');
      console.log(`   Record ID: ${data.id}`);
      return true;
    } else {
      console.log('   ⚠️  Could not store (provider constraint):', error.message);
      console.log('   💡 Run the migration first to add "porkbun" to allowed providers');
      console.log('   Migration file: website/supabase/migrations/20250101000002_add_porkbun_provider.sql');
    }
  }
  
  return false;
}

addPorkbunAndStore().then(success => {
  if (success) {
    console.log('\n✅ All done! Credentials are in user_api_keys table.');
  } else {
    console.log('\n📋 Next steps:');
    console.log('   1. Go to Supabase SQL Editor');
    console.log('   2. Run: website/supabase/migrations/20250101000002_add_porkbun_provider.sql');
    console.log('   3. Then run this script again to store credentials');
  }
}).catch(console.error);
