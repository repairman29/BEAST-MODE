#!/usr/bin/env node
/**
 * Setup Stripe Webhook Endpoint
 * Creates webhook endpoint in Stripe and outputs the signing secret
 */

require('dotenv').config({ path: require('path').join(__dirname, '../website/.env.local') });

const Stripe = require('stripe');
const readline = require('readline');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupWebhook() {
  console.log('🔧 Stripe Webhook Setup\n');
  console.log('======================================================================\n');

  // Determine webhook URL
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`
    : 'https://beast-mode.dev/api/stripe/webhook';

  console.log(`📋 Webhook URL: ${webhookUrl}\n`);

  // Check for existing webhooks
  console.log('🔍 Checking for existing webhooks...\n');
  const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
  
  const existing = webhooks.data.find(w => w.url === webhookUrl);
  
  if (existing) {
    console.log(`✅ Found existing webhook: ${existing.id}`);
    console.log(`   URL: ${existing.url}`);
    console.log(`   Status: ${existing.status}`);
    console.log(`   Events: ${existing.enabled_events.length} events\n`);
    
    const answer = await question('Webhook exists. Do you want to:\n  1. Use existing (get secret)\n  2. Create new\n  3. Update existing\nChoice (1/2/3): ');
    
    if (answer === '1') {
      console.log('\n📋 To get the signing secret:');
      console.log('   1. Go to: https://dashboard.stripe.com/webhooks');
      console.log(`   2. Click on webhook: ${existing.id}`);
      console.log('   3. Click "Reveal" next to "Signing secret"');
      console.log(`   4. Add to .env.local: STRIPE_WEBHOOK_SECRET=whsec_...\n`);
      rl.close();
      return;
    } else if (answer === '3') {
      // Update existing
      await updateWebhook(existing.id, webhookUrl);
      rl.close();
      return;
    }
    // Otherwise create new
  }

  // Create new webhook
  console.log('📝 Creating new webhook endpoint...\n');
  
  const events = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'payment_intent.succeeded',
  ];

  console.log('📋 Events to subscribe to:');
  events.forEach(e => console.log(`   • ${e}`));
  console.log('');

  try {
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: events,
      description: 'BEAST MODE - Subscription and payment webhooks',
    });

    console.log('✅ Webhook created successfully!\n');
    console.log('======================================================================\n');
    console.log('📋 Webhook Details:');
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Status: ${webhook.status}`);
    console.log(`   Events: ${webhook.enabled_events.length} events\n`);
    console.log('🔑 Signing Secret:');
    console.log(`   ${webhook.secret}\n`);
    console.log('======================================================================\n');
    console.log('⚠️  IMPORTANT: Save this secret!\n');
    console.log('Add to .env.local:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}\n`);
    console.log('Add to Vercel:');
    console.log(`vercel env add STRIPE_WEBHOOK_SECRET production`);
    console.log(`# Then paste: ${webhook.secret}\n`);

  } catch (error) {
    console.error('❌ Error creating webhook:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 Webhook URL already exists. Use existing webhook or delete it first.');
    }
  }

  rl.close();
}

async function updateWebhook(webhookId, webhookUrl) {
  console.log('📝 Updating webhook endpoint...\n');
  
  const events = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'payment_intent.succeeded',
  ];

  try {
    const webhook = await stripe.webhookEndpoints.update(webhookId, {
      enabled_events: events,
      description: 'BEAST MODE - Subscription and payment webhooks',
    });

    console.log('✅ Webhook updated successfully!\n');
    console.log('📋 To get the signing secret:');
    console.log('   1. Go to: https://dashboard.stripe.com/webhooks');
    console.log(`   2. Click on webhook: ${webhookId}`);
    console.log('   3. Click "Reveal" next to "Signing secret"\n');
  } catch (error) {
    console.error('❌ Error updating webhook:', error.message);
  }
}

setupWebhook().catch(console.error);
