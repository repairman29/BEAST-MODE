import { NextRequest, NextResponse } from 'next/server';

/**
 * Resource Optimization API
 * 
 * Provides resource management and optimization
 * 
 * Phase 2: Optimization Services Integration
 */

async function handler(req: NextRequest) {
  try {
    // Optional service - may not be available
    let optimizer: any = null;
    try {
      const path = require('path');
      const optimizerPath = path.join(process.cwd(), '../../../lib/scale/resourceOptimizer');
      const { getResourceOptimizerService } = require(optimizerPath);
      optimizer = await getResourceOptimizerService();
    } catch (error) {
      // Service not available - return graceful response
      return NextResponse.json(
        { error: 'Resource optimizer not available', status: 'unavailable' },
        { status: 503 }
      );
    }
    
    if (!optimizer) {
    if (!optimizer) {
      return NextResponse.json(
        { error: 'Resource optimizer not available' },
        { status: 503 }
      );
    }

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'summary';

      if (operation === 'summary') {
        const stats = optimizer.getAllocationStatistics();
        return NextResponse.json({
          status: 'ok',
          data: stats,
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'usage') {
        const pools = optimizer.getPoolStatus();
        return NextResponse.json({
          status: 'ok',
          data: { usage: pools },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'forecast') {
        const duration = parseInt(searchParams.get('duration') || '86400000');
        const forecast = optimizer.forecastResources(duration);
        return NextResponse.json({
          status: 'ok',
          data: { forecast },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Resource optimization API ready',
        operations: ['summary', 'usage', 'forecast'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'allocate') {
        const { tenantId, requirements } = body;
        const allocation = optimizer.allocateResources(tenantId || 'default', requirements || {});
        return NextResponse.json({
          status: 'ok',
          data: { allocation },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'release') {
        const { allocationId } = body;
        const released = optimizer.releaseResources(allocationId);
        return NextResponse.json({
          status: 'ok',
          data: { released },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'optimize') {
        const optimization = optimizer.optimizeAllocation();
        return NextResponse.json({
          status: 'ok',
          data: { optimization },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json(
        { error: `Unknown operation: ${operation}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
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

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}

