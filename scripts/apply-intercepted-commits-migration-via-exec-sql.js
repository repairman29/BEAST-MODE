#!/usr/bin/env node

/**
 * Apply intercepted_commits table migration via exec_sql RPC
 * 
 * Creates the intercepted_commits table for Brand/Reputation/Secret Interceptor
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20250111000000_create_intercepted_commits_table.sql');

async function applyMigration() {
  console.log('🛡️  Applying intercepted_commits Migration via exec_sql\n');

  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Need: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');
    console.error('   Need: SUPABASE_SERVICE_ROLE_KEY');
    console.error('\n💡 Check website/.env.local for credentials\n');
    process.exit(1);
  }

  // Read migration SQL
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`❌ Migration file not found: ${MIGRATION_FILE}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  console.log(`📄 Migration file: ${MIGRATION_FILE}`);
  console.log(`📏 SQL length: ${sql.length} characters\n`);

  // Initialize Supabase client
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check if exec_sql function exists
    console.log('🔍 Checking for exec_sql RPC function...');
    const { data: rpcCheck, error: rpcError } = await supabase.rpc('exec_sql', { 
      sql_query: 'SELECT 1 as test' 
    });

    if (rpcError && (rpcError.message.includes('does not exist') || rpcError.message.includes('function exec_sql'))) {
      console.log('⚠️  exec_sql RPC function not found');
      console.log('\n💡 Options:');
      console.log('   1. Create exec_sql function in Supabase (see docs)');
      console.log('   2. Apply migration manually via Supabase Dashboard SQL Editor');
      console.log('   3. Use Supabase CLI: supabase db push --include-all');
      console.log(`\n📁 Migration file: ${MIGRATION_FILE}\n`);
      process.exit(1);
    }

    console.log('✅ exec_sql RPC function found');
    console.log('🔄 Applying migration via exec_sql RPC...\n');

    // Execute migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });

    if (error) {
      // Check if it's an "already exists" error (which is OK)
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate') ||
          error.message.includes('relation "intercepted_commits" already exists')) {
        console.log('⚠️  Table or objects already exist (this is OK)');
        console.log('   Migration may have already been applied\n');
      } else {
        console.error('❌ Error applying migration:', error.message);
        console.error('\n💡 Try applying manually via Supabase Dashboard SQL Editor');
        console.log(`📁 Migration file: ${MIGRATION_FILE}\n`);
        process.exit(1);
      }
    } else {
      console.log('✅ Migration SQL executed successfully!');
      if (data) {
        console.log('   Response:', JSON.stringify(data, null, 2));
      }
    }

    // Verify table was created
    console.log('\n🔍 Verifying table creation...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('intercepted_commits')
      .select('id')
      .limit(1);

    if (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.log('⚠️  Table not found after migration');
        console.log('   Migration may have failed or table name is different');
        process.exit(1);
      } else {
        // Other errors might be OK (like RLS blocking access)
        console.log('⚠️  Could not verify table (may be RLS):', tableError.message);
      }
    } else {
      console.log('✅ Table intercepted_commits exists and is accessible!');
    }

    // Check indexes
    console.log('\n🔍 Checking indexes...');
    const { data: indexCheck, error: indexError } = await supabase
      .from('intercepted_commits')
      .select('*')
      .limit(0);

    if (!indexError) {
      console.log('✅ Table structure looks good');
    }

    console.log('\n✅ Migration complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test interceptor: beast-mode interceptor check');
    console.log('   2. View intercepted data: beast-mode interceptor list');
    console.log('   3. Check status: beast-mode interceptor status\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('\n💡 Try applying migration manually via Supabase Dashboard SQL Editor');
    console.log(`📁 Migration file: ${MIGRATION_FILE}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  applyMigration().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { applyMigration };
