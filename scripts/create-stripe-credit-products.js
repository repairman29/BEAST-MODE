#!/usr/bin/env node

/**
 * Create Stripe Credit Products
 * 
 * Creates one-time products for credit purchases
 */

const Stripe = require('stripe');
require('dotenv').config({ path: require('path').join(__dirname, '../website/.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Credit packages
const CREDIT_PACKAGES = [
  {
    name: '100 Credits',
    description: 'Perfect for trying premium features',
    credits: 100,
    price: 500, // $5.00 in cents
    metadata: {
      credits: '100',
      type: 'credit_package'
    }
  },
  {
    name: '500 Credits',
    description: 'Great for small projects',
    credits: 500,
    price: 2000, // $20.00 in cents
    metadata: {
      credits: '500',
      type: 'credit_package'
    }
  },
  {
    name: '1,000 Credits',
    description: 'Best value for regular users',
    credits: 1000,
    price: 3500, // $35.00 in cents (save $15 vs 100 credits)
    metadata: {
      credits: '1000',
      type: 'credit_package'
    }
  },
  {
    name: '5,000 Credits',
    description: 'For power users and teams',
    credits: 5000,
    price: 15000, // $150.00 in cents (save $100 vs 1000 credits)
    metadata: {
      credits: '5000',
      type: 'credit_package'
    }
  },
  {
    name: '10,000 Credits',
    description: 'Maximum value for heavy usage',
    credits: 10000,
    price: 25000, // $250.00 in cents (save $250 vs 1000 credits)
    metadata: {
      credits: '10000',
      type: 'credit_package'
    }
  }
];

async function createCreditProducts() {
  console.log('💳 Creating Stripe Credit Products...\n');
  console.log('='.repeat(60));
  console.log();

  const results = {
    products: [],
    errors: []
  };

  for (const package of CREDIT_PACKAGES) {
    try {
      console.log(`📦 Creating: ${package.name} (${package.credits} credits - $${(package.price / 100).toFixed(2)})`);

      // Create product
      const product = await stripe.products.create({
        name: package.name,
        description: package.description,
        metadata: {
          ...package.metadata,
          product_type: 'credit_package'
        }
      });

      console.log(`   ✅ Product created: ${product.id}`);

      // Create price (one-time payment)
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: package.price,
        currency: 'usd',
        metadata: {
          credits: package.credits.toString(),
          type: 'credit_package'
        }
      });

      console.log(`   ✅ Price created: ${price.id}`);
      console.log();

      results.products.push({
        name: package.name,
        credits: package.credits,
        price: package.price,
        productId: product.id,
        priceId: price.id
      });

    } catch (error) {
      console.error(`   ❌ Error creating ${package.name}:`, error.message);
      results.errors.push({
        package: package.name,
        error: error.message
      });
      console.log();
    }
  }

  // Save results
  const fs = require('fs');
  const resultsPath = require('path').join(__dirname, '../stripe-credit-products.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  console.log('='.repeat(60));
  console.log('\n📊 Results:\n');
  console.log(`   ✅ Created: ${results.products.length} products`);
  if (results.errors.length > 0) {
    console.log(`   ❌ Errors: ${results.errors.length}`);
  }
  console.log(`\n📄 Results saved to: stripe-credit-products.json\n`);

  if (results.products.length > 0) {
    console.log('📋 Product IDs:\n');
    results.products.forEach(p => {
      console.log(`   ${p.name}:`);
      console.log(`     Product: ${p.productId}`);
      console.log(`     Price: ${p.priceId}`);
      console.log(`     Credits: ${p.credits}`);
      console.log();
    });
  }

  return results;
}

if (require.main === module) {
  createCreditProducts()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = { createCreditProducts, CREDIT_PACKAGES };
