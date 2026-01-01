#!/usr/bin/env node
/**
 * Store Porkbun credentials in user_api_keys table
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

async function storePorkbunCredentials() {
  console.log('🔐 Storing Porkbun credentials in user_api_keys...\n');
  
  // Store as JSON with both keys
  const credentials = JSON.stringify({
    api_key: PORKBUN_API_KEY,
    secret_key: PORKBUN_SECRET_KEY
  });
  
  const encrypted = encryptKey(credentials);
  if (!encrypted) {
    console.error('❌ Failed to encrypt credentials');
    process.exit(1);
  }
  
  // Get a user_id from existing records
  const { data: existingUser } = await supabase
    .from('user_api_keys')
    .select('user_id')
    .limit(1)
    .single();
  
  const userId = existingUser?.user_id || '00000000-0000-0000-0000-000000000000';
  
  // Check what providers are allowed - try different approaches
  const providerOptions = ['porkbun', 'dns', 'domain', 'infrastructure'];
  
  for (const provider of providerOptions) {
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('provider', provider)
        .ilike('key_name', '%porkbun%')
        .limit(1);
      
      if (existing && existing.length > 0) {
        // Update existing
        console.log(`📝 Updating existing record with provider: ${provider}...`);
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
          console.log(`✅ Updated Porkbun credentials in user_api_keys`);
          console.log(`   Provider: ${provider}`);
          console.log(`   Record ID: ${data.id}`);
          return true;
        }
      } else {
        // Try to insert new
        console.log(`➕ Creating new record with provider: ${provider}...`);
        const { data, error } = await supabase
          .from('user_api_keys')
          .insert({
            user_id: userId,
            provider: provider,
            encrypted_key: encrypted,
            key_name: 'Porkbun DNS API',
            is_active: true
          })
          .select()
          .single();
        
        if (!error) {
          console.log(`✅ Stored Porkbun credentials in user_api_keys`);
          console.log(`   Provider: ${provider}`);
          console.log(`   Record ID: ${data.id}`);
          return true;
        } else {
          console.log(`   ⚠️  Provider "${provider}" not allowed: ${error.message}`);
        }
      }
    } catch (e) {
      console.log(`   ⚠️  Error with provider "${provider}": ${e.message}`);
    }
  }
  
  console.log('\n❌ Could not store in user_api_keys - provider constraint issue');
  console.log('💡 Check what providers are allowed in the table constraint');
  return false;
}

storePorkbunCredentials().then(success => {
  if (success) {
    console.log('\n✅ Credentials stored successfully!');
  }
}).catch(console.error);
