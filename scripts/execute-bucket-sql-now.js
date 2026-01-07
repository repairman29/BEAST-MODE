#!/usr/bin/env node

/**
 * Execute Bucket SQL Now
 * Tries all methods to create the bucket immediately
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'ml-artifacts';

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

const policiesSQL = [
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

async function checkBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  return buckets?.find(b => b.name === BUCKET_NAME);
}

async function executeViaRPC(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

async function executeViaREST(sql) {
  return new Promise((resolve) => {
    const url = new URL(`${supabaseUrl}/rest/v1/rpc/exec_sql`);
    const postData = JSON.stringify({ sql });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

async function createBucket() {
  console.log('🚀 Creating ML Artifacts Bucket NOW\n');

  // Check if exists
  const existing = await checkBucket();
  if (existing) {
    console.log('✅ Bucket already exists!');
    return true;
  }

  console.log('📋 Method 1: Trying exec_sql RPC via client...');
  let result = await executeViaRPC(bucketSQL);
  if (result.success) {
    console.log('✅ Bucket created via RPC!');
    await createPolicies();
    return true;
  }

  console.log('📋 Method 2: Trying exec_sql RPC via REST API...');
  result = await executeViaREST(bucketSQL);
  if (result.success) {
    console.log('✅ Bucket created via REST API!');
    await createPolicies();
    return true;
  }

  // If exec_sql doesn't exist, we need to use Management API or direct SQL
  console.log('⚠️  exec_sql RPC not available. Using Management API...');
  
  // Try Management API (requires access token from supabase login)
  try {
    const { execSync } = require('child_process');
    const accessToken = execSync('supabase projects api-keys --project-ref ' + projectRef + ' 2>/dev/null | grep -i "access" | head -1', { encoding: 'utf8' }).trim();
    
    if (accessToken) {
      console.log('📋 Method 3: Trying Management API...');
      // Management API endpoint for SQL execution
      // This would require the access token from supabase login
      console.log('⚠️  Management API requires access token from: supabase login');
    }
  } catch (error) {
    // No access token
  }

  // Final fallback: Provide SQL for manual execution
  console.log('\n⚠️  Automatic execution not available.\n');
  console.log('📋 Execute this SQL manually:\n');
  console.log('URL: https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n');
  console.log('SQL:');
  console.log('─────────────────────────────────────────────────');
  console.log(bucketSQL);
  console.log('─────────────────────────────────────────────────\n');
  
  return false;
}

async function createPolicies() {
  console.log('📋 Creating storage policies...');
  
  for (const policySQL of policiesSQL) {
    const result = await executeViaRPC(policySQL);
    if (result.success) {
      console.log('  ✅ Policy created');
    } else {
      // Try REST
      const restResult = await executeViaREST(policySQL);
      if (restResult.success) {
        console.log('  ✅ Policy created');
      } else {
        console.log('  ⚠️  Policy creation skipped (may need manual creation)');
      }
    }
  }
}

createBucket().then(async (success) => {
  if (success) {
    // Verify
    const bucket = await checkBucket();
    if (bucket) {
      console.log('\n✅ Bucket verified and ready!');
      console.log('   Name:', bucket.name);
      console.log('   Public:', bucket.public);
      console.log('\n🚀 Now uploading files...\n');
      
      // Run upload script
      const { execSync } = require('child_process');
      try {
        execSync('node scripts/upload-ml-artifacts-to-storage.js', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        });
      } catch (error) {
        console.log('Run manually: node scripts/upload-ml-artifacts-to-storage.js');
      }
    }
  } else {
    console.log('After creating bucket manually, run:');
    console.log('  node scripts/upload-ml-artifacts-to-storage.js');
  }
}).catch(error => {
  console.error('❌ Error:', error.message);
});

