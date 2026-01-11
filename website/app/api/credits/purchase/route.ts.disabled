import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

/**
 * POST /api/credits/purchase
 * Create Stripe checkout session for credit purchase
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId, userId } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // Get price to verify it's a credit package
    const price = await stripe.prices.retrieve(priceId);
    
    if (!price.metadata?.type || price.metadata.type !== 'credit_package') {
      return NextResponse.json(
        { error: 'Invalid price - must be a credit package' },
        { status: 400 }
      );
    }

    const credits = parseInt(price.metadata.credits || '0');

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${NEXT_PUBLIC_URL}/dashboard/customer?tab=billing&credits=purchased`,
      cancel_url: `${NEXT_PUBLIC_URL}/dashboard/customer?tab=billing&credits=cancelled`,
      metadata: {
        userId,
        type: 'credit_purchase',
        credits: credits.toString(),
        priceId,
      },
      customer_email: body.email, // Optional: if provided
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      credits,
    });
  } catch (error: any) {
    console.error('Error creating credit purchase checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}
