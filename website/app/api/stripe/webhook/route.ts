import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe subscription events:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Subscription changed (upgrade/downgrade)
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_succeeded: Payment successful
 * - invoice.payment_failed: Payment failed
 */

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('[Stripe Webhook] Missing Stripe configuration');
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  });

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Stripe Webhook] No signature provided');
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error('[Stripe Webhook] Signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // Check if this is a credit purchase (one-time payment)
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'payment' && session.metadata?.type === 'credit_purchase') {
          await handleCreditPurchase(session, supabase);
        } else {
          // Regular subscription checkout
          await handleCheckoutSessionCompleted(session, supabase);
        }
        break;

      case 'payment_intent.succeeded':
        // Handle successful one-time payment (credit purchase)
        const paymentIntentData = event.data.object as Stripe.PaymentIntent;
        if (paymentIntentData.metadata?.type === 'credit_purchase') {
          await handleCreditPurchasePaymentIntent(paymentIntentData, supabase);
        }
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error processing event:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle credit purchase (one-time payment)
 */
async function handleCreditPurchase(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  console.log(`[Stripe Webhook] Credit purchase completed: ${session.id}`);

  const userId = session.metadata?.userId;
  const credits = parseInt(session.metadata?.credits || '0', 10);

  if (!userId || !credits) {
    console.error('[Stripe Webhook] Missing userId or credits in credit purchase');
    return;
  }

  // Add credits to user's balance using the database function
  const { error } = await supabase.rpc('add_credits_to_user', {
    p_user_id: userId,
    p_credits: credits
  });

  if (error) {
    console.error('[Stripe Webhook] Error adding credits:', error);
    return;
  }

  // Record the purchase
  await supabase
    .from('credit_purchases')
    .insert({
      user_id: userId,
      credits: credits,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_checkout_session_id: session.id,
      status: 'completed',
      purchased_at: new Date().toISOString()
    });

  console.log(`[Stripe Webhook] Added ${credits} credits to user ${userId}`);
}

/**
 * Handle credit purchase via payment intent (alternative flow)
 */
async function handleCreditPurchasePaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  console.log(`[Stripe Webhook] Credit purchase payment intent: ${paymentIntent.id}`);

  const userId = paymentIntent.metadata?.userId;
  const credits = parseInt(paymentIntent.metadata?.credits || '0', 10);

  if (!userId || !credits) {
    console.error('[Stripe Webhook] Missing userId or credits in payment intent');
    return;
  }

  // Add credits to user's balance using the database function
  const { error } = await supabase.rpc('add_credits_to_user', {
    p_user_id: userId,
    p_credits: credits
  });

  if (error) {
    console.error('[Stripe Webhook] Error adding credits:', error);
    return;
  }

  // Record the purchase
  await supabase
    .from('credit_purchases')
    .insert({
      user_id: userId,
      credits: credits,
      amount: paymentIntent.amount ? paymentIntent.amount / 100 : 0,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'completed',
      purchased_at: new Date().toISOString()
    });

  console.log(`[Stripe Webhook] Added ${credits} credits to user ${userId} via payment intent`);
}

/**
 * Handle checkout.session.completed
 * New subscription created - activate user's subscription
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  console.log(`[Stripe Webhook] Checkout completed: ${session.id}`);

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const planId = session.metadata?.planId || 'pro';
  const userId = session.metadata?.userId;

  if (!customerId || !subscriptionId) {
    console.error('[Stripe Webhook] Missing customer or subscription ID');
    return;
  }

  // Get subscription details from Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  });

  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
  const priceId = subscription.items.data[0]?.price.id;

  // Map planId to tier
  const tierMap: Record<string, string> = {
    pro: 'pro',
    team: 'team',
    enterprise: 'enterprise',
    developer: 'pro' // Legacy mapping
  };
  const tier = tierMap[planId] || 'pro';

  // If userId provided, update subscription directly
  if (userId) {
    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        tier,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        status: subscription.status === 'active' ? 'active' : 'trialing',
        current_period_start: (subscription as any).current_period_start 
          ? new Date(((subscription as any).current_period_start as number) * 1000).toISOString()
          : new Date().toISOString(),
        current_period_end: (subscription as any).current_period_end
          ? new Date(((subscription as any).current_period_end as number) * 1000).toISOString()
          : new Date().toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    console.log(`[Stripe Webhook] Subscription activated for user ${userId}: ${tier}`);
    return;
  }

  // If no userId, try to find by customer ID
  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (existing) {
    await supabase
      .from('user_subscriptions')
      .update({
        tier,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        status: subscription.status === 'active' ? 'active' : 'trialing',
        current_period_start: (subscription as any).current_period_start 
          ? new Date(((subscription as any).current_period_start as number) * 1000).toISOString()
          : new Date().toISOString(),
        current_period_end: (subscription as any).current_period_end
          ? new Date(((subscription as any).current_period_end as number) * 1000).toISOString()
          : new Date().toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', existing.user_id);

    console.log(`[Stripe Webhook] Subscription updated for user ${existing.user_id}: ${tier}`);
  } else {
    console.warn(`[Stripe Webhook] No user found for customer ${customerId}`);
  }
}

/**
 * Handle customer.subscription.updated
 * Subscription changed (upgrade/downgrade, status change)
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log(`[Stripe Webhook] Subscription updated: ${subscription.id}`);

  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  // Determine tier from price ID or metadata
  // TODO: Map price IDs to tiers (set up in Stripe dashboard)
  const tier = subscription.metadata?.tier || 'pro';

  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!existing) {
    console.warn(`[Stripe Webhook] No subscription found for customer ${customerId}`);
    return;
  }

  await supabase
    .from('user_subscriptions')
    .update({
      tier,
      stripe_price_id: priceId,
      status: subscription.status === 'active' ? 'active' : 
              subscription.status === 'trialing' ? 'trialing' :
              subscription.status === 'past_due' ? 'past_due' : 'canceled',
      current_period_start: (subscription as any).current_period_start
        ? new Date(((subscription as any).current_period_start as number) * 1000).toISOString()
        : new Date().toISOString(),
      current_period_end: (subscription as any).current_period_end
        ? new Date(((subscription as any).current_period_end as number) * 1000).toISOString()
        : new Date().toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', existing.user_id);

  console.log(`[Stripe Webhook] Subscription updated for user ${existing.user_id}: ${tier} (${subscription.status})`);
}

/**
 * Handle customer.subscription.deleted
 * Subscription canceled - downgrade to free tier
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log(`[Stripe Webhook] Subscription deleted: ${subscription.id}`);

  const customerId = subscription.customer as string;

  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!existing) {
    console.warn(`[Stripe Webhook] No subscription found for customer ${customerId}`);
    return;
  }

  await supabase
    .from('user_subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', existing.user_id);

  console.log(`[Stripe Webhook] Subscription canceled for user ${existing.user_id} - downgraded to free`);
}

/**
 * Handle invoice.payment_succeeded
 * Payment successful - ensure subscription is active
 */
async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log(`[Stripe Webhook] Payment succeeded: ${invoice.id}`);

  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return; // One-time payment, not subscription
  }

  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (existing) {
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', existing.user_id);

    console.log(`[Stripe Webhook] Payment succeeded - subscription active for user ${existing.user_id}`);
  }
}

/**
 * Handle invoice.payment_failed
 * Payment failed - mark subscription as past_due
 */
async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log(`[Stripe Webhook] Payment failed: ${invoice.id}`);

  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (existing) {
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', existing.user_id);

    console.log(`[Stripe Webhook] Payment failed - subscription past_due for user ${existing.user_id}`);
  }
}
