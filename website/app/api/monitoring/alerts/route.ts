import { NextRequest, NextResponse } from 'next/server';

/**
 * Monitoring Alerts API
 * 
 * Provides production monitoring alerts
 * 
 * Phase 1: Production Deployment
 */

// Optional import - service may not be available
async function getMonitor() {
  try {
    // @ts-ignore - Dynamic import, module may not exist
    const monitorModule = await import(/* webpackIgnore: true */ '../../../../lib/monitoring/productionMonitor').catch(() => null);
    return monitorModule?.getProductionMonitor?.() || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const monitor = await getMonitor();
    
    if (!monitor) {
      return NextResponse.json({
        status: 'ok',
        data: {
          alerts: [],
          count: 0,
          severity: 'all',
          message: 'Monitoring service not available'
        },
        timestamp: new Date().toISOString()
      });
    }

    await monitor.initialize?.();

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') || null;
    const limit = parseInt(searchParams.get('limit') || '50');

    const alerts = monitor.getAlerts?.(severity, limit) || [];

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

