#!/usr/bin/env node
/**
 * Check Stripe Webhooks
 * Lists existing webhooks and helps identify BEAST MODE webhook
 */

require('dotenv').config({ path: require('path').join(__dirname, '../website/.env.local') });

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

async function checkWebhooks() {
  console.log('🔍 Checking Stripe Webhooks\n');
  console.log('======================================================================\n');

  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    
    if (webhooks.data.length === 0) {
      console.log('❌ No webhooks found\n');
      console.log('💡 Create one at: https://dashboard.stripe.com/acct_1So8HhHftdvxqEbU/workbench/webhooks\n');
      console.log('📋 Steps:');
      console.log('   1. Click "Add endpoint"');
      console.log('   2. URL: https://beast-mode.dev/api/stripe/webhook');
      console.log('   3. Select required events');
      console.log('   4. Save and get signing secret\n');
      return;
    }

    console.log(`📋 Found ${webhooks.data.length} webhook(s):\n`);
    
    webhooks.data.forEach((w, i) => {
      console.log(`${i + 1}. ${w.url}`);
      console.log(`   ID: ${w.id}`);
      console.log(`   Status: ${w.status}`);
      console.log(`   Events: ${w.enabled_events.length} events`);
      if (w.description) {
        console.log(`   Description: ${w.description}`);
      }
      console.log('');
    });
    
    const beastModeWebhook = webhooks.data.find(w => 
      w.url.includes('beast-mode.dev') || 
      w.url.includes('api/stripe/webhook') ||
      (w.description && w.description.includes('BEAST MODE'))
    );
    
    if (beastModeWebhook) {
      console.log('✅ Found BEAST MODE webhook!\n');
      console.log('======================================================================\n');
      console.log('📋 Webhook Details:');
      console.log(`   URL: ${beastModeWebhook.url}`);
      console.log(`   ID: ${beastModeWebhook.id}`);
      console.log(`   Status: ${beastModeWebhook.status}`);
      console.log(`   Events: ${beastModeWebhook.enabled_events.join(', ')}\n`);
      
      const requiredEvents = [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'payment_intent.succeeded'
      ];
      
      const missingEvents = requiredEvents.filter(e => !beastModeWebhook.enabled_events.includes(e));
      
      if (missingEvents.length > 0) {
        console.log('⚠️  Missing events:');
        missingEvents.forEach(e => console.log(`   • ${e}`));
        console.log('\n💡 Update webhook to include all required events\n');
      } else {
        console.log('✅ All required events are configured\n');
      }
      
      console.log('📋 To get signing secret:');
      console.log('   1. Go to: https://dashboard.stripe.com/acct_1So8HhHftdvxqEbU/workbench/webhooks');
      console.log(`   2. Click on webhook: ${beastModeWebhook.id}`);
      console.log('   3. Click "Reveal" next to "Signing secret"');
      console.log('   4. Copy the whsec_... value\n');
      
      const currentSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (currentSecret) {
        console.log('💡 Current secret in .env.local:');
        console.log(`   ${currentSecret.substring(0, 20)}...`);
        console.log('\n⚠️  Verify this matches the secret from Stripe dashboard\n');
      }
    } else {
      console.log('⚠️  No BEAST MODE webhook found\n');
      console.log('💡 Create one at: https://dashboard.stripe.com/acct_1So8HhHftdvxqEbU/workbench/webhooks\n');
      console.log('📋 Steps:');
      console.log('   1. Click "Add endpoint"');
      console.log('   2. Endpoint URL: https://beast-mode.dev/api/stripe/webhook');
      console.log('   3. Description: BEAST MODE - Subscription and payment webhooks');
      console.log('   4. Select events:');
      console.log('      • checkout.session.completed');
      console.log('      • customer.subscription.created');
      console.log('      • customer.subscription.updated');
      console.log('      • customer.subscription.deleted');
      console.log('      • invoice.payment_succeeded');
      console.log('      • invoice.payment_failed');
      console.log('      • payment_intent.succeeded');
      console.log('   5. Click "Add endpoint"');
      console.log('   6. Get signing secret and update .env.local\n');
    }
    
  } catch (error) {
    if (error.type === 'StripeAuthenticationError') {
      console.log('⚠️  Invalid API key - cannot check webhooks via API\n');
      console.log('💡 Check webhooks manually at:');
      console.log('   https://dashboard.stripe.com/acct_1So8HhHftdvxqEbU/workbench/webhooks\n');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

checkWebhooks().catch(console.error);
