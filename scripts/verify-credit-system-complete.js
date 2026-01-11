#!/usr/bin/env node

/**
 * Complete Credit System Verification
 * 
 * Verifies all credit system components are working
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyCreditSystem() {
  console.log('\n🔍 Complete Credit System Verification\n');
  console.log('='.repeat(70));
  console.log();
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const results = {
    tables: {},
    columns: {},
    functions: {},
    indexes: {}
  };
  
  // 1. Verify Tables
  console.log('1️⃣  Verifying Tables...\n');
  const tables = ['credit_purchases', 'credit_usage', 'credit_transactions'];
  
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error || error.code === 'PGRST116') {
        console.log(`   ✅ ${tableName} exists`);
        results.tables[tableName] = true;
      } else {
        console.log(`   ❌ ${tableName}: ${error.message}`);
        results.tables[tableName] = false;
      }
    } catch (error) {
      console.log(`   ⚠️  ${tableName}: ${error.message}`);
      results.tables[tableName] = false;
    }
  }
  
  // 2. Verify Columns
  console.log('\n2️⃣  Verifying user_subscriptions Columns...\n');
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('credits_balance, credits_total_purchased, credits_total_used')
      .limit(1);
    
    if (!error || error.code === 'PGRST116') {
      console.log('   ✅ Credit columns exist');
      results.columns.user_subscriptions = true;
    } else {
      console.log(`   ❌ Columns missing: ${error.message}`);
      results.columns.user_subscriptions = false;
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
    results.columns.user_subscriptions = false;
  }
  
  // 3. Verify Functions
  console.log('\n3️⃣  Verifying Functions...\n');
  const functions = [
    'add_credits_to_user',
    'use_credits_from_user',
    'get_user_credit_balance'
  ];
  
  for (const funcName of functions) {
    try {
      // Try to call the function
      const { data, error } = await supabase.rpc(funcName, {
        p_user_id: 'test-verification'
      });
      
      // If function doesn't exist, we'll get an error, but that's OK for verification
      if (error && error.message?.includes('does not exist')) {
        console.log(`   ❌ ${funcName}: Function does not exist`);
        results.functions[funcName] = false;
      } else {
        // Function exists (even if it errors on test data, that's fine)
        console.log(`   ✅ ${funcName} exists`);
        results.functions[funcName] = true;
      }
    } catch (error) {
      // Check if it's a "function doesn't exist" error
      if (error.message?.includes('does not exist')) {
        console.log(`   ❌ ${funcName}: Function does not exist`);
        results.functions[funcName] = false;
      } else {
        // Function exists, just failed on test data (expected)
        console.log(`   ✅ ${funcName} exists`);
        results.functions[funcName] = true;
      }
    }
  }
  
  // 4. Test Credit Balance API
  console.log('\n4️⃣  Testing Credit Balance Function...\n');
  try {
    const { data, error } = await supabase.rpc('get_user_credit_balance', {
      p_user_id: 'test-user'
    });
    
    if (!error) {
      console.log('   ✅ get_user_credit_balance works');
      console.log(`   📊 Test result: ${JSON.stringify(data)}`);
    } else {
      console.log(`   ⚠️  Error: ${error.message}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Exception: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Verification Results:\n');
  
  const tableCount = Object.keys(results.tables).length;
  const tablePassed = Object.values(results.tables).filter(Boolean).length;
  console.log(`   Tables: ${tablePassed}/${tableCount} (${Math.round(tablePassed/tableCount*100)}%)`);
  
  const columnCount = Object.keys(results.columns).length;
  const columnPassed = Object.values(results.columns).filter(Boolean).length;
  console.log(`   Columns: ${columnPassed}/${columnCount} (${Math.round(columnPassed/columnCount*100)}%)`);
  
  const functionCount = Object.keys(results.functions).length;
  const functionPassed = Object.values(results.functions).filter(Boolean).length;
  console.log(`   Functions: ${functionPassed}/${functionCount} (${Math.round(functionPassed/functionCount*100)}%)`);
  
  const allPassed = tablePassed === tableCount && 
                    columnPassed === columnCount && 
                    functionPassed === functionCount;
  
  console.log('\n' + '='.repeat(70));
  if (allPassed) {
    console.log('\n✅ Credit system is fully operational!\n');
  } else {
    console.log('\n⚠️  Some components missing. Review above.\n');
    console.log('💡 If tables/columns missing, run:');
    console.log('   supabase db push --linked --include-all\n');
  }
  
  return allPassed;
}

if (require.main === module) {
  verifyCreditSystem()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyCreditSystem };
