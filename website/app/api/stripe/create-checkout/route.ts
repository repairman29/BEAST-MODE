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

    // Plan pricing (in cents)
    const plans: Record<string, number> = {
      developer: 2900, // $29/month
      team: 9900, // $99/month
      enterprise: 29900 // $299/month
    };

    const priceId = plans[planId];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
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
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `BEAST MODE ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
            description: `BEAST MODE ${planId} subscription plan`,
          },
          unit_amount: priceId,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?canceled=true`,
      metadata: {
        planId: planId,
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

