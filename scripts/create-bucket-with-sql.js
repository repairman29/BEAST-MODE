#!/usr/bin/env node

/**
 * Create ML Bucket - Provides SQL to Execute
 * Since bucket creation requires direct SQL, this provides the SQL
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ML Artifacts Bucket Creation\n');
console.log('📋 Since bucket creation requires SQL, here are your options:\n');

// Read the migration SQL
const migrationFile = path.join(__dirname, '../supabase/migrations/20250106000000_create_ml_artifacts_storage_bucket.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

// Extract the bucket creation SQL
const bucketSQL = `
-- Create ML Artifacts Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ml-artifacts',
  'ml-artifacts',
  false,
  52428800,
  ARRAY['application/json', 'application/gzip', 'application/x-tar', 'application/zip', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;
`;

const policiesSQL = sql.split('-- Storage Policies')[1];

console.log('Option 1: Execute via Supabase CLI (if linked):');
console.log('─────────────────────────────────────────────────');
console.log('cd BEAST-MODE-PRODUCT');
console.log('supabase db execute --linked --file supabase/migrations/20250106000000_create_ml_artifacts_storage_bucket.sql\n');

console.log('Option 2: Execute SQL directly in Supabase Dashboard:');
console.log('─────────────────────────────────────────────────────');
console.log('1. Go to: https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/sql/new');
console.log('2. Copy and paste this SQL:\n');
console.log(bucketSQL);
console.log(policiesSQL);
console.log('\n3. Click "Run"\n');

console.log('Option 3: Use psql (if you have database password):');
console.log('─────────────────────────────────────────────────────');
console.log('Set SUPABASE_DB_PASSWORD in website/.env.local, then:');
console.log('node scripts/apply-ml-bucket-sql.js\n');

// Try to check if supabase CLI is available and linked
try {
  const projectRef = execSync('cd ' + path.join(__dirname, '..') + ' && cat supabase/.temp/project-ref 2>/dev/null', { encoding: 'utf8' }).trim();
  if (projectRef) {
    console.log('✅ Project is linked! Trying to execute via CLI...\n');
    try {
      execSync(
        `cd ${path.join(__dirname, '..')} && supabase db execute --linked --sql "${bucketSQL.replace(/\n/g, ' ')}"`,
        { stdio: 'inherit' }
      );
      console.log('\n✅ Bucket created! Now creating policies...\n');
      // Policies would need to be run separately
      console.log('⚠️  Policies still need to be created. Run the policies SQL from the migration file.');
    } catch (error) {
      console.log('⚠️  CLI execution failed. Use one of the options above.\n');
    }
  }
} catch (error) {
  // Not linked or CLI not available
}

console.log('After bucket is created, run:');
console.log('  node scripts/upload-ml-artifacts-to-storage.js --dry-run');
console.log('  node scripts/upload-ml-artifacts-to-storage.js');

