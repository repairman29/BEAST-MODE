#!/usr/bin/env node

/**
 * Simple API Key Adder
 * 
 * Easy way to add an API key for testing
 * 
 * Usage:
 *   node scripts/add-api-key-simple.js --user-id=YOUR_USER_ID --provider=openai --key=sk-...
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const providerArg = args.find(arg => arg.startsWith('--provider='));
const keyArg = args.find(arg => arg.startsWith('--key='));

const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;
const provider = providerArg ? providerArg.split('=')[1] : 'openai';
const apiKey = keyArg ? keyArg.split('=')[1] : null;

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/add-api-key-simple.js --user-id=YOUR_USER_ID --provider=openai --key=sk-...');
  process.exit(1);
}

if (!apiKey) {
  console.error('❌ API key required');
  console.error('   Usage: node scripts/add-api-key-simple.js --user-id=YOUR_USER_ID --provider=openai --key=sk-...');
  console.error('');
  console.error('💡 You can get API keys from:');
  console.error('   - OpenAI: https://platform.openai.com/api-keys');
  console.error('   - Anthropic: https://console.anthropic.com/settings/keys');
  process.exit(1);
}

/**
 * Encrypt API key
 */
function encryptApiKey(text) {
  const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || 
                       process.env.ENCRYPTION_KEY || 
                       'default-encryption-key-change-in-production';
  
  const key = Buffer.from(encryptionKey.slice(0, 32), 'utf8');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Load Supabase client
 */
async function getSupabaseClient() {
  try {
    const envPath = path.join(__dirname, '../website/.env.local');
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                       process.env.SUPABASE_ANON_KEY ||
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }

    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    throw new Error(`Failed to initialize Supabase: ${error.message}`);
  }
}

/**
 * Main
 */
async function main() {
  console.log('🔑 Adding API Key');
  console.log('='.repeat(60));
  console.log(`👤 User ID: ${userId}`);
  console.log(`🔧 Provider: ${provider}`);
  console.log(`🔑 Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log('');
  
  try {
    // Encrypt API key
    console.log('🔐 Encrypting API key...');
    const encrypted = encryptApiKey(apiKey);
    console.log('   ✅ Encrypted');
    
    // Store in Supabase
    console.log('💾 Storing in Supabase...');
    const supabase = await getSupabaseClient();
    
    // Check if key already exists
    const { data: existing } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();
    
    let result;
    if (existing) {
      // Update existing
      console.log('   📝 Updating existing key...');
      result = await supabase
        .from('user_api_keys')
        .update({
          encrypted_key: encrypted.encrypted,
          iv: encrypted.iv,
          auth_tag: encrypted.authTag,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new
      console.log('   ➕ Creating new key...');
      result = await supabase
        .from('user_api_keys')
        .insert({
          user_id: userId,
          provider: provider,
          encrypted_key: encrypted.encrypted,
          iv: encrypted.iv,
          auth_tag: encrypted.authTag,
          is_active: true
        })
        .select()
        .single();
    }
    
    if (result.error) {
      throw new Error(`Failed to store API key: ${result.error.message}`);
    }
    
    console.log('   ✅ Stored successfully!');
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ API Key Added!');
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 Details:');
    console.log(`   Provider: ${provider}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Status: Active`);
    console.log('');
    console.log('🚀 You can now use this API key for:');
    console.log('   - Code generation');
    console.log('   - Feature generation');
    console.log('   - All LLM-powered features');
    console.log('');
    console.log('💡 Test it:');
    console.log('   node scripts/build-real-feature.js --user-id=' + userId);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Check .env.local has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.error('   2. Verify API_KEYS_ENCRYPTION_KEY is set');
    console.error('   3. Check user_id is correct');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
