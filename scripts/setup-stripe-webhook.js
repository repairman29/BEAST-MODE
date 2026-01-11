#!/usr/bin/env node

/**
 * Setup Stripe Webhook for BEAST MODE
 * 
 * Creates webhook endpoint and gets the signing secret
 */

const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`
  : 'https://beast-mode.dev/api/stripe/webhook';

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in .env.local');
  process.exit(1);
}

async function setupStripeWebhook() {
  console.log('\n🔗 Setting Up Stripe Webhook\n');
  console.log('='.repeat(60));
  
  console.log(`\n📡 Webhook URL: ${WEBHOOK_URL}`);
  console.log('\n📋 Events to listen for:');
  const events = [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
  ];
  
  events.forEach(event => {
    console.log(`   • ${event}`);
  });
  
  console.log('\n💡 To create webhook via Stripe CLI:');
  console.log(`\n   stripe webhooks create \\`);
  console.log(`     --url="${WEBHOOK_URL}" \\`);
  console.log(`     --enabled-events="${events.join(' ')}" \\`);
  console.log(`     --api-key=${STRIPE_SECRET_KEY.substring(0, 20)}...`);
  
  console.log('\n📋 Or create manually in Stripe Dashboard:');
  console.log('   1. Go to: https://dashboard.stripe.com/webhooks');
  console.log(`   2. Add endpoint: ${WEBHOOK_URL}`);
  console.log('   3. Select events:');
  events.forEach(event => {
    console.log(`      - ${event}`);
  });
  console.log('   4. Copy webhook signing secret (starts with whsec_)');
  console.log('   5. Add to .env.local: STRIPE_WEBHOOK_SECRET=whsec_...');
  console.log('   6. Add to Vercel environment variables\n');
  
  // Try to create via CLI
  try {
    console.log('🔄 Attempting to create webhook via CLI...\n');
    
    const cmd = `stripe webhooks create --url="${WEBHOOK_URL}" --enabled-events="${events.join(' ')}" --api-key=${STRIPE_SECRET_KEY}`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    const webhook = JSON.parse(output);
    
    console.log('✅ Webhook created successfully!');
    console.log(`\n📋 Webhook Details:`);
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Status: ${webhook.status}`);
    
    // Get signing secret
    try {
      const secretCmd = `stripe webhooks retrieve ${webhook.id} --api-key=${STRIPE_SECRET_KEY}`;
      const secretOutput = execSync(secretCmd, { encoding: 'utf8', stdio: 'pipe' });
      const webhookDetails = JSON.parse(secretOutput);
      
      // Get signing secret from webhook endpoint secrets
      console.log('\n🔑 To get signing secret:');
      console.log(`   stripe webhook_endpoints retrieve ${webhook.id} --api-key=${STRIPE_SECRET_KEY}`);
      console.log('\n   Or check in Stripe Dashboard → Webhooks → Click webhook → Signing secret');
      
    } catch (secretError) {
      console.log('\n⚠️  Could not retrieve signing secret automatically');
      console.log('   Get it from Stripe Dashboard → Webhooks → Signing secret');
    }
    
    console.log('\n📝 Add to .env.local:');
    console.log('   STRIPE_WEBHOOK_SECRET=whsec_...');
    console.log('\n📝 Add to Vercel environment variables\n');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Webhook may already exist');
      console.log('   Check existing webhooks: stripe webhooks list');
    } else {
      console.log('⚠️  Could not create webhook via CLI');
      console.log(`   Error: ${error.message}`);
      console.log('\n💡 Create manually in Stripe Dashboard (see instructions above)\n');
    }
  }
}

if (require.main === module) {
  setupStripeWebhook()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupStripeWebhook };
