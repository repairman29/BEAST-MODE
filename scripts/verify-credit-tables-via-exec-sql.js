#!/usr/bin/env node

/**
 * Verify Credit System Tables via exec_sql
 * 
 * Uses Supabase exec_sql RPC to check and create tables if needed
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyCreditTables() {
  console.log('\n🔍 Verifying Credit System Tables via exec_sql\n');
  console.log('='.repeat(70));
  console.log();
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found');
    console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Check if exec_sql function exists
  console.log('1️⃣  Checking exec_sql function...\n');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT 1 as test;"
    });
    
    if (error) {
      if (error.message?.includes('does not exist')) {
        console.log('   ⚠️  exec_sql function not found');
        console.log('   💡 Creating exec_sql function...\n');
        
        // Create exec_sql function
        const createExecSql = `
          CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
          RETURNS json
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result json;
          BEGIN
            EXECUTE sql_query INTO result;
            RETURN result;
          EXCEPTION
            WHEN OTHERS THEN
              RETURN json_build_object('error', SQLERRM);
          END;
          $$;
        `;
        
        // Try to create via direct SQL (requires service role)
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql_query: createExecSql
        });
        
        if (createError) {
          console.log('   ❌ Could not create exec_sql function');
          console.log('   💡 Run this SQL manually in Supabase SQL editor:');
          console.log('\n' + createExecSql + '\n');
          return;
        }
      } else {
        console.log(`   ❌ Error: ${error.message}`);
        return;
      }
    } else {
      console.log('   ✅ exec_sql function available');
    }
  } catch (error) {
    console.log(`   ⚠️  Error checking exec_sql: ${error.message}`);
  }
  
  // Check if credit_purchases table exists
  console.log('\n2️⃣  Checking credit_purchases table...\n');
  try {
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'credit_purchases'
      ) as exists;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: checkTableQuery
    });
    
    if (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
      // Try direct query instead
      const { data: directData, error: directError } = await supabase
        .from('credit_purchases')
        .select('*')
        .limit(1);
      
      if (!directError || directError.code === 'PGRST116') {
        console.log('   ✅ credit_purchases table exists (via direct query)');
      } else {
        console.log('   ❌ credit_purchases table does not exist');
        console.log('   💡 Creating table...\n');
        
        // Create table via migration SQL
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS credit_purchases (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            stripe_payment_intent_id TEXT,
            stripe_checkout_session_id TEXT,
            credits_amount INTEGER NOT NULL,
            price_amount INTEGER NOT NULL,
            price_currency TEXT DEFAULT 'usd',
            status TEXT DEFAULT 'pending',
            purchased_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;
        
        console.log('   Running CREATE TABLE...');
        // Try via direct SQL execution
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql_query: createTableSQL
        });
        
        if (createError) {
          console.log('   ⚠️  Could not create via exec_sql');
          console.log('   💡 Run migration: supabase db push --linked');
        } else {
          console.log('   ✅ credit_purchases table created');
        }
      }
    } else {
      const exists = data?.[0]?.exists || data?.exists;
      if (exists) {
        console.log('   ✅ credit_purchases table exists');
      } else {
        console.log('   ❌ credit_purchases table does not exist');
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // Check user_subscriptions columns
  console.log('\n3️⃣  Checking user_subscriptions credit columns...\n');
  try {
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' 
      AND column_name LIKE 'credit%';
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: checkColumnsQuery
    });
    
    if (error) {
      // Try direct query
      const { data: directData, error: directError } = await supabase
        .from('user_subscriptions')
        .select('credits_balance, credits_total_purchased, credits_total_used')
        .limit(1);
      
      if (!directError || directError.code === 'PGRST116') {
        console.log('   ✅ Credit columns exist in user_subscriptions');
      } else if (directError.message?.includes('column')) {
        console.log('   ❌ Credit columns missing');
        console.log('   💡 Adding columns...\n');
        
        const addColumnsSQL = `
          ALTER TABLE user_subscriptions
          ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS credits_total_purchased INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS credits_total_used INTEGER DEFAULT 0;
        `;
        
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql_query: addColumnsSQL
        });
        
        if (alterError) {
          console.log('   ⚠️  Could not add columns via exec_sql');
          console.log('   💡 Run migration: supabase db push --linked');
        } else {
          console.log('   ✅ Credit columns added');
        }
      }
    } else {
      const columns = Array.isArray(data) ? data : (data?.rows || []);
      if (columns.length > 0) {
        console.log(`   ✅ Found ${columns.length} credit column(s):`);
        columns.forEach(col => {
          const colName = col.column_name || col;
          console.log(`      • ${colName}`);
        });
      } else {
        console.log('   ❌ No credit columns found');
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Verification complete!\n');
  console.log('📋 If tables/columns are missing, run:');
  console.log('   supabase db push --linked --include-all\n');
}

if (require.main === module) {
  verifyCreditTables()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyCreditTables };
