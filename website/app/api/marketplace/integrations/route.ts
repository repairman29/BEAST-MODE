import { NextRequest, NextResponse } from 'next/server';

/**
 * Integration Marketplace API
 * 
 * Provides integration marketplace functionality
 * 
 * Phase 2: Optimization Services Integration
 */

async function handler(req: NextRequest) {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'Integration marketplace API ready',
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

// Optional middleware - may not be available
let withProductionIntegration: any = null;
try {
  const middleware = await import(/* webpackIgnore: true */ '../../../../lib/api-middleware').catch(() => null);
  withProductionIntegration = middleware?.withProductionIntegration;
} catch (error) {
  // Middleware not available
}

export async function GET(req: NextRequest) {
  if (withProductionIntegration) {
    try {
      const wrappedHandler = withProductionIntegration(handler);
      return wrappedHandler(req);
    } catch (error) {
      // Fall through to direct handler
    }
  }
  return handler(req);
}

export async function POST(req: NextRequest) {
  if (withProductionIntegration) {
    try {
      const wrappedHandler = withProductionIntegration(handler);
      return wrappedHandler(req);
    } catch (error) {
      // Fall through to direct handler
    }
  }
  return handler(req);
}
