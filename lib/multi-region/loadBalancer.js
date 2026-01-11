/**
 * Load Balancer Service
 * Routes requests across regions based on strategy
 * 
 * Month 7: Week 2 - Multi-Region Deployment
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
const { getRegionManager } = require('./regionManager');
const logger = createLogger('LoadBalancer');

class LoadBalancer {
  constructor() {
    this.routingStrategy = 'latency';
    this.requestCounts = new Map();
    this.regionWeights = new Map();
  }

  /**
   * Initialize load balancer
   */
  async initialize() {
    try {
      const regionManager = getRegionManager();
      await regionManager.initialize();

      // Initialize region weights
      const regions = regionManager.listRegions();
      for (const region of regions) {
        this.regionWeights.set(region.id, 1.0);
        this.requestCounts.set(region.id, 0);
      }

      logger.info('✅ Load balancer initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize load balancer:', error);
      return false;
    }
  }

  /**
   * Route request to region
   */
  async routeRequest(request, strategy = null) {
    const routingStrategy = strategy || this.routingStrategy;
    const regionManager = getRegionManager();

    // Get active regions
    const activeRegions = regionManager.getActiveRegions();
    if (activeRegions.length === 0) {
      throw new Error('No active regions available');
    }

    let selectedRegion = null;

    switch (routingStrategy) {
      case 'latency':
        selectedRegion = this.routeByLatency(activeRegions);
        break;

      case 'health':
        selectedRegion = this.routeByHealth(activeRegions, regionManager);
        break;

      case 'geographic':
        selectedRegion = this.routeByGeographic(activeRegions, request);
        break;

      case 'round-robin':
        selectedRegion = this.routeRoundRobin(activeRegions);
        break;

      case 'weighted':
        selectedRegion = this.routeWeighted(activeRegions);
        break;

      default:
        selectedRegion = activeRegions[0];
    }

    // Update request count
    const count = this.requestCounts.get(selectedRegion.id) || 0;
    this.requestCounts.set(selectedRegion.id, count + 1);

    logger.debug(`Request routed to region: ${selectedRegion.id} (strategy: ${routingStrategy})`);
    return {
      region: selectedRegion,
      endpoint: selectedRegion.endpoint,
      strategy: routingStrategy
    };
  }

  /**
   * Route by latency
   */
  routeByLatency(regions) {
    const regionsWithLatency = regions.filter(r => r.latency !== null);
    if (regionsWithLatency.length === 0) {
      return regions[0];
    }

    return regionsWithLatency.sort((a, b) => a.latency - b.latency)[0];
  }

  /**
   * Route by health
   */
  routeByHealth(regions, regionManager) {
    const healthyRegions = regions.filter(r => {
      const health = regionManager.getRegionHealth(r.id);
      return health && health.status === 'healthy';
    });

    if (healthyRegions.length === 0) {
      return regions[0]; // Fallback to any region
    }

    // Select region with lowest failure count
    return healthyRegions.map(r => ({
      region: r,
      health: regionManager.getRegionHealth(r.id)
    })).sort((a, b) => a.health.consecutiveFailures - b.health.consecutiveFailures)[0].region;
  }

  /**
   * Route by geographic location
   */
  routeByGeographic(regions, request) {
    // Simple geographic routing based on region ID prefix
    const clientLocation = request.clientLocation || 'us';
    
    const regionMap = {
      'us': ['us-east-1', 'us-west-2'],
      'eu': ['eu-west-1'],
      'ap': ['ap-southeast-1']
    };

    const preferredRegions = regionMap[clientLocation] || [];
    const preferred = regions.find(r => preferredRegions.includes(r.id));
    
    return preferred || regions[0];
  }

  /**
   * Round-robin routing
   */
  routeRoundRobin(regions) {
    // Get region with least requests
    const sorted = regions.map(r => ({
      region: r,
      count: this.requestCounts.get(r.id) || 0
    })).sort((a, b) => a.count - b.count);

    return sorted[0].region;
  }

  /**
   * Weighted routing
   */
  routeWeighted(regions) {
    // Calculate total weight
    const totalWeight = regions.reduce((sum, r) => {
      return sum + (this.regionWeights.get(r.id) || 1.0);
    }, 0);

    // Select based on weight
    let random = Math.random() * totalWeight;
    for (const region of regions) {
      const weight = this.regionWeights.get(region.id) || 1.0;
      random -= weight;
      if (random <= 0) {
        return region;
      }
    }

    return regions[0];
  }

  /**
   * Set routing strategy
   */
  setRoutingStrategy(strategy) {
    this.routingStrategy = strategy;
    logger.info(`Routing strategy set to: ${strategy}`);
  }

  /**
   * Set region weight
   */
  setRegionWeight(regionId, weight) {
    this.regionWeights.set(regionId, weight);
    logger.info(`Region ${regionId} weight set to: ${weight}`);
  }

  /**
   * Get routing statistics
   */
  getRoutingStatistics() {
    return {
      strategy: this.routingStrategy,
      requestCounts: Object.fromEntries(this.requestCounts),
      regionWeights: Object.fromEntries(this.regionWeights)
    };
  }
}

// Singleton instance
let instance = null;

function getLoadBalancer() {
  if (!instance) {
    instance = new LoadBalancer();
  }
  return instance;
}

module.exports = {
  LoadBalancer,
  getLoadBalancer
};

