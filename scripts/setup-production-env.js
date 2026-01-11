#!/usr/bin/env node

/**
 * Setup Production Environment Variables
 * 
 * Adds missing production environment variables to .env.local
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../website/.env.local');
const appUrl = 'https://beast-mode.dev';

function setupProductionEnv() {
  console.log('\n🔧 Setting Up Production Environment Variables\n');
  console.log('='.repeat(60));
  
  let envContent = '';
  let needsUpdate = false;
  
  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Found existing .env.local\n');
  } else {
    console.log('⚠️  .env.local not found, will create new file\n');
  }
  
  // Check if NEXT_PUBLIC_APP_URL exists
  if (!envContent.includes('NEXT_PUBLIC_APP_URL')) {
    console.log('➕ Adding NEXT_PUBLIC_APP_URL...');
    envContent += `\n# Production App URL\nNEXT_PUBLIC_APP_URL=${appUrl}\n`;
    needsUpdate = true;
  } else {
    // Check if it's set correctly
    const match = envContent.match(/NEXT_PUBLIC_APP_URL=(.+)/);
    if (match && match[1].trim() !== appUrl) {
      console.log(`⚠️  NEXT_PUBLIC_APP_URL exists but is set to: ${match[1].trim()}`);
      console.log(`   Should be: ${appUrl}`);
      console.log('   Please update manually if needed\n');
    } else {
      console.log(`✅ NEXT_PUBLIC_APP_URL already set to: ${appUrl}\n`);
    }
  }
  
  // Check if STRIPE_WEBHOOK_SECRET exists
  if (!envContent.includes('STRIPE_WEBHOOK_SECRET')) {
    console.log('➕ Adding STRIPE_WEBHOOK_SECRET placeholder...');
    envContent += `\n# Stripe Webhook Secret (get from Stripe dashboard after webhook setup)\n# STRIPE_WEBHOOK_SECRET=whsec_...\n`;
    needsUpdate = true;
    console.log('   ⚠️  You need to:');
    console.log('      1. Deploy to Vercel first');
    console.log('      2. Set up Stripe webhook in Stripe dashboard');
    console.log('      3. Copy webhook secret and add it here\n');
  } else {
    const match = envContent.match(/STRIPE_WEBHOOK_SECRET=(.+)/);
    if (match && match[1].trim().startsWith('#')) {
      console.log('⚠️  STRIPE_WEBHOOK_SECRET is commented out');
      console.log('   Uncomment and add the secret from Stripe dashboard\n');
    } else if (match && match[1].trim().startsWith('whsec_')) {
      console.log('✅ STRIPE_WEBHOOK_SECRET is set\n');
    } else {
      console.log('⚠️  STRIPE_WEBHOOK_SECRET exists but may not be valid');
      console.log('   Should start with "whsec_"\n');
    }
  }
  
  // Write updated content
  if (needsUpdate) {
    // Ensure directory exists
    const envDir = path.dirname(envPath);
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }
    
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log(`✅ Updated ${envPath}\n`);
  } else {
    console.log('✅ All environment variables are set\n');
  }
  
  console.log('='.repeat(60));
  console.log('\n📋 Next Steps:\n');
  console.log('1. Review .env.local file');
  console.log('2. Add STRIPE_WEBHOOK_SECRET after setting up Stripe webhook');
  console.log('3. Add all variables to Vercel environment variables');
  console.log('4. Deploy: vercel --prod --yes');
  console.log('5. Set up Stripe webhook in Stripe dashboard');
  console.log('6. Test end-to-end\n');
}

if (require.main === module) {
  setupProductionEnv();
}

module.exports = { setupProductionEnv };
