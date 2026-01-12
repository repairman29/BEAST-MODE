#!/usr/bin/env node

/**
 * Rotate Stripe Webhook Secret
 * Creates a new webhook endpoint and provides the new secret
 */

require('dotenv').config({ path: require('path').join(__dirname, '../website/.env.local') });

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

async function rotateWebhookSecret() {
  console.log('🔄 Rotating Stripe Webhook Secret\n');
  console.log('======================================================================\n');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not set in environment');
    console.error('   Set it in .env.local or export it');
    process.exit(1);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });

  try {
    // Find existing webhook
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const beastModeWebhook = webhooks.data.find(w => 
      w.url && (w.url.includes('beast-mode.dev') || w.url.includes('api/stripe/webhook'))
    );

    if (!beastModeWebhook) {
      console.log('⚠️  No existing webhook found. Creating new one...\n');
      
      // Create new webhook
      const newWebhook = await stripe.webhookEndpoints.create({
        url: 'https://beast-mode.dev/api/stripe/webhook',
        description: 'BEAST MODE - Subscription and payment webhooks',
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed',
          'payment_intent.succeeded',
        ],
      });

      console.log('✅ Created new webhook endpoint\n');
      console.log('======================================================================\n');
      console.log('📋 New Webhook Details:');
      console.log(`   ID: ${newWebhook.id}`);
      console.log(`   URL: ${newWebhook.url}`);
      console.log(`   Status: ${newWebhook.status}\n`);
      console.log('🔑 NEW WEBHOOK SECRET:');
      console.log(`   ${newWebhook.secret}\n`);
      console.log('======================================================================\n');
      console.log('📝 Next Steps:');
      console.log('   1. Update STRIPE_WEBHOOK_SECRET in Vercel:');
      console.log(`      vercel env add STRIPE_WEBHOOK_SECRET production --yes`);
      console.log(`      (When prompted, paste: ${newWebhook.secret})\n`);
      console.log('   2. Delete old webhook in Stripe Dashboard (if exists)');
      console.log('   3. Redeploy: cd website && vercel --prod --yes\n');
      
      return newWebhook.secret;
    }

    console.log(`📋 Found existing webhook: ${beastModeWebhook.id}\n`);
    console.log('🔄 Creating new webhook endpoint...\n');

    // Create new webhook with same configuration
    const newWebhook = await stripe.webhookEndpoints.create({
      url: beastModeWebhook.url,
      description: beastModeWebhook.description || 'BEAST MODE - Subscription and payment webhooks',
      enabled_events: beastModeWebhook.enabled_events,
    });

    console.log('✅ Created new webhook endpoint\n');
    console.log('======================================================================\n');
    console.log('📋 New Webhook Details:');
    console.log(`   ID: ${newWebhook.id}`);
    console.log(`   URL: ${newWebhook.url}`);
    console.log(`   Status: ${newWebhook.status}\n`);
    console.log('🔑 NEW WEBHOOK SECRET:');
    console.log(`   ${newWebhook.secret}\n`);
    console.log('======================================================================\n');

    // Optionally delete old webhook
    console.log('🗑️  Deleting old webhook...\n');
    await stripe.webhookEndpoints.del(beastModeWebhook.id);
    console.log('✅ Old webhook deleted\n');

    console.log('📝 Next Steps:');
    console.log('   1. Update STRIPE_WEBHOOK_SECRET in Vercel:');
    console.log(`      vercel env add STRIPE_WEBHOOK_SECRET production --yes`);
    console.log(`      (When prompted, paste: ${newWebhook.secret})\n`);
    console.log('   2. Redeploy: cd website && vercel --prod --yes\n');

    return newWebhook.secret;
  } catch (error) {
    if (error.type === 'StripeAuthenticationError') {
      console.error('❌ Invalid Stripe API key');
      console.error('   Set STRIPE_SECRET_KEY in .env.local');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  rotateWebhookSecret().catch(console.error);
}

module.exports = { rotateWebhookSecret };
