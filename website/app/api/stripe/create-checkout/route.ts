import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Use unified config if available
let getUnifiedConfig: any = null;
try {
  const path = require('path');
  const configPath = path.join(process.cwd(), '../../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

// Helper function to get config value (TypeScript compatible)
async function getConfigValue(key: string, defaultValue: string | null = null): Promise<string | null> {
  if (getUnifiedConfig) {
    try {
      const config = await getUnifiedConfig();
      const value = config.get(key);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    } catch (error) {
      // Fallback to process.env
    }
  }
  // Fallback to process.env for backward compatibility
  return process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : defaultValue;
}

/**
 * Stripe Checkout Session Creation
 * 
 * Creates a Stripe checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Plan pricing (in cents) - Updated to match monetization strategy
    const plans: Record<string, { price: number; tier: string }> = {
      pro: { price: 1900, tier: 'pro' }, // $19/month
      team: { price: 9900, tier: 'team' }, // $99/month
      enterprise: { price: 49900, tier: 'enterprise' }, // $499/month (starts at)
      // Legacy plans
      developer: { price: 1900, tier: 'pro' }, // Maps to pro
    };

    const plan = plans[planId];
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan ID. Use: pro, team, or enterprise' },
        { status: 400 }
      );
    }

    // Get config values
    const stripeSecretKey = await getConfigValue('STRIPE_SECRET_KEY', null);
    const nextPublicUrl = await getConfigValue('NEXT_PUBLIC_URL', 'http://localhost:7777');
    const baseUrl = nextPublicUrl || 'http://localhost:7777';

    // Check if Stripe is configured
    if (!stripeSecretKey) {
      return NextResponse.json(
        { 
          error: 'Stripe not configured',
          message: 'STRIPE_SECRET_KEY is missing from environment variables'
        },
        { status: 500 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });
    
    // Get user ID from request (if available)
    const userId = request.headers.get('x-user-id') || 
                   (await request.json().catch(() => ({}))).userId || 
                   null;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `BEAST MODE ${plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)} Plan`,
            description: `BEAST MODE ${plan.tier} subscription - Unlimited PR analysis, advanced features, and more`,
          },
          unit_amount: plan.price,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        planId: planId,
        tier: plan.tier,
        userId: userId || '',
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Subscription data
      subscription_data: {
        metadata: {
          tier: plan.tier,
          userId: userId || '',
        },
      },
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}

