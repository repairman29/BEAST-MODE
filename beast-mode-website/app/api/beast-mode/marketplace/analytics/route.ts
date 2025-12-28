import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Marketplace Analytics API
 *
 * Provides comprehensive analytics for marketplace usage, revenue, and user behavior
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';
    const metrics = searchParams.get('metrics')?.split(',') || [];

    // Check if marketplace is available
    if (!global.beastMode || !global.beastMode.marketplace) {
      return NextResponse.json(
        { error: 'Marketplace not available' },
        { status: 503 }
      );
    }

    // Get analytics from marketplace
    const analytics = await global.beastMode.marketplace.getAnalytics(timeframe, metrics);

    return NextResponse.json({
      analytics,
      timestamp: new Date().toISOString(),
      marketplace: {
        totalPlugins: global.beastMode.marketplace.availablePlugins?.size || 0,
        totalRevenue: global.beastMode.marketplace.totalRevenue || 0,
        monthlyRevenue: global.beastMode.marketplace.monthlyRevenue || 0
      }
    });

  } catch (error) {
    console.error('Marketplace Analytics API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve marketplace analytics',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for tracking marketplace events
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, action, data = {} } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    // Check if marketplace is available
    if (!global.beastMode || !global.beastMode.marketplace) {
      return NextResponse.json(
        { error: 'Marketplace not available' },
        { status: 503 }
      );
    }

    // Track the usage event
    global.beastMode.marketplace.trackUsage(userId, action, data);

    return NextResponse.json({
      success: true,
      message: `Tracked ${action} event for user ${userId}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Marketplace Tracking API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to track marketplace event',
        details: error.message
      },
      { status: 500 }
    );
  }
}
