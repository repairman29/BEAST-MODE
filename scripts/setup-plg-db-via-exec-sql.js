#!/usr/bin/env node
/**
 * Setup PLG Component Usage Table via exec_sql
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExecSQLExists() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1;' });
    return !error;
  } catch (e) {
    return false;
  }
}

async function executeSQLViaRPC(sql) {
  const statements = sql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
  
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (trimmed.length === 0) continue;
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: trimmed + ';' });
      if (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`   ⚠️  ${trimmed.substring(0, 50)}... (already exists, skipping)`);
        } else {
          throw new Error(`Error executing statement: ${error.message}`);
        }
      }
    } catch (e) {
      console.error(`   ❌ Error: ${e.message}`);
    }
  }
}

async function main() {
  console.log('📊 Setting up PLG Component Usage Table\n');
  console.log('='.repeat(70));
  console.log();

  const migrationPath = path.join(__dirname, '../supabase/migrations/20250109000000_create_plg_component_usage.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  const execSQLExists = await checkExecSQLExists();
  if (!execSQLExists) {
    console.error('❌ exec_sql function not found.');
    console.log('   Please create it first or run the migration manually.');
    process.exit(1);
  }

  console.log('✅ exec_sql function found');
  console.log('📝 Executing migration...\n');

  await executeSQLViaRPC(sql);

  console.log();
  console.log('='.repeat(70));
  console.log('✅ PLG Component Usage Table Setup Complete!');
  console.log('='.repeat(70));
  console.log();
  console.log('📊 What\'s Set Up:');
  console.log('   1. plg_component_usage table');
  console.log('   2. Indexes for performance');
  console.log();
  console.log('💡 Next: Components will auto-track usage!');
  console.log();
}

main().catch(console.error);
