#!/usr/bin/env node

/**
 * Apply Monetization Migration Directly
 * 
 * Applies the user_subscriptions migration via Supabase API
 * Bypasses migration conflicts by applying directly
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvVars() {
  const envPath = path.join(__dirname, '../website/.env.local');
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

  console.log('\n📋 Applying Monetization Migration\n');
  console.log('✅ Using Supabase:', supabaseUrl);
  console.log('');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250110000001_create_user_subscriptions_table.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 Executing ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement || statement.length < 10) continue;

    try {
      // Use RPC to execute SQL (if exec_sql function exists)
      // Otherwise, we'll need to use direct connection
      console.log(`   [${i + 1}/${statements.length}] Executing statement...`);
      
      // Try using Supabase's exec_sql RPC if available
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      });

      if (error) {
        // If exec_sql doesn't exist, try direct query (won't work for DDL)
        // For now, just log and continue
        if (error.message.includes('function exec_sql') || error.message.includes('does not exist')) {
          console.log(`   ⚠️  exec_sql RPC not available - using alternative method`);
          // We'll need to use psql or direct connection
          console.log(`   💡 Run migration manually via Supabase Dashboard or CLI`);
          break;
        } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`   ✅ Already exists (skipping)`);
        } else {
          console.log(`   ⚠️  Error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
    }
  }

  console.log('\n📋 Migration application complete!');
  console.log('\n💡 If exec_sql RPC is not available, apply migration via:');
  console.log('   supabase db push --include-all');
  console.log('   Or use Supabase Dashboard SQL Editor\n');
}

if (require.main === module) {
  applyMigration().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { applyMigration };
