import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedMultiRegionService } from '../../../../../lib/multi-region/unifiedMultiRegionService';
import { getCircuitBreakerService, getDisasterRecoveryService, getPerformanceStats } from '../../../../../lib/api-middleware';

/**
 * Service Health Check API
 * 
 * Detailed health check for individual services
 * 
 * Phase 1: Production Deployment
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service');

  const services: any = {};

  // Multi-Region Service
  if (!service || service === 'multi-region') {
    try {
      const multiRegion = getUnifiedMultiRegionService();
      const status = multiRegion.getStatus();
      services.multiRegion = {
        status: status.initialized ? 'healthy' : 'unhealthy',
        initialized: status.initialized,
        services: status.services,
        timestamp: new Date().toISOString()
      };
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
      const circuitBreaker = await getCircuitBreakerService();
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
      const disasterRecovery = await getDisasterRecoveryService();
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
      const performanceStats = await getPerformanceStats();
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

