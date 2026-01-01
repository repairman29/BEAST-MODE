import { NextRequest, NextResponse } from 'next/server';
import { getAdvancedLoadBalancerService } from '../../../lib/api-middleware';

/**
 * Load Balancing API
 * 
 * Provides advanced load balancing and routing
 * 
 * Phase 2, Week 3: Advanced Scaling Features
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation') || 'stats';

    const balancer = await getAdvancedLoadBalancerService();
    
    if (!balancer) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Advanced load balancer not available',
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'stats') {
      const stats = balancer.getRoutingStats();
      return NextResponse.json({
        status: 'ok',
        stats,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Load balancing API ready',
      operations: ['stats'],
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
    const { request: req, strategy } = await request.json();

    if (!req) {
      return NextResponse.json(
        { error: 'request required' },
        { status: 400 }
      );
    }

    const balancer = await getAdvancedLoadBalancerService();
    
    if (!balancer) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Advanced load balancer not available',
        timestamp: new Date().toISOString()
      });
    }

    // Route request using specified strategy
    const routing = await balancer.routeRequest(req, strategy || 'adaptive');

    return NextResponse.json({
      status: 'ok',
      routing,
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



