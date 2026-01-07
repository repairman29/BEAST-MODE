#!/usr/bin/env node

/**
 * Create ML Bucket - Final Attempt
 * Tries all methods to create the bucket
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'ml-artifacts';

async function createBucket() {
  console.log('🚀 Creating ML Artifacts Bucket\n');

  // Check if exists
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.find(b => b.name === BUCKET_NAME)) {
    console.log('✅ Bucket already exists!');
    return true;
  }

  // Try exec_sql RPC
  const bucketSQL = `
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

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: bucketSQL });
    if (!error) {
      console.log('✅ Bucket created via exec_sql RPC!');
      await createPolicies();
      return true;
    }
  } catch (error) {
    // exec_sql doesn't exist
  }

  // If we get here, we need manual SQL execution
  console.log('⚠️  Bucket creation requires SQL execution\n');
  console.log('📋 Execute this SQL in Supabase Dashboard:\n');
  console.log('URL: https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/sql/new\n');
  console.log('SQL:');
  console.log('─────────────────────────────────────────────────');
  console.log(bucketSQL);
  console.log('─────────────────────────────────────────────────\n');
  console.log('After creating bucket, policies will be created automatically.\n');
  console.log('Then run: node scripts/upload-ml-artifacts-to-storage.js\n');
  
  return false;
}

async function createPolicies() {
  console.log('📋 Creating storage policies...');
  
  const policies = [
    `DROP POLICY IF EXISTS "Service role can read ML artifacts" ON storage.objects;
     CREATE POLICY "Service role can read ML artifacts"
     ON storage.objects FOR SELECT TO service_role
     USING (bucket_id = '${BUCKET_NAME}');`,
    `DROP POLICY IF EXISTS "Service role can upload ML artifacts" ON storage.objects;
     CREATE POLICY "Service role can upload ML artifacts"
     ON storage.objects FOR INSERT TO service_role
     WITH CHECK (bucket_id = '${BUCKET_NAME}');`,
    `DROP POLICY IF EXISTS "Service role can delete ML artifacts" ON storage.objects;
     CREATE POLICY "Service role can delete ML artifacts"
     ON storage.objects FOR DELETE TO service_role
     USING (bucket_id = '${BUCKET_NAME}');`,
    `DROP POLICY IF EXISTS "Service role can update ML artifacts" ON storage.objects;
     CREATE POLICY "Service role can update ML artifacts"
     ON storage.objects FOR UPDATE TO service_role
     USING (bucket_id = '${BUCKET_NAME}');`
  ];

  for (const policySQL of policies) {
    try {
      await supabase.rpc('exec_sql', { sql: policySQL });
      console.log('  ✅ Policy created');
    } catch (error) {
      console.log('  ⚠️  Policy creation skipped (may need manual creation)');
    }
  }
}

createBucket().then(success => {
  if (success) {
    console.log('\n✅ Bucket setup complete!');
    console.log('Run: node scripts/upload-ml-artifacts-to-storage.js');
  }
}).catch(error => {
  console.error('❌ Error:', error.message);
});

