#!/usr/bin/env node

/**
 * Apply GitHub App Credentials Migration
 * 
 * Applies the Supabase migration to create github_app_credentials table
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, '../supabase/migrations/20250110000000_create_github_app_credentials_table.sql');

console.log('📋 Applying GitHub App Credentials Migration...\n');

if (!fs.existsSync(migrationFile)) {
  console.error('❌ Migration file not found:', migrationFile);
  process.exit(1);
}

// Check if Supabase CLI is available
try {
  execSync('supabase --version', { stdio: 'ignore' });
} catch (error) {
  console.log('⚠️  Supabase CLI not found.');
  console.log('   Install it: https://supabase.com/docs/guides/cli');
  console.log('\n📋 Manual application:');
  console.log('   1. Go to Supabase Dashboard → SQL Editor');
  console.log('   2. Copy contents of:', migrationFile);
  console.log('   3. Paste and run\n');
  process.exit(1);
}

// Check if linked to a project
try {
  execSync('supabase status', { stdio: 'ignore' });
} catch (error) {
  console.log('⚠️  Not linked to Supabase project.');
  console.log('   Run: supabase link --project-ref YOUR_PROJECT_REF');
  console.log('\n📋 Or apply manually via Supabase Dashboard\n');
  process.exit(1);
}

// Apply migration
try {
  console.log('🔄 Applying migration...');
  execSync(`supabase db push`, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Migration applied successfully!');
  console.log('\n📋 Next: Save credentials to Supabase');
  console.log('   Run: beast-mode github-app save-credentials\n');
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.log('\n📋 Try manual application via Supabase Dashboard\n');
  process.exit(1);
}
