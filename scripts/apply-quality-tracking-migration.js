#!/usr/bin/env node

/**
 * Apply Quality Tracking Migration via exec_sql
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20250111000001_create_quality_tracking_table.sql');

async function applyMigration() {
  console.log('🔄 Applying quality_tracking Migration via exec_sql...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');

  console.log('🔍 Checking for exec_sql RPC function...');
  const { error: rpcCheckError } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
  if (rpcCheckError && rpcCheckError.message.includes('does not exist')) {
    console.error('❌ exec_sql RPC function not found. Please ensure it is enabled in your Supabase project.');
    process.exit(1);
  }
  console.log('✅ exec_sql RPC function found');

  console.log('🔄 Applying migration via exec_sql RPC...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Migration failed via exec_sql RPC:', error.message);
    process.exit(1);
  }
  console.log('✅ Migration SQL executed successfully!');
  console.log('   Response:', data || 'Success');

  // Verification
  console.log('\n🔍 Verifying table creation...');
  const { data: tableCheck, error: tableError } = await supabase.from('quality_tracking').select('id').limit(1);
  if (tableError && tableError.code === '42P01') {
    console.error('❌ Table does not exist - migration may have failed');
    process.exit(1);
  } else if (tableError) {
    console.warn('⚠️  Verification query had an error (may be RLS):', tableError.message);
  } else {
    console.log('✅ Table verified - migration successful!');
  }

  console.log('\n✅ Migration complete!');
}

applyMigration().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
