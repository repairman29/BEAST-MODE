/**
 * API Middleware for Production Integration
 * 
 * Integrates Error Handler, Performance Monitor, and Multi-Level Cache
 * 
 * Phase 1, Week 1: Critical Production Integration
 */

import { NextRequest, NextResponse } from 'next/server';

// Lazy load services to avoid initialization issues
let errorHandler: any = null;
let performanceMonitor: any = null;
let multiLevelCache: any = null;
let intelligentRouter: any = null;
let autoOptimizer: any = null;
let trendAnalyzer: any = null;
let anomalyDetector: any = null;
let securityEnhancer: any = null;
let databaseOptimizer: any = null;
let biIntegration: any = null;
let biExporter: any = null;
let selfLearning: any = null;
let recommendationEngine: any = null;
let advancedScaler: any = null;
let resourceOptimizer: any = null;
let loadBalancerAdvanced: any = null;
let circuitBreaker: any = null;
let disasterRecovery: any = null;
let productionMonitor: any = null;
let costOptimizer: any = null;
let performanceOptimizer: any = null;

async function getErrorHandler() {
  if (!errorHandler) {
    try {
      const path = require('path');
      const errorHandlerPath = path.join(process.cwd(), '../lib/resilience/errorHandler');
      const { getErrorHandler } = require(errorHandlerPath);
      errorHandler = getErrorHandler();
      await errorHandler.initialize();
    } catch (error) {
      console.debug('[API Middleware] Error handler not available:', error.message);
    }
  }
  return errorHandler;
}

async function getPerformanceMonitor() {
  if (!performanceMonitor) {
    try {
      const path = require('path');
      const monitorPath = path.join(process.cwd(), '../lib/scale/performanceMonitor');
      const { getPerformanceMonitor } = require(monitorPath);
      performanceMonitor = getPerformanceMonitor();
      await performanceMonitor.initialize();
    } catch (error) {
      console.debug('[API Middleware] Performance monitor not available:', error.message);
    }
  }
  return performanceMonitor;
}

async function getMultiLevelCache() {
  if (!multiLevelCache) {
    try {
      const path = require('path');
      const cachePath = path.join(process.cwd(), '../lib/scale/multiLevelCache');
      const { getMultiLevelCache } = require(cachePath);
      multiLevelCache = getMultiLevelCache();
      await multiLevelCache.initialize();
    } catch (error) {
      console.debug('[API Middleware] Multi-level cache not available:', error.message);
    }
  }
  return multiLevelCache;
}

/**
 * Generate cache key from request
 */
function generateCacheKey(endpoint: string, context: any): string {
  const keyParts = [
    endpoint,
    JSON.stringify(context).substring(0, 200) // Limit key length
  ];
  return `api:${keyParts.join(':')}`;
}

/**
 * Hash function for cache keys
 */
function hashCacheKey(key: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `cache_${Math.abs(hash).toString(36)}`;
}

/**
 * Wrapper for API endpoints with error handling, performance monitoring, and caching
 */
