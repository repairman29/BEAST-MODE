#!/usr/bin/env node

/**
 * Store Vercel token in Supabase user_api_keys table
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

const VERCEL_TOKEN = process.argv[2] || 'BfpTMhfaQgsHMouTgb6XdcE1';

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

async function storeVercelToken() {
  console.log('🔐 Storing Vercel token in Supabase...\n');
  
  // Check if 'vercel' is in allowed providers
  const { data: checkConstraint } = await supabase
    .from('user_api_keys')
    .select('provider')
    .limit(1);
  
  // Get user_id (use first available or default)
  const { data: existingUser } = await supabase
    .from('user_api_keys')
    .select('user_id')
    .limit(1)
    .single();
  
  const userId = existingUser?.user_id || '00000000-0000-0000-0000-000000000000';
  
  // Encrypt the token
  const encrypted = encryptKey(VERCEL_TOKEN);
  if (!encrypted) {
    console.error('❌ Failed to encrypt token');
    process.exit(1);
  }
  
  // Check if vercel provider exists
  const { data: existing } = await supabase
    .from('user_api_keys')
    .select('*')
    .eq('provider', 'vercel')
    .limit(1);
  
  if (existing && existing.length > 0) {
    // Update existing
    const { data, error } = await supabase
      .from('user_api_keys')
      .update({
        encrypted_key: encrypted,
        updated_at: new Date().toISOString(),
        is_active: true
      })
      .eq('id', existing[0].id)
      .select()
      .single();
    
    if (!error) {
      console.log('✅ Updated existing Vercel token in user_api_keys!');
      console.log(`   Record ID: ${data.id}`);
      return true;
    } else {
      console.error('❌ Failed to update:', error.message);
      return false;
    }
  } else {
    // Try to insert (may fail if 'vercel' not in allowed providers)
    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: userId,
        provider: 'vercel',
        encrypted_key: encrypted,
        key_name: 'Vercel API Token',
        is_active: true
      })
      .select()
      .single();
    
    if (!error) {
      console.log('✅ Stored Vercel token in user_api_keys!');
      console.log(`   Record ID: ${data.id}`);
      return true;
    } else {
      if (error.message.includes('check constraint')) {
        console.log('⚠️  "vercel" provider not in allowed list');
        console.log('   Need to add "vercel" to user_api_keys provider constraint');
        console.log('\n📝 Run this SQL in Supabase:');
        console.log(`
ALTER TABLE user_api_keys 
DROP CONSTRAINT IF EXISTS user_api_keys_provider_check;

ALTER TABLE user_api_keys 
ADD CONSTRAINT user_api_keys_provider_check 
CHECK (provider IN ('openai', 'mistral', 'gemini', 'groq', 'anthropic', 'together', 'porkbun', 'vercel'));
        `);
        return false;
      } else {
        console.error('❌ Failed to store:', error.message);
        return false;
      }
    }
  }
}

storeVercelToken().then(success => {
  if (success) {
    console.log('\n✅ Vercel token stored successfully!');
    console.log('   It can now be retrieved from Supabase for Vercel operations.\n');
  } else {
    console.log('\n📋 Next steps:');
    console.log('   1. Add "vercel" to allowed providers (see SQL above)');
    console.log('   2. Run this script again\n');
  }
}).catch(console.error);

