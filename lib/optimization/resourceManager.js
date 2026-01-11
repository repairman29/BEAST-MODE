/**
 * Resource Manager Service
 * Manages and optimizes system resources
 * 
 * Month 8: Advanced Optimization
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
const logger = createLogger('ResourceManager');

class ResourceManager {
  constructor() {
    this.resourceUsage = new Map();
    this.resourceQuotas = new Map();
    this.autoScaling = {
      enabled: false,
      minInstances: 1,
      maxInstances: 10,
      targetCPU: 70,
      targetMemory: 80
    };
  }

  /**
   * Initialize resource manager
   */
  async initialize() {
    try {
      // Start resource monitoring
      this.startResourceMonitoring();
      logger.info('✅ Resource manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize resource manager:', error);
      return false;
    }
  }

  /**
   * Track resource usage
   */
  trackUsage(resourceType, usage, metadata = {}) {
    const usageEntry = {
      resourceType,
      usage,
      timestamp: Date.now(),
      metadata
    };

    const current = this.resourceUsage.get(resourceType) || {
      current: 0,
      peak: 0,
      avg: 0,
      history: []
    };

    current.current = usage;
    current.peak = Math.max(current.peak, usage);
    current.history.push(usage);
    if (current.history.length > 1000) {
      current.history.shift();
    }
    current.avg = current.history.reduce((a, b) => a + b, 0) / current.history.length;
    current.lastUpdated = Date.now();

    this.resourceUsage.set(resourceType, current);

    // Check quotas
    this.checkQuotas(resourceType, usage);

    // Auto-scaling check
    if (this.autoScaling.enabled) {
      this.checkAutoScaling(resourceType, usage);
    }

    return usageEntry;
  }

  /**
   * Get resource usage
   */
  getResourceUsage(resourceType) {
    return this.resourceUsage.get(resourceType) || null;
  }

  /**
   * Set resource quota
   */
  setQuota(tenantId, resourceType, quota) {
    const key = `${tenantId}:${resourceType}`;
    this.resourceQuotas.set(key, {
      tenantId,
      resourceType,
      quota,
      used: 0,
      createdAt: Date.now()
    });

    logger.info(`Quota set: ${tenantId} - ${resourceType} = ${quota}`);
    return this.resourceQuotas.get(key);
  }

  /**
   * Check quotas
   */
  checkQuotas(resourceType, usage) {
    const violations = [];

    for (const [key, quota] of this.resourceQuotas.entries()) {
      if (quota.resourceType === resourceType) {
        quota.used = usage; // Simplified - would track per tenant
        if (quota.used > quota.quota) {
          violations.push({
            tenantId: quota.tenantId,
            resourceType,
            used: quota.used,
            quota: quota.quota,
            exceeded: quota.used - quota.quota
          });
        }
      }
    }

    if (violations.length > 0) {
      logger.warn(`Resource quota violations: ${violations.length}`);
    }

    return violations;
  }

  /**
   * Check auto-scaling
   */
  checkAutoScaling(resourceType, usage) {
    if (resourceType === 'cpu' && usage > this.autoScaling.targetCPU) {
      this.scaleUp();
    } else if (resourceType === 'cpu' && usage < this.autoScaling.targetCPU * 0.5) {
      this.scaleDown();
    }

    if (resourceType === 'memory' && usage > this.autoScaling.targetMemory) {
      this.scaleUp();
    } else if (resourceType === 'memory' && usage < this.autoScaling.targetMemory * 0.5) {
      this.scaleDown();
    }
  }

  /**
   * Scale up
   */
  scaleUp() {
    // Simplified - would actually scale infrastructure
    logger.info('Auto-scaling: Scale up triggered');
    return { action: 'scale_up', timestamp: Date.now() };
  }

  /**
   * Scale down
   */
  scaleDown() {
    // Simplified - would actually scale infrastructure
    logger.info('Auto-scaling: Scale down triggered');
    return { action: 'scale_down', timestamp: Date.now() };
  }

  /**
   * Start resource monitoring
   */
  startResourceMonitoring() {
    setInterval(() => {
      // Simulate resource monitoring
      const cpu = Math.random() * 100;
      const memory = Math.random() * 100;
      
      this.trackUsage('cpu', cpu);
      this.trackUsage('memory', memory);
    }, 10000); // Every 10 seconds
  }

  /**
   * Get resource analytics
   */
  getResourceAnalytics() {
    const analytics = {};

    for (const [resourceType, usage] of this.resourceUsage.entries()) {
      analytics[resourceType] = {
        current: usage.current,
        peak: usage.peak,
        avg: usage.avg,
        lastUpdated: usage.lastUpdated
      };
    }

    return {
      resources: analytics,
      quotas: Array.from(this.resourceQuotas.values()),
      autoScaling: this.autoScaling,
      timestamp: Date.now()
    };
  }

  /**
   * Optimize resources
   */
  optimizeResources() {
    const recommendations = [];

    // Check for high resource usage
    for (const [resourceType, usage] of this.resourceUsage.entries()) {
      if (usage.current > 80) {
        recommendations.push({
          type: 'high_usage',
          resourceType,
          current: usage.current,
          recommendation: 'Consider scaling up or optimizing usage'
        });
      }

      if (usage.current < 20 && usage.peak < 30) {
        recommendations.push({
          type: 'low_usage',
          resourceType,
          current: usage.current,
          recommendation: 'Consider scaling down to reduce costs'
        });
      }
    }

    return recommendations;
  }
}

// Singleton instance
let instance = null;

function getResourceManager() {
  if (!instance) {
    instance = new ResourceManager();
  }
  return instance;
}

module.exports = {
  ResourceManager,
  getResourceManager
};

