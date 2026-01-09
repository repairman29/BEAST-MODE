import { NextRequest, NextResponse } from 'next/server';

/**
 * Neural Architecture Search (NAS) API
 * 
 * Phase 2: Advanced MLOps Integration
 * Dog Fooding: Built using BEAST MODE
 */

// Dynamic import to avoid build-time errors
let service: any = null;

try {
  const serviceModule = require('../../../../../lib/mlops/nasService');
  if (serviceModule.getNASService) {
    service = serviceModule.getNASService();
  } else if (serviceModule.NASService) {
    service = new serviceModule.NASService();
  } else {
    service = serviceModule;
  }
} catch (error) {
  console.warn('[NAS API] Service not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'NAS service not available',
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
      message: 'NAS API ready',
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
        message: 'NAS service not available',
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
      case 'create-run':
        result = await service.createSearchRun(userId, params);
        break;
      case 'generate-candidate':
        result = await service.generateCandidate(params.searchRunId, params.generation, params.parentIds);
        break;
      case 'evaluate-candidate':
        result = await service.evaluateCandidate(params.candidateId, params.metrics);
        break;
      case 'mark-optimal':
        result = await service.markOptimal(params.searchRunId, params.candidateId, params.performanceSummary);
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