export async function withProductionIntegration(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    endpoint: string;
    enableCache?: boolean;
    cacheTTL?: number;
  } = { endpoint: 'unknown' }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const { endpoint, enableCache = true, cacheTTL } = options;

    try {
      // Initialize services
      const errorHandler = await getErrorHandler();
      const performanceMonitor = await getPerformanceMonitor();
      const cache = enableCache ? await getMultiLevelCache() : null;

      // Get request body for cache key (clone request to avoid consuming body)
      let requestBody: any = null;
      let cacheKey: string | null = null;

      if (enableCache && cache && req.method === 'POST') {
        try {
          // Clone request to read body without consuming it
          const clonedReq = req.clone();
          requestBody = await clonedReq.json();
          const rawKey = generateCacheKey(endpoint, requestBody);
          cacheKey = hashCacheKey(rawKey);

          // Try to get from cache
          const cached = await cache.get(cacheKey);
          if (cached) {
            // Record cache hit
            if (performanceMonitor) {
              performanceMonitor.recordMetric('cache_hit', 1, { endpoint });
            }
            return NextResponse.json({
              ...cached,
              _cached: true,
              _cacheKey: cacheKey
            });
          }

          // Record cache miss
          if (performanceMonitor) {
            performanceMonitor.recordMetric('cache_miss', 1, { endpoint });
          }
        } catch (error) {
          // Couldn't parse body, skip caching
          console.debug('[API Middleware] Could not parse body for caching:', error);
        }
      }

      // Validate and sanitize request (if POST with body)
      let sanitizedBody: any = null;
      if (requestBody && req.method === 'POST') {
        const security = await getSecurityEnhancer();
        if (security) {
          // Basic validation schema (can be enhanced)
          const schema: Record<string, any> = {};
          for (const key in requestBody) {
            schema[key] = { type: typeof requestBody[key] === 'string' ? 'string' : 'number' };
          }
          
          const validation = await validateAndSanitizeRequest(requestBody, schema);
          if (!validation.valid) {
            return NextResponse.json(
              {
                error: 'Validation failed',
                details: validation.errors,
                timestamp: new Date().toISOString()
              },
              { status: 400 }
            );
          }
          sanitizedBody = validation.sanitized;
        } else {
          sanitizedBody = requestBody;
        }
      }

      // Execute handler
      let response: NextResponse;
      try {
        // Recreate request with sanitized body if we consumed it
        if (sanitizedBody && req.method === 'POST') {
          const newReq = new NextRequest(req.url, {
            method: req.method,
            headers: req.headers,
            body: JSON.stringify(sanitizedBody)
          });
          response = await handler(newReq);
        } else {
          response = await handler(req);
        }

      // Record performance metrics
      const duration = Date.now() - startTime;
      if (performanceMonitor) {
        performanceMonitor.recordMetric('responseTime', duration, { endpoint });
        performanceMonitor.recordMetric('throughput', 1, { endpoint });
        
        // Detect anomalies in real-time
        const anomaly = await detectAnomalies(endpoint, duration, { 
          method: req.method,
          cached: !!cacheKey 
        });
        
        if (anomaly && anomaly.isAnomaly) {
          console.warn(`[API Middleware] Anomaly detected on ${endpoint}:`, anomaly);
        }
      }

      // Record in production monitor
      const prodMonitor = await getProductionMonitor();
      if (prodMonitor) {
        prodMonitor.recordRequest(endpoint, req.method, response.status, duration);
      }

        // Cache successful responses
        if (enableCache && cache && cacheKey && response.status === 200) {
          try {
            const responseData = await response.json();
            await cache.set(cacheKey, responseData, cacheTTL);
          } catch (error) {
            // Couldn't cache response
            console.debug('[API Middleware] Could not cache response:', error);
          }
        }

        // Trigger auto-optimization periodically (every 100 requests)
        if (performanceMonitor) {
          const stats = performanceMonitor.getPerformanceSummary();
          const totalRequests = stats.metrics.throughput?.count || 0;
          if (totalRequests > 0 && totalRequests % 100 === 0) {
            // Trigger optimization in background (don't await)
            triggerAutoOptimization().catch(err => {
              console.debug('[API Middleware] Background optimization failed:', err);
            });

            // Check scaling needs
            checkScalingNeeds().catch(err => {
              console.debug('[API Middleware] Scaling check failed:', err);
            });

            // Optimize resources
            optimizeResources().catch(err => {
              console.debug('[API Middleware] Resource optimization failed:', err);
            });
          }
        }

        // Learn from successful request
        if (response.status === 200) {
          const learning = await getSelfLearning();
          if (learning) {
            // Learn from routing decision (if intelligent router was used)
            const reward = duration < 200 ? 1 : duration < 500 ? 0.5 : 0.1; // Reward faster responses
            learnFromOutcome('api_request', {
              endpoint,
              duration,
              cached: !!cacheKey,
              status: response.status
            }, reward).catch(err => {
              console.debug('[API Middleware] Learning failed:', err);
            });
          }
        }

        return response;
      } catch (handlerError: any) {
        // Handle handler errors
        if (errorHandler) {
          const handled = await errorHandler.handleError(handlerError, {
            endpoint,
            operation: () => handler(req)
          });

          // Record error metrics
          if (performanceMonitor) {
            performanceMonitor.recordMetric('errorRate', 1, { endpoint });
          }

          // Return error response
          return NextResponse.json(
            {
              error: 'Internal server error',
              details: handled.recovery?.success ? 'Error recovered' : handlerError.message,
              timestamp: new Date().toISOString()
            },
            { status: 500 }
          );
        }

        // Fallback error response
        return NextResponse.json(
          {
            error: 'Internal server error',
            details: handlerError.message,
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        );
      }
    } catch (middlewareError: any) {
      // Middleware error - log and return basic error
      console.error('[API Middleware] Middleware error:', middlewareError);
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: middlewareError.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Record performance metric
 */
export async function recordMetric(name: string, value: number, tags: Record<string, any> = {}) {
  const monitor = await getPerformanceMonitor();
  if (monitor) {
    monitor.recordMetric(name, value, tags);
  }
}

/**
 * Get performance statistics
 */
export async function getPerformanceStats() {
  const monitor = await getPerformanceMonitor();
  if (monitor) {
    return monitor.getPerformanceSummary();
  }
  return null;
}

/**
 * Get Intelligent Router
 */
async function getIntelligentRouter() {
  if (!intelligentRouter) {
    try {
      const path = require('path');
      const routerPath = path.join(process.cwd(), '../lib/intelligence/intelligentRouter');
      const { getIntelligentRouter } = require(routerPath);
      intelligentRouter = getIntelligentRouter();
      await intelligentRouter.initialize();
    } catch (error) {
      console.debug('[API Middleware] Intelligent router not available:', error.message);
    }
  }
  return intelligentRouter;
}

/**
 * Get Auto-Optimizer
 */
async function getAutoOptimizer() {
  if (!autoOptimizer) {
    try {
      const path = require('path');
      const optimizerPath = path.join(process.cwd(), '../lib/intelligence/autoOptimizer');
      const { getAutoOptimizer } = require(optimizerPath);
      autoOptimizer = getAutoOptimizer();
      await autoOptimizer.initialize();
    } catch (error) {
      console.debug('[API Middleware] Auto-optimizer not available:', error.message);
    }
  }
  return autoOptimizer;
}

/**
 * Get Trend Analyzer
 */
async function getTrendAnalyzer() {
  if (!trendAnalyzer) {
    try {
      const path = require('path');
      const analyzerPath = path.join(process.cwd(), '../lib/analytics/trendAnalyzer');
      const { getTrendAnalyzer } = require(analyzerPath);
      trendAnalyzer = getTrendAnalyzer();
      await trendAnalyzer.initialize();
    } catch (error) {
      console.debug('[API Middleware] Trend analyzer not available:', error.message);
    }
  }
  return trendAnalyzer;
}

/**
 * Get Anomaly Detector
 */
async function getAnomalyDetector() {
  if (!anomalyDetector) {
    try {
      const path = require('path');
      const detectorPath = path.join(process.cwd(), '../lib/analytics/anomalyDetector');
      const { getAnomalyDetector } = require(detectorPath);
      anomalyDetector = getAnomalyDetector();
      await anomalyDetector.initialize();
    } catch (error) {
      console.debug('[API Middleware] Anomaly detector not available:', error.message);
    }
  }
  return anomalyDetector;
}

/**
 * Analyze trends from performance metrics
 */
export async function analyzeTrends(endpoint: string, timeRange: number = 3600000) {
  const analyzer = await getTrendAnalyzer();
  const monitor = await getPerformanceMonitor();
  
  if (!analyzer || !monitor) {
    return null;
  }

  try {
    // Get historical metrics
    const historical = monitor.getHistoricalMetrics('responseTime', timeRange);
    
    if (historical.data.length < 2) {
      return null;
    }

    // Analyze trends
    const trendAnalysis = analyzer.analyzeTrends(historical.data, {
      metric: 'value',
      timeWindow: Math.floor(timeRange / (24 * 60 * 60 * 1000)) || 7
    });

    return trendAnalysis;
  } catch (error) {
    console.debug('[API Middleware] Trend analysis failed:', error);
    return null;
  }
}

/**
 * Detect anomalies in real-time
 */
export async function detectAnomalies(endpoint: string, value: number, context: any = {}) {
  const detector = await getAnomalyDetector();
  
  if (!detector) {
    return null;
  }

  try {
    const result = detector.detectRealTime(value, {
      endpoint,
      ...context
    });

    return result;
  } catch (error) {
    console.debug('[API Middleware] Anomaly detection failed:', error);
    return null;
  }
}

/**
 * Trigger auto-optimization
 */
export async function triggerAutoOptimization() {
  const optimizer = await getAutoOptimizer();
  const monitor = await getPerformanceMonitor();
  
  if (!optimizer || !monitor) {
    return null;
  }

  try {
    // Get current performance metrics
    const stats = monitor.getPerformanceSummary();
    
    // Extract metrics for optimization
    const metrics = {
      cacheHitRate: stats.metrics.cache_hit?.avg || 0,
      memoryUsage: stats.metrics.memoryUsage?.avg || 0,
      throughput: stats.metrics.throughput?.avg || 0,
      avgLatency: stats.metrics.responseTime?.avg || 0,
      timeoutRate: stats.metrics.timeoutRate?.avg || 0,
      cpuUsage: stats.metrics.cpuUsage?.avg || 0
    };

    // Trigger optimization
    const optimization = await optimizer.autoOptimize(metrics);
    
    return optimization;
  } catch (error) {
    console.debug('[API Middleware] Auto-optimization failed:', error);
    return null;
  }
}

/**
 * Get Intelligent Router (exported for use in routes)
 */
export async function getIntelligentRouterService() {
  return await getIntelligentRouter();
}

/**
 * Get Auto-Optimizer (exported for use in routes)
 */
export async function getAutoOptimizerService() {
  return await getAutoOptimizer();
}

/**
 * Get Trend Analyzer (exported for use in routes)
 */
export async function getTrendAnalyzerService() {
  return await getTrendAnalyzer();
}

/**
 * Get Anomaly Detector (exported for use in routes)
 */
export async function getAnomalyDetectorService() {
  return await getAnomalyDetector();
}

/**
 * Get Security Enhancer
 */
async function getSecurityEnhancer() {
  if (!securityEnhancer) {
    try {
      const path = require('path');
      const securityPath = path.join(process.cwd(), '../lib/resilience/securityEnhancer');
      const { getSecurityEnhancer: getSecurityEnhancerService } = require(securityPath);
      securityEnhancer = getSecurityEnhancerService();
      await securityEnhancer.initialize();
    } catch (error) {
      console.debug('[API Middleware] Security enhancer not available:', error.message);
    }
  }
  return securityEnhancer;
}

/**
 * Get Database Optimizer
 */
async function getDatabaseOptimizer() {
  if (!databaseOptimizer) {
    try {
      const path = require('path');
      const dbPath = path.join(process.cwd(), '../lib/scale/databaseOptimizer');
      const { getDatabaseOptimizer: getDatabaseOptimizerService } = require(dbPath);
      databaseOptimizer = getDatabaseOptimizerService();
      await databaseOptimizer.initialize();
    } catch (error) {
      console.debug('[API Middleware] Database optimizer not available:', error.message);
    }
  }
  return databaseOptimizer;
}

/**
 * Get BI Integration
 */
async function getBIIntegration() {
  if (!biIntegration) {
    try {
      const path = require('path');
      const biPath = path.join(process.cwd(), '../lib/analytics/biIntegration');
      const { getBIIntegration: getBIIntegrationService } = require(biPath);
      biIntegration = getBIIntegrationService();
      await biIntegration.initialize();
    } catch (error) {
      console.debug('[API Middleware] BI integration not available:', error.message);
    }
  }
  return biIntegration;
}

/**
 * Validate and sanitize request
 */
export async function validateAndSanitizeRequest(body: any, schema: Record<string, any>) {
  const security = await getSecurityEnhancer();
  if (!security) {
    return { valid: true, sanitized: body }; // No security enhancer, skip validation
  }

  try {
    // Validate request
    const validation = security.validateRequest(body, schema);
    
    if (!validation.valid) {
      return {
        valid: false,
        errors: validation.errors,
        sanitized: null
      };
    }

    // Sanitize output
    const sanitized = security.sanitizeOutput(body, 'xss');
    
    return {
      valid: true,
      sanitized,
      errors: []
    };
  } catch (error) {
    console.debug('[API Middleware] Validation failed:', error);
    return { valid: true, sanitized: body }; // Fallback to original
  }
}

/**
 * Optimize database query
 */
export async function optimizeQuery(query: string, params: any[] = []) {
  const optimizer = await getDatabaseOptimizer();
  if (!optimizer) {
    return { query, params }; // No optimizer, return original
  }

  try {
    const result = await optimizer.optimizeQuery(query, params);
    return {
      query: result.optimized || query,
      params,
      analysis: result.analysis
    };
  } catch (error) {
    console.debug('[API Middleware] Query optimization failed:', error);
    return { query, params }; // Fallback to original
  }
}

/**
 * Export data for BI
 */
export async function exportForBI(data: any[], format: string = 'csv') {
  const bi = await getBIIntegration();
  if (!bi) {
    return null;
  }

  try {
    const exported = await bi.exportForBI(data, format);
    return exported;
  } catch (error) {
    console.debug('[API Middleware] BI export failed:', error);
    return null;
  }
}

/**
 * Get Security Enhancer (exported for use in routes)
 */
export async function getSecurityEnhancerService() {
  return await getSecurityEnhancer();
}

/**
 * Get Database Optimizer (exported for use in routes)
 */
export async function getDatabaseOptimizerService() {
  return await getDatabaseOptimizer();
}

/**
 * Get BI Integration (exported for use in routes)
 */
export async function getBIIntegrationService() {
  return await getBIIntegration();
}

/**
 * Get Self-Learning
 */
async function getSelfLearning() {
  if (!selfLearning) {
    try {
      const path = require('path');
      const learningPath = path.join(process.cwd(), '../lib/intelligence/selfLearning');
      const { getSelfLearning: getSelfLearningService } = require(learningPath);
      selfLearning = getSelfLearningService();
      await selfLearning.initialize();
    } catch (error) {
      console.debug('[API Middleware] Self-learning not available:', error.message);
    }
  }
  return selfLearning;
}

/**
 * Get Recommendation Engine
 */
async function getRecommendationEngine() {
  if (!recommendationEngine) {
    try {
      const path = require('path');
      const recPath = path.join(process.cwd(), '../lib/intelligence/recommendationEngine');
      const { getRecommendationEngine: getRecommendationEngineService } = require(recPath);
      recommendationEngine = getRecommendationEngineService();
      await recommendationEngine.initialize();
    } catch (error) {
      console.debug('[API Middleware] Recommendation engine not available:', error.message);
    }
  }
  return recommendationEngine;
}

/**
 * Learn from outcome
 */
export async function learnFromOutcome(action: string, outcome: any, reward: number) {
  const learning = await getSelfLearning();
  if (!learning) {
    return null;
  }

  try {
    // Use learnFromExperience if learnFromOutcome doesn't exist
    const result = learning.learnFromExperience 
      ? learning.learnFromExperience(action, reward, outcome)
      : learning.learnFromOutcome 
        ? learning.learnFromOutcome(action, outcome, reward)
        : null;
    return result;
  } catch (error) {
    console.debug('[API Middleware] Learning from outcome failed:', error);
    return null;
  }
}

/**
 * Get recommendations
 */
export async function getRecommendations(userId: string, context: any = {}) {
  const engine = await getRecommendationEngine();
  if (!engine) {
    return null;
  }

  try {
    const recommendations = await engine.recommend(userId, 'hybrid', {
      limit: 10,
      context
    });
    return recommendations;
  } catch (error) {
    console.debug('[API Middleware] Recommendation generation failed:', error);
    return null;
  }
}

/**
 * Get Self-Learning (exported for use in routes)
 */
export async function getSelfLearningService() {
  return await getSelfLearning();
}

/**
 * Get Recommendation Engine (exported for use in routes)
 */
export async function getRecommendationEngineService() {
  return await getRecommendationEngine();
}

/**
 * Get Advanced Scaler
 */
async function getAdvancedScaler() {
  if (!advancedScaler) {
    try {
      const path = require('path');
      const scalerPath = path.join(process.cwd(), '../lib/scale/advancedScaler');
      const { getAdvancedScaler: getAdvancedScalerService } = require(scalerPath);
      advancedScaler = getAdvancedScalerService();
      await advancedScaler.initialize();
    } catch (error) {
      console.debug('[API Middleware] Advanced scaler not available:', error.message);
    }
  }
  return advancedScaler;
}

/**
 * Get Resource Optimizer
 */
async function getResourceOptimizer() {
  if (!resourceOptimizer) {
    try {
      const path = require('path');
      const optimizerPath = path.join(process.cwd(), '../lib/scale/resourceOptimizer');
      const { getResourceOptimizer: getResourceOptimizerService } = require(optimizerPath);
      resourceOptimizer = getResourceOptimizerService();
      await resourceOptimizer.initialize();
    } catch (error) {
      console.debug('[API Middleware] Resource optimizer not available:', error.message);
    }
  }
  return resourceOptimizer;
}

/**
 * Get Advanced Load Balancer
 */
async function getAdvancedLoadBalancer() {
  if (!loadBalancerAdvanced) {
    try {
      const path = require('path');
      const balancerPath = path.join(process.cwd(), '../lib/scale/loadBalancerAdvanced');
      const { getLoadBalancerAdvanced } = require(balancerPath);
      loadBalancerAdvanced = getLoadBalancerAdvanced();
      await loadBalancerAdvanced.initialize();
    } catch (error) {
      console.debug('[API Middleware] Advanced load balancer not available:', error.message);
    }
  }
  return loadBalancerAdvanced;
}

/**
 * Check if scaling is needed
 */
export async function checkScalingNeeds() {
  const scaler = await getAdvancedScaler();
  const monitor = await getPerformanceMonitor();
  
  if (!scaler || !monitor) {
    return null;
  }

  try {
    const stats = monitor.getPerformanceSummary();
    const metrics = {
      cpuUsage: stats.metrics.cpuUsage?.avg || 0,
      memoryUsage: stats.metrics.memoryUsage?.avg || 0,
      throughput: stats.metrics.throughput?.avg || 0,
      avgLatency: stats.metrics.responseTime?.avg || 0
    };

    // Check if scaling is needed
    const scalingDecision = await scaler.multiMetricScale(metrics);
    return scalingDecision;
  } catch (error) {
    console.debug('[API Middleware] Scaling check failed:', error);
    return null;
  }
}

/**
 * Optimize resources
 */
export async function optimizeResources() {
  const optimizer = await getResourceOptimizer();
  const monitor = await getPerformanceMonitor();
  
  if (!optimizer || !monitor) {
    return null;
  }

  try {
    const stats = monitor.getPerformanceSummary();
    const usage = {
      cpu: stats.metrics.cpuUsage?.avg || 0,
      memory: stats.metrics.memoryUsage?.avg || 0,
      network: stats.metrics.throughput?.avg || 0
    };

    const optimization = await optimizer.optimizeAllocation(usage);
    return optimization;
  } catch (error) {
    console.debug('[API Middleware] Resource optimization failed:', error);
    return null;
  }
}

/**
 * Get Advanced Scaler (exported for use in routes)
 */
export async function getAdvancedScalerService() {
  return await getAdvancedScaler();
}

/**
 * Get Resource Optimizer (exported for use in routes)
 */
export async function getResourceOptimizerService() {
  return await getResourceOptimizer();
}

/**
 * Get Advanced Load Balancer (exported for use in routes)
 */
export async function getAdvancedLoadBalancerService() {
  return await getAdvancedLoadBalancer();
}

/**
 * Get Production Monitor
 */
async function getProductionMonitor() {
  if (!productionMonitor) {
    try {
      const path = require('path');
      const monitorPath = path.join(process.cwd(), '../lib/monitoring/productionMonitor');
      const { getProductionMonitor } = require(monitorPath);
      productionMonitor = getProductionMonitor();
      await productionMonitor.initialize();
    } catch (error) {
      console.debug('[API Middleware] Production monitor not available:', error.message);
    }
  }
  return productionMonitor;
}

/**
 * Get Production Monitor (exported for use in routes)
 */
export async function getProductionMonitorService() {
  return await getProductionMonitor();
}

/**
 * Get Circuit Breaker Service
 */
async function getCircuitBreaker() {
  if (!circuitBreaker) {
    try {
      const path = require('path');
      const breakerPath = path.join(process.cwd(), '../lib/resilience/circuitBreaker');
      const { getCircuitBreaker: getCircuitBreakerService } = require(breakerPath);
      circuitBreaker = getCircuitBreakerService();
      await circuitBreaker.initialize?.();
    } catch (error) {
      console.debug('[API Middleware] Circuit breaker not available:', error.message);
    }
  }
  return circuitBreaker;
}

/**
 * Get Circuit Breaker Service (exported for use in routes)
 */
export async function getCircuitBreakerService() {
  return await getCircuitBreaker();
}

/**
 * Get Disaster Recovery Service
 */
async function getDisasterRecovery() {
  if (!disasterRecovery) {
    try {
      const path = require('path');
      const recoveryPath = path.join(process.cwd(), '../lib/resilience/disasterRecovery');
      const { getDisasterRecovery: getDisasterRecoveryService } = require(recoveryPath);
      disasterRecovery = getDisasterRecoveryService();
      await disasterRecovery.initialize?.();
    } catch (error) {
      console.debug('[API Middleware] Disaster recovery not available:', error.message);
    }
  }
  return disasterRecovery;
}

/**
 * Get Disaster Recovery Service (exported for use in routes)
 */
export async function getDisasterRecoveryService() {
  return await getDisasterRecovery();
}

