import { NextRequest, NextResponse } from 'next/server';

/**
 * Notification Channels API
 * 
 * Manages notification channels
 * 
 * Phase 1: Production Deployment
 */

async function getAlertManager() {
  try {
    const module = await import('../../../../../../lib/monitoring/alertManager');
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
        data: { channels: [] },
        message: 'Alert manager not available',
        timestamp: new Date().toISOString()
      });
    }

    await alertManager.initialize();

    const channels = alertManager.getNotificationChannels();

    return NextResponse.json({
      status: 'ok',
      data: { channels },
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

    const { test } = await request.json();

    if (test) {
      // Send test alert
      const testAlert = {
        id: 'test_alert',
        ruleId: 'test',
        ruleName: 'Test Alert',
        severity: 'low',
        message: 'This is a test alert',
        timestamp: Date.now()
      };

      const results = await alertManager.sendNotifications(testAlert);

      return NextResponse.json({
        status: 'ok',
        data: {
          testAlert,
          results
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Use test=true to send test alert' },
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

