/**
 * Advanced Load Balancer Service
 * Enhanced routing with health checks, performance-based routing, dynamic weights
 * 
 * Month 10: Advanced Scaling & Performance Monitoring
 */

const { createLogger } = require('../utils/logger');
const { getLoadBalancer } = require('../multi-region/loadBalancer');
const logger = createLogger('LoadBalancerAdvanced');

class LoadBalancerAdvanced {
  constructor() {
    this.healthChecks = new Map();
    this.performanceMetrics = new Map();
    this.dynamicWeights = new Map();
    this.routingHistory = [];
  }

  /**
   * Initialize advanced load balancer
   */
  async initialize() {
    try {
      this.loadBalancer = getLoadBalancer();
      await this.loadBalancer.initialize();
      this.setupHealthChecks();
      logger.info('✅ Advanced load balancer initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize advanced load balancer:', error);
      return false;
    }
  }

  /**
   * Setup health checks
   */
  setupHealthChecks() {
    // Health check configuration
    this.healthCheckConfig = {
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      failureThreshold: 3,
      successThreshold: 2
    };
  }

  /**
   * Route request with advanced strategies
   */
  async routeAdvanced(request, strategy = 'performance', context = {}) {
    try {
      let routing = null;

      switch (strategy) {
        case 'health':
          routing = await this.healthBasedRouting(request, context);
          break;
        case 'performance':
          routing = await this.performanceBasedRouting(request, context);
          break;
        case 'weighted':
          routing = await this.weightedRouting(request, context);
          break;
        case 'adaptive':
          routing = await this.adaptiveRouting(request, context);
          break;
        default:
          routing = await this.loadBalancer.routeRequest(request, 'latency');
      }

      // Record routing
      this.recordRouting(routing, strategy, context);

      return routing;
    } catch (error) {
      logger.error('Advanced routing failed:', error);
      return await this.loadBalancer.routeRequest(request, 'latency');
    }
  }

  /**
   * Health-based routing
   */
  async healthBasedRouting(request, context) {
    // Get regions from region manager if available
    const { getRegionManager } = require('../multi-region/regionManager');
    const regionManager = getRegionManager();
    await regionManager.initialize();
    const allRegions = regionManager.regions ? Array.from(regionManager.regions.values()) : [];
    const healthyRegions = [];

    for (const region of allRegions) {
      const health = await this.checkHealth(region.id);
      if (health && health.status === 'healthy') {
        healthyRegions.push(region);
      }
    }

    if (healthyRegions.length === 0) {
      logger.warn('No healthy regions available, using fallback');
      return await this.loadBalancer.routeRequest(request, 'latency');
    }

    // Route to healthiest region
    const healthiest = healthyRegions.sort((a, b) => {
      const healthA = this.healthChecks.get(a.id) || { score: 0 };
      const healthB = this.healthChecks.get(b.id) || { score: 0 };
      return healthB.score - healthA.score;
    })[0];

    return {
      region: healthiest,
      strategy: 'health',
      healthScore: this.healthChecks.get(healthiest.id)?.score || 0
    };
  }

  /**
   * Performance-based routing
   */
  async performanceBasedRouting(request, context) {
    // Get regions from region manager
    const { getRegionManager } = require('../multi-region/regionManager');
    const regionManager = getRegionManager();
    await regionManager.initialize();
    const regions = regionManager.regions ? Array.from(regionManager.regions.values()) : [];
    const scoredRegions = [];

    for (const region of regions) {
      // Get or create performance metrics
      if (!this.performanceMetrics.has(region.id)) {
        this.performanceMetrics.set(region.id, {
          avgLatency: 200,
          successRate: 0.95,
          throughput: 100
        });
      }
      const metrics = this.performanceMetrics.get(region.id);

      // Calculate performance score
      const latencyScore = 1 - Math.min(metrics.avgLatency / 1000, 1);
      const successScore = metrics.successRate;
      const throughputScore = Math.min(metrics.throughput / 1000, 1);

      const performanceScore = (latencyScore * 0.4 + successScore * 0.4 + throughputScore * 0.2);

      scoredRegions.push({
        region,
        score: performanceScore,
        metrics
      });
    }

    // Route to best performing region
    const best = scoredRegions.sort((a, b) => b.score - a.score)[0];

    return {
      region: best.region,
      strategy: 'performance',
      performanceScore: best.score,
      metrics: best.metrics
    };
  }

