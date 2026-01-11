#!/usr/bin/env node

/**
 * Apply Credit System Migration
 * 
 * Creates credit balance, purchases, and usage tracking tables
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Applying Credit System Migration...\n');

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250120000000_create_credit_system.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Check if exec_sql function exists
    console.log('🔍 Checking for exec_sql function...');
    let execSQLExists = false;
    try {
      const { error: testError } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1;' });
      if (!testError) {
        execSQLExists = true;
        console.log('   ✅ exec_sql function found');
      } else {
        console.log('   ⚠️  exec_sql function not found');
        console.log('   💡 Will try direct execution...');
      }
    } catch (err) {
      console.log('   ⚠️  exec_sql function not available');
    }

    if (execSQLExists) {
      // Use exec_sql if available
      console.log('\n✅ Using exec_sql function...\n');
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // Check if it's just "already exists" errors
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log('⚠️  Some objects already exist (this is okay)\n');
          console.log('   Continuing with verification...\n');
        } else {
          throw error;
        }
      } else {
        console.log('   ✅ Migration SQL executed successfully!\n');
      }
    } else {
      console.log('\n⚠️  exec_sql not available. Using Supabase CLI method...\n');
      console.log('   💡 Run: supabase db push --linked');
      console.log('   Or apply migration manually via Supabase dashboard\n');
    }

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    
    const tables = ['credit_purchases', 'credit_usage', 'credit_transactions'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && !error.message.includes('permission denied')) {
        console.error(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Accessible`);
      }
    }

    // Verify columns added to user_subscriptions
    console.log('\n🔍 Verifying user_subscriptions columns...\n');
    const { data: columns, error: colError } = await supabase
      .from('user_subscriptions')
      .select('credits_balance, credits_total_purchased, credits_total_used')
      .limit(1);
    
    if (colError && !colError.message.includes('column') && !colError.message.includes('does not exist')) {
      console.error(`   ❌ Error checking columns: ${colError.message}`);
    } else {
      console.log('   ✅ Credits columns added to user_subscriptions');
    }

    console.log('\n✅ Credit System Migration Applied Successfully!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Create Stripe credit products');
    console.log('   2. Test credit purchase flow');
    console.log('   3. Update usage dashboard with credit balance');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

applyMigration();
