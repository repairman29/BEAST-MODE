#!/usr/bin/env node
/**
 * Apply All Database Migrations
 * 
 * Applies all pending migrations to Supabase using exec_sql
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Try multiple env paths
const envPaths = [
  path.join(__dirname, '../echeo-landing/.env.local'),
  path.join(__dirname, '../website/.env.local'),
  path.join(__dirname, '../.env.local'),
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    envLoaded = true;
    break;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
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
  // Split SQL into statements (handle multi-statement files)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  const results = [];
  for (const statement of statements) {
    if (statement.length === 0) continue;
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });
      
      if (error) {
        // Some errors are expected (e.g., table already exists)
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('relation') && error.message.includes('already')) {
          console.log('   ⚠️  (expected):', error.message.split('\n')[0]);
        } else {
          throw new Error(`Error executing statement: ${error.message}`);
        }
      } else {
        results.push({ statement: statement.substring(0, 50) + '...', success: true });
      }
    } catch (err) {
      throw new Error(`Failed to execute SQL: ${err.message}`);
    }
  }
  
  return results;
}

async function applyMigration(migrationFile) {
  const migrationPath = path.join(__dirname, '../supabase/migrations', migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    return false;
  }

  console.log(`📝 Applying: ${migrationFile}`);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    const results = await executeSQLViaRPC(sql);
    console.log(`   ✅ Applied successfully (${results.length} statements)`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying All Database Migrations\n');
  console.log('='.repeat(70));
  console.log();

  // Check if exec_sql exists
  const execSQLExists = await checkExecSQLExists();
  if (!execSQLExists) {
    console.error('❌ exec_sql function not found in Supabase');
    console.error('   Please create it first using:');
    console.error('   node scripts/setup-exec-sql-function.js');
    console.error();
    process.exit(1);
  }

  console.log('✅ exec_sql function found');
  console.log();

  // Get all migration files
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found:', migrationsDir);
    process.exit(1);
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Apply in order

  console.log(`📦 Found ${migrationFiles.length} migration(s)`);
  console.log();

  let applied = 0;
  let failed = 0;

  for (const migrationFile of migrationFiles) {
    const success = await applyMigration(migrationFile);
    if (success) {
      applied++;
    } else {
      failed++;
    }
    console.log();
  }

  console.log('='.repeat(70));
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  console.log();
  console.log(`   ✅ Applied: ${applied}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📝 Total:  ${migrationFiles.length}`);
  console.log();

  if (failed === 0) {
    console.log('✅ All migrations applied successfully!');
    console.log();
  } else {
    console.log('⚠️  Some migrations failed. Review errors above.');
    console.log();
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
