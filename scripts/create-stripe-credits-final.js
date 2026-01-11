#!/usr/bin/env node

/**
 * Create Stripe Credit Products - Final Version
 * Uses Stripe CLI via exec to avoid API key issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PACKAGES = [
  { name: '100 Credits', credits: 100, price: 500, desc: 'Perfect for trying premium features' },
  { name: '500 Credits', credits: 500, price: 2000, desc: 'Great for small projects' },
  { name: '1,000 Credits', credits: 1000, price: 3500, desc: 'Best value for regular users', popular: true },
  { name: '5,000 Credits', credits: 5000, price: 15000, desc: 'For power users and teams' },
  { name: '10,000 Credits', credits: 10000, price: 25000, desc: 'Maximum value for heavy usage' },
];

const results = { products: [], errors: [] };

function createProduct(pkg) {
  try {
    console.log(`📦 Creating: ${pkg.name} (${pkg.credits} credits - $${(pkg.price / 100).toFixed(2)})`);
    
    // Create product with JSON input to avoid shell escaping issues
    const productJson = JSON.stringify({
      name: pkg.name,
      description: pkg.desc,
      metadata: {
        type: 'credit_package',
        credits: pkg.credits.toString()
      }
    });
    
    const productOutput = execSync(
      `stripe products create -d '${productJson.replace(/'/g, "'\\''")}'`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    const productId = JSON.parse(productOutput).id;
    console.log(`   ✅ Product: ${productId}`);
    
    // Create price
    const priceJson = JSON.stringify({
      product: productId,
      unit_amount: pkg.price,
      currency: 'usd',
      metadata: {
        type: 'credit_package',
        credits: pkg.credits.toString()
      }
    });
    
    const priceOutput = execSync(
      `stripe prices create -d '${priceJson.replace(/'/g, "'\\''")}'`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    const priceId = JSON.parse(priceOutput).id;
    console.log(`   ✅ Price: ${priceId}`);
    console.log();
    
    results.products.push({
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.price,
      productId,
      priceId
    });
    
    return { productId, priceId };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    results.errors.push({
      package: pkg.name,
      error: error.message
    });
    return null;
  }
}

// Create all products
console.log('💳 Creating Stripe Credit Products via CLI...\n');
console.log('='.repeat(60));
console.log();

PACKAGES.forEach(pkg => createProduct(pkg));

// Save results
const resultsFile = path.join(__dirname, '../stripe-credit-products-final.json');
fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

// Update .env.local
const envPath = path.join(__dirname, '../website/.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  // File doesn't exist, that's okay
}

const newVars = [];
results.products.forEach(p => {
  const varName = `NEXT_PUBLIC_STRIPE_PRICE_${p.credits}_CREDITS`;
  if (!envContent.includes(varName)) {
    newVars.push(`${varName}=${p.priceId}`);
  }
});

if (newVars.length > 0) {
  fs.appendFileSync(envPath, '\n# Stripe Credit Product Price IDs (Auto-generated)\n' + newVars.join('\n') + '\n');
  console.log('✅ Added price IDs to website/.env.local\n');
}

console.log('='.repeat(60));
console.log('\n📊 Results:\n');
console.log(`   ✅ Created: ${results.products.length} products`);
if (results.errors.length > 0) {
  console.log(`   ❌ Errors: ${results.errors.length}`);
}
console.log(`\n📄 Results saved to: ${resultsFile}\n`);

if (results.products.length > 0) {
  console.log('📋 Price IDs:\n');
  results.products.forEach(p => {
    console.log(`   ${p.name}:`);
    console.log(`     Product: ${p.productId}`);
    console.log(`     Price: ${p.priceId}`);
    console.log();
  });
}
