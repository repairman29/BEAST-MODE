#!/usr/bin/env node

/**
 * Use Real API Keys for Testing
 * 
 * Retrieves real API keys from Supabase and uses them for testing
 * 
 * Usage:
 *   node scripts/use-real-api-keys-for-testing.js --user-id=YOUR_USER_ID
 */

const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/use-real-api-keys-for-testing.js --user-id=YOUR_USER_ID');
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
 * Decrypt API key using the same method as the website
 */
async function decryptApiKey(encryptedKey) {
  if (!encryptedKey) return null;
  
  try {
    // Use the same decryption method as website/lib/api-keys-decrypt.ts
    const parts = encryptedKey.split(':');
    if (parts.length !== 3) {
      // Not in expected format, might be plaintext
      return encryptedKey;
    }

    const crypto = require('crypto');
    const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || 
                         process.env.ENCRYPTION_KEY || 
                         'default_key_change_in_production';
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    
    // Derive key from encryption key
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.warn('   ⚠️  Decryption failed:', error.message);
    return null;
  }
}

/**
 * Get and decrypt API keys
 */
async function getRealApiKeys() {
  console.log('🔑 Retrieving Real API Keys from Supabase');
  console.log('='.repeat(60));
  
  const supabase = await getSupabaseClient();
  
  // Get API keys
  const { data: apiKeys, error } = await supabase
    .from('user_api_keys')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);
  
  if (error) {
    throw new Error(`Failed to fetch API keys: ${error.message}`);
  }
  
  if (!apiKeys || apiKeys.length === 0) {
    console.log('⚠️  No API keys found in user_api_keys table');
    return {};
  }
  
  console.log(`   ✅ Found ${apiKeys.length} API key(s)`);
  console.log('');
  
  const decryptedKeys = {};
  
  for (const key of apiKeys) {
    console.log(`🔑 Decrypting ${key.provider} key...`);
    
    if (key.encrypted_key) {
      const decrypted = await decryptApiKey(key.encrypted_key);
      
      if (decrypted) {
        decryptedKeys[key.provider] = decrypted;
        const prefix = decrypted.substring(0, 8);
        const suffix = decrypted.substring(decrypted.length - 4);
        console.log(`   ✅ Decrypted: ${prefix}...${suffix}`);
      } else {
        console.log(`   ⚠️  Could not decrypt (encryption key mismatch?)`);
      }
    } else {
      console.log(`   ⚠️  No encrypted_key field`);
    }
  }
  
  return decryptedKeys;
}

/**
 * Test with real API keys
 */
async function testWithRealKeys(apiKeys) {
  console.log('\n🧪 Testing with Real API Keys');
  console.log('='.repeat(60));
  
  const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';
  const testPrompt = 'Create a simple React button component with TypeScript';
  
  const results = {};
  
  // Test OpenAI if available
  if (apiKeys.openai) {
    console.log('\n🔵 Testing OpenAI...');
    try {
      const response = await fetch(`${BASE_URL}/api/codebase/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `github_oauth_user_id=${userId}`
        },
        body: JSON.stringify({
          sessionId: `test-${Date.now()}`,
          message: testPrompt,
          repo: 'test-repo',
          model: 'openai:gpt-3.5-turbo',
          useLLM: true
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.message) {
        console.log(`   ✅ Success! Response: ${data.message.substring(0, 100)}...`);
        results.openai = {
          success: true,
          responseLength: data.message.length,
          model: data.model
        };
      } else {
        console.log(`   ⚠️  Response: ${data.error || 'Unknown error'}`);
        results.openai = { success: false, error: data.error };
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.openai = { success: false, error: error.message };
    }
  }
  
  // Test Anthropic if available
  if (apiKeys.anthropic) {
    console.log('\n🔵 Testing Anthropic...');
    try {
      const response = await fetch(`${BASE_URL}/api/codebase/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `github_oauth_user_id=${userId}`
        },
        body: JSON.stringify({
          sessionId: `test-${Date.now()}`,
          message: testPrompt,
          repo: 'test-repo',
          model: 'anthropic:claude-3-sonnet',
          useLLM: true
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.message) {
        console.log(`   ✅ Success! Response: ${data.message.substring(0, 100)}...`);
        results.anthropic = {
          success: true,
          responseLength: data.message.length,
          model: data.model
        };
      } else {
        console.log(`   ⚠️  Response: ${data.error || 'Unknown error'}`);
        results.anthropic = { success: false, error: data.error };
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.anthropic = { success: false, error: error.message };
    }
  }
  
  return results;
}

/**
 * Run comprehensive benchmark with real keys
 */
async function runBenchmarkWithRealKeys(apiKeys) {
  console.log('\n🏁 Running Comprehensive Benchmark with Real API Keys');
  console.log('='.repeat(60));
  
  // Import the comprehensive benchmark
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    const { stdout, stderr } = await execPromise(
      `node scripts/comprehensive-benchmark.js --user-id=${userId}`,
      { cwd: __dirname + '/..' }
    );
    
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error('Benchmark error:', error.message);
  }
}

/**
 * Main
 */
async function main() {
  console.log('🔑 Using Real API Keys for Testing');
  console.log('='.repeat(60));
  console.log(`👤 User ID: ${userId}`);
  console.log('');
  
  try {
    // Get real API keys
    const apiKeys = await getRealApiKeys();
    
    if (Object.keys(apiKeys).length === 0) {
      console.log('\n⚠️  No API keys could be decrypted');
      console.log('💡 Possible issues:');
      console.log('   1. Encryption key mismatch (check API_KEYS_ENCRYPTION_KEY)');
      console.log('   2. Keys stored in different format');
      console.log('   3. Keys need to be re-encrypted');
      console.log('');
      console.log('💡 Try:');
      console.log(`   node scripts/add-api-key-simple.js --user-id=${userId} --provider=openai --key=YOUR_KEY`);
      return;
    }
    
    console.log('\n✅ Decrypted API Keys:');
    Object.keys(apiKeys).forEach(provider => {
      const key = apiKeys[provider];
      const prefix = key.substring(0, 8);
      const suffix = key.substring(key.length - 4);
      console.log(`   ${provider}: ${prefix}...${suffix} (${key.length} chars)`);
    });
    
    // Test with real keys
    const testResults = await testWithRealKeys(apiKeys);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(60));
    
    Object.entries(testResults).forEach(([provider, result]) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`   ${icon} ${provider}: ${result.success ? 'Working' : result.error}`);
    });
    
    // Run comprehensive benchmark
    if (Object.values(testResults).some(r => r.success)) {
      console.log('\n🚀 API keys are working! Running comprehensive benchmark...');
      await runBenchmarkWithRealKeys(apiKeys);
    } else {
      console.log('\n⚠️  API keys retrieved but tests failed');
      console.log('💡 Check if local server is running: npm run dev');
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
