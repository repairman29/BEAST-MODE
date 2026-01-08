#!/usr/bin/env node

/**
 * Load Credentials from Supabase
 * 
 * Queries Supabase tables to find user IDs and credentials for testing.
 * 
 * Usage:
 *   node scripts/load-supabase-credentials.js
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/load-supabase-credentials.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables
function loadEnv() {
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
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                   process.env.SUPABASE_ANON_KEY ||
                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Or ensure website/.env.local has these values');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Query auth.users table
 */
async function getUsers() {
  try {
    // Use RPC or direct query if available
    const { data, error } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(10);
    
    if (error) {
      // Try alternative: use admin API
      console.log('   ⚠️  Direct query failed, trying admin API...');
      return null;
    }
    
    return data;
  } catch (error) {
    // auth.users might not be directly queryable
    console.log('   ⚠️  Cannot query auth.users directly');
    return null;
  }
}

/**
 * Query custom_models table for user IDs
 */
async function getUsersFromCustomModels() {
  try {
    const { data, error } = await supabase
      .from('custom_models')
      .select('user_id, model_name, created_at')
      .not('user_id', 'is', null)
      .limit(20);
    
    if (error) {
      throw error;
    }
    
    // Get unique user IDs
    const userIds = [...new Set(data.map(m => m.user_id))];
    return userIds.map(userId => {
      const models = data.filter(m => m.user_id === userId);
      return {
        userId,
        modelCount: models.length,
        firstModel: models[0]?.model_name,
        lastCreated: models.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )[0]?.created_at
      };
    });
  } catch (error) {
    console.error('   ❌ Error querying custom_models:', error.message);
    return [];
  }
}

/**
 * Query user_api_keys table for user IDs
 */
async function getUsersFromApiKeys() {
  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('user_id, provider, created_at')
      .not('user_id', 'is', null)
      .limit(20);
    
    if (error) {
      throw error;
    }
    
    // Get unique user IDs
    const userIds = [...new Set(data.map(k => k.user_id))];
    return userIds.map(userId => {
      const keys = data.filter(k => k.user_id === userId);
      return {
        userId,
        keyCount: keys.length,
        providers: [...new Set(keys.map(k => k.provider))],
        lastCreated: keys.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )[0]?.created_at
      };
    });
  } catch (error) {
    console.error('   ❌ Error querying user_api_keys:', error.message);
    return [];
  }
}

/**
 * Query any other tables that might have user_id
 */
async function getUsersFromOtherTables() {
  const tables = [
    'user_repositories',
    'user_sessions',
    'feedback',
    'predictions',
    'quality_improvements'
  ];
  
  const results = [];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('user_id')
        .not('user_id', 'is', null)
        .limit(5);
      
      if (!error && data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        results.push({
          table,
          userIds,
          count: userIds.length
        });
      }
    } catch (error) {
      // Table might not exist, skip
    }
  }
  
  return results;
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Loading Credentials from Supabase\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using: ${supabaseKey.substring(0, 20)}...\n`);
  
  const allUserIds = new Set();
  const userInfo = {};
  
  // 1. Try to get users from auth.users
  console.log('📋 Querying auth.users...');
  const users = await getUsers();
  if (users && users.length > 0) {
    console.log(`   ✅ Found ${users.length} users`);
    users.forEach(user => {
      allUserIds.add(user.id);
      userInfo[user.id] = {
        email: user.email,
        createdAt: user.created_at,
        source: 'auth.users'
      };
    });
  } else {
    console.log('   ⚠️  Could not query auth.users (may require admin access)');
  }
  
  // 2. Get users from custom_models
  console.log('\n📋 Querying custom_models table...');
  const customModelUsers = await getUsersFromCustomModels();
  if (customModelUsers.length > 0) {
    console.log(`   ✅ Found ${customModelUsers.length} users with custom models`);
    customModelUsers.forEach(({ userId, modelCount, firstModel }) => {
      allUserIds.add(userId);
      if (!userInfo[userId]) {
        userInfo[userId] = { source: 'custom_models' };
      }
      userInfo[userId].customModels = modelCount;
      userInfo[userId].firstModel = firstModel;
    });
  } else {
    console.log('   ⚠️  No users found in custom_models');
  }
  
  // 3. Get users from user_api_keys
  console.log('\n📋 Querying user_api_keys table...');
  const apiKeyUsers = await getUsersFromApiKeys();
  if (apiKeyUsers.length > 0) {
    console.log(`   ✅ Found ${apiKeyUsers.length} users with API keys`);
    apiKeyUsers.forEach(({ userId, keyCount, providers }) => {
      allUserIds.add(userId);
      if (!userInfo[userId]) {
        userInfo[userId] = { source: 'user_api_keys' };
      }
      userInfo[userId].apiKeys = keyCount;
      userInfo[userId].providers = providers;
    });
  } else {
    console.log('   ⚠️  No users found in user_api_keys');
  }
  
  // 4. Get users from other tables
  console.log('\n📋 Querying other tables...');
  const otherTableUsers = await getUsersFromOtherTables();
  if (otherTableUsers.length > 0) {
    otherTableUsers.forEach(({ table, userIds }) => {
      console.log(`   ✅ Found ${userIds.length} users in ${table}`);
      userIds.forEach(userId => {
        allUserIds.add(userId);
        if (!userInfo[userId]) {
          userInfo[userId] = { source: table };
        }
      });
    });
  } else {
    console.log('   ⚠️  No users found in other tables');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log(`\n✅ Found ${allUserIds.size} unique user ID(s):\n`);
  
  const userIdArray = Array.from(allUserIds);
  userIdArray.forEach((userId, index) => {
    const info = userInfo[userId] || {};
    console.log(`${index + 1}. ${userId}`);
    if (info.email) console.log(`   Email: ${info.email}`);
    if (info.customModels) console.log(`   Custom Models: ${info.customModels}`);
    if (info.apiKeys) console.log(`   API Keys: ${info.apiKeys} (${info.providers?.join(', ')})`);
    if (info.source) console.log(`   Source: ${info.source}`);
    console.log('');
  });
  
  // Export commands
  if (userIdArray.length > 0) {
    console.log('='.repeat(60));
    console.log('🚀 Quick Test Commands');
    console.log('='.repeat(60));
    console.log('\n# Use first user ID:');
    console.log(`export TEST_USER_ID=${userIdArray[0]}`);
    console.log(`node scripts/test-custom-model-registration.js --user-id=${userIdArray[0]}`);
    console.log('\n# Or use any user ID:');
    userIdArray.slice(0, 3).forEach(userId => {
      console.log(`node scripts/test-custom-model-registration.js --user-id=${userId}`);
    });
    console.log('');
  }
  
  // Save to file
  const outputFile = path.join(__dirname, '../.test-user-ids.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    userIds: userIdArray,
    userInfo,
    loadedAt: new Date().toISOString()
  }, null, 2));
  console.log(`💾 Saved to: ${outputFile}`);
  console.log('');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
