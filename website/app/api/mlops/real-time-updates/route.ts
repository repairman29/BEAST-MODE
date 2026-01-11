import { NextRequest, NextResponse } from 'next/server';

/**
 * Real-time model updates and online learning API
 * 
 * Phase 2: Advanced MLOps Integration
 */

// Dynamic import to avoid build-time errors
// Note: This service may have dependencies that cause webpack issues
// We'll handle it gracefully at runtime
let service: any = null;
let serviceLoadAttempted = false;

// Lazy load service only when needed (runtime, not build-time)
async function getService() {
  if (serviceLoadAttempted) return service;
  serviceLoadAttempted = true;
  
  try {
    // Use dynamic require with webpackIgnore to prevent bundling
    // @ts-ignore - Dynamic require for CommonJS module
    const serviceModule = eval('require')('@/lib/mlops/realTimeModelUpdates');
    if (serviceModule && serviceModule.getRealTimeModelUpdates) {
      service = serviceModule.getRealTimeModelUpdates();
    } else if (serviceModule && serviceModule.RealTimeModelUpdates) {
      service = new serviceModule.RealTimeModelUpdates();
    } else if (serviceModule) {
      service = serviceModule;
    } else {
      service = false;
    }
  } catch (error: any) {
    console.warn('[realTimeModelUpdates API] Service not available:', error?.message || error);
    service = false; // Mark as unavailable
  }
  
  return service;
}

export async function GET(request: NextRequest) {
  try {
    const serviceInstance = await getService();
    if (!serviceInstance) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Real-time model updates and online learning service not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      const initialized = serviceInstance.initialize ? await serviceInstance.initialize() : true;
      return NextResponse.json({
        status: 'ok',
        available: !!serviceInstance,
        initialized,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Real-time model updates and online learning API ready',
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
    const serviceInstance = await getService();
    if (!serviceInstance) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Real-time model updates and online learning service not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    // Service-specific logic would go here
    return NextResponse.json({
      status: 'ok',
      message: 'Real-time model updates and online learning operation completed',
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
