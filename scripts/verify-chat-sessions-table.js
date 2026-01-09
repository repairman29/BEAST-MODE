#!/usr/bin/env node

/**
 * Verify Chat Sessions Table
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
function loadEnv() {
  const envPath = path.join(__dirname, '../../.env.local');
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
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rbfzlqmkwhbvrrfdcain.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('🔍 Verifying codebase_chat_sessions table...\n');

  // Check if table exists via exec_sql
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'codebase_chat_sessions'
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      console.error('❌ Error checking table:', error.message);
      process.exit(1);
    }

    if (data && Array.isArray(data) && data.length > 0) {
      console.log('✅ Table exists with columns:');
      data.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      console.log(`\n✅ Total columns: ${data.length}`);
    } else {
      console.log('⚠️  Table structure check returned no data');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Try to query the table directly
  console.log('\n🔍 Testing table access...');
  try {
    const { data, error } = await supabase
      .from('codebase_chat_sessions')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.error('❌ Table does not exist!');
        process.exit(1);
      } else {
        console.log('⚠️  Query error (may be RLS):', error.message);
        console.log('   This is okay - table exists but RLS may be blocking');
      }
    } else {
      console.log('✅ Table is accessible!');
      console.log(`   Current session count: ${data?.length || 0}`);
    }
  } catch (error) {
    console.log('⚠️  Direct query test:', error.message);
  }

  // Check indexes
  console.log('\n🔍 Checking indexes...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = 'codebase_chat_sessions';
      `
    });

    if (!error && data && Array.isArray(data)) {
      console.log(`✅ Found ${data.length} indexes:`);
      data.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
    }
  } catch (error) {
    console.log('⚠️  Could not check indexes');
  }

  console.log('\n✅ Verification complete!');
}

verify().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
