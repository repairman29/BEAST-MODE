#!/usr/bin/env node

/**
 * Verify Stripe Integration
 * 
 * Checks that Stripe product/price IDs match the code
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const Stripe = require('stripe');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

// Expected plans from code
const expectedPlans = {
  pro: { price: 1900, name: 'BEAST MODE Pro' },
  team: { price: 9900, name: 'BEAST MODE Team' },
  enterprise: { price: 49900, name: 'BEAST MODE Enterprise' }
};

async function verifyStripeIntegration() {
  console.log('\n💳 Verifying Stripe Integration\n');
  console.log('='.repeat(60));
  
  try {
    // Get products
    const products = await stripe.products.list({ limit: 100, active: true });
    const beastModeProducts = products.data.filter(p => 
      p.name.includes('BEAST MODE') || p.metadata?.beastMode === 'true'
    );
    
    console.log(`\n📦 Found ${beastModeProducts.length} BEAST MODE products\n`);
    
    const results = {
      products: [],
      prices: [],
      missing: [],
      mismatched: []
    };
    
    // Check each expected plan
    for (const [planId, expected] of Object.entries(expectedPlans)) {
      const product = beastModeProducts.find(p => 
        p.name === expected.name || p.metadata?.planId === planId
      );
      
      if (!product) {
        console.log(`   ❌ ${expected.name}: Product not found`);
        results.missing.push({ planId, name: expected.name });
        continue;
      }
      
      console.log(`   ✅ ${expected.name}: ${product.id}`);
      results.products.push({ planId, productId: product.id, name: expected.name });
      
      // Check prices
      const prices = await stripe.prices.list({ 
        product: product.id, 
        limit: 100,
        active: true 
      });
      
      const matchingPrice = prices.data.find(p => 
        p.unit_amount === expected.price && 
        p.recurring?.interval === 'month' &&
        p.currency === 'usd'
      );
      
      if (!matchingPrice) {
        console.log(`      ⚠️  Price not found for $${expected.price/100}/month`);
        results.missing.push({ planId, name: expected.name, type: 'price' });
      } else {
        console.log(`      ✅ Price: ${matchingPrice.id} ($${expected.price/100}/month)`);
        results.prices.push({ planId, priceId: matchingPrice.id, amount: expected.price });
      }
    }
    
    // Check webhook
    console.log('\n🔗 Checking Webhook:\n');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const beastModeWebhook = webhooks.data.find(w => 
      w.url.includes('beast-mode.dev') || w.metadata?.beastMode === 'true'
    );
    
    if (beastModeWebhook) {
      console.log(`   ✅ Webhook exists: ${beastModeWebhook.id}`);
      console.log(`      URL: ${beastModeWebhook.url}`);
      console.log(`      Status: ${beastModeWebhook.status}`);
      console.log(`      Events: ${beastModeWebhook.enabled_events.length}`);
      
      const requiredEvents = [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ];
      
      const missingEvents = requiredEvents.filter(e => 
        !beastModeWebhook.enabled_events.includes(e)
      );
      
      if (missingEvents.length > 0) {
        console.log(`      ⚠️  Missing events: ${missingEvents.join(', ')}`);
      } else {
        console.log(`      ✅ All required events enabled`);
      }
    } else {
      console.log(`   ❌ Webhook not found`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary:\n');
    console.log(`   ✅ Products: ${results.products.length}/${Object.keys(expectedPlans).length}`);
    console.log(`   ✅ Prices: ${results.prices.length}/${Object.keys(expectedPlans).length}`);
    console.log(`   ❌ Missing: ${results.missing.length}`);
    
    if (results.missing.length > 0) {
      console.log('\n⚠️  Missing Items:');
      results.missing.forEach(item => {
        console.log(`   • ${item.name}${item.type ? ` (${item.type})` : ''}`);
      });
    }
    
    // Save results
    const resultsPath = path.join(__dirname, '../stripe-verification-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      verified: new Date().toISOString(),
      products: results.products,
      prices: results.prices,
      missing: results.missing,
      webhook: beastModeWebhook ? {
        id: beastModeWebhook.id,
        url: beastModeWebhook.url,
        status: beastModeWebhook.status
      } : null
    }, null, 2));
    
    console.log(`\n💾 Results saved to: stripe-verification-results.json\n`);
    
    return results.missing.length === 0;
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  verifyStripeIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { verifyStripeIntegration };
