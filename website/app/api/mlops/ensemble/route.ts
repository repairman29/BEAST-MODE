import { NextRequest, NextResponse } from 'next/server';

/**
 * Advanced ensemble strategies (stacking, meta-learning) API
 * 
 * Phase 2: Advanced MLOps Integration
 */

// Dynamic import to avoid build-time errors
let service: any = null;

try {
  const serviceModule = require('../../../../../lib/mlops/advancedEnsemble');
  if (serviceModule.getAdvancedEnsemble) {
    service = serviceModule.getAdvancedEnsemble();
  } else if (serviceModule.AdvancedEnsemble) {
    service = new serviceModule.AdvancedEnsemble();
  } else {
    service = serviceModule;
  }
} catch (error) {
  console.warn('[advancedEnsemble API] Service not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Advanced ensemble strategies (stacking, meta-learning) service not available',
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
      message: 'Advanced ensemble strategies (stacking, meta-learning) API ready',
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
        message: 'Ensemble service not available',
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
      case 'create-config':
        result = await service.createEnsembleConfig(userId, params);
        break;
      case 'predict':
        result = await service.predict(params.context, params.ensembleConfigId, params.serviceName);
        break;
      case 'record-performance':
        result = await service.recordPerformance(params.ensembleConfigId, params.serviceName, params.metrics);
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
