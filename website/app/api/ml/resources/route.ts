import { NextRequest, NextResponse } from 'next/server';

// Optional imports - services may not be available
async function getResourceServices() {
  try {
    const middleware = await import(/* webpackIgnore: true */ '../../../../lib/api-middleware').catch(() => null);
    return {
      optimizeResources: middleware?.optimizeResources || null,
      getResourceOptimizerService: middleware?.getResourceOptimizerService || null
    };
  } catch {
    return {
      optimizeResources: null,
      getResourceOptimizerService: null
    };
  }
}

/**
 * Resources API
 * 
 * Provides resource optimization and management
 * 
 * Phase 2, Week 3: Advanced Scaling Features
 */

export async function GET(request: NextRequest) {
  try {
    const services = await getResourceServices();
    if (!services.getResourceOptimizerService || !services.optimizeResources) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Resource optimizer not available',
        timestamp: new Date().toISOString()
      });
    }
    
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation') || 'optimize';

    const optimizer = await services.getResourceOptimizerService();
    
    if (!optimizer) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Resource optimizer not available',
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'optimize') {
      const optimization = await services.optimizeResources();
      return NextResponse.json({
        status: 'ok',
        optimization,
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'usage') {
      const usage = optimizer.getUsageReport();
      return NextResponse.json({
        status: 'ok',
        usage,
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'forecast') {
      const forecast = optimizer.forecastResources(7); // 7 days
      return NextResponse.json({
        status: 'ok',
        forecast,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Resources API ready',
      operations: ['optimize', 'usage', 'forecast'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const services = await getResourceServices();
    if (!services.getResourceOptimizerService) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Resource optimizer not available',
        timestamp: new Date().toISOString()
      });
    }
    
    const { operation, resources } = await request.json();

    const optimizer = await services.getResourceOptimizerService();
    
    if (!optimizer) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Resource optimizer not available',
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'allocate') {
      if (!resources) {
        return NextResponse.json(
          { error: 'resources required' },
          { status: 400 }
        );
      }
      const allocation = await optimizer.allocateResources(resources);
      return NextResponse.json({
        status: 'ok',
        allocation,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: `Unknown operation: ${operation}` },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}



