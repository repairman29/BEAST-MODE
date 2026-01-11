/**
 * Multi-Region Manager
 * Manages regions, health checks, and region selection
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
const logger = createLogger('RegionManager');

class RegionManager {
  constructor() {
    this.regions = new Map();
    this.regionHealth = new Map();
    this.defaultRegion = 'us-east-1';
  }

  /**
   * Initialize region manager
   */
  async initialize() {
    try {
      // Register default regions
      this.registerDefaultRegions();
      logger.info('✅ Region manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize region manager:', error);
      return false;
    }
  }

  /**
   * Register default regions
   */
  registerDefaultRegions() {
    const defaultRegions = [
      { id: 'us-east-1', name: 'US East (N. Virginia)', endpoint: 'https://api-us-east.playsmuggler.com' },
      { id: 'us-west-2', name: 'US West (Oregon)', endpoint: 'https://api-us-west.playsmuggler.com' },
      { id: 'eu-west-1', name: 'Europe (Ireland)', endpoint: 'https://api-eu-west.playsmuggler.com' },
      { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', endpoint: 'https://api-ap-southeast.playsmuggler.com' }
    ];

    for (const region of defaultRegions) {
      this.registerRegion(region);
    }
  }

  /**
   * Register a region
   */
  registerRegion(config) {
    const region = {
      id: config.id,
      name: config.name || config.id,
      endpoint: config.endpoint,
      status: 'active',
      priority: config.priority || 1,
      capacity: config.capacity || 1000,
      latency: null,
      lastHealthCheck: null,
      metadata: config.metadata || {}
    };

    this.regions.set(region.id, region);
    this.regionHealth.set(region.id, {
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0,
      responseTime: null
    });

    logger.info(`Region registered: ${region.id} (${region.name})`);
    return region;
  }

  /**
   * Get region
   */
  getRegion(regionId) {
    return this.regions.get(regionId) || null;
  }

  /**
   * List all regions
   */
  listRegions() {
    return Array.from(this.regions.values());
  }

  /**
   * Get active regions
   */
  getActiveRegions() {
    return Array.from(this.regions.values())
      .filter(r => r.status === 'active');
  }

  /**
   * Health check for region
   */
  async healthCheck(regionId) {
    const region = this.regions.get(regionId);
    if (!region) {
      throw new Error(`Region ${regionId} not found`);
    }

    const startTime = Date.now();
    let healthy = false;
    let responseTime = null;

    try {
      // Simple health check (would use actual endpoint in production)
      const response = await fetch(`${region.endpoint}/health`, {
        method: 'GET',
        timeout: 5000
      }).catch(() => null);

      responseTime = Date.now() - startTime;
      healthy = response && response.ok;

      // Update health status
      const health = this.regionHealth.get(regionId);
      if (healthy) {
        health.status = 'healthy';
        health.consecutiveFailures = 0;
        health.responseTime = responseTime;
      } else {
        health.status = 'unhealthy';
        health.consecutiveFailures++;
        health.responseTime = responseTime;
      }

      health.lastCheck = Date.now();
      region.lastHealthCheck = Date.now();
      region.latency = responseTime;

      this.regionHealth.set(regionId, health);
      this.regions.set(regionId, region);

      logger.debug(`Health check for ${regionId}: ${healthy ? 'healthy' : 'unhealthy'} (${responseTime}ms)`);
      return { healthy, responseTime };
    } catch (error) {
      responseTime = Date.now() - startTime;
      const health = this.regionHealth.get(regionId);
      health.status = 'unhealthy';
      health.consecutiveFailures++;
      health.responseTime = responseTime;
      health.lastCheck = Date.now();
      this.regionHealth.set(regionId, health);

      logger.warn(`Health check failed for ${regionId}:`, error.message);
      return { healthy: false, responseTime, error: error.message };
    }
  }

  /**
   * Health check all regions
   */
  async healthCheckAll() {
    const regions = Array.from(this.regions.keys());
    const results = await Promise.all(
      regions.map(async (regionId) => {
        try {
          return await this.healthCheck(regionId);
        } catch (error) {
          return { healthy: false, error: error.message };
        }
      })
    );

    return results;
  }

  /**
   * Select best region
   */
  selectBestRegion(strategy = 'latency') {
    const activeRegions = this.getActiveRegions();

    if (activeRegions.length === 0) {
      return this.defaultRegion;
    }

    switch (strategy) {
      case 'latency':
        // Select region with lowest latency
        const sortedByLatency = activeRegions
          .filter(r => r.latency !== null)
          .sort((a, b) => a.latency - b.latency);
        return sortedByLatency.length > 0 ? sortedByLatency[0].id : activeRegions[0].id;

      case 'health':
        // Select healthiest region
        const sortedByHealth = activeRegions
          .map(r => ({
            region: r,
            health: this.regionHealth.get(r.id)
          }))
          .filter(rh => rh.health && rh.health.status === 'healthy')
          .sort((a, b) => a.health.consecutiveFailures - b.health.consecutiveFailures);
        return sortedByHealth.length > 0 ? sortedByHealth[0].region.id : activeRegions[0].id;

      case 'capacity':
        // Select region with most capacity
        const sortedByCapacity = activeRegions.sort((a, b) => b.capacity - a.capacity);
        return sortedByCapacity[0].id;

      case 'priority':
        // Select region with highest priority
        const sortedByPriority = activeRegions.sort((a, b) => b.priority - a.priority);
        return sortedByPriority[0].id;

      default:
        return activeRegions[0].id;
    }
  }

  /**
   * Get region health status
   */
  getRegionHealth(regionId) {
    return this.regionHealth.get(regionId) || null;
  }

  /**
   * Get all region health statuses
   */
  getAllRegionHealth() {
    const health = {};
    for (const [regionId, healthData] of this.regionHealth.entries()) {
      const region = this.regions.get(regionId);
      health[regionId] = {
        ...healthData,
        region: region ? { id: region.id, name: region.name, endpoint: region.endpoint } : null
      };
    }
    return health;
  }

  /**
   * Set region status
   */
  setRegionStatus(regionId, status) {
    const region = this.regions.get(regionId);
    if (!region) {
      throw new Error(`Region ${regionId} not found`);
    }

    region.status = status;
    this.regions.set(regionId, region);
    logger.info(`Region ${regionId} status set to: ${status}`);
    return region;
  }
}

// Singleton instance
let instance = null;

function getRegionManager() {
  if (!instance) {
    instance = new RegionManager();
  }
  return instance;
}

module.exports = {
  RegionManager,
  getRegionManager
};

