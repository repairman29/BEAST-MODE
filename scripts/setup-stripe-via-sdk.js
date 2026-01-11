#!/usr/bin/env node

/**
 * Setup Stripe Products and Webhook using Stripe SDK
 * 
 * Creates all subscription products and webhook for BEAST MODE
 */

const Stripe = require('stripe');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in .env.local');
  console.log('\n💡 Add STRIPE_SECRET_KEY to website/.env.local first');
  process.exit(1);
}

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

// BEAST MODE Subscription Plans
const plans = [
  {
    name: 'BEAST MODE Pro',
    description: 'Pro plan - $19/month - Unlimited PR analysis, advanced features',
    price: 1900, // $19.00 in cents
    interval: 'month',
    planId: 'pro',
    currency: 'usd'
  },
  {
    name: 'BEAST MODE Team',
    description: 'Team plan - $99/month - Team collaboration, dashboards, advanced analytics',
    price: 9900, // $99.00 in cents
    interval: 'month',
    planId: 'team',
    currency: 'usd'
  },
  {
    name: 'BEAST MODE Enterprise',
    description: 'Enterprise plan - $499/month - Custom pricing, SSO, dedicated support',
    price: 49900, // $499.00 in cents
    interval: 'month',
    planId: 'enterprise',
    currency: 'usd'
  }
];

async function setupStripeProducts() {
  console.log('\n💳 Setting Up Stripe Products for BEAST MODE\n');
  console.log('='.repeat(60));
  
  const results = {
    products: [],
    prices: [],
    errors: []
  };
  
  // Test API key first
  try {
    await stripe.products.list({ limit: 1 });
    console.log('✅ Stripe API key is valid\n');
  } catch (error) {
    console.error('❌ Invalid Stripe API key');
    console.error(`   Error: ${error.message}`);
    console.log('\n💡 Check that STRIPE_SECRET_KEY in .env.local is correct');
    console.log('   It should start with sk_test_ or sk_live_\n');
    process.exit(1);
  }
  
  for (const plan of plans) {
    try {
      console.log(`\n📦 Creating: ${plan.name}`);
      console.log(`   Price: $${(plan.price / 100).toFixed(2)}/${plan.interval}`);
      
      // Check if product already exists
      const existingProducts = await stripe.products.list({ 
        limit: 100,
        active: true 
      });
      const existing = existingProducts.data.find(p => p.name === plan.name);
      
      let product;
      if (existing) {
        console.log(`   ✅ Product exists: ${existing.id}`);
        product = existing;
      } else {
        // Create product
        product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: {
            planId: plan.planId,
            beastMode: 'true'
          }
        });
        console.log(`   ✅ Product created: ${product.id}`);
      }
      
      results.products.push({ 
        planId: plan.planId, 
        productId: product.id, 
        name: plan.name 
      });
      
      // Check for existing price
      const existingPrices = await stripe.prices.list({
        product: product.id,
        limit: 100,
        active: true
      });
      
      const existingPrice = existingPrices.data.find(p => 
        p.unit_amount === plan.price && 
        p.recurring?.interval === plan.interval &&
        p.currency === plan.currency
      );
      
      if (existingPrice) {
        console.log(`   ✅ Price exists: ${existingPrice.id}`);
        results.prices.push({ 
          planId: plan.planId, 
          priceId: existingPrice.id, 
          productId: product.id 
        });
      } else {
        // Create price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.price,
          currency: plan.currency,
          recurring: {
            interval: plan.interval,
          },
          metadata: {
            planId: plan.planId,
            beastMode: 'true'
          }
        });
        console.log(`   ✅ Price created: ${price.id}`);
        results.prices.push({ 
          planId: plan.planId, 
          priceId: price.id, 
          productId: product.id 
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.type === 'StripeInvalidRequestError') {
        console.log(`   💡 Details: ${error.message}`);
      }
      results.errors.push({ plan: plan.name, error: error.message });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Setup Summary:\n');
  
  if (results.products.length > 0) {
    console.log('✅ Products:');
    results.products.forEach(p => {
      console.log(`   • ${p.name}: ${p.productId}`);
    });
  }
  
  if (results.prices.length > 0) {
    console.log('\n✅ Prices:');
    results.prices.forEach(p => {
      const plan = plans.find(pl => pl.planId === p.planId);
      console.log(`   • ${plan.name}: ${p.priceId} ($${(plan.price / 100).toFixed(2)}/${plan.interval})`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    results.errors.forEach(e => {
      console.log(`   • ${e.plan}: ${e.error}`);
    });
  }
  
  // Save results
  const resultsPath = path.join(__dirname, '../stripe-products.json');
  const output = {
    products: results.products,
    prices: results.prices,
    createdAt: new Date().toISOString(),
    accountId: 'acct_1So8HhHftdvxqEbU'
  };
  
  fs.writeFileSync(resultsPath, JSON.stringify(output, null, 2));
  console.log(`\n💾 Results saved to: stripe-products.json`);
  
  return results;
}

async function setupWebhook() {
  console.log('\n🔗 Setting Up Stripe Webhook\n');
  console.log('='.repeat(60));
  
  const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`
    : 'https://beast-mode.dev/api/stripe/webhook';
  
  const events = [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
  ];
  
  console.log(`\n📡 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`\n📋 Events: ${events.join(', ')}`);
  
  // Check for existing webhook
  const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = existingWebhooks.data.find(w => w.url === WEBHOOK_URL);
  
  if (existing) {
    console.log(`\n✅ Webhook already exists: ${existing.id}`);
    console.log(`   Status: ${existing.status}`);
    console.log(`\n🔑 To get signing secret:`);
    console.log(`   1. Go to: https://dashboard.stripe.com/webhooks`);
    console.log(`   2. Click on webhook: ${existing.id}`);
    console.log(`   3. Copy "Signing secret" (starts with whsec_)`);
    console.log(`   4. Add to .env.local: STRIPE_WEBHOOK_SECRET=whsec_...`);
    return existing;
  }
  
  // Create webhook
  try {
    console.log(`\n🔄 Creating webhook...`);
    const webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: events,
      metadata: {
        beastMode: 'true',
        environment: 'production'
      }
    });
    
    console.log(`\n✅ Webhook created: ${webhook.id}`);
    console.log(`   Status: ${webhook.status}`);
    console.log(`\n🔑 Signing Secret:`);
    console.log(`   ${webhook.secret || 'Get from Stripe Dashboard → Webhooks → Signing secret'}`);
    console.log(`\n📝 Add to .env.local:`);
    console.log(`   STRIPE_WEBHOOK_SECRET=${webhook.secret || 'whsec_...'}`);
    console.log(`\n📝 Add to Vercel environment variables\n`);
    
    return webhook;
  } catch (error) {
    console.log(`\n⚠️  Could not create webhook: ${error.message}`);
    console.log(`\n💡 Create manually:`);
    console.log(`   1. Go to: https://dashboard.stripe.com/webhooks`);
    console.log(`   2. Add endpoint: ${WEBHOOK_URL}`);
    console.log(`   3. Select events: ${events.join(', ')}`);
    console.log(`   4. Copy signing secret and add to .env.local\n`);
    throw error;
  }
}

async function main() {
  try {
    const products = await setupStripeProducts();
    const webhook = await setupWebhook();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Stripe Setup Complete!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Verify products in Stripe dashboard');
    console.log('   2. Add STRIPE_WEBHOOK_SECRET to .env.local');
    console.log('   3. Add STRIPE_WEBHOOK_SECRET to Vercel env vars');
    console.log('   4. Test checkout flow');
    console.log('   5. Deploy to production\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupStripeProducts, setupWebhook };
