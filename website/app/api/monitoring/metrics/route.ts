import { NextRequest, NextResponse } from 'next/server';

/**
 * Monitoring Metrics API
 * 
 * Provides production monitoring metrics
 * 
 * Phase 1: Production Deployment
 */

// Optional: Production monitor not available in current build
let monitor: any = null;
try {
  const { getProductionMonitor } = require('../../../../../lib/monitoring/productionMonitor');
  monitor = getProductionMonitor();
} catch (error) {
  // Production monitor not available
}

export async function GET(request: NextRequest) {
  try {
    if (!monitor) {
      return NextResponse.json({
        status: 'ok',
        data: {
          message: 'Production monitor not available',
          summary: {},
          health: { status: 'unknown' }
        },
        timestamp: new Date().toISOString()
      });
    }

    await monitor.initialize();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';

    if (type === 'summary') {
      const summary = monitor.getMetricsSummary();
      return NextResponse.json({
        status: 'ok',
        data: summary,
        timestamp: new Date().toISOString()
      });
    }

    if (type === 'health') {
      const health = monitor.getHealthStatus();
      return NextResponse.json({
        status: 'ok',
        data: health,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Monitoring metrics API ready',
      types: ['summary', 'health'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

