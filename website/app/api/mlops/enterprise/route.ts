import { NextRequest, NextResponse } from 'next/server';

/**
 * Enterprise Features API
 * 
 * Phase 3: Enterprise Features
 * Dog Fooding: Built using BEAST MODE
 */

// Dynamic import to avoid build-time errors
let service: any = null;

try {
  const serviceModule = require('../../../../../lib/mlops/enterpriseService');
  if (serviceModule.getEnterpriseService) {
    service = serviceModule.getEnterpriseService();
  } else if (serviceModule.EnterpriseService) {
    service = new serviceModule.EnterpriseService();
  } else {
    service = serviceModule;
  }
} catch (error) {
  console.warn('[Enterprise API] Service not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Enterprise service not available',
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
      message: 'Enterprise API ready',
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
        message: 'Enterprise service not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case 'configure-sso':
        result = await service.configureSSO(params.teamId, params);
        break;
      case 'create-permission':
        result = await service.createPermission(params);
        break;
      case 'log-audit':
        result = await service.logAuditEvent(params);
        break;
      case 'set-setting':
        result = await service.setSetting(params.teamId, params.key, params.value, params);
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
