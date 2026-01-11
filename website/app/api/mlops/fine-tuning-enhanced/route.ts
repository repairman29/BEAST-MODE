import { NextRequest, NextResponse } from 'next/server';

/**
 * Enhanced Fine-Tuning API with Database Integration
 * 
 * Phase 2: Advanced MLOps Integration
 * Dog Fooding: Built using BEAST MODE
 */

// Dynamic import to avoid build-time errors
let service: any = null;

try {
  const serviceModule = require('@/lib/mlops/fineTuningService');
  if (serviceModule.getFineTuningService) {
    service = serviceModule.getFineTuningService();
  } else if (serviceModule.FineTuningService) {
    service = new serviceModule.FineTuningService();
  } else {
    service = serviceModule;
  }
} catch (error) {
  console.warn('[Fine-Tuning API] Service not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Fine-tuning service not available',
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
      message: 'Fine-tuning API ready',
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
        message: 'Fine-tuning service not available',
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
      case 'create-job':
        result = await service.createJob(userId, params);
        break;
      case 'execute-job':
        result = await service.executeJob(params.jobId);
        break;
      case 'record-metrics':
        result = await service.recordMetrics(params.jobId, params.epoch, params.metrics);
        break;
      case 'create-incremental-update':
        result = await service.createIncrementalUpdate(params.jobId, params.modelVersionId, params.newData);
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
