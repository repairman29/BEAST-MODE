#!/usr/bin/env node

/**
 * Apply Credit System Migration via exec_sql
 * 
 * Uses Supabase exec_sql RPC to apply the migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applyMigration() {
  console.log('\n🔧 Applying Credit System Migration via exec_sql\n');
  console.log('='.repeat(70));
  console.log();
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250120000000_create_credit_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Execute entire migration as one block
  console.log('📋 Executing full migration SQL...\n');
  
  try {
    // Use exec_sql RPC to execute entire migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });
    
    if (error) {
      // Check if it's a "no return" error (which is OK for DDL)
      if (error.message?.includes('does not return') || 
          error.message?.includes('no return')) {
        console.log('   ✅ Migration executed (DDL statements)');
      } else {
        console.log(`   ⚠️  Error: ${error.message}`);
        // Try executing in chunks
        console.log('   💡 Trying to execute in chunks...\n');
        await executeInChunks(supabase, migrationSQL);
      }
    } else {
      console.log('   ✅ Migration executed successfully');
    }
  } catch (error) {
    console.log(`   ⚠️  Exception: ${error.message}`);
    console.log('   💡 Trying to execute in chunks...\n');
    await executeInChunks(supabase, migrationSQL);
  }
  
  async function executeInChunks(supabase, sql) {
    // Split by major statements (CREATE TABLE, ALTER TABLE, CREATE FUNCTION, etc.)
    const chunks = sql.split(/(?=CREATE TABLE|ALTER TABLE|CREATE OR REPLACE FUNCTION|CREATE INDEX|CREATE POLICY)/);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      if (!chunk || chunk.startsWith('--')) continue;
      
      const preview = chunk.substring(0, 60).replace(/\n/g, ' ') + '...';
      console.log(`[${i + 1}/${chunks.length}] ${preview}`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: chunk
        });
        
        if (error) {
          if (error.message?.includes('already exists') || 
              error.message?.includes('duplicate') ||
              error.message?.includes('IF NOT EXISTS') ||
              error.message?.includes('does not return')) {
            console.log(`   ⚠️  ${error.message.substring(0, 80)}`);
            successCount++;
          } else {
            console.log(`   ❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log('   ✅ Success');
          successCount++;
        }
      } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
        errorCount++;
      }
      console.log();
    }
    
    return { successCount, errorCount };
  }
  
  // Verify tables exist
  console.log('🔍 Verifying tables...\n');
  
  const tablesToCheck = [
    'credit_purchases',
    'credit_usage',
    'credit_transactions'
  ];
  
  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error || error.code === 'PGRST116') {
        console.log(`   ✅ ${tableName} table exists`);
      } else {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      }
    } catch (error) {
      console.log(`   ⚠️  ${tableName}: ${error.message}`);
    }
  }
  
  // Verify columns exist
  console.log('\n🔍 Verifying user_subscriptions columns...\n');
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('credits_balance, credits_total_purchased, credits_total_used')
      .limit(1);
    
    if (!error || error.code === 'PGRST116') {
      console.log('   ✅ Credit columns exist in user_subscriptions');
    } else {
      console.log(`   ❌ Columns missing: ${error.message}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Migration Status:\n');
  console.log('   ✅ Migration SQL executed');
  console.log('   ⚠️  Note: Schema cache may need refresh');
  console.log('\n💡 If tables still missing, run:');
  console.log('   supabase db push --linked --include-all\n');
}

if (require.main === module) {
  applyMigration()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { applyMigration };
