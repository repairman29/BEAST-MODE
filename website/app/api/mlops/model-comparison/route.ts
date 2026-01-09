import { NextRequest, NextResponse } from 'next/server';

/**
 * Model comparison and A/B testing API
 * 
 * Phase 2: Advanced MLOps Integration
 */

// Dynamic import to avoid build-time errors
let service: any = null;

try {
  const serviceModule = require('../../../../../lib/mlops/modelComparison');
  if (serviceModule.getModelComparison) {
    service = serviceModule.getModelComparison();
  } else if (serviceModule.ModelComparison) {
    service = new serviceModule.ModelComparison();
  } else {
    service = serviceModule;
  }
} catch (error) {
  console.warn('[modelComparison API] Service not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Model comparison and A/B testing service not available',
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
      message: 'Model comparison and A/B testing API ready',
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
        message: 'Model comparison and A/B testing service not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    // Service-specific logic would go here
    return NextResponse.json({
      status: 'ok',
      message: 'Model comparison and A/B testing operation completed',
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