  /**
   * Weighted routing
   */
  async weightedRouting(request, context) {
    // Get regions from region manager
    const { getRegionManager } = require('../multi-region/regionManager');
    const regionManager = getRegionManager();
    await regionManager.initialize();
    const regions = regionManager.getActiveRegions();
    const weightedRegions = [];

    for (const region of regions) {
      const weight = this.dynamicWeights.get(region.id) || 1.0;
      weightedRegions.push({
        region,
        weight
      });
    }

    // Select region based on weights
    const totalWeight = weightedRegions.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const weighted of weightedRegions) {
      random -= weighted.weight;
      if (random <= 0) {
        return {
          region: weighted.region,
          strategy: 'weighted',
          weight: weighted.weight
        };
      }
    }

    // Fallback
    return {
      region: weightedRegions[0].region,
      strategy: 'weighted',
      weight: weightedRegions[0].weight
    };
  }

  /**
   * Adaptive routing
   */
  async adaptiveRouting(request, context) {
    // Get regions from region manager
    const { getRegionManager } = require('../multi-region/regionManager');
    const regionManager = getRegionManager();
    await regionManager.initialize();
    const regions = regionManager.getActiveRegions();
    const scoredRegions = [];

    for (const region of regions) {
      // Check health (simplified)
      const health = { status: 'healthy', score: 1.0 };
      if (!this.performanceMetrics.has(region.id)) {
        this.performanceMetrics.set(region.id, {
          avgLatency: 200,
          successRate: 0.95,
          throughput: 100
        });
      }
      const metrics = this.performanceMetrics.get(region.id);
      const weight = this.dynamicWeights.get(region.id) || 1.0;

      // Calculate adaptive score
      const healthScore = health.status === 'healthy' ? 1.0 : 0.0;
      const latencyScore = 1 - Math.min((metrics.avgLatency || 200) / 1000, 1);
      const successScore = metrics.successRate || 0.95;

      const adaptiveScore = (healthScore * 0.3 + latencyScore * 0.3 + successScore * 0.2 + weight * 0.2);

      scoredRegions.push({
        region,
        score: adaptiveScore,
        health,
        metrics,
        weight
      });
    }

    // Route to best adaptive score
    const best = scoredRegions.sort((a, b) => b.score - a.score)[0];

    return {
      region: best.region,
      strategy: 'adaptive',
      adaptiveScore: best.score,
      factors: {
        health: best.health.status,
        latency: best.metrics.avgLatency,
        success: best.metrics.successRate,
        weight: best.weight
      }
    };
  }

  /**
   * Check health
   */
  async checkHealth(regionId) {
    try {
      // Simulate health check
      const health = {
        regionId,
        status: 'healthy',
        score: 0.95,
        lastCheck: Date.now(),
        responseTime: 50
      };

      this.healthChecks.set(regionId, health);
      return health;
    } catch (error) {
      return {
        regionId,
        status: 'unhealthy',
        score: 0,
        lastCheck: Date.now()
      };
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(regionId, metrics) {
    this.performanceMetrics.set(regionId, {
      ...this.performanceMetrics.get(regionId),
      ...metrics,
      lastUpdate: Date.now()
    });
  }

  /**
   * Update dynamic weights
   */
  updateWeights(weights) {
    for (const [regionId, weight] of Object.entries(weights)) {
      this.dynamicWeights.set(regionId, weight);
    }
  }

  /**
   * Record routing
   */
  recordRouting(routing, strategy, context) {
    const record = {
      routing,
      strategy,
      context,
      timestamp: Date.now()
    };

    this.routingHistory.push(record);

    // Keep only last 10000 records
    if (this.routingHistory.length > 10000) {
      this.routingHistory.shift();
    }
  }

  /**
   * Get routing statistics
   */
  getRoutingStatistics() {
    const byStrategy = {};
    const byRegion = {};

    for (const record of this.routingHistory) {
      const strategy = record.strategy;
      const regionId = record.routing.region.id;

      byStrategy[strategy] = (byStrategy[strategy] || 0) + 1;
      byRegion[regionId] = (byRegion[regionId] || 0) + 1;
    }

    return {
      totalRoutings: this.routingHistory.length,
      byStrategy,
      byRegion,
      healthChecks: Array.from(this.healthChecks.values()),
      timestamp: Date.now()
    };
  }
}

// Singleton instance
let instance = null;

function getLoadBalancerAdvanced() {
  if (!instance) {
    instance = new LoadBalancerAdvanced();
  }
  return instance;
}

module.exports = {
  LoadBalancerAdvanced,
  getLoadBalancerAdvanced
};

