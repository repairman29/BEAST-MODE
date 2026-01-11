#!/usr/bin/env node

/**
 * Add metadata to Stripe products and prices
 */

const { execSync } = require('child_process');

const PRODUCTS = [
  { id: 'prod_TljCmbYQ9ialiR', credits: 100 },
  { id: 'prod_TljCUqgDr8Srv9', credits: 500 },
  { id: 'prod_TljC6KsGwMa5ff', credits: 1000 },
  { id: 'prod_TljC12tWfP4p7v', credits: 5000 },
  { id: 'prod_TljC9fGaxOACXp', credits: 10000 },
];

const PRICES = [
  { id: 'price_1SoBjiGa3zSfMp7oLZI0R5nW', credits: 100 },
  { id: 'price_1SoBjrGa3zSfMp7oN3FuKzkA', credits: 500 },
  { id: 'price_1SoBjrGa3zSfMp7ofT06ylCk', credits: 1000 },
  { id: 'price_1SoBjsGa3zSfMp7o6jMc8kdv', credits: 5000 },
  { id: 'price_1SoBjtGa3zSfMp7oy3Ry2QEA', credits: 10000 },
];

console.log('📝 Adding metadata to Stripe products and prices...\n');

// Add metadata to products
for (const prod of PRODUCTS) {
  try {
    execSync(`stripe products update ${prod.id} --metadata type=credit_package --metadata credits=${prod.credits}`, { stdio: 'inherit' });
    console.log(`✅ Product ${prod.id}: metadata added\n`);
  } catch (error) {
    console.error(`❌ Error updating product ${prod.id}:`, error.message);
  }
}

// Add metadata to prices
for (const price of PRICES) {
  try {
    execSync(`stripe prices update ${price.id} --metadata type=credit_package --metadata credits=${price.credits}`, { stdio: 'inherit' });
    console.log(`✅ Price ${price.id}: metadata added\n`);
  } catch (error) {
    console.error(`❌ Error updating price ${price.id}:`, error.message);
  }
}

console.log('✅ Metadata update complete!');
