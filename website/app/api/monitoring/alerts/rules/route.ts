import { NextRequest, NextResponse } from 'next/server';

// Optional import - service may not be available
async function getProductionMonitorService() {
  try {
    // @ts-ignore - Dynamic import, module may not exist
    const middleware = await import(/* webpackIgnore: true */ '../../../../../lib/monitoring/productionMonitor').catch(() => null);
    const getMonitor = middleware?.getProductionMonitor;
    return getMonitor ? getMonitor() : null;
  } catch {
    return null;
  }
}

/**
 * Alert Rules API
 * 
 * Manages alert rules and evaluates alerts
 * 
 * Phase 1: Production Deployment
 */

async function getAlertManager() {
  try {
    // Use dynamic import with template literal to prevent webpack static analysis
    const basePath = '../../../../../../lib/monitoring/';
    const moduleName = 'alertManager';
    const module = await import(`${basePath}${moduleName}`);
    return module.getAlertManager();
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const alertManager = await getAlertManager();
    if (!alertManager) {
      return NextResponse.json({
        status: 'ok',
        data: { rules: [] },
        message: 'Alert manager not available',
        timestamp: new Date().toISOString()
      });
    }

    await alertManager.initialize();

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation') || 'list';

    if (operation === 'list') {
      const rules = alertManager.getAlertRules();
      return NextResponse.json({
        status: 'ok',
        data: { rules },
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'evaluate') {
      // Get current metrics
      const monitor = await getProductionMonitorService();
      if (!monitor) {
        return NextResponse.json(
          { error: 'Production monitor not available' },
          { status: 503 }
        );
      }

      const health = monitor.getHealthStatus();
      const metrics = monitor.getMetricsSummary();

      // Evaluate alert rules
      const triggeredAlerts = await alertManager.evaluateAlertRules({
        errorRate: health.metrics?.errorRate || 0,
        memoryUsage: health.metrics?.memoryUsage || 0,
        avgResponseTime: metrics.application?.requests?.avgResponseTime || 0,
        status: health.status
      });

      return NextResponse.json({
        status: 'ok',
        data: {
          triggeredAlerts,
          count: triggeredAlerts.length
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Alert rules API ready',
      operations: ['list', 'evaluate'],
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

export async function POST(request: NextRequest) {
  try {
    const alertManager = await getAlertManager();
    if (!alertManager) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Alert manager not available',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    await alertManager.initialize();

    const { operation, ruleId, duration } = await request.json();

    if (operation === 'silence') {
      if (!ruleId) {
        return NextResponse.json(
          { error: 'ruleId required' },
          { status: 400 }
        );
      }
      const silenced = alertManager.silenceAlert(ruleId, duration || 3600000);
      return NextResponse.json({
        status: 'ok',
        data: { silenced, ruleId },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: `Unknown operation: ${operation}` },
      { status: 400 }
    );
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

