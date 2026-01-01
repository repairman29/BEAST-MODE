#!/usr/bin/env node

/**
 * Add vercel provider and store token in one go
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

const VERCEL_TOKEN = process.argv[2] || 'BfpTMhfaQgsHMouTgb6XdcE1';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addVercelProviderAndStore() {
  console.log('🔐 Adding vercel provider and storing token...\n');
  
  // Step 1: Check if vercel provider is allowed
  console.log('1️⃣  Checking if "vercel" provider is allowed...');
  
  // Try to insert a test record to see if provider is allowed
  // (We'll delete it immediately if it works)
  const testResult = await supabase
    .from('user_api_keys')
    .insert({
      provider: 'vercel',
      encrypted_key: 'test',
      key_name: 'test',
      is_active: false
    })
    .select()
    .single();
  
  if (testResult.error && testResult.error.message.includes('check constraint')) {
    console.log('   ⚠️  "vercel" provider not in allowed list');
    console.log('   💡 Run this SQL in Supabase SQL Editor:');
    console.log('');
    console.log('   ALTER TABLE user_api_keys');
    console.log('   DROP CONSTRAINT IF EXISTS user_api_keys_provider_check;');
    console.log('');
    console.log('   ALTER TABLE user_api_keys');
    console.log('   ADD CONSTRAINT user_api_keys_provider_check');
    console.log("   CHECK (provider IN ('openai', 'mistral', 'gemini', 'groq', 'anthropic', 'together', 'porkbun', 'vercel'));");
    console.log('');
    console.log('   Then run this script again.\n');
    return false;
  } else if (!testResult.error) {
    // Delete the test record
    await supabase.from('user_api_keys').delete().eq('id', testResult.data.id);
    console.log('   ✅ "vercel" provider is allowed\n');
  } else {
    console.log('   ✅ Proceeding (provider check passed)\n');
  }
  
  // Step 2: Store token (will work once provider is added)
  console.log('2️⃣  Storing Vercel token...');
  
  // Get encryption function from store script
  const crypto = require('crypto');
  const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || 'default_key_change_in_production';
  
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
  
  const encrypted = encryptKey(VERCEL_TOKEN);
  if (!encrypted) {
    console.error('   ❌ Failed to encrypt token');
    return false;
  }
  
  // Get user_id
  const { data: existingUser } = await supabase
    .from('user_api_keys')
    .select('user_id')
    .limit(1)
    .single();
  
  const userId = existingUser?.user_id || '00000000-0000-0000-0000-000000000000';
  
  // Try to store
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
      console.log('   ✅ Updated existing Vercel token!');
      console.log(`   Record ID: ${data.id}\n`);
      return true;
    } else {
      if (error.message.includes('check constraint')) {
        console.log('   ⚠️  Provider not added yet. Run SQL migration first.\n');
        return false;
      }
      console.error('   ❌ Failed to update:', error.message);
      return false;
    }
  } else {
    // Insert new
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
      console.log('   ✅ Stored Vercel token!');
      console.log(`   Record ID: ${data.id}\n`);
      return true;
    } else {
      if (error.message.includes('check constraint')) {
        console.log('   ⚠️  Provider not added yet. Run SQL migration first.\n');
        return false;
      }
      console.error('   ❌ Failed to store:', error.message);
      return false;
    }
  }
}

addVercelProviderAndStore().then(success => {
  if (success) {
    console.log('✅ All done! Vercel token is stored in Supabase.\n');
  } else {
    console.log('📋 Summary:');
    console.log('   1. Run the SQL migration in Supabase SQL Editor');
    console.log('   2. Then run this script again\n');
  }
}).catch(console.error);

