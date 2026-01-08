import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Bug Tracking API
 * 
 * Tracks bugs per feature generation, bug rates, and trends
 */

let deliveryMetrics: any;
try {
  const deliveryMetricsModule = loadModule('../../../../../lib/mlops/deliveryMetrics') || 
                                 require('../../../../../lib/mlops/deliveryMetrics');
  deliveryMetrics = deliveryMetricsModule?.getDeliveryMetrics 
    ? deliveryMetricsModule.getDeliveryMetrics()
    : deliveryMetricsModule;
} catch (error) {
  console.warn('[Bug Tracking API] Delivery metrics module not available:', error);
}

/**
 * GET /api/delivery/bug-tracking
 * Get bug tracking metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    // For now, return mock data structure
    // TODO: Integrate with actual delivery metrics tracking
    const bugs = {
      total: 0,
      byFeature: [] as Array<{ feature: string; bugs: number; rate: number }>,
      byCategory: {
        syntax: 0,
        logic: 0,
        performance: 0,
        security: 0,
        other: 0
      },
      trends: [] as Array<{ date: string; count: number; rate: number }>,
      averageRate: 0
    };

    // If delivery metrics module is available, use it
    if (deliveryMetrics && typeof deliveryMetrics.getBugMetrics === 'function') {
      const metrics = await deliveryMetrics.getBugMetrics(userId, timeRange);
      return NextResponse.json({
        success: true,
        bugs: metrics,
        timeRange
      });
    }

    // Return structure for now (will be populated as bugs are tracked)
    return NextResponse.json({
      success: true,
      bugs,
      timeRange
    });

  } catch (error: any) {
    console.error('[Bug Tracking API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get bug tracking data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/delivery/bug-tracking
 * Record a bug
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureId, bugType, description, severity } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!featureId || !bugType) {
      return NextResponse.json(
        { error: 'featureId and bugType are required' },
        { status: 400 }
      );
    }

    // Record bug
    // TODO: Store in database
    const bug = {
      id: `bug-${Date.now()}`,
      featureId,
      bugType,
      description,
      severity: severity || 'medium',
      userId,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      bug
    });

  } catch (error: any) {
    console.error('[Bug Tracking API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to record bug', details: error.message },
      { status: 500 }
    );
  }
}
