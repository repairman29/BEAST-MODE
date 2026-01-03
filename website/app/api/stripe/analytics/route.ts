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
 * Stripe Analytics API
 * 
 * Fetches revenue and subscription analytics from Stripe
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';

    // Get Stripe secret key from unified config
    const stripeSecretKey = await getConfigValue('STRIPE_SECRET_KEY', null);
    
    // Check if Stripe is configured
    if (!stripeSecretKey) {
      // Return mock data if Stripe not configured
      return NextResponse.json({
        totalRevenue: 8750,
        monthlyRevenue: 1250,
        subscriptions: {
          active: 12,
          canceled: 2,
          trialing: 1
        },
        revenueByType: {
          subscriptions: 7500,
          one_time: 1250
        },
        topEarningPlugins: [
          ['eslint-pro', 2500],
          ['typescript-guardian', 1800],
          ['security-scanner', 1500],
          ['prettier-integration', 1200],
          ['test-coverage', 750]
        ],
        growthRate: 12.5,
        projections: {
          nextMonth: 1400,
          nextQuarter: 4500,
          nextYear: 18000
        },
        recentTransactions: [],
        note: 'Stripe not configured - showing mock data'
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });

    // Calculate date range
    const now = Math.floor(Date.now() / 1000);
    let startDate: number;
    switch (timeframe) {
      case '7d':
        startDate = now - (7 * 24 * 60 * 60);
        break;
      case '30d':
        startDate = now - (30 * 24 * 60 * 60);
        break;
      case '90d':
        startDate = now - (90 * 24 * 60 * 60);
        break;
      case '1y':
        startDate = now - (365 * 24 * 60 * 60);
        break;
      default:
        startDate = now - (30 * 24 * 60 * 60);
    }

    // Fetch subscriptions
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      created: { gte: startDate }
    });

    // Fetch payment intents (one-time payments)
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      created: { gte: startDate }
    });

    // Calculate metrics
    let totalRevenue = 0;
    let subscriptionRevenue = 0;
    let oneTimeRevenue = 0;
    const activeSubscriptions = subscriptions.data.filter(s => s.status === 'active').length;
    const canceledSubscriptions = subscriptions.data.filter(s => s.status === 'canceled').length;
    const trialingSubscriptions = subscriptions.data.filter(s => s.status === 'trialing').length;

    // Calculate subscription revenue
    subscriptions.data.forEach(sub => {
      if (sub.status === 'active' || sub.status === 'trialing') {
        const amount = sub.items.data.reduce((sum, item) => {
          if (item.price.unit_amount) {
            return sum + item.price.unit_amount;
          }
          return sum;
        }, 0);
        subscriptionRevenue += amount;
        totalRevenue += amount;
      }
    });

    // Calculate one-time payment revenue
    paymentIntents.data.forEach(pi => {
      if (pi.status === 'succeeded' && pi.amount) {
        oneTimeRevenue += pi.amount;
        totalRevenue += pi.amount;
      }
    });

    // Convert from cents to dollars
    totalRevenue = totalRevenue / 100;
    subscriptionRevenue = subscriptionRevenue / 100;
    oneTimeRevenue = oneTimeRevenue / 100;

    // Calculate monthly recurring revenue (MRR)
    const monthlyRevenue = subscriptionRevenue;

    // Calculate growth rate (simplified - compare to previous period)
    const previousStartDate = startDate - (now - startDate);
    const previousSubscriptions = await stripe.subscriptions.list({
      limit: 100,
      created: { gte: previousStartDate, lt: startDate }
    });
    
    let previousRevenue = 0;
    previousSubscriptions.data.forEach(sub => {
      if (sub.status === 'active' || sub.status === 'trialing') {
        const amount = sub.items.data.reduce((sum, item) => {
          if (item.price.unit_amount) {
            return sum + item.price.unit_amount;
          }
          return sum;
        }, 0);
        previousRevenue += amount;
      }
    });
    previousRevenue = previousRevenue / 100;

    const growthRate = previousRevenue > 0 
      ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // Get recent transactions
    const recentTransactions = paymentIntents.data
      .slice(0, 10)
      .map(pi => ({
        id: pi.id,
        amount: pi.amount ? pi.amount / 100 : 0,
        currency: pi.currency,
        status: pi.status,
        created: pi.created,
        description: pi.description || 'Payment'
      }));

    // Projections (simple linear projection)
    const projections = {
      nextMonth: monthlyRevenue * 1.1, // 10% growth
      nextQuarter: monthlyRevenue * 3.3, // 3 months with growth
      nextYear: monthlyRevenue * 12 * 1.2 // Annual with 20% growth
    };

    return NextResponse.json({
      totalRevenue,
      monthlyRevenue,
      subscriptions: {
        active: activeSubscriptions,
        canceled: canceledSubscriptions,
        trialing: trialingSubscriptions
      },
      revenueByType: {
        subscriptions: subscriptionRevenue,
        one_time: oneTimeRevenue
      },
      topEarningPlugins: [], // Would need metadata tracking for this
      growthRate,
      projections,
      recentTransactions
    });

  } catch (error: any) {
    console.error('Stripe analytics error:', error);
    
    // Return mock data on error
    return NextResponse.json({
      totalRevenue: 8750,
      monthlyRevenue: 1250,
      subscriptions: {
        active: 12,
        canceled: 2,
        trialing: 1
      },
      revenueByType: {
        subscriptions: 7500,
        one_time: 1250
      },
      topEarningPlugins: [
        ['eslint-pro', 2500],
        ['typescript-guardian', 1800],
        ['security-scanner', 1500]
      ],
      growthRate: 12.5,
      projections: {
        nextMonth: 1400,
        nextQuarter: 4500,
        nextYear: 18000
      },
      recentTransactions: [],
      note: 'Error fetching Stripe data - showing mock data',
      error: error.message
    });
  }
}

