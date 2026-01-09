#!/usr/bin/env node

/**
 * Apply Chat Sessions Migration via exec_sql
 * 
 * Applies the codebase_chat_sessions table migration using exec_sql RPC.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
function loadEnv() {
  // Try website/.env.local first
  const envPath = path.join(__dirname, '../website/.env.local');
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
  const rootEnvPath = path.join(__dirname, '../../.env.local');
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

const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20250118000000_create_codebase_chat_sessions.sql');

async function applyMigration() {
  console.log('🚀 Applying Chat Sessions Migration via exec_sql...\n');

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

  // Execute via exec_sql RPC
  console.log('📋 Executing migration via exec_sql RPC...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });

    if (error) {
      console.error('❌ exec_sql RPC error:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      
      // Check if exec_sql function exists
      if (error.message?.includes('function') || error.code === '42883') {
        console.error('\n⚠️  exec_sql function may not exist.');
        console.error('   You may need to create it first or use Supabase Dashboard.');
        console.error('\n   See: docs/CHAT_SESSIONS_QUICK_SETUP.md for manual steps');
      }
      
      process.exit(1);
    }

    console.log('✅ Migration executed successfully!');
    console.log('   Response:', data || 'No data returned (this is normal)');

  } catch (error) {
    console.error('❌ Error executing migration:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }

  // Verify table was created
  console.log('\n🔍 Verifying table creation...');
  
  try {
    const { data, error } = await supabase
      .from('codebase_chat_sessions')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.error('❌ Table does not exist - migration may have failed');
        console.error('   Error:', error.message);
        process.exit(1);
      }
      // Other errors might be okay (RLS, etc.)
      console.log('⚠️  Verification query had an error (may be RLS):', error.message);
      console.log('   This is okay if the table exists.');
    } else {
      console.log('✅ Table verified - migration successful!');
    }
  } catch (error) {
    console.log('⚠️  Could not verify table (may need manual check):', error.message);
  }

  // Check table structure
  console.log('\n📊 Checking table structure...');
  
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns
          WHERE table_name = 'codebase_chat_sessions'
          ORDER BY ordinal_position;
        `
      });

    if (!error && data) {
      console.log('✅ Table columns:');
      if (Array.isArray(data)) {
        data.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
      } else {
        console.log('   (Structure check completed)');
      }
    }
  } catch (error) {
    // Ignore structure check errors
  }

  console.log('\n🎉 Migration applied successfully!');
  console.log('\n💡 Chat sessions will now persist across server restarts.');
  console.log('\n📚 Next steps:');
  console.log('   1. Test by starting a chat session');
  console.log('   2. Restart your server');
  console.log('   3. Reopen the chat - it should recover automatically!');
}

applyMigration().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
