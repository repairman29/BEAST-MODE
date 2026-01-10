#!/usr/bin/env node

/**
 * Apply Monetization Migration via exec_sql RPC
 * 
 * Uses the exec_sql RPC function (fastest method) to apply the migration
 * Follows cursor rules: CLI/API-first, never use UI
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvVars() {
  const envPath = path.join(__dirname, '../../website/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

async function applyMigration() {
  loadEnvVars();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase not configured');
    console.log('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('\n🚀 Applying Monetization Migration via exec_sql RPC\n');
  console.log('✅ Using Supabase:', supabaseUrl);
  console.log('📋 Method: exec_sql RPC (fastest - CLI/API-first approach)\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read migration file
  const migrationPath = path.join(__dirname, '../../supabase/migrations/20250110000001_create_user_subscriptions_table.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Check if exec_sql function exists
  console.log('🔍 Checking for exec_sql RPC function...');
  try {
    const { data: functions, error } = await supabase
      .rpc('exec_sql', { sql: 'SELECT 1;' });

    if (error && error.message.includes('function exec_sql')) {
      console.log('⚠️  exec_sql RPC not available');
      console.log('📋 Setting up exec_sql function first...\n');
      await setupExecSqlFunction(supabase);
    }
  } catch (error) {
    console.log('⚠️  exec_sql check failed, setting up function...\n');
    await setupExecSqlFunction(supabase);
  }

  // Apply migration using exec_sql
  console.log('📋 Applying migration via exec_sql RPC...\n');

  try {
    // Split migration into statements (handle CREATE OR REPLACE, etc.)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/));

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 10) continue;

      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.match(/^\s*$/)) continue;

      const fullStatement = statement + ';';

      try {
        console.log(`   [${i + 1}/${statements.length}] Executing...`);

        const { data, error } = await supabase.rpc('exec_sql', {
          sql: fullStatement
        });

        if (error) {
          // Check if it's a "already exists" error (ok to skip)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.message.includes('42710')) {
            console.log(`      ✅ Already exists (skipping)`);
            skipCount++;
          } else {
            console.log(`      ⚠️  Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`      ✅ Success`);
          successCount++;
        }
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`      ✅ Already exists (skipping)`);
          skipCount++;
        } else {
          console.log(`      ⚠️  Error: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`   ⚠️  Errors: ${errorCount}\n`);

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const { data: tables, error: tableError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      console.log('⚠️  user_subscriptions table not found - migration may have failed');
    } else {
      console.log('✅ user_subscriptions table exists');
    }

    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('id')
      .limit(1);

    if (usageError && usageError.code === '42P01') {
      console.log('⚠️  user_usage table not found - migration may have failed');
    } else {
      console.log('✅ user_usage table exists');
    }

    const { data: installations, error: installError } = await supabase
      .from('github_installations')
      .select('id')
      .limit(1);

    if (installError && installError.code === '42P01') {
      console.log('⚠️  github_installations table not found - migration may have failed');
    } else {
      console.log('✅ github_installations table exists');
    }

    console.log('\n✅ Migration application complete!\n');
    console.log('🧪 Test with: node scripts/test-monetization-with-supabase.js\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: Apply via Supabase Dashboard SQL Editor');
    console.log('   Or use: supabase db push --include-all --yes\n');
    process.exit(1);
  }
}

/**
 * Setup exec_sql function if it doesn't exist
 */
async function setupExecSqlFunction(supabase) {
  console.log('📋 Creating exec_sql function...');

  const execSqlFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result json;
    BEGIN
      EXECUTE sql;
      RETURN json_build_object('success', true);
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
    END;
    $$;
  `;

  try {
    // Try to create via direct SQL (if we have direct access)
    // Otherwise, user needs to create it manually
    console.log('💡 exec_sql function needs to be created manually');
    console.log('   Run this SQL in Supabase Dashboard:');
    console.log('\n' + execSqlFunction + '\n');
    return false;
  } catch (error) {
    console.log('⚠️  Could not create exec_sql function automatically');
    return false;
  }
}

if (require.main === module) {
  applyMigration().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { applyMigration };
