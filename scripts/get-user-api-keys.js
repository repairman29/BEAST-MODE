#!/usr/bin/env node

/**
 * Get User API Keys
 * 
 * Retrieves and displays user API keys from Supabase
 * Shows what API keys are available for testing
 * 
 * Usage:
 *   node scripts/get-user-api-keys.js --user-id=YOUR_USER_ID
 */

const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/get-user-api-keys.js --user-id=YOUR_USER_ID');
  console.error('   Or set: export TEST_USER_ID=YOUR_USER_ID');
  process.exit(1);
}

/**
 * Load Supabase client
 */
async function getSupabaseClient() {
  try {
    // Load .env.local from website directory
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
      throw new Error('Supabase credentials not found in environment');
    }

    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    throw new Error(`Failed to initialize Supabase: ${error.message}`);
  }
}

/**
 * Decrypt API key
 */
function decryptApiKey(encrypted, iv, authTag = null) {
  if (!encrypted || !iv) return null;

  try {
    const crypto = require('crypto');
    const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || 
                        process.env.ENCRYPTION_KEY || 
                        'default-encryption-key-change-in-production';
    
    const key = Buffer.from(encryptionKey.slice(0, 32), 'utf8');
    const ivBuffer = Buffer.from(iv, 'hex');
    
    // Try GCM first (with auth tag)
    if (authTag) {
      try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch (error) {
        // Fall through to CBC
      }
    }
    
    // Try CBC (legacy format)
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.warn('   ⚠️  Decryption failed:', error.message);
    return null;
  }
}

/**
 * Main
 */
async function main() {
  console.log('🔑 Getting User API Keys');
  console.log('='.repeat(60));
  console.log(`👤 User ID: ${userId}`);
  console.log('');
  
  try {
    const supabase = await getSupabaseClient();
    
    // Get user API keys
    console.log('📋 Fetching API keys from user_api_keys table...');
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (apiKeysError) {
      console.error('❌ Error fetching API keys:', apiKeysError.message);
      return;
    }
    
    console.log(`   ✅ Found ${apiKeys?.length || 0} API key(s)`);
    console.log('');
    
    if (apiKeys && apiKeys.length > 0) {
      console.log('🔑 Available API Keys:');
      console.log('='.repeat(60));
      
      apiKeys.forEach((key, i) => {
        console.log(`\n${i + 1}. Provider: ${key.provider}`);
        console.log(`   ID: ${key.id}`);
        console.log(`   Created: ${new Date(key.created_at).toLocaleString()}`);
        
        // Try to decrypt
        if (key.encrypted_key && key.iv) {
          const decrypted = decryptApiKey(key.encrypted_key, key.iv, key.auth_tag);
          if (decrypted) {
            // Show partial key for security
            const prefix = decrypted.substring(0, 8);
            const suffix = decrypted.substring(decrypted.length - 4);
            console.log(`   🔓 Key: ${prefix}...${suffix} (${decrypted.length} chars)`);
            console.log(`   ✅ Decrypted successfully`);
            console.log(`   💡 Full key available for testing`);
          } else {
            console.log(`   ⚠️  Could not decrypt`);
            console.log(`   💡 Encryption key might not match, or key format is different`);
          }
        } else {
          console.log(`   ⚠️  No encrypted key stored (metadata only)`);
          console.log(`   💡 Add key using: node scripts/add-api-key-simple.js`);
        }
      });
    } else {
      console.log('⚠️  No API keys found for this user');
      console.log('');
      console.log('💡 To add API keys:');
      console.log('   1. Use the UI: /dashboard/settings/api-keys');
      console.log('   2. Or use API: POST /api/auth/api-keys');
      console.log('   3. Or store directly in Supabase user_api_keys table');
    }
    
    // Get custom models (which have their own API keys)
    console.log('\n' + '='.repeat(60));
    console.log('📋 Fetching custom models...');
    const { data: customModels, error: customModelsError } = await supabase
      .from('custom_models')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (customModelsError) {
      console.error('❌ Error fetching custom models:', customModelsError.message);
      return;
    }
    
    console.log(`   ✅ Found ${customModels?.length || 0} custom model(s)`);
    console.log('');
    
    if (customModels && customModels.length > 0) {
      console.log('🤖 Custom Models (with API keys):');
      console.log('='.repeat(60));
      
      customModels.forEach((model, i) => {
        console.log(`\n${i + 1}. Model: ${model.model_name}`);
        console.log(`   ID: ${model.model_id}`);
        console.log(`   Endpoint: ${model.endpoint_url}`);
        console.log(`   Provider: ${model.provider}`);
        
        if (model.api_key_encrypted && model.api_key_iv) {
          const decrypted = decryptApiKey(model.api_key_encrypted, model.api_key_iv, model.api_key_auth_tag);
          if (decrypted) {
            const prefix = decrypted.substring(0, 8);
            const suffix = decrypted.substring(decrypted.length - 4);
            console.log(`   🔓 API Key: ${prefix}...${suffix} (${decrypted.length} chars)`);
            console.log(`   ✅ Decrypted successfully`);
            console.log(`   💡 Full key available for testing`);
          } else {
            console.log(`   ⚠️  Could not decrypt`);
            console.log(`   💡 Encryption key might not match`);
            console.log(`   💡 Update model with: node scripts/simple-setup-custom-model.js`);
          }
        } else {
          console.log(`   ⚠️  No API key stored`);
          console.log(`   💡 Add key using: node scripts/simple-setup-custom-model.js`);
        }
      });
    } else {
      console.log('⚠️  No custom models found');
      console.log('');
      console.log('💡 To add custom models:');
      console.log('   node scripts/simple-setup-custom-model.js --user-id=' + userId);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    console.log(`   Provider API Keys: ${apiKeys?.length || 0}`);
    console.log(`   Custom Models: ${customModels?.length || 0}`);
    console.log(`   Total: ${(apiKeys?.length || 0) + (customModels?.length || 0)}`);
    console.log('');
    
    if ((apiKeys?.length || 0) === 0 && (customModels?.length || 0) === 0) {
      console.log('💡 No API keys found. You can:');
      console.log('');
      console.log('   1. Add Provider API Key (OpenAI, Anthropic, etc.):');
      console.log('      - Use UI: Navigate to /dashboard/settings/api-keys');
      console.log('      - Or store in Supabase user_api_keys table');
      console.log('');
      console.log('   2. Add Custom Model:');
      console.log(`      node scripts/simple-setup-custom-model.js --user-id=${userId}`);
      console.log('');
    } else {
      console.log('✅ API keys found! You can use them for testing.');
      console.log('');
      console.log('💡 To test code generation:');
      console.log('   node scripts/build-real-feature.js --user-id=' + userId);
      console.log('');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Check .env.local has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.error('   2. Verify user_id is correct');
    console.error('   3. Check API_KEYS_ENCRYPTION_KEY matches encryption key used');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
