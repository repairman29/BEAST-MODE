import { NextRequest, NextResponse } from 'next/server';

// Use unified config if available
let getUnifiedConfig: any = null;
try {
  const path = require('path');
  const configPath = path.join(process.cwd(), '../../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

// Helper function to get config value (TypeScript compatible)
async function getConfigValue(key: string, defaultValue: string | null = null): Promise<string | null> {
  try {
    if (getUnifiedConfig) {
      try {
        const config = await getUnifiedConfig();
        const value = config.get(key);
        if (value !== null && value !== undefined && value !== '') {
          return value;
        }
      } catch (error) {
        // Fallback to process.env
      }
    }
  } catch (error) {
    // Ignore config errors
  }
  // Fallback to process.env for backward compatibility
  return process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : defaultValue;
}

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
 * Health Check API
 * 
 * Comprehensive health check for all services
 * Always returns 200 with JSON response
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'basic';

    // Get config values with error handling
    let version = '1.0.0';
    let environment = 'development';
    
    try {
      version = (await getConfigValue('npm_package_version', '1.0.0')) || '1.0.0';
      environment = (await getConfigValue('NODE_ENV', 'development')) || 'development';
    } catch (error) {
      // Use defaults if config fails
      version = process.env.npm_package_version || '1.0.0';
      environment = process.env.NODE_ENV || 'development';
    }

    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: version,
      environment: environment
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
    } catch (error) {
      // Service checks failed, but health endpoint should still respond
      health.status = 'degraded';
      health.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Always return 200 with JSON - this is a health check endpoint
    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    // Even on error, return JSON with 200 status so endpoint is always accessible
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      { 
        status: 200, // Return 200 even on error so endpoint is always accessible
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
