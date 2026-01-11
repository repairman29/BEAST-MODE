import { NextRequest, NextResponse } from 'next/server';

/**
 * Advanced Caching API
 * 
 * Phase 2: Advanced MLOps Integration
 * Dog Fooding: Built using BEAST MODE
 */

// Dynamic import to avoid build-time errors
let service: any = null;

try {
  const serviceModule = require('@/lib/mlops/advancedCachingService');
  if (serviceModule.getAdvancedCachingService) {
    service = serviceModule.getAdvancedCachingService();
  } else if (serviceModule.AdvancedCachingService) {
    service = new serviceModule.AdvancedCachingService();
  } else {
    service = serviceModule;
  }
} catch (error) {
  console.warn('[Advanced Caching API] Service not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Advanced caching service not available',
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
      message: 'Advanced caching API ready',
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
        message: 'Advanced caching service not available',
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
      case 'predict-and-prewarm':
        result = await service.predictAndPreWarm(params.cacheKey, params.context, params.predictedValue);
        break;
      case 'create-warming-job':
        result = await service.createWarmingJob(userId, params);
        break;
      case 'execute-warming-job':
        result = await service.executeWarmingJob(params.jobId);
        break;
      case 'record-performance':
        result = await service.recordPerformance(params.cacheTier, params.metrics);
        break;
      case 'detect-pattern':
        result = await service.detectPattern(params.patternType, params.patternSignature, params.associatedKeys);
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
