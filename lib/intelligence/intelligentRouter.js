/**
 * Intelligent Router Service
 * ML-based intelligent request routing
 * 
 * Month 9: Advanced Intelligence
 */

// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}
const { getLoadBalancer } = require('../multi-region/loadBalancer');
const { getRegionManager } = require('../multi-region/regionManager');
const logger = createLogger('IntelligentRouter');

class IntelligentRouter {
  constructor() {
    this.routingHistory = [];
    this.routingModel = null;
    this.performanceData = new Map();
  }

  /**
   * Initialize intelligent router
   */
  async initialize() {
    try {
      this.loadBalancer = getLoadBalancer();
      await this.loadBalancer.initialize();
      
      this.regionManager = getRegionManager();
      await this.regionManager.initialize();

      logger.info('✅ Intelligent router initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize intelligent router:', error);
      return false;
    }
  }

  /**
   * Route request intelligently
   */
  async routeIntelligently(request, context = {}) {
    try {
      // Analyze request context
      const analysis = this.analyzeRequest(request, context);

      // Predict best route
      const prediction = this.predictBestRoute(analysis, context);

      // Execute routing
      const routing = await this.loadBalancer.routeRequest(request, prediction.strategy);

      // Record routing decision
      this.recordRouting(routing, analysis, prediction);

      return {
        ...routing,
        intelligence: {
          analysis,
          prediction,
          confidence: prediction.confidence
        }
      };
    } catch (error) {
      logger.error('Intelligent routing failed:', error);
      // Fallback to standard routing
      return await this.loadBalancer.routeRequest(request, 'latency');
    }
  }

  /**
   * Analyze request
   */
  analyzeRequest(request, context) {
    return {
      requestType: context.requestType || 'prediction',
      priority: context.priority || 'normal',
      tenantId: context.tenantId || null,
      dataSize: this.estimateDataSize(request),
      complexity: this.estimateComplexity(request),
      timestamp: Date.now()
    };
  }

  /**
   * Estimate data size
   */
  estimateDataSize(request) {
    try {
      return JSON.stringify(request).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Estimate complexity
   */
  estimateComplexity(request) {
    // Simplified complexity estimation
    const keys = Object.keys(request || {});
    if (keys.length < 5) return 'simple';
    if (keys.length < 10) return 'medium';
    return 'complex';
  }

  /**
   * Predict best route
   */
  predictBestRoute(analysis, context) {
    // ML-based prediction (simplified)
    const regions = this.regionManager.getActiveRegions();
    const scores = [];

    for (const region of regions) {
      const health = this.regionManager.getRegionHealth(region.id);
      let score = 0.5;

      // Factor 1: Region health
      if (health && health.status === 'healthy') {
        score += 0.2;
      }

      // Factor 2: Latency
      if (region.latency !== null) {
        const latencyScore = 1 - Math.min(region.latency / 1000, 1); // Normalize to 0-1
        score += latencyScore * 0.2;
      }

      // Factor 3: Historical performance
      const perfData = this.performanceData.get(region.id);
      if (perfData && perfData.successRate > 0.95) {
        score += 0.1;
      }

      // Factor 4: Request complexity match
      if (analysis.complexity === 'simple' && region.capacity > 500) {
        score += 0.1;
      }

      scores.push({
        region: region.id,
        score,
        strategy: 'intelligent'
      });
    }

    // Select best region
    const best = scores.sort((a, b) => b.score - a.score)[0];

    return {
      strategy: 'intelligent',
      region: best.region,
      confidence: best.score,
      alternatives: scores.slice(1, 3)
    };
  }

  /**
   * Record routing decision
   */
  recordRouting(routing, analysis, prediction) {
    const record = {
      routing,
      analysis,
      prediction,
      timestamp: Date.now()
    };

    this.routingHistory.push(record);

    // Keep only last 10000 records
    if (this.routingHistory.length > 10000) {
      this.routingHistory.shift();
    }
  }

  /**
   * Update performance data
   */
  updatePerformance(regionId, success, latency) {
    const perf = this.performanceData.get(regionId) || {
      requests: 0,
      successes: 0,
      failures: 0,
      totalLatency: 0,
      successRate: 0.95
    };

    perf.requests++;
    if (success) {
      perf.successes++;
    } else {
      perf.failures++;
    }
    perf.totalLatency += latency;
    perf.successRate = perf.successes / perf.requests;
    perf.avgLatency = perf.totalLatency / perf.requests;

    this.performanceData.set(regionId, perf);
  }

  /**
   * Get routing statistics
   */
  getRoutingStatistics() {
    const stats = {
      totalRoutings: this.routingHistory.length,
      byStrategy: {},
      byRegion: {},
      avgConfidence: 0
    };

    let totalConfidence = 0;
    for (const record of this.routingHistory) {
      const strategy = record.prediction.strategy;
      const region = record.routing.region.id;

      stats.byStrategy[strategy] = (stats.byStrategy[strategy] || 0) + 1;
      stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;
      totalConfidence += record.prediction.confidence || 0;
    }

    stats.avgConfidence = this.routingHistory.length > 0 
      ? totalConfidence / this.routingHistory.length 
      : 0;

    return stats;
  }
}

// Singleton instance
let instance = null;

function getIntelligentRouter() {
  if (!instance) {
    instance = new IntelligentRouter();
  }
  return instance;
}

module.exports = {
  IntelligentRouter,
  getIntelligentRouter
};

