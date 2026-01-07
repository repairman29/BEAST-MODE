#!/usr/bin/env node

/**
 * Apply ML Bucket SQL Directly
 * Executes the bucket creation SQL via direct PostgreSQL connection
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL!');
  process.exit(1);
}

if (!SUPABASE_DB_PASSWORD) {
  console.error('❌ Missing SUPABASE_DB_PASSWORD!');
  console.error('   Set it in website/.env.local');
  console.error('   Get it from: Supabase Dashboard → Settings → Database');
  process.exit(1);
}

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

// Try different connection formats
const connectionStrings = [
  `postgresql://postgres:${encodeURIComponent(SUPABASE_DB_PASSWORD)}@db.${projectRef}.supabase.co:6543/postgres?sslmode=require`,
  `postgresql://postgres:${encodeURIComponent(SUPABASE_DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`,
];

async function findWorkingConnection() {
  for (const connString of connectionStrings) {
    try {
      const pool = new Pool({
        connectionString: connString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });
      await pool.query('SELECT 1');
      await pool.end();
      return connString;
    } catch (e) {
      // Try next
    }
  }
  return null;
}

async function applyBucketSQL() {
  console.log('🚀 Creating ML Artifacts Bucket via SQL\n');

  // Find working connection
  console.log('🔍 Finding working database connection...');
  const workingConnection = await findWorkingConnection();

  if (!workingConnection) {
    console.error('❌ Could not connect to database!');
    console.error('   Check SUPABASE_DB_PASSWORD in website/.env.local');
    process.exit(1);
  }

  console.log('✅ Connected to database!\n');

  const pool = new Pool({
    connectionString: workingConnection,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check if bucket exists
    console.log('🔍 Checking if bucket exists...');
    const checkResult = await pool.query(
      `SELECT id FROM storage.buckets WHERE id = 'ml-artifacts'`
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ Bucket already exists!');
      await pool.end();
      return;
    }

    // Create bucket
    console.log('📋 Creating bucket...');
    await pool.query(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'ml-artifacts',
        'ml-artifacts',
        false,
        52428800,
        ARRAY['application/json', 'application/gzip', 'application/x-tar', 'application/zip', 'text/plain']
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Bucket created!\n');

    // Create policies
    console.log('📋 Creating storage policies...');
    
    const policies = [
      `DROP POLICY IF EXISTS "Service role can read ML artifacts" ON storage.objects;
       CREATE POLICY "Service role can read ML artifacts"
       ON storage.objects FOR SELECT
       TO service_role
       USING (bucket_id = 'ml-artifacts');`,
      
      `DROP POLICY IF EXISTS "Service role can upload ML artifacts" ON storage.objects;
       CREATE POLICY "Service role can upload ML artifacts"
       ON storage.objects FOR INSERT
       TO service_role
       WITH CHECK (bucket_id = 'ml-artifacts');`,
      
      `DROP POLICY IF EXISTS "Service role can delete ML artifacts" ON storage.objects;
       CREATE POLICY "Service role can delete ML artifacts"
       ON storage.objects FOR DELETE
       TO service_role
       USING (bucket_id = 'ml-artifacts');`,
      
      `DROP POLICY IF EXISTS "Service role can update ML artifacts" ON storage.objects;
       CREATE POLICY "Service role can update ML artifacts"
       ON storage.objects FOR UPDATE
       TO service_role
       USING (bucket_id = 'ml-artifacts');`
    ];

    for (const policySQL of policies) {
      await pool.query(policySQL);
    }
    console.log('✅ Policies created!\n');

    // Verify
    console.log('🔍 Verifying bucket...');
    const verifyResult = await pool.query(
      `SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'ml-artifacts'`
    );
    
    if (verifyResult.rows.length > 0) {
      const bucket = verifyResult.rows[0];
      console.log('✅ Bucket verified!');
      console.log(`   Name: ${bucket.name}`);
      console.log(`   Public: ${bucket.public}`);
      console.log(`   Size limit: ${(bucket.file_size_limit / 1024 / 1024).toFixed(0)}MB`);
    }

    await pool.end();
    console.log('\n🎯 Bucket creation complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

applyBucketSQL().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

