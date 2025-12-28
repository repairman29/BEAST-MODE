import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Health Monitoring API
 *
 * Provides real-time health status of all system components
 */
export async function GET(request: NextRequest) {
  try {
    // Check if BEAST MODE health monitor is available
    if (!global.beastMode || !global.beastMode.healthMonitor) {
      return NextResponse.json(
        {
          error: 'BEAST MODE Health Monitor not available',
          isMonitoring: false,
          components: {},
          alerts: [],
          history: []
        },
        { status: 503 }
      );
    }

    // Get health status from the monitor
    const healthStatus = global.beastMode.getHealthStatus();

    return NextResponse.json({
      isMonitoring: healthStatus.isMonitoring,
      lastCheck: healthStatus.lastCheck,
      components: healthStatus.components,
      alerts: healthStatus.alerts,
      history: healthStatus.history,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve health status',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for triggering manual health check
 */
export async function POST(request: NextRequest) {
  try {
    if (!global.beastMode || !global.beastMode.healthMonitor) {
      return NextResponse.json(
        { error: 'BEAST MODE Health Monitor not available' },
        { status: 503 }
      );
    }

    // Trigger manual health check
    await global.beastMode.healthMonitor.performHealthCheck();

    // Return updated health status
    const healthStatus = global.beastMode.getHealthStatus();

    return NextResponse.json({
      message: 'Manual health check completed',
      isMonitoring: healthStatus.isMonitoring,
      lastCheck: healthStatus.lastCheck,
      components: healthStatus.components,
      alerts: healthStatus.alerts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Manual health check error:', error);
    return NextResponse.json(
      {
        error: 'Manual health check failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}
