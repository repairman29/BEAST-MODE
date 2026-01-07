/**
 * Resource Optimizer Service
 * Optimizes resource allocation, pooling, and forecasting
 * 
 * Month 10: Advanced Scaling & Performance Monitoring
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('ResourceOptimizer');

class ResourceOptimizer {
  constructor() {
    this.resources = new Map();
    this.pools = new Map();
    this.allocations = [];
    this.forecasts = [];
  }

  /**
   * Initialize resource optimizer
   */
  async initialize() {
    try {
      this.setupDefaultPools();
      logger.info('✅ Resource optimizer initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize resource optimizer:', error);
      return false;
    }
  }

  /**
   * Setup default resource pools
   */
  setupDefaultPools() {
    this.pools.set('cpu', {
      name: 'CPU',
      total: 100,
      allocated: 0,
      available: 100,
      unit: 'cores'
    });

    this.pools.set('memory', {
      name: 'Memory',
      total: 16384, // MB
      allocated: 0,
      available: 16384,
      unit: 'MB'
    });

    this.pools.set('storage', {
      name: 'Storage',
      total: 1000, // GB
      allocated: 0,
      available: 1000,
      unit: 'GB'
    });
  }

  /**
   * Allocate resources
   */
  allocateResources(tenantId, requirements) {
    try {
      const allocation = {
        id: `alloc_${Date.now()}`,
        tenantId,
        resources: {},
        timestamp: Date.now()
      };

      // Allocate each resource type
      for (const [resourceType, amount] of Object.entries(requirements)) {
        const pool = this.pools.get(resourceType);
        if (!pool) {
          logger.warn(`Resource pool not found: ${resourceType}`);
          continue;
        }

        if (pool.available < amount) {
          logger.warn(`Insufficient ${resourceType}: requested ${amount}, available ${pool.available}`);
          continue;
        }

        pool.allocated += amount;
        pool.available -= amount;
        allocation.resources[resourceType] = amount;
      }

      this.allocations.push(allocation);
      logger.info(`Resources allocated to ${tenantId}: ${JSON.stringify(allocation.resources)}`);

      return allocation;
    } catch (error) {
      logger.error('Resource allocation failed:', error);
      return null;
    }
  }

  /**
   * Release resources
   */
  releaseResources(allocationId) {
    try {
      const allocation = this.allocations.find(a => a.id === allocationId);
      if (!allocation) {
        return false;
      }

      // Release each resource
      for (const [resourceType, amount] of Object.entries(allocation.resources)) {
        const pool = this.pools.get(resourceType);
        if (pool) {
          pool.allocated -= amount;
          pool.available += amount;
        }
      }

      // Remove allocation
      this.allocations = this.allocations.filter(a => a.id !== allocationId);

      logger.info(`Resources released: ${allocationId}`);
      return true;
    } catch (error) {
      logger.error('Resource release failed:', error);
      return false;
    }
  }

  /**
   * Optimize resource allocation
   */
  optimizeAllocation() {
    try {
      const optimizations = [];

      // Check for overallocation
      for (const [resourceType, pool] of this.pools.entries()) {
        const utilization = (pool.allocated / pool.total) * 100;

        if (utilization > 90) {
          optimizations.push({
            type: 'high_utilization',
            resource: resourceType,
            utilization: utilization.toFixed(2) + '%',
            recommendation: 'Consider scaling up or redistributing resources'
          });
        } else if (utilization < 20 && pool.allocated > 0) {
          optimizations.push({
            type: 'low_utilization',
            resource: resourceType,
            utilization: utilization.toFixed(2) + '%',
            recommendation: 'Consider scaling down or reallocating resources'
          });
        }
      }

      // Check for fragmentation
      const tenants = new Set(this.allocations.map(a => a.tenantId));
      if (tenants.size > 1) {
        const avgAllocation = this.allocations.length / tenants.size;
        if (avgAllocation > 5) {
          optimizations.push({
            type: 'fragmentation',
            recommendation: 'Consider consolidating allocations'
          });
        }
      }

      return optimizations;
    } catch (error) {
      logger.error('Allocation optimization failed:', error);
      return [];
    }
  }

  /**
   * Forecast resource needs
   */
  forecastResources(timeHorizon = 86400000) {
    try {
      // Analyze historical allocation patterns
      const historical = this.allocations
        .filter(a => a.timestamp > Date.now() - timeHorizon)
        .map(a => ({
          timestamp: a.timestamp,
          cpu: a.resources.cpu || 0,
          memory: a.resources.memory || 0,
          storage: a.resources.storage || 0
        }));

      if (historical.length === 0) {
        return { forecast: [], error: 'Insufficient historical data' };
      }

      // Simple linear forecast
      const forecast = [];
      const intervals = 24; // 24 hours
      const interval = timeHorizon / intervals;

      for (let i = 1; i <= intervals; i++) {
        const futureTime = Date.now() + (interval * i);
        const avgCpu = historical.reduce((sum, h) => sum + h.cpu, 0) / historical.length;
        const avgMemory = historical.reduce((sum, h) => sum + h.memory, 0) / historical.length;
        const avgStorage = historical.reduce((sum, h) => sum + h.storage, 0) / historical.length;

        forecast.push({
          timestamp: futureTime,
          cpu: avgCpu,
          memory: avgMemory,
          storage: avgStorage
        });
      }

      const forecastRecord = {
        id: `forecast_${Date.now()}`,
        forecast,
        timeHorizon,
        timestamp: Date.now()
      };

      this.forecasts.push(forecastRecord);
      return forecastRecord;
    } catch (error) {
      logger.error('Resource forecasting failed:', error);
      return null;
    }
  }

  /**
   * Get resource pool status
   */
  getPoolStatus(resourceType = null) {
    if (resourceType) {
      return this.pools.get(resourceType) || null;
    }

    return Object.fromEntries(this.pools);
  }

  /**
   * Get allocation statistics
   */
  getAllocationStatistics() {
    const tenants = new Set(this.allocations.map(a => a.tenantId));

    return {
      totalAllocations: this.allocations.length,
      activeTenants: tenants.size,
      pools: Object.fromEntries(
        Array.from(this.pools.entries()).map(([type, pool]) => [
          type,
          {
            utilization: ((pool.allocated / pool.total) * 100).toFixed(2) + '%',
            allocated: pool.allocated,
            available: pool.available,
            total: pool.total
          }
        ])
      ),
      timestamp: Date.now()
    };
  }
}

// Singleton instance
let instance = null;

function getResourceOptimizer() {
  if (!instance) {
    instance = new ResourceOptimizer();
  }
  return instance;
}

module.exports = {
  ResourceOptimizer,
  getResourceOptimizer
};

