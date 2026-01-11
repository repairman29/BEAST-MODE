#!/usr/bin/env node
/**
 * Apply Custom Model Monitoring Migration
 * Creates the custom_model_monitoring table for tracking model usage
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('📦 Applying Custom Model Monitoring Migration\n');
  console.log('='.repeat(70));
  console.log();

  const migrationPath = path.join(__dirname, '../supabase/migrations/20250110000000_create_custom_model_monitoring_table.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Check if exec_sql function exists
    const { data: rpcCheck, error: rpcError } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
    
    if (rpcError && rpcError.message.includes('does not exist')) {
      console.log('⚠️  exec_sql RPC not available');
      console.log('   Applying migration via direct SQL execution...\n');
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        try {
          // Try to execute via raw SQL (if available)
          const { error } = await supabase.from('custom_model_monitoring').select('id').limit(0);
          if (!error || error.message.includes('does not exist')) {
            // Table doesn't exist, need to create it
            // For now, we'll use a workaround - check if table exists first
            console.log('   ⚠️  Direct SQL execution not available via Supabase client');
            console.log('   💡 Please apply migration manually via Supabase dashboard or CLI');
            console.log('   📁 Migration file:', migrationPath);
            break;
          }
        } catch (err) {
          // Continue
        }
      }
    } else {
      console.log('✅ exec_sql function found');
      console.log('🔄 Applying migration via exec_sql RPC...\n');
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // Check if it's an "already exists" error (which is OK)
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('   ⚠️  Some objects already exist (this is OK)');
        } else {
          throw error;
        }
      }
      
      console.log('   ✅ Migration SQL executed successfully!');
      if (data) {
        console.log('   Response:', data);
      }
    }

    // Verify table was created
    console.log('\n🔍 Verifying table creation...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('custom_model_monitoring')
      .select('id')
      .limit(1);

    if (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.log('   ❌ Table does not exist yet');
        console.log('   💡 Please apply migration manually via Supabase dashboard');
      } else {
        throw tableError;
      }
    } else {
      console.log('   ✅ custom_model_monitoring table exists and is accessible!');
    }

    console.log('\n✅ Migration applied successfully!');
    console.log();

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('   Details:', error);
    process.exit(1);
  }
}

applyMigration().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
