#!/usr/bin/env node

/**
 * Verify Credit System is Ready for Testing
 * 
 * Checks all components of the credit purchase system
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROD_URL = 'https://beast-mode.dev';

function checkEndpoint(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const req = https.request(url, {
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve({ status: res.statusCode, accessible: res.statusCode < 500 });
    });
    
    req.on('error', () => resolve({ status: 0, accessible: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, accessible: false });
    });
    
    req.end();
  });
}

async function verifySystem() {
  console.log('\n🔍 Verifying Credit Purchase System\n');
  console.log('='.repeat(70));
  console.log();
  
  const results = {
    database: { connected: false, tables: false, migration: false },
    api: { endpoint: false, webhook: false },
    stripe: { key: false, webhookSecret: false, priceIds: false },
    ready: false
  };
  
  // 1. Database Connection
  console.log('📊 Step 1: Database Connection...\n');
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: 'SELECT 1 as test;'
      });
      
      if (!error) {
        results.database.connected = true;
        console.log('   ✅ Database connected');
      } else {
        console.log(`   ❌ Database error: ${error.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
    }
  } else {
    console.log('   ❌ Supabase credentials not found');
  }
  
  // 2. Database Tables
  console.log('\n📋 Step 2: Database Tables...\n');
  if (results.database.connected) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Check credit_purchases table
      const { data: purchases, error: purchasesError } = await supabase
        .from('credit_purchases')
        .select('id')
        .limit(1);
      
      if (!purchasesError) {
        results.database.tables = true;
        console.log('   ✅ credit_purchases table exists');
      } else {
        console.log(`   ❌ credit_purchases table: ${purchasesError.message}`);
      }
      
      // Check credit_usage table
      const { data: usage, error: usageError } = await supabase
        .from('credit_usage')
        .select('id')
        .limit(1);
      
      if (!usageError) {
        console.log('   ✅ credit_usage table exists');
      } else {
        console.log(`   ⚠️  credit_usage table: ${usageError.message}`);
      }
      
      // Check credit_transactions table
      const { data: transactions, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('id')
        .limit(1);
      
      if (!transactionsError) {
        console.log('   ✅ credit_transactions table exists');
        results.database.migration = true;
      } else {
        console.log(`   ⚠️  credit_transactions table: ${transactionsError.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking tables: ${error.message}`);
    }
  }
  
  // 3. API Endpoints
  console.log('\n🌐 Step 3: API Endpoints...\n');
  
  // Check credit purchase endpoint
  try {
    const purchaseCheck = await checkEndpoint(`${PROD_URL}/api/credits/purchase`);
    if (purchaseCheck.accessible) {
      results.api.endpoint = true;
      console.log(`   ✅ Credit purchase endpoint accessible (${purchaseCheck.status})`);
    } else {
      console.log(`   ⚠️  Credit purchase endpoint: ${purchaseCheck.status || 'timeout'}`);
    }
  } catch (error) {
    console.log(`   ❌ Error checking endpoint: ${error.message}`);
  }
  
  // Check webhook endpoint
  try {
    const webhookCheck = await checkEndpoint(`${PROD_URL}/api/stripe/webhook`);
    if (webhookCheck.accessible) {
      results.api.webhook = true;
      console.log(`   ✅ Webhook endpoint accessible (${webhookCheck.status})`);
    } else {
      console.log(`   ⚠️  Webhook endpoint: ${webhookCheck.status || 'timeout'}`);
    }
  } catch (error) {
    console.log(`   ❌ Error checking webhook: ${error.message}`);
  }
  
  // 4. Stripe Configuration
  console.log('\n💳 Step 4: Stripe Configuration...\n');
  
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && stripeKey.startsWith('sk_')) {
    results.stripe.key = true;
    console.log('   ✅ Stripe secret key configured');
  } else {
    console.log('   ❌ Stripe secret key not found or invalid');
  }
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret && webhookSecret.startsWith('whsec_')) {
    results.stripe.webhookSecret = true;
    console.log('   ✅ Stripe webhook secret configured');
  } else {
    console.log('   ❌ Stripe webhook secret not found or invalid');
  }
  
  // Check price IDs
  const priceIds = [
    'NEXT_PUBLIC_STRIPE_PRICE_100_CREDITS',
    'NEXT_PUBLIC_STRIPE_PRICE_500_CREDITS',
    'NEXT_PUBLIC_STRIPE_PRICE_1000_CREDITS',
    'NEXT_PUBLIC_STRIPE_PRICE_5000_CREDITS',
    'NEXT_PUBLIC_STRIPE_PRICE_10000_CREDITS'
  ];
  
  const configuredPrices = priceIds.filter(id => process.env[id]);
  if (configuredPrices.length === priceIds.length) {
    results.stripe.priceIds = true;
    console.log(`   ✅ All ${priceIds.length} price IDs configured`);
  } else {
    console.log(`   ⚠️  Only ${configuredPrices.length}/${priceIds.length} price IDs configured`);
    priceIds.forEach(id => {
      if (!process.env[id]) {
        console.log(`      Missing: ${id}`);
      }
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Verification Summary:\n');
  
  const allReady = 
    results.database.connected &&
    results.database.tables &&
    results.database.migration &&
    results.api.endpoint &&
    results.api.webhook &&
    results.stripe.key &&
    results.stripe.webhookSecret &&
    results.stripe.priceIds;
  
  results.ready = allReady;
  
  console.log(`   ${results.database.connected ? '✅' : '❌'} Database Connected`);
  console.log(`   ${results.database.tables ? '✅' : '❌'} Database Tables`);
  console.log(`   ${results.database.migration ? '✅' : '❌'} Migration Applied`);
  console.log(`   ${results.api.endpoint ? '✅' : '❌'} API Endpoint`);
  console.log(`   ${results.api.webhook ? '✅' : '❌'} Webhook Endpoint`);
  console.log(`   ${results.stripe.key ? '✅' : '❌'} Stripe Key`);
  console.log(`   ${results.stripe.webhookSecret ? '✅' : '❌'} Webhook Secret`);
  console.log(`   ${results.stripe.priceIds ? '✅' : '❌'} Price IDs`);
  
  console.log('\n' + '='.repeat(70));
  
  if (allReady) {
    console.log('\n✅ SYSTEM READY FOR TESTING!\n');
    console.log('📋 Manual Test Steps:');
    console.log('   1. Visit: https://beast-mode.dev/dashboard/customer?tab=billing');
    console.log('   2. Click "Buy Credits" button');
    console.log('   3. Select a package (e.g., 1,000 Credits)');
    console.log('   4. Complete Stripe checkout');
    console.log('   5. Use test card: 4242 4242 4242 4242');
    console.log('   6. Verify webhook in Stripe dashboard');
    console.log('   7. Run: node scripts/monitor-production.js');
    console.log();
  } else {
    console.log('\n⚠️  SYSTEM NOT FULLY READY\n');
    console.log('Please fix the issues above before testing.\n');
  }
  
  return results;
}

if (require.main === module) {
  verifySystem()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifySystem };
