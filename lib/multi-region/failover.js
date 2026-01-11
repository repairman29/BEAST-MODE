/**
 * Failover Service
 * Handles automatic failover and recovery
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
const { getLoadBalancer } = require('./loadBalancer');
const logger = createLogger('Failover');

class Failover {
  constructor() {
    this.failoverConfig = {
      healthCheckInterval: 30000, // 30 seconds
      failureThreshold: 3, // 3 consecutive failures
      recoveryThreshold: 2, // 2 consecutive successes
      autoFailover: true
    };
    this.failoverHistory = [];
    this.activeFailovers = new Map();
  }

  /**
   * Initialize failover service
   */
  async initialize() {
    try {
      const regionManager = getRegionManager();
      await regionManager.initialize();

      // Start health monitoring
      this.startHealthMonitoring();
      logger.info('✅ Failover service initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize failover service:', error);
      return false;
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    setInterval(async () => {
      await this.checkRegionsAndFailover();
    }, this.failoverConfig.healthCheckInterval);
  }

  /**
   * Check regions and trigger failover if needed
   */
  async checkRegionsAndFailover() {
    const regionManager = getRegionManager();
    const regions = regionManager.listRegions();

    for (const region of regions) {
      const health = regionManager.getRegionHealth(region.id);
      
      if (!health) continue;

      // Check if region should failover
      if (health.consecutiveFailures >= this.failoverConfig.failureThreshold) {
        if (region.status === 'active' && this.failoverConfig.autoFailover) {
          await this.triggerFailover(region.id);
        }
      }

      // Check if region should recover
      if (region.status === 'failed' && health.status === 'healthy') {
        if (health.consecutiveFailures === 0) {
          await this.triggerRecovery(region.id);
        }
      }
    }
  }

  /**
   * Trigger failover for region
   */
  async triggerFailover(regionId) {
    try {
      logger.warn(`⚠️  Failover triggered for region: ${regionId}`);

      const regionManager = getRegionManager();
      const region = regionManager.getRegion(regionId);
      
      if (!region) {
        throw new Error(`Region ${regionId} not found`);
      }

      // Mark region as failed
      regionManager.setRegionStatus(regionId, 'failed');

      // Find alternative region
      const alternativeRegion = this.selectAlternativeRegion(regionId);
      
      if (!alternativeRegion) {
        logger.error(`No alternative region available for failover from ${regionId}`);
        return { success: false, error: 'No alternative region available' };
      }

      // Record failover
      const failover = {
        id: `failover_${Date.now()}`,
        fromRegion: regionId,
        toRegion: alternativeRegion.id,
        triggeredAt: Date.now(),
        status: 'active'
      };

      this.activeFailovers.set(regionId, failover);
      this.failoverHistory.push(failover);

      // Replicate data to alternative region
      const { getDataReplication } = require('./dataReplication');
      const replication = getDataReplication();
      // Would replicate models and data to alternative region

      logger.info(`✅ Failover complete: ${regionId} → ${alternativeRegion.id}`);
      return {
        success: true,
        failover,
        alternativeRegion
      };
    } catch (error) {
      logger.error('Failover failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Select alternative region
   */
  selectAlternativeRegion(failedRegionId) {
    const regionManager = getRegionManager();
    const activeRegions = regionManager.getActiveRegions()
      .filter(r => r.id !== failedRegionId);

    if (activeRegions.length === 0) {
      return null;
    }

    // Select healthiest region
    const loadBalancer = getLoadBalancer();
    const routing = loadBalancer.routeByHealth(activeRegions, regionManager);
    
    return routing || activeRegions[0];
  }

  /**
   * Trigger recovery for region
   */
  async triggerRecovery(regionId) {
    try {
      logger.info(`🔄 Recovery triggered for region: ${regionId}`);

      const regionManager = getRegionManager();
      const region = regionManager.getRegion(regionId);
      
      if (!region) {
        throw new Error(`Region ${regionId} not found`);
      }

      // Verify region is healthy
      const healthCheck = await regionManager.healthCheck(regionId);
      if (!healthCheck.healthy) {
        logger.warn(`Region ${regionId} recovery aborted - still unhealthy`);
        return { success: false, reason: 'Region still unhealthy' };
      }

      // Mark region as active
      regionManager.setRegionStatus(regionId, 'active');

      // Record recovery
      const recovery = {
        id: `recovery_${Date.now()}`,
        region: regionId,
        recoveredAt: Date.now(),
        status: 'completed'
      };

      // Remove from active failovers
      this.activeFailovers.delete(regionId);

      logger.info(`✅ Recovery complete for region: ${regionId}`);
      return {
        success: true,
        recovery
      };
    } catch (error) {
      logger.error('Recovery failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get failover status
   */
  getFailoverStatus(regionId = null) {
    if (regionId) {
      return this.activeFailovers.get(regionId) || null;
    }

    return Array.from(this.activeFailovers.values());
  }

  /**
   * Get failover history
   */
  getFailoverHistory(limit = 50) {
    return this.failoverHistory.slice(-limit).reverse();
  }

  /**
   * Manual failover
   */
  async manualFailover(fromRegionId, toRegionId) {
    try {
      logger.info(`Manual failover: ${fromRegionId} → ${toRegionId}`);

      const regionManager = getRegionManager();
      regionManager.setRegionStatus(fromRegionId, 'failed');

      const failover = {
        id: `manual_failover_${Date.now()}`,
        fromRegion: fromRegionId,
        toRegion: toRegionId,
        triggeredAt: Date.now(),
        status: 'active',
        manual: true
      };

      this.activeFailovers.set(fromRegionId, failover);
      this.failoverHistory.push(failover);

      return {
        success: true,
        failover
      };
    } catch (error) {
      logger.error('Manual failover failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
let instance = null;

function getFailover() {
  if (!instance) {
    instance = new Failover();
  }
  return instance;
}

module.exports = {
  Failover,
  getFailover
};

