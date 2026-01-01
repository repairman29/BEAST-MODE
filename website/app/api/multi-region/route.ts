import { NextRequest, NextResponse } from 'next/server';

/**
 * Multi-Region API
 * 
 * Unified multi-region operations (regions, replication, load balancing, failover, monitoring)
 * 
 * Phase 3, Week 1: Multi-Region Deployment
 */

// Optional import - service not available in build
async function getMultiRegionService() {
  // Service module not available - return unavailable status
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const service = await getMultiRegionService();
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Multi-region service not available',
        timestamp: new Date().toISOString()
      });
    }

    await service.initialize();

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const regionId = searchParams.get('regionId');

    if (operation === 'status' && regionId) {
      const status = await service.getRegionStatus(regionId);
      return NextResponse.json({
        status: 'ok',
        data: status,
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'global-status') {
      const globalStatus = await multiRegionService.getGlobalStatus();
      return NextResponse.json({
        status: 'ok',
        data: globalStatus,
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'service-status') {
      const serviceStatus = multiRegionService.getStatus();
      return NextResponse.json({
        status: 'ok',
        data: serviceStatus,
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'best-region') {
      const strategy = searchParams.get('strategy') || 'latency';
      const bestRegion = await multiRegionService.selectBestRegion(strategy);
      return NextResponse.json({
        status: 'ok',
        data: { bestRegion },
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'failover-status') {
      const failoverStatus = await multiRegionService.getFailoverStatus();
      return NextResponse.json({
        status: 'ok',
        data: failoverStatus,
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'global-dashboard') {
      const dashboard = await multiRegionService.getGlobalDashboard();
      return NextResponse.json({
        status: 'ok',
        data: dashboard,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Multi-Region API ready',
      operations: [
        'status?regionId=xxx',
        'global-status',
        'service-status',
        'best-region?strategy=latency',
        'failover-status',
        'global-dashboard'
      ],
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
    const service = await getMultiRegionService();
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Multi-region service not available',
        timestamp: new Date().toISOString()
      });
    }
    
    await service.initialize();

    const body = await request.json();
    const { operation, ...params } = body;

    switch (operation) {
      case 'register-region':
        const region = await service.registerRegion(params);
        return NextResponse.json({
          status: 'ok',
          data: region,
          timestamp: new Date().toISOString()
        });

      case 'replicate-model':
        if (!params.modelId || !params.regionId) {
          return NextResponse.json(
            { error: 'modelId and regionId required' },
            { status: 400 }
          );
        }
        const replication = await multiRegionService.replicateModel(params.modelId, params.regionId);
        return NextResponse.json({
          status: 'ok',
          data: replication,
          timestamp: new Date().toISOString()
        });

      case 'route-request':
        if (!params.request) {
          return NextResponse.json(
            { error: 'request required' },
            { status: 400 }
          );
        }
        const routing = await multiRegionService.routeRequest(params.request, params.strategy || 'latency');
        return NextResponse.json({
          status: 'ok',
          data: routing,
          timestamp: new Date().toISOString()
        });

      case 'initiate-failover':
        if (!params.fromRegionId || !params.toRegionId) {
          return NextResponse.json(
            { error: 'fromRegionId and toRegionId required' },
            { status: 400 }
          );
        }
        const failover = await multiRegionService.initiateFailover(params.fromRegionId, params.toRegionId);
        return NextResponse.json({
          status: 'ok',
          data: failover,
          timestamp: new Date().toISOString()
        });

      case 'recover-region':
        if (!params.regionId) {
          return NextResponse.json(
            { error: 'regionId required' },
            { status: 400 }
          );
        }
        const recovery = await multiRegionService.recoverRegion(params.regionId);
        return NextResponse.json({
          status: 'ok',
          data: recovery,
          timestamp: new Date().toISOString()
        });

      case 'aggregate-metrics':
        const metrics = await multiRegionService.aggregateMetrics(params.timeRange || 3600000);
        return NextResponse.json({
          status: 'ok',
          data: metrics,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }
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



