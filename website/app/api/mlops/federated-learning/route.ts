import { NextRequest, NextResponse } from 'next/server';

/**
 * Federated Learning API
 * 
 * Phase 2: Advanced MLOps Integration
 * Dog Fooding: Built using BEAST MODE
 */

// Dynamic import to avoid build-time errors
let service: any = null;

try {
  const serviceModule = require('../../../../../lib/mlops/federatedLearningService');
  if (serviceModule.getFederatedLearningService) {
    service = serviceModule.getFederatedLearningService();
  } else if (serviceModule.FederatedLearningService) {
    service = new serviceModule.FederatedLearningService();
  } else {
    service = serviceModule;
  }
} catch (error) {
  console.warn('[Federated Learning API] Service not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Federated learning service not available',
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

    if (action === 'active-nodes') {
      const result = await service.getActiveNodes();
      return NextResponse.json({
        status: result.success ? 'ok' : 'error',
        ...result,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Federated learning API ready',
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
        message: 'Federated learning service not available',
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
      case 'register-node':
        result = await service.registerNode(params);
        break;
      case 'submit-update':
        result = await service.submitUpdate(params.nodeId, params.roundNumber, params.updateData, params.sampleCount);
        break;
      case 'aggregate-updates':
        result = await service.aggregateUpdates(params.roundNumber, params.aggregationMethod);
        break;
      case 'record-metrics':
        result = await service.recordMetrics(params.roundNumber, params.nodeId, params.metrics);
        break;
      case 'start-round':
        result = await service.startRound();
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
