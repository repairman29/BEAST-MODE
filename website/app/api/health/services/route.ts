import { NextRequest, NextResponse } from 'next/server';

// Optional imports - services may not be available
async function getServices() {
  let getUnifiedMultiRegionService: any;
  let getCircuitBreakerService: any;
  let getDisasterRecoveryService: any;
  let getPerformanceStats: any;

  try {
    // Use dynamic import with string to avoid webpack static analysis
    // @ts-ignore - Dynamic import, module may not exist
    const multiRegionModule = await import(/* webpackIgnore: true */ '../../../../lib/multi-region/unifiedMultiRegionService').catch(() => null);
    getUnifiedMultiRegionService = multiRegionModule?.getUnifiedMultiRegionService;
  } catch {}

  try {
    // Use dynamic import with string to avoid webpack static analysis
    // @ts-ignore - Dynamic import, module may not exist
    const middlewareModule = await import(/* webpackIgnore: true */ '../../../lib/api-middleware').catch(() => null);
    getCircuitBreakerService = middlewareModule?.getCircuitBreakerService;
    getDisasterRecoveryService = middlewareModule?.getDisasterRecoveryService;
    getPerformanceStats = middlewareModule?.getPerformanceStats;
  } catch {}

  return { getUnifiedMultiRegionService, getCircuitBreakerService, getDisasterRecoveryService, getPerformanceStats };
}

/**
 * Service Health Check API
 * 
 * Detailed health check for individual services
 * 
 * Phase 1: Production Deployment
 */

export async function GET(request: NextRequest) {
  const { getUnifiedMultiRegionService, getCircuitBreakerService, getDisasterRecoveryService, getPerformanceStats } = await getServices();
  
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service');

  const services: any = {};

  // Multi-Region Service
  if (!service || service === 'multi-region') {
    try {
      if (getUnifiedMultiRegionService) {
        const multiRegion = getUnifiedMultiRegionService();
      const status = multiRegion.getStatus();
        services.multiRegion = {
          status: status.initialized ? 'healthy' : 'unhealthy',
          initialized: status.initialized,
          services: status.services,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      services.multiRegion = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Circuit Breaker
  if (!service || service === 'circuit-breaker') {
    try {
      const circuitBreaker = getCircuitBreakerService ? await getCircuitBreakerService() : null;
      services.circuitBreaker = {
        status: circuitBreaker ? 'healthy' : 'unavailable',
        available: !!circuitBreaker,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      services.circuitBreaker = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Disaster Recovery
  if (!service || service === 'disaster-recovery') {
    try {
      const disasterRecovery = getDisasterRecoveryService ? await getDisasterRecoveryService() : null;
      services.disasterRecovery = {
        status: disasterRecovery ? 'healthy' : 'unavailable',
        available: !!disasterRecovery,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      services.disasterRecovery = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Performance Monitor
  if (!service || service === 'performance-monitor') {
    try {
      const performanceStats = getPerformanceStats ? await getPerformanceStats() : null;
      services.performanceMonitor = {
        status: performanceStats ? 'healthy' : 'unavailable',
        available: !!performanceStats,
        stats: performanceStats ? {
          avgResponseTime: performanceStats.metrics?.responseTime?.avg || 0,
          totalRequests: performanceStats.metrics?.throughput?.count || 0
        } : null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      services.performanceMonitor = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Overall status
  const allHealthy = Object.values(services).every((s: any) => s.status === 'healthy' || s.status === 'unavailable');
  const overallStatus = allHealthy ? 'healthy' : 'degraded';

  return NextResponse.json({
    status: overallStatus,
    services,
    timestamp: new Date().toISOString()
  });
}

