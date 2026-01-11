#!/usr/bin/env node

/**
 * Setup Stripe Products and Prices for BEAST MODE
 * 
 * Creates all subscription products using Stripe CLI
 */

const Stripe = require('stripe');
const path = require('path');
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
  
  // Set Stripe API key
  process.env.STRIPE_SECRET_KEY = STRIPE_SECRET_KEY;
  
  const results = {
    products: [],
    prices: [],
    errors: []
  };
  
  for (const plan of plans) {
    try {
      console.log(`\n📦 Creating: ${plan.name}`);
      console.log(`   Price: $${(plan.price / 100).toFixed(2)}/${plan.interval}`);
      
      // Check if product already exists
      const existingProducts = await stripe.products.list({ limit: 100 });
      const existing = existingProducts.data.find(p => p.name === plan.name);
      
      let product;
      if (existing) {
        console.log(`   ✅ Product exists: ${existing.id}`);
        product = existing;
      } else {
        // Create product using Stripe SDK
        product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
        });
        console.log(`   ✅ Product created: ${product.id}`);
      }
      
      results.products.push({ planId: plan.planId, productId: product.id, name: plan.name });
      
      // Check for existing price
      const existingPrices = await stripe.prices.list({
        product: product.id,
        limit: 100
      });
      
      const existingPrice = existingPrices.data.find(p => 
        p.unit_amount === plan.price && 
        p.recurring?.interval === plan.interval &&
        p.currency === plan.currency
      );
      
      if (existingPrice) {
        console.log(`   ✅ Price exists: ${existingPrice.id}`);
        results.prices.push({ planId: plan.planId, priceId: existingPrice.id, productId: product.id });
      } else {
        // Create price for the product
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.price,
          currency: plan.currency,
          recurring: {
            interval: plan.interval,
          },
        });
        console.log(`   ✅ Price created: ${price.id}`);
        results.prices.push({ planId: plan.planId, priceId: price.id, productId: product.id });
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.type === 'StripeInvalidRequestError') {
        console.log(`   💡 Stripe error: ${error.message}`);
      }
      results.errors.push({ plan: plan.name, error: error.message });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Setup Summary:\n');
  
  console.log('✅ Products Created:');
  results.products.forEach(p => {
    console.log(`   • ${p.name}: ${p.productId}`);
  });
  
  console.log('\n✅ Prices Created:');
  results.prices.forEach(p => {
    const plan = plans.find(pl => pl.planId === p.planId);
    console.log(`   • ${plan.name}: ${p.priceId} ($${(plan.price / 100).toFixed(2)}/${plan.interval})`);
  });
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    results.errors.forEach(e => {
      console.log(`   • ${e.plan}: ${e.error}`);
    });
  }
  
  // Save results to file for reference
  const resultsPath = path.join(__dirname, '../stripe-products.json');
  const output = {
    products: results.products,
    prices: results.prices,
    createdAt: new Date().toISOString()
  };
  
  require('fs').writeFileSync(resultsPath, JSON.stringify(output, null, 2));
  console.log(`\n💾 Results saved to: stripe-products.json`);
  
  console.log('\n📋 Next Steps:');
  console.log('   1. Verify products in Stripe dashboard');
  console.log('   2. Update code to use these price IDs (if needed)');
  console.log('   3. Set up webhook endpoint');
  console.log('   4. Test checkout flow\n');
  
  return results;
}

if (require.main === module) {
  setupStripeProducts()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupStripeProducts };
