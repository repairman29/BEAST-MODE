#!/usr/bin/env node

/**
 * Generate BEAST MODE API Key
 * 
 * Creates a new BEAST MODE API key for a user
 * 
 * Usage:
 *   node scripts/generate-beast-mode-api-key.js --user-id=YOUR_USER_ID --name="My API Key"
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const nameArg = args.find(arg => arg.startsWith('--name='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;
const name = nameArg ? nameArg.split('=')[1] : 'My API Key';

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/generate-beast-mode-api-key.js --user-id=YOUR_USER_ID [--name="Key Name"]');
  console.error('   Or set: export TEST_USER_ID=YOUR_USER_ID');
  process.exit(1);
}

/**
 * Make HTTP request
 */
async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `github_oauth_user_id=${userId}`,
    ...options.headers
  };
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers
    });
    
    const data = await response.json().catch(() => ({}));
    
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

/**
 * Main
 */
async function main() {
  console.log('🔑 Generating BEAST MODE API Key');
  console.log('='.repeat(60));
  console.log(`👤 User ID: ${userId}`);
  console.log(`📝 Name: ${name}`);
  console.log('');
  
  try {
    const result = await request('/api/auth/api-keys', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        name
      })
    });
    
    if (!result.ok) {
      throw new Error(`Failed to generate API key: ${result.status} - ${JSON.stringify(result.data)}`);
    }
    
    const apiKey = result.data?.apiKey;
    const keyData = result.data?.key;
    
    if (!apiKey) {
      throw new Error('API key not returned');
    }
    
    console.log('✅ API Key Generated Successfully!');
    console.log('');
    console.log('='.repeat(60));
    console.log('🔑 YOUR API KEY (SAVE THIS - SHOWN ONLY ONCE!)');
    console.log('='.repeat(60));
    console.log('');
    console.log(apiKey);
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 Key Details:');
    if (keyData) {
      console.log(`   ID: ${keyData.id}`);
      console.log(`   Prefix: ${keyData.key_prefix}`);
      console.log(`   Name: ${keyData.name}`);
      console.log(`   Tier: ${keyData.tier}`);
      console.log(`   Created: ${new Date(keyData.created_at).toLocaleString()}`);
    }
    console.log('');
    console.log('💡 Usage:');
    console.log('   Add this key to your requests:');
    console.log('   Authorization: Bearer YOUR_API_KEY');
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('   - This key is shown only once!');
    console.log('   - Save it securely');
    console.log('   - Don\'t commit it to git');
    console.log('   - Regenerate if compromised');
    console.log('');
    
  } catch (error) {
    console.error('❌ Failed to generate API key:', error.message);
    if (error.message.includes('subscription')) {
      console.error('');
      console.error('💡 You may need an active subscription to generate API keys.');
      console.error('   Check: /api/auth/api-keys (GET) to see your keys');
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
