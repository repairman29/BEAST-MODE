import { NextRequest, NextResponse } from 'next/server';

/**
 * Custom Models Monitoring API
 * 
 * Get metrics and health status for custom models
 */

// Dynamic require for Node.js modules
let customModelMonitoring: any;
try {
  customModelMonitoring = require('../../../../../../lib/mlops/customModelMonitoring');
} catch (error) {
  console.error('[Monitoring API] Failed to load modules:', error);
}

/**
 * GET /api/models/custom/monitoring
 * Get custom model metrics and health status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('timeRange') || '7d';
  try {
    if (!customModelMonitoring) {
      return NextResponse.json(
        { error: 'Monitoring not available' },
        { status: 500 }
      );
    }

    const { getCustomModelMonitoring } = customModelMonitoring;
    const monitoring = getCustomModelMonitoring();

    const metrics = monitoring.getMetrics();
    const health = monitoring.getHealthStatus();

    return NextResponse.json({
      success: true,
      metrics,
      health,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Monitoring API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get monitoring data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/models/custom/monitoring/reset
 * Reset metrics (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reset') {
      if (!customModelMonitoring) {
        return NextResponse.json(
          { error: 'Monitoring not available' },
          { status: 500 }
        );
      }

      const { getCustomModelMonitoring } = customModelMonitoring;
      const monitoring = getCustomModelMonitoring();
      monitoring.reset();

      return NextResponse.json({
        success: true,
        message: 'Metrics reset'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Monitoring API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reset metrics', details: error.message },
      { status: 500 }
    );
  }
}
