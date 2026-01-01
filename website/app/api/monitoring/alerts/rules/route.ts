import { NextRequest, NextResponse } from 'next/server';
import { getAlertManager } from '../../../../../../lib/monitoring/alertManager';
import { getProductionMonitorService } from '../../../../../lib/api-middleware';

/**
 * Alert Rules API
 * 
 * Manages alert rules and evaluates alerts
 * 
 * Phase 1: Production Deployment
 */

const alertManager = getAlertManager();

export async function GET(request: NextRequest) {
  try {
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

