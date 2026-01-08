#!/usr/bin/env node

/**
 * Test API Keys Directly
 * 
 * Directly tests if API keys from Supabase work for code generation
 * 
 * Usage:
 *   node scripts/test-api-keys-direct.js --user-id=YOUR_USER_ID
 */

const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/test-api-keys-direct.js --user-id=YOUR_USER_ID');
  process.exit(1);
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
 * Get API key using the same method as the API routes
 */
async function getUserApiKey(userId, provider) {
  try {
    // Use the same decryption method as the website
    const { getUserApiKey: getKey } = require('../website/lib/api-keys-decrypt');
    const key = await getKey(userId, provider);
    return key;
  } catch (error) {
    console.warn(`   ⚠️  Could not get key via lib: ${error.message}`);
    return null;
  }
}

/**
 * Test code generation with API key
 */
async function testCodeGeneration(provider, apiKey) {
  const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';
  
  console.log(`\n   🧪 Testing code generation with ${provider}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/codebase/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `github_oauth_user_id=${userId}`
      },
      body: JSON.stringify({
        sessionId: `test-${Date.now()}`,
        message: 'Create a simple hello world function in TypeScript',
        repo: 'test-repo',
        model: `${provider}:gpt-3.5-turbo`,
        useLLM: true
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.message) {
      console.log(`   ✅ Code generation works!`);
      console.log(`   📝 Response: ${data.message.substring(0, 100)}...`);
      return true;
    } else {
      console.log(`   ⚠️  Response: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Main
 */
async function main() {
  console.log('🔑 Testing API Keys from Supabase');
  console.log('='.repeat(60));
  console.log(`👤 User ID: ${userId}`);
  console.log('');
  
  try {
    const supabase = await getSupabaseClient();
    
    // Get all API keys
    console.log('📋 Fetching API keys from Supabase...');
    const { data: apiKeys, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      throw new Error(`Failed to fetch API keys: ${error.message}`);
    }
    
    if (!apiKeys || apiKeys.length === 0) {
      console.log('⚠️  No API keys found');
      return;
    }
    
    console.log(`   ✅ Found ${apiKeys.length} API key(s)`);
    console.log('');
    
    // Test each key
    const results = {};
    
    for (const key of apiKeys) {
      console.log(`🔑 Testing ${key.provider}...`);
      console.log(`   ID: ${key.id}`);
      console.log(`   Has encrypted_key: ${!!key.encrypted_key}`);
      console.log(`   Has iv: ${!!key.iv}`);
      console.log(`   Has auth_tag: ${!!key.auth_tag}`);
      
      // Try to get decrypted key
      const decryptedKey = await getUserApiKey(userId, key.provider);
      
      if (decryptedKey) {
        console.log(`   ✅ Key retrieved: ${decryptedKey.substring(0, 8)}...${decryptedKey.substring(decryptedKey.length - 4)}`);
        
        // Test if it works
        const works = await testCodeGeneration(key.provider, decryptedKey);
        results[key.provider] = works ? '✅ Works' : '⚠️  Key retrieved but test failed';
      } else {
        console.log(`   ⚠️  Could not retrieve key`);
        console.log(`   💡 Key might be stored in different format`);
        results[key.provider] = '⚠️  Could not retrieve';
      }
      
      console.log('');
    }
    
    // Summary
    console.log('='.repeat(60));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(60));
    
    Object.entries(results).forEach(([provider, status]) => {
      console.log(`   ${status} ${provider}`);
    });
    
    const workingCount = Object.values(results).filter(r => r.includes('✅')).length;
    console.log(`\n📈 Working: ${workingCount}/${apiKeys.length}`);
    
    if (workingCount > 0) {
      console.log('\n✅ Great! You have working API keys!');
      console.log('💡 You can now use them for code generation:');
      console.log('   node scripts/build-real-feature.js --user-id=' + userId);
    } else {
      console.log('\n⚠️  Keys found but not working');
      console.log('💡 Possible issues:');
      console.log('   1. Encryption key mismatch (check API_KEYS_ENCRYPTION_KEY)');
      console.log('   2. Keys stored in different format');
      console.log('   3. Keys need to be re-encrypted');
      console.log('');
      console.log('💡 Try:');
      console.log('   node scripts/add-api-key-simple.js --user-id=' + userId + ' --provider=openai --key=YOUR_KEY');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
