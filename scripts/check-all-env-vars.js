#!/usr/bin/env node

/**
 * Check All Environment Variables
 * 
 * Verifies all required environment variables are set
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const requiredVars = {
  supabase: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ],
  stripe: [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PRICE_100_CREDITS',
    'NEXT_PUBLIC_STRIPE_PRICE_500_CREDITS',
    'NEXT_PUBLIC_STRIPE_PRICE_1000_CREDITS',
    'NEXT_PUBLIC_STRIPE_PRICE_5000_CREDITS',
    'NEXT_PUBLIC_STRIPE_PRICE_10000_CREDITS'
  ],
  github: [
    'GITHUB_APP_ID',
    'GITHUB_APP_PRIVATE_KEY',
    'GITHUB_WEBHOOK_SECRET'
  ],
  app: [
    'NEXT_PUBLIC_APP_URL',
    'NODE_ENV'
  ]
};

function checkEnvVars() {
  console.log('\n🔍 Checking All Environment Variables\n');
  console.log('='.repeat(70));
  console.log();
  
  const results = {};
  let totalRequired = 0;
  let totalFound = 0;
  
  for (const [category, vars] of Object.entries(requiredVars)) {
    console.log(`📦 ${category.toUpperCase()}:`);
    console.log();
    
    results[category] = {};
    
    for (const varName of vars) {
      totalRequired++;
      const value = process.env[varName];
      const isSet = !!value;
      const isSecret = varName.includes('KEY') || varName.includes('SECRET') || varName.includes('PRIVATE');
      
      if (isSet) {
        totalFound++;
        const displayValue = isSecret 
          ? `${value.substring(0, 10)}...${value.substring(value.length - 4)} (${value.length} chars)`
          : value;
        console.log(`   ✅ ${varName}`);
        console.log(`      ${displayValue}`);
        results[category][varName] = { set: true, value: displayValue };
      } else {
        console.log(`   ❌ ${varName}: NOT SET`);
        results[category][varName] = { set: false };
      }
      console.log();
    }
  }
  
  // Summary
  console.log('='.repeat(70));
  console.log('\n📊 Summary:\n');
  
  for (const [category, vars] of Object.entries(results)) {
    const found = Object.values(vars).filter(v => v.set).length;
    const total = Object.keys(vars).length;
    const percentage = Math.round(found / total * 100);
    const status = found === total ? '✅' : found > 0 ? '⚠️' : '❌';
    
    console.log(`   ${status} ${category.toUpperCase()}: ${found}/${total} (${percentage}%)`);
  }
  
  const overallPercentage = Math.round(totalFound / totalRequired * 100);
  console.log(`\n   📈 Overall: ${totalFound}/${totalRequired} (${overallPercentage}%)`);
  
  // Missing vars
  const missing = [];
  for (const [category, vars] of Object.entries(results)) {
    for (const [varName, info] of Object.entries(vars)) {
      if (!info.set) {
        missing.push({ category, varName });
      }
    }
  }
  
  if (missing.length > 0) {
    console.log('\n⚠️  Missing Variables:\n');
    for (const { category, varName } of missing) {
      console.log(`   • ${category.toUpperCase()}: ${varName}`);
    }
    console.log();
  }
  
  // Recommendations
  console.log('💡 Recommendations:\n');
  if (missing.some(m => m.category === 'supabase')) {
    console.log('   • Set Supabase vars in website/.env.local');
    console.log('   • Get from Supabase dashboard → Settings → API\n');
  }
  if (missing.some(m => m.category === 'stripe')) {
    console.log('   • Set Stripe vars in website/.env.local');
    console.log('   • Get from Stripe dashboard → Developers → API keys');
    console.log('   • Create credit products and get price IDs\n');
  }
  if (missing.some(m => m.category === 'github')) {
    console.log('   • Set GitHub App vars in website/.env.local');
    console.log('   • Get from GitHub App settings\n');
  }
  
  return results;
}

if (require.main === module) {
  checkEnvVars();
}

module.exports = { checkEnvVars };
