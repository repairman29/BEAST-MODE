import { NextRequest, NextResponse } from 'next/server';

/**
 * Cross-Domain Learning API
 * 
 * Phase 2: Advanced MLOps Integration
 * Dog Fooding: Built using BEAST MODE
 */

// Dynamic import to avoid build-time errors
let service: any = null;

try {
  const serviceModule = require('@/lib/mlops/crossDomainService');
  if (serviceModule.getCrossDomainService) {
    service = serviceModule.getCrossDomainService();
  } else if (serviceModule.CrossDomainService) {
    service = new serviceModule.CrossDomainService();
  } else {
    service = serviceModule;
  }
} catch (error) {
  console.warn('[Cross-Domain API] Service not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Cross-domain service not available',
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
      message: 'Cross-domain API ready',
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
        message: 'Cross-domain service not available',
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
      case 'create-mapping':
        result = await service.createDomainMapping(params.sourceDomain, params.targetDomain, params);
        break;
      case 'create-transfer-run':
        result = await service.createTransferRun(userId, params);
        break;
      case 'execute-transfer':
        result = await service.executeTransfer(params.transferRunId);
        break;
      case 'record-adaptation-metrics':
        result = await service.recordAdaptationMetrics(params.transferRunId, params.phase, params.metrics);
        break;
      case 'predict':
        result = await service.predict(params.transferRunId, params.inputContext, params.sourceDomain, params.targetDomain);
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
