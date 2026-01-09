import { NextRequest, NextResponse } from 'next/server';

/**
 * Advanced Analytics API
 * 
 * Phase 3: Enterprise Features
 * Dog Fooding: Built using BEAST MODE
 */

// Dynamic import to avoid build-time errors
let service: any = null;

try {
  const serviceModule = require('../../../../../lib/mlops/analyticsService');
  if (serviceModule.getAnalyticsService) {
    service = serviceModule.getAnalyticsService();
  } else if (serviceModule.AnalyticsService) {
    service = new serviceModule.AnalyticsService();
  } else {
    service = serviceModule;
  }
} catch (error) {
  console.warn('[Analytics API] Service not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Analytics service not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      const initialized = service.initialize ? await service.initialize() : true;
      return NextResponse.json({
        status: 'ok',
        available: !!service,
        initialized,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Analytics API ready',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Analytics service not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const body = await request.json();
    const { action, userId, ...params } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case 'create-dashboard':
        result = await service.createDashboard(userId, params);
        break;
      case 'generate-report':
        result = await service.generateReport(params.dashboardId, userId, params);
        break;
      case 'record-trend':
        result = await service.recordTrend(params);
        break;
      case 'track-event':
        result = await service.trackEvent(userId, params);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      status: result.success ? 'ok' : 'error',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
