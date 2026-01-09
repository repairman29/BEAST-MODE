#!/usr/bin/env node
/**
 * Cache Warming Script
 * 
 * Pre-warms cache with common requests to improve hit rate
 */

const { getModelRouter } = require('../lib/mlops/modelRouter');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Try multiple env paths
const envPaths = [
  path.join(__dirname, '../echeo-landing/.env.local'),
  path.join(__dirname, '../website/.env.local'),
  path.join(__dirname, '../.env.local'),
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    envLoaded = true;
    break;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔥 Warming Cache\n');
console.log('='.repeat(70));
console.log();

// Common requests to warm
const commonRequests = [
  {
    modelId: 'custom:gpt-4',
    request: {
      messages: [
        { role: 'user', content: 'What is the quality score of this repository?' }
      ],
      temperature: 0.7,
      maxTokens: 1000
    }
  },
  {
    modelId: 'custom:claude-3',
    request: {
      messages: [
        { role: 'user', content: 'Analyze this code for quality issues' }
      ],
      temperature: 0.7,
      maxTokens: 1000
    }
  }
];

async function warmCache() {
  const router = getModelRouter();
  await router.initialize();

  let warmed = 0;
  let failed = 0;

  console.log(`📦 Warming cache with ${commonRequests.length} common requests...`);
  console.log();

  for (const { modelId, request } of commonRequests) {
    try {
      console.log(`🔥 Warming: ${modelId}`);
      
      // Make request (will be cached if successful)
      await router.route(modelId, request, null);
      
      warmed++;
      console.log(`   ✅ Cached`);
    } catch (error) {
      failed++;
      console.log(`   ⚠️  Failed: ${error.message.split('\n')[0]}`);
    }
    console.log();
  }

  console.log('='.repeat(70));
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log();
  console.log(`   ✅ Warmed: ${warmed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📝 Total:  ${commonRequests.length}`);
  console.log();

  if (warmed > 0) {
    console.log('✅ Cache warming complete!');
    console.log();
    console.log('💡 Tip: Run this script on server startup for best results');
    console.log();
  } else {
    console.log('⚠️  No requests were cached. Check model availability.');
    console.log();
  }
}

warmCache().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
