#!/usr/bin/env node
/**
 * Apply LLM Cache Migration
 * 
 * Applies the L3 cache table migration to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('📦 Applying LLM Cache Migration\n');
  console.log('='.repeat(70));
  console.log();

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250119000000_create_llm_cache_table.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📄 Migration file:', migrationPath);
    console.log('📊 SQL size:', migrationSQL.length, 'bytes');
    console.log();

    // Check if exec_sql exists first
    console.log('🔍 Checking for exec_sql function...');
    let execSQLExists = false;
    try {
      const { error: testError } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1;' });
      if (!testError) {
        execSQLExists = true;
        console.log('   ✅ exec_sql function found');
      } else {
        console.log('   ⚠️  exec_sql function not found');
        console.log('   💡 Run: node scripts/setup-exec-sql-function.js');
      }
    } catch (err) {
      console.log('   ⚠️  Could not check exec_sql:', err.message);
    }

    // Apply migration via exec_sql RPC (as per .cursorrules)
    console.log('\n🔄 Applying migration via exec_sql RPC...');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: migrationSQL 
      });

      if (error) {
        console.error('   ❌ exec_sql RPC error:', error.message);
        console.error('   Code:', error.code);
        
        if (error.message?.includes('function') || error.code === '42883') {
          console.error('\n⚠️  exec_sql function does not exist.');
          console.error('   Run: node scripts/setup-exec-sql-function.js');
          console.error('   Or apply migration manually via Supabase Dashboard SQL Editor');
          return;
        }
        
        console.error('   Details:', error.details);
        return;
      }
      
      console.log('   ✅ Migration SQL executed successfully!');
      console.log('   Response:', data || '(No data returned - this is normal)');
    } catch (err) {
      console.error('   ❌ Migration failed:', err.message);
      console.error('   📄 Please apply migration manually via Supabase Dashboard SQL Editor');
      console.error('   📁 File:', migrationPath);
      return;
    }

    console.log();
    console.log('='.repeat(70));
    console.log('✅ Migration applied successfully!');
    
    // Verify table exists
    console.log();
    console.log('🔍 Verifying table creation...');
    try {
      const { data, error } = await supabase
        .from('llm_cache')
        .select('*')
        .limit(1);

      if (error && error.message.includes('relation "llm_cache" does not exist')) {
        console.log('   ⚠️  Table not found - migration may need manual application');
        console.log('   📄 Run SQL from:', migrationPath);
      } else if (error && error.code === '42P01') {
        console.log('   ⚠️  Table does not exist - migration may have failed');
        console.log('   Error:', error.message);
      } else if (error) {
        // RLS or other errors are okay - table exists
        console.log('   ✅ llm_cache table exists! (RLS may prevent query)');
      } else {
        console.log('   ✅ llm_cache table exists and is accessible!');
      }
    } catch (verifyError) {
      console.log('   ⚠️  Could not verify table (may need manual check):', verifyError.message);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error();
    console.error('📄 Please apply migration manually:');
    console.error('   1. Go to Supabase Dashboard → SQL Editor');
    console.error('   2. Copy contents of: supabase/migrations/20250119000000_create_llm_cache_table.sql');
    console.error('   3. Run the SQL');
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  applyMigration().catch(console.error);
}

module.exports = { applyMigration };
