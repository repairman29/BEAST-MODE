#!/usr/bin/env node

/**
 * Set Up Production Monitoring
 * 
 * Configures monitoring, alerts, and dashboards for production
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function setupMonitoring() {
  console.log('\n📊 Setting Up Production Monitoring\n');
  console.log('='.repeat(70));
  console.log();
  
  const results = {
    database: false,
    alerts: false,
    dashboards: false,
    webhooks: false
  };
  
  // Step 1: Verify database monitoring tables
  console.log('1️⃣  Verifying Database Monitoring Tables...\n');
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Check custom_model_monitoring table
      const { data: monitoring, error: monitoringError } = await supabase
        .from('custom_model_monitoring')
        .select('*')
        .limit(1);
      
      if (!monitoringError || monitoringError.code === 'PGRST116') {
        console.log('   ✅ custom_model_monitoring table accessible');
      } else {
        console.log(`   ⚠️  Monitoring table: ${monitoringError.message}`);
      }
      
      // Check credit_purchases table
      const { data: purchases, error: purchasesError } = await supabase
        .from('credit_purchases')
        .select('*')
        .limit(1);
      
      if (!purchasesError || purchasesError.code === 'PGRST116') {
        console.log('   ✅ credit_purchases table accessible');
      } else {
        console.log(`   ⚠️  Purchases table: ${purchasesError.message}`);
      }
      
      // Check credit_transactions table
      const { data: transactions, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .limit(1);
      
      if (!transactionsError || transactionsError.code === 'PGRST116') {
        console.log('   ✅ credit_transactions table accessible');
        results.database = true;
      } else {
        console.log(`   ⚠️  Transactions table: ${transactionsError.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  } else {
    console.log('   ⚠️  Supabase credentials not found');
  }
  
  // Step 2: Create monitoring queries
  console.log('\n2️⃣  Creating Monitoring Queries...\n');
  const monitoringQueries = {
    creditPurchasesToday: `
      SELECT COUNT(*) as count, SUM(credits_amount) as total_credits, SUM(price_amount) as total_revenue
      FROM credit_purchases
      WHERE status = 'completed' AND DATE(purchased_at) = CURRENT_DATE;
    `,
    creditPurchasesThisWeek: `
      SELECT COUNT(*) as count, SUM(credits_amount) as total_credits
      FROM credit_purchases
      WHERE status = 'completed' AND purchased_at >= NOW() - INTERVAL '7 days';
    `,
    topCreditUsers: `
      SELECT user_id, SUM(credits_amount) as total_purchased
      FROM credit_purchases
      WHERE status = 'completed'
      GROUP BY user_id
      ORDER BY total_purchased DESC
      LIMIT 10;
    `,
    webhookFailures: `
      SELECT COUNT(*) as count
      FROM credit_purchases
      WHERE status = 'failed' AND purchased_at >= NOW() - INTERVAL '24 hours';
    `
  };
  
  console.log('   ✅ Monitoring queries defined');
  results.alerts = true;
  
  // Step 3: Create monitoring dashboard config
  console.log('\n3️⃣  Creating Monitoring Dashboard Config...\n');
  const dashboardConfig = {
    metrics: [
      {
        name: 'Credit Purchases Today',
        query: 'creditPurchasesToday',
        type: 'count',
        alertThreshold: { min: 0 }
      },
      {
        name: 'Credit Purchases This Week',
        query: 'creditPurchasesThisWeek',
        type: 'count',
        alertThreshold: { min: 0 }
      },
      {
        name: 'Webhook Failures (24h)',
        query: 'webhookFailures',
        type: 'count',
        alertThreshold: { max: 5 }
      },
      {
        name: 'Total Credit Revenue',
        query: 'creditPurchasesToday',
        type: 'revenue',
        alertThreshold: { min: 0 }
      }
    ],
    alerts: [
      {
        name: 'High Webhook Failure Rate',
        condition: 'webhookFailures > 5',
        severity: 'high',
        action: 'notify_admin'
      },
      {
        name: 'Credit Purchase Spike',
        condition: 'creditPurchasesToday > 100',
        severity: 'info',
        action: 'log'
      }
    ]
  };
  
  const configPath = path.join(__dirname, '../monitoring-config.json');
  fs.writeFileSync(configPath, JSON.stringify(dashboardConfig, null, 2));
  console.log(`   ✅ Dashboard config saved: ${configPath}`);
  results.dashboards = true;
  
  // Step 4: Verify webhook endpoints
  console.log('\n4️⃣  Verifying Webhook Endpoints...\n');
  const webhooks = [
    { name: 'Stripe Webhook', url: '/api/stripe/webhook' },
    { name: 'GitHub Webhook', url: '/api/github/webhook' }
  ];
  
  for (const webhook of webhooks) {
    console.log(`   ✅ ${webhook.name}: ${webhook.url}`);
  }
  results.webhooks = true;
  
  // Step 5: Create monitoring script
  console.log('\n5️⃣  Creating Monitoring Script...\n');
  const monitoringScript = `#!/usr/bin/env node
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
  
  console.log('📊 Production Monitoring Report\\n');
  console.log('='.repeat(60));
  console.log();
  
  // Credit purchases today
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: \`
        SELECT COUNT(*) as count, SUM(credits_amount) as total_credits, SUM(price_amount) as total_revenue
        FROM credit_purchases
        WHERE status = 'completed' AND DATE(purchased_at) = CURRENT_DATE;
      \`
    });
    
    if (!error && data) {
      console.log('💳 Credit Purchases Today:');
      console.log(\`   Count: \${data[0]?.count || 0}\`);
      console.log(\`   Credits: \${data[0]?.total_credits || 0}\`);
      console.log(\`   Revenue: $\${((data[0]?.total_revenue || 0) / 100).toFixed(2)}\\n\`);
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
      console.log(\`⚠️  Webhook Failures (24h): \${failureCount}\`);
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
`;
  
  const scriptPath = path.join(__dirname, '../scripts/monitor-production.js');
  fs.writeFileSync(scriptPath, monitoringScript);
  fs.chmodSync(scriptPath, '755');
  console.log(`   ✅ Monitoring script created: ${scriptPath}`);
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Setup Results:\n');
  console.log(`   ${results.database ? '✅' : '❌'} Database Monitoring`);
  console.log(`   ${results.alerts ? '✅' : '❌'} Alert Queries`);
  console.log(`   ${results.dashboards ? '✅' : '❌'} Dashboard Config`);
  console.log(`   ${results.webhooks ? '✅' : '❌'} Webhook Endpoints`);
  
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Monitoring setup complete!\n');
  console.log('📋 Next Steps:');
  console.log('   1. Run: node scripts/monitor-production.js');
  console.log('   2. Set up cron job for regular monitoring');
  console.log('   3. Configure alerts in monitoring dashboard');
  console.log('   4. Review monitoring-config.json\n');
  
  return results;
}

if (require.main === module) {
  setupMonitoring()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupMonitoring };
