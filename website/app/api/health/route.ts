import { NextRequest, NextResponse } from 'next/server';

// Optional imports - services may not be available
async function getServices() {
  let getUnifiedMultiRegionService: any;
  let getCircuitBreakerService: any;
  let getDisasterRecoveryService: any;
  let getPerformanceStats: any;

  try {
    // Use dynamic import with string to avoid webpack static analysis
    const multiRegionModule = await import(/* webpackIgnore: true */ '../../../../lib/multi-region/unifiedMultiRegionService').catch(() => null);
    getUnifiedMultiRegionService = multiRegionModule?.getUnifiedMultiRegionService;
  } catch {}

  try {
    // Use dynamic import with string to avoid webpack static analysis
    const middlewareModule = await import(/* webpackIgnore: true */ '../../lib/api-middleware').catch(() => null);
    getCircuitBreakerService = middlewareModule?.getCircuitBreakerService;
    getDisasterRecoveryService = middlewareModule?.getDisasterRecoveryService;
    getPerformanceStats = middlewareModule?.getPerformanceStats;
  } catch {}

  return { getUnifiedMultiRegionService, getCircuitBreakerService, getDisasterRecoveryService, getPerformanceStats };
}

/**
 * Health Check API
 * 
 * Comprehensive health check for all services
 * 
 * Phase 1: Production Deployment
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level') || 'basic';

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  try {
    const { getUnifiedMultiRegionService, getCircuitBreakerService, getDisasterRecoveryService, getPerformanceStats } = await getServices();

    if (level === 'detailed' || level === 'full') {
      // Check service status
      const services: any = {};

      // Check Multi-Region Service
      try {
        if (getUnifiedMultiRegionService) {
          const multiRegion = getUnifiedMultiRegionService();
          const multiRegionStatus = multiRegion.getStatus();
          services.multiRegion = {
            status: multiRegionStatus.initialized ? 'healthy' : 'unhealthy',
            initialized: multiRegionStatus.initialized,
            services: multiRegionStatus.services
          };
        }
      } catch (error) {
        services.multiRegion = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Check Circuit Breaker
      try {
        const circuitBreaker = getCircuitBreakerService ? await getCircuitBreakerService() : null;
        services.circuitBreaker = {
          status: circuitBreaker ? 'healthy' : 'unavailable',
          available: !!circuitBreaker
        };
      } catch (error) {
        services.circuitBreaker = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Check Disaster Recovery
      try {
        const disasterRecovery = getDisasterRecoveryService ? await getDisasterRecoveryService() : null;
        services.disasterRecovery = {
          status: disasterRecovery ? 'healthy' : 'unavailable',
          available: !!disasterRecovery
        };
      } catch (error) {
        services.disasterRecovery = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Check Performance Monitor
      try {
        const performanceStats = getPerformanceStats ? await getPerformanceStats() : null;
        services.performanceMonitor = {
          status: performanceStats ? 'healthy' : 'unavailable',
          available: !!performanceStats
        };
      } catch (error) {
        services.performanceMonitor = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      health.services = services;

      // Check overall health
      const allHealthy = Object.values(services).every((s: any) => s.status === 'healthy' || s.status === 'unavailable');
      if (!allHealthy) {
        health.status = 'degraded';
      }
    }

    if (level === 'full') {
      // Add system metrics
      health.system = {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      };

      // Add performance stats if available
      try {
        const performanceStats = getPerformanceStats ? await getPerformanceStats() : null;
        if (performanceStats) {
          health.performance = {
            avgResponseTime: performanceStats.metrics?.responseTime?.avg || 0,
            totalRequests: performanceStats.metrics?.throughput?.count || 0,
            errorRate: performanceStats.metrics?.errorRate?.avg || 0
          };
        }
      } catch (error) {
        // Performance stats not available
      }
    }

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

