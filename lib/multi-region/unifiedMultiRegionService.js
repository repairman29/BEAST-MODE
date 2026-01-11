/**
 * Unified Multi-Region Service
 * Consolidates region management, replication, load balancing, failover, and monitoring
 * 
 * Phase 3, Week 1: Multi-Region Deployment
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
const { getDataReplication } = require('./dataReplication');
const { getLoadBalancer } = require('./loadBalancer');
const { getFailover } = require('./failover');
const { getCrossRegionMonitoring } = require('./crossRegionMonitoring');

const logger = createLogger('UnifiedMultiRegionService');

class UnifiedMultiRegionService {
  constructor() {
    this.initialized = false;
    this.regionManager = null;
    this.dataReplication = null;
    this.loadBalancer = null;
    this.failover = null;
    this.monitoring = null;
  }

  /**
   * Initialize unified multi-region service
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      // Initialize all multi-region services
      this.regionManager = getRegionManager();
      await this.regionManager.initialize();

      this.dataReplication = getDataReplication();
      await this.dataReplication.initialize();

      this.loadBalancer = getLoadBalancer();
      await this.loadBalancer.initialize();

      this.failover = getFailover();
      await this.failover.initialize();

      this.monitoring = getCrossRegionMonitoring();
      await this.monitoring.initialize();

      this.initialized = true;
      logger.info('✅ Unified multi-region service initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize unified multi-region service:', error);
      return false;
    }
  }

  // ============================================================================
  // REGION MANAGEMENT
  // ============================================================================

  /**
   * Register a region
   */
  async registerRegion(config) {
    await this.ensureInitialized();
    return this.regionManager.registerRegion(config);
  }

  /**
   * Get region status
   */
  async getRegionStatus(regionId) {
    await this.ensureInitialized();
    const region = this.regionManager.getRegion(regionId);
    if (!region) {
      return null;
    }
    const health = this.regionManager.getRegionHealth(regionId);
    return {
      region,
      health,
      status: region.status
    };
  }

  /**
   * Select best region
   */
  async selectBestRegion(strategy = 'latency') {
    await this.ensureInitialized();
    return this.regionManager.selectBestRegion(strategy);
  }

  // ============================================================================
  // DATA REPLICATION
  // ============================================================================

  /**
   * Replicate model to region
   */
  async replicateModel(modelId, regionId) {
    await this.ensureInitialized();
    return await this.dataReplication.replicateModel(modelId, regionId);
  }

  /**
   * Replicate metrics to region
   */
  async replicateMetrics(metrics, regionId) {
    await this.ensureInitialized();
    return await this.dataReplication.replicateMetrics(metrics, regionId);
  }

  /**
   * Sync configuration
   */
  async syncConfiguration(config, regionId) {
    await this.ensureInitialized();
    // Data replication doesn't have syncConfiguration, use replicateModel with config
    return await this.dataReplication.replicateModel(`config:${JSON.stringify(config)}`, regionId);
  }

  // ============================================================================
  // LOAD BALANCING
  // ============================================================================

  /**
   * Route request to region
   */
  async routeRequest(request, strategy = 'latency') {
    await this.ensureInitialized();
    return await this.loadBalancer.routeRequest(request, strategy);
  }

  /**
   * Update region weights
   */
  async updateRegionWeights(weights) {
    await this.ensureInitialized();
    // Load balancer has regionWeights map, update it directly
    for (const [regionId, weight] of Object.entries(weights)) {
      this.loadBalancer.regionWeights.set(regionId, weight);
    }
    return true;
  }

  // ============================================================================
  // FAILOVER
  // ============================================================================

  /**
   * Initiate failover
   */
  async initiateFailover(fromRegionId, toRegionId) {
    await this.ensureInitialized();
    return await this.failover.initiateFailover(fromRegionId, toRegionId);
  }

  /**
   * Recover region
   */
  async recoverRegion(regionId) {
    await this.ensureInitialized();
    return await this.failover.recoverRegion(regionId);
  }

  /**
   * Get failover status
   */
  async getFailoverStatus() {
    await this.ensureInitialized();
    return this.failover.getFailoverStatus();
  }

  // ============================================================================
  // MONITORING
  // ============================================================================

  /**
   * Aggregate metrics across regions
   */
  async aggregateMetrics(timeRange = 3600000) {
    await this.ensureInitialized();
    // Collect metrics in background (don't wait)
    this.monitoring.collectAllRegionMetrics().catch(() => {});
    // Aggregate immediately with what we have
    return this.monitoring.aggregateMetrics();
  }

  /**
   * Get global dashboard
   */
  async getGlobalDashboard() {
    await this.ensureInitialized();
    // Collect metrics in background (don't wait)
    this.monitoring.collectAllRegionMetrics().catch(() => {});
    // Get dashboard immediately with what we have
    return this.monitoring.getGlobalDashboard();
  }

  /**
   * Send global alert
   */
  async sendGlobalAlert(alert) {
    await this.ensureInitialized();
    return await this.monitoring.sendGlobalAlert(alert);
  }

  // ============================================================================
  // UNIFIED OPERATIONS
  // ============================================================================

  /**
   * Get global status (unified view)
   */
  async getGlobalStatus() {
    await this.ensureInitialized();

    const regions = this.regionManager.listRegions();
    const regionStatuses = {};
    
    for (const region of regions) {
      const health = this.regionManager.getRegionHealth(region.id);
      regionStatuses[region.id] = {
        region: {
          id: region.id,
          name: region.name,
          endpoint: region.endpoint,
          status: region.status
        },
        health,
        status: region.status
      };
    }

    const failoverStatus = this.failover.getFailoverStatus();
    const globalMetrics = await this.aggregateMetrics(3600000);
    const globalDashboard = await this.getGlobalDashboard();

    return {
      regions: regionStatuses,
      failover: failoverStatus,
      metrics: globalMetrics,
      dashboard: globalDashboard,
      timestamp: Date.now()
    };
  }

  /**
   * Ensure service is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      services: {
        regionManager: !!this.regionManager,
        dataReplication: !!this.dataReplication,
        loadBalancer: !!this.loadBalancer,
        failover: !!this.failover,
        monitoring: !!this.monitoring
      }
    };
  }
}

// Singleton instance
let unifiedMultiRegionServiceInstance = null;

function getUnifiedMultiRegionService() {
  if (!unifiedMultiRegionServiceInstance) {
    unifiedMultiRegionServiceInstance = new UnifiedMultiRegionService();
  }
  return unifiedMultiRegionServiceInstance;
}

module.exports = {
  UnifiedMultiRegionService,
  getUnifiedMultiRegionService
};

