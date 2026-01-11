import { NextRequest, NextResponse } from 'next/server';

/**
 * Autonomous Evolution API
 * 
 * Phase 2: Advanced MLOps Integration
 * Dog Fooding: Built using BEAST MODE
 */

// Dynamic import to avoid build-time errors
let service: any = null;

try {
  const serviceModule = require('@/lib/mlops/autonomousEvolutionService');
  if (serviceModule.getAutonomousEvolutionService) {
    service = serviceModule.getAutonomousEvolutionService();
  } else if (serviceModule.AutonomousEvolutionService) {
    service = new serviceModule.AutonomousEvolutionService();
  } else {
    service = serviceModule;
  }
} catch (error) {
  console.warn('[Autonomous Evolution API] Service not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Autonomous evolution service not available',
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
      message: 'Autonomous evolution API ready',
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
        message: 'Autonomous evolution service not available',
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
      case 'create-generation':
        result = await service.createGeneration(userId, params);
        break;
      case 'generate-candidates':
        result = await service.generateCandidates(params.generationId, params.count);
        break;
      case 'evaluate-candidate':
        result = await service.evaluateCandidate(params.candidateId, params.fitnessScore, params.fitnessComponents);
        break;
      case 'select-candidates':
        result = await service.selectCandidates(params.generationId, params.selectionMethod);
        break;
      case 'record-metrics':
        result = await service.recordMetrics(params.generationId, params.metrics);
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
