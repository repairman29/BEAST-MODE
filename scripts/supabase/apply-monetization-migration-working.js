#!/usr/bin/env node

/**
 * Apply Monetization Migration (Working Pattern)
 * 
 * Uses the same pattern as apply-chat-sessions-via-exec-sql.js
 * Follows cursor rules: CLI/API-first, never use UI
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
function loadEnv() {
  // Try website/.env.local first
  const envPath = path.join(__dirname, '../../website/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
  
  // Also try root .env.local
  const rootEnvPath = path.join(__dirname, '../../../.env.local');
  if (fs.existsSync(rootEnvPath)) {
    const envContent = fs.readFileSync(rootEnvPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const MIGRATION_FILE = path.join(__dirname, '../../supabase/migrations/20250110000001_create_user_subscriptions_table.sql');

async function applyMigration() {
  console.log('🚀 Applying Monetization Migration via exec_sql...\n');

  // Get Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Need: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
    console.error('   Need: SUPABASE_SERVICE_ROLE_KEY');
    console.error('\n   Check: website/.env.local or .env.local');
    process.exit(1);
  }

  console.log('✅ Supabase credentials found');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read migration SQL
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`❌ Migration file not found: ${MIGRATION_FILE}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  console.log(`✅ Migration file loaded (${sql.length} characters)\n`);

  // Check if tables already exist
  console.log('🔍 Checking if tables already exist...');
  try {
    const { data: subCheck, error: subError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .limit(1);

    if (!subError) {
      console.log('✅ user_subscriptions table already exists');
      console.log('✅ Migration already applied - skipping\n');
      return;
    }
  } catch (error) {
    // Table doesn't exist, proceed with migration
  }

  // Execute via exec_sql RPC (using sql_query parameter like chat sessions script)
  console.log('📋 Executing migration via exec_sql RPC...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });

    if (error) {
      console.error('❌ exec_sql RPC error:', error.message);
      console.error('   Code:', error.code);
      
      // Check if exec_sql function exists
      if (error.message?.includes('function') || error.code === '42883') {
        console.error('\n⚠️  exec_sql function may not exist.');
        console.error('   Using Supabase CLI instead...\n');
        
        // Fallback to CLI
        const { execSync } = require('child_process');
        try {
          console.log('📋 Trying Supabase CLI...');
          execSync(`supabase db push --linked --include-all --yes`, {
            cwd: path.join(__dirname, '../..'),
            stdio: 'inherit'
          });
          console.log('✅ Migration applied via CLI\n');
        } catch (cliError) {
          console.error('❌ CLI also failed');
          console.error('\n💡 Apply migration manually via Supabase Dashboard SQL Editor');
          console.error(`   File: ${MIGRATION_FILE}\n`);
          process.exit(1);
        }
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration applied successfully!\n');
    }

    // Verify tables
    console.log('🔍 Verifying tables...');
    const tables = ['user_subscriptions', 'user_usage', 'github_installations'];
    for (const table of tables) {
      try {
        const { error: checkError } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (checkError && checkError.code === '42P01') {
          console.log(`⚠️  ${table} table not found`);
        } else {
          console.log(`✅ ${table} table exists`);
        }
      } catch (error) {
        console.log(`⚠️  ${table} check failed: ${error.message}`);
      }
    }

    console.log('\n✅ Migration complete!\n');
    console.log('🧪 Test with: node scripts/test-monetization-with-supabase.js\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Alternative: Apply via Supabase Dashboard SQL Editor');
    console.error(`   File: ${MIGRATION_FILE}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  applyMigration().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { applyMigration };
