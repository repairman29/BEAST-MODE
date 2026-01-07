#!/usr/bin/env node

/**
 * Create ML Artifacts Bucket Directly
 * Uses Supabase Management API or direct SQL execution
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const BUCKET_NAME = 'ml-artifacts';

async function createBucket() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🚀 Creating ML Artifacts Bucket\n');

  // Check if bucket already exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError.message);
    process.exit(1);
  }

  const existingBucket = buckets.find(b => b.name === BUCKET_NAME);
  if (existingBucket) {
    console.log(`✅ Bucket '${BUCKET_NAME}' already exists!`);
    return;
  }

  // Create bucket via SQL (using RPC if available, or direct SQL)
  // Note: Supabase Storage API doesn't have createBucket, so we use SQL
  const createBucketSQL = `
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      '${BUCKET_NAME}',
      '${BUCKET_NAME}',
      false,
      52428800,
      ARRAY['application/json', 'application/gzip', 'application/x-tar', 'application/zip', 'text/plain']
    )
    ON CONFLICT (id) DO NOTHING;
  `;

  // Try to execute via RPC if exec_sql exists
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
      sql: createBucketSQL
    });

    if (!rpcError) {
      console.log('✅ Bucket created via exec_sql RPC');
      await createPolicies(supabase);
      return;
    }
  } catch (error) {
    // exec_sql doesn't exist, continue to other methods
  }

  // Method 2: Use Management API (requires access token)
  console.log('⚠️  exec_sql RPC not available. Trying alternative methods...');
  console.log('\n📋 Manual Steps Required:');
  console.log('\n1. Create bucket via Supabase Dashboard:');
  console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/storage/buckets`);
  console.log('   - Name: ml-artifacts');
  console.log('   - Public: false');
  console.log('   - File size limit: 50MB');
  
  console.log('\n2. Then run this script again to create policies:');
  console.log('   node scripts/create-ml-bucket-policies.js');
  
  // Or try to create policies directly if bucket might exist
  await createPolicies(supabase);
}

async function createPolicies(supabase) {
  console.log('\n🔧 Creating storage policies...');

  const policies = [
    {
      name: 'Service role can read ML artifacts',
      sql: `CREATE POLICY IF NOT EXISTS "Service role can read ML artifacts"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = '${BUCKET_NAME}');`
    },
    {
      name: 'Service role can upload ML artifacts',
      sql: `CREATE POLICY IF NOT EXISTS "Service role can upload ML artifacts"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = '${BUCKET_NAME}');`
    },
    {
      name: 'Service role can delete ML artifacts',
      sql: `CREATE POLICY IF NOT EXISTS "Service role can delete ML artifacts"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = '${BUCKET_NAME}');`
    },
    {
      name: 'Service role can update ML artifacts',
      sql: `CREATE POLICY IF NOT EXISTS "Service role can update ML artifacts"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = '${BUCKET_NAME}');`
    }
  ];

  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (!error) {
        console.log(`  ✅ Policy created: ${policy.name}`);
      } else {
        console.log(`  ⚠️  Policy creation skipped (may already exist): ${policy.name}`);
      }
    } catch (error) {
      console.log(`  ⚠️  Could not create policy via RPC: ${policy.name}`);
      console.log(`     SQL: ${policy.sql}`);
    }
  }
}

createBucket().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

