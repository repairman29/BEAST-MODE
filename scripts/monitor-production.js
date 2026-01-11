#!/usr/bin/env node
/**
 * Production Monitoring Script
 * 
 * Runs monitoring queries and checks system health
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMonitoring() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('📊 Production Monitoring Report\n');
  console.log('='.repeat(60));
  console.log();
  
  // Credit purchases today
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT COUNT(*) as count, SUM(credits_amount) as total_credits, SUM(price_amount) as total_revenue
        FROM credit_purchases
        WHERE status = 'completed' AND DATE(purchased_at) = CURRENT_DATE;
      `
    });
    
    if (!error && data) {
      console.log('💳 Credit Purchases Today:');
      console.log(`   Count: ${data[0]?.count || 0}`);
      console.log(`   Credits: ${data[0]?.total_credits || 0}`);
      console.log(`   Revenue: $${((data[0]?.total_revenue || 0) / 100).toFixed(2)}\n`);
    }
  } catch (error) {
    console.log('   ⚠️  Could not fetch credit purchases');
  }
  
  // Webhook failures
  try {
    const { data, error } = await supabase
      .from('credit_purchases')
      .select('*', { count: 'exact' })
      .eq('status', 'failed')
      .gte('purchased_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (!error) {
      const failureCount = data?.length || 0;
      console.log(`⚠️  Webhook Failures (24h): ${failureCount}`);
      if (failureCount > 5) {
        console.log('   🚨 ALERT: High failure rate detected!');
      }
      console.log();
    }
  } catch (error) {
    console.log('   ⚠️  Could not fetch webhook failures');
  }
  
  // System health
  console.log('✅ Monitoring complete');
}

runMonitoring();
