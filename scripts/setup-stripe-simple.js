#!/usr/bin/env node

/**
 * Simple Stripe Setup using SDK
 * Creates products, prices, and webhook for BEAST MODE
 */

const Stripe = require('stripe');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

// Get API key - try multiple sources
let STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// If not in env, try to get from Stripe CLI config
if (!STRIPE_SECRET_KEY) {
  try {
    const { execSync } = require('child_process');
    const config = execSync('stripe config --list', { encoding: 'utf8' });
    // Try to extract from config or use Stripe CLI's logged-in account
    console.log('⚠️  STRIPE_SECRET_KEY not in .env.local, using Stripe CLI account');
  } catch (e) {
    // Ignore
  }
}

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found');
  console.log('\n💡 Options:');
  console.log('   1. Add STRIPE_SECRET_KEY to website/.env.local');
  console.log('   2. Or use Stripe CLI: stripe login then use CLI commands');
  console.log('   3. Or create products manually in dashboard');
  process.exit(1);
}

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY.trim(), {
  apiVersion: '2025-12-15.clover',
});

const plans = [
  { name: 'BEAST MODE Pro', desc: 'Pro plan - $19/month', price: 1900, planId: 'pro' },
  { name: 'BEAST MODE Team', desc: 'Team plan - $99/month', price: 9900, planId: 'team' },
  { name: 'BEAST MODE Enterprise', desc: 'Enterprise plan - $499/month', price: 49900, planId: 'enterprise' }
];

async function main() {
  console.log('\n💳 Setting Up Stripe for BEAST MODE\n');
  console.log('='.repeat(60));
  
  // Test API key
  try {
    await stripe.products.list({ limit: 1 });
    console.log('✅ Stripe API key is valid\n');
  } catch (error) {
    console.error('❌ Invalid Stripe API key');
    console.error(`   ${error.message}\n`);
    console.log('💡 The API key might be:');
    console.log('   • Incorrect or expired');
    console.log('   • From a different Stripe account');
    console.log('   • Has extra whitespace (check .env.local)\n');
    console.log('💡 Alternative: Use Stripe Dashboard to create products manually');
    console.log('   https://dashboard.stripe.com/acct_1So8HhHftdvxqEbU/products\n');
    process.exit(1);
  }
  
  const results = { products: [], prices: [], webhook: null };
  
  // Create products and prices
  for (const plan of plans) {
    try {
      console.log(`\n📦 ${plan.name} ($${(plan.price/100).toFixed(2)}/month)`);
      
      // Check existing
      const existing = await stripe.products.list({ limit: 100 });
      let product = existing.data.find(p => p.name === plan.name);
      
      if (product) {
        console.log(`   ✅ Product exists: ${product.id}`);
      } else {
        product = await stripe.products.create({
          name: plan.name,
          description: plan.desc,
          metadata: { planId: plan.planId, beastMode: 'true' }
        });
        console.log(`   ✅ Product created: ${product.id}`);
      }
      
      results.products.push({ planId: plan.planId, productId: product.id });
      
      // Check/create price
      const prices = await stripe.prices.list({ product: product.id, limit: 100 });
      let price = prices.data.find(p => 
        p.unit_amount === plan.price && 
        p.recurring?.interval === 'month'
      );
      
      if (price) {
        console.log(`   ✅ Price exists: ${price.id}`);
      } else {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.price,
          currency: 'usd',
          recurring: { interval: 'month' },
          metadata: { planId: plan.planId }
        });
        console.log(`   ✅ Price created: ${price.id}`);
      }
      
      results.prices.push({ planId: plan.planId, priceId: price.id });
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Create webhook
  console.log(`\n🔗 Creating Webhook...`);
  const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`
    : 'https://beast-mode.dev/api/stripe/webhook';
  
  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    let webhook = webhooks.data.find(w => w.url === WEBHOOK_URL);
    
    if (webhook) {
      console.log(`   ✅ Webhook exists: ${webhook.id}`);
      results.webhook = { id: webhook.id, secret: process.env.SECRET || '' };
    } else {
      webhook = await stripe.webhookEndpoints.create({
        url: WEBHOOK_URL,
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed'
        ],
        metadata: { beastMode: 'true' }
      });
      console.log(`   ✅ Webhook created: ${webhook.id}`);
      // Note: Secret is not returned in create response, need to get from dashboard
      results.webhook = { id: webhook.id, secret: process.env.SECRET || '' };
    }
  } catch (error) {
    console.log(`   ❌ Webhook error: ${error.message}`);
    console.log(`   💡 Create manually in Stripe Dashboard`);
  }
  
  // Save results
  const output = {
    accountId: 'acct_1So8HhHftdvxqEbU',
    products: results.products,
    prices: results.prices,
    webhook: results.webhook,
    createdAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../stripe-setup-results.json'),
    JSON.stringify(output, null, 2)
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:\n');
  results.products.forEach(p => {
    const plan = plans.find(pl => pl.planId === p.planId);
    const price = results.prices.find(pr => pr.planId === p.planId);
    console.log(`   ${plan.name}:`);
    console.log(`      Product: ${p.productId}`);
    console.log(`      Price: ${price?.priceId || 'Not created'}`);
  });
  
  if (results.webhook) {
    console.log(`\n   Webhook: ${results.webhook.id}`);
    console.log(`   Secret: Get from https://dashboard.stripe.com/webhooks`);
  }
  
  console.log(`\n💾 Results saved to: stripe-setup-results.json`);
  console.log(`\n📝 Next Steps:`);
  console.log(`   1. Get webhook secret from Stripe Dashboard`);
  console.log(`   2. Add to .env.local: STRIPE_WEBHOOK_SECRET=whsec_...`);
  console.log(`   3. Add to Vercel environment variables`);
  console.log(`   4. Test checkout flow\n`);
}

main().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
});
