import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../../lib/api-middleware';
import { getResourceOptimizerService } from '../../../../lib/api-middleware';

/**
 * Resource Optimization API
 * 
 * Provides resource management and optimization
 * 
 * Phase 2: Optimization Services Integration
 */

async function handler(req: NextRequest) {
  try {
    const optimizer = await getResourceOptimizerService();
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
  const wrappedHandler = await withProductionIntegration(handler);
  return wrappedHandler(req);
}
export async function POST(req: NextRequest) {
  const wrappedHandler = await withProductionIntegration(handler);
  return wrappedHandler(req);
}

