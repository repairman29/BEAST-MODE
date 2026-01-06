#!/usr/bin/env node

/**
 * Verify BEAST MODE subscriptions migration
 * Checks if tables exist and are properly configured
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToCheck = [
  'beast_mode_subscriptions',
  'beast_mode_api_keys',
  'beast_mode_api_usage'
];

async function verifyMigration() {
  console.log('🔍 Verifying BEAST MODE migration...\n');

  let allExist = true;

  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.log(`❌ ${table}: Table does NOT exist`);
          allExist = false;
        } else {
          console.log(`⚠️  ${table}: Error - ${error.message}`);
          allExist = false;
        }
      } else {
        console.log(`✅ ${table}: Table exists (${count || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allExist = false;
    }
  }

  // Check helper functions
  console.log('\n🔍 Checking helper functions...\n');
  
  try {
    const { data, error } = await supabase.rpc('get_user_subscription_tier', { p_user_id: 'test' });
    if (error && error.message.includes('does not exist')) {
      console.log('❌ get_user_subscription_tier function does NOT exist');
      allExist = false;
    } else {
      console.log('✅ get_user_subscription_tier function exists');
    }
  } catch (err) {
    console.log('❌ get_user_subscription_tier function error:', err.message);
    allExist = false;
  }

  try {
    const { data, error } = await supabase.rpc('get_user_api_usage_count', { p_user_id: 'test' });
    if (error && error.message.includes('does not exist')) {
      console.log('❌ get_user_api_usage_count function does NOT exist');
      allExist = false;
    } else {
      console.log('✅ get_user_api_usage_count function exists');
    }
  } catch (err) {
    console.log('❌ get_user_api_usage_count function error:', err.message);
    allExist = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allExist) {
    console.log('✅ Migration verified! All tables and functions exist.');
  } else {
    console.log('❌ Migration incomplete. Some tables/functions are missing.');
    console.log('\n📋 To apply migration:');
    console.log('   node scripts/apply-beast-mode-migration.js');
    console.log('\nOr apply manually via Supabase Dashboard SQL Editor.');
  }
  console.log('='.repeat(50));
}

verifyMigration().catch(console.error);

