import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Self-Healing API
 *
 * Triggers automatic recovery for failed components
 */
export async function POST(request: NextRequest) {
  try {
    const { component } = await request.json();

    // Check if BEAST MODE is available
    if (!global.beastMode) {
      return NextResponse.json(
        { error: 'BEAST MODE not available' },
        { status: 503 }
      );
    }

    // Trigger self-healing
    const healingResult = await global.beastMode.triggerSelfHealing(component);

    // Get updated health status
    const healthStatus = global.beastMode.getHealthStatus();

    return NextResponse.json({
      message: component
        ? `Self-healing triggered for component: ${component}`
        : 'Self-healing triggered for all unhealthy components',
      component: component || 'all',
      results: healingResult,
      updatedHealth: {
        components: healthStatus.components,
        alerts: healthStatus.alerts.slice(-5), // Last 5 alerts
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Self-healing API error:', error);
    return NextResponse.json(
      {
        error: 'Self-healing failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for healing status
 */
export async function GET(request: NextRequest) {
  try {
    if (!global.beastMode || !global.beastMode.healthMonitor) {
      return NextResponse.json(
        {
          available: false,
          healing: false,
          components: {}
        },
        { status: 503 }
      );
    }

    const healthStatus = global.beastMode.getHealthStatus();

    // Check if any components are currently being healed
    const unhealthyComponents = Object.values(healthStatus.components)
      .filter((comp: any) => comp.status !== 'healthy');

    return NextResponse.json({
      available: true,
      healing: false, // This would be tracked separately in a real implementation
      componentsNeedingHealing: unhealthyComponents.length,
      unhealthyComponents: unhealthyComponents.map((comp: any) => ({
        name: comp.name,
        status: comp.status,
        consecutiveFailures: comp.consecutiveFailures
      })),
      lastHealingAttempt: null // Would track this in real implementation
    });

  } catch (error) {
    console.error('Healing status API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get healing status',
        details: error.message
      },
      { status: 500 }
    );
  }
}
