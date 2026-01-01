import { NextRequest, NextResponse } from 'next/server';
import { getProductionMonitor } from '../../../../../lib/monitoring/productionMonitor';

/**
 * Monitoring Alerts API
 * 
 * Provides production monitoring alerts
 * 
 * Phase 1: Production Deployment
 */

const monitor = getProductionMonitor();

export async function GET(request: NextRequest) {
  try {
    await monitor.initialize();

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') || null;
    const limit = parseInt(searchParams.get('limit') || '50');

    const alerts = monitor.getAlerts(severity, limit);

    return NextResponse.json({
      status: 'ok',
      data: {
        alerts,
        count: alerts.length,
        severity: severity || 'all'
      },
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

