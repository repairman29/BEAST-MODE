/**
 * Auto-Optimizer Service
 * Automatically optimizes system parameters and configurations
 * 
 * Month 9: Advanced Intelligence
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('AutoOptimizer');

class AutoOptimizer {
  constructor() {
    this.optimizationHistory = [];
    this.currentConfig = new Map();
    this.performanceBaseline = null;
  }

  /**
   * Initialize auto-optimizer
   */
  async initialize() {
    try {
      this.setupDefaultConfig();
      logger.info('✅ Auto-optimizer initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize auto-optimizer:', error);
      return false;
    }
  }

  /**
   * Setup default configuration
   */
  setupDefaultConfig() {
    this.currentConfig.set('cache_size', 1000);
    this.currentConfig.set('batch_size', 10);
    this.currentConfig.set('timeout', 5000);
    this.currentConfig.set('retry_attempts', 3);
    this.currentConfig.set('concurrency', 5);
  }

  /**
   * Auto-optimize based on performance metrics
   */
  async autoOptimize(performanceMetrics) {
    try {
      logger.info('Running auto-optimization...');

      const optimizations = [];

      // Optimize cache size
      const cacheOptimization = this.optimizeCacheSize(performanceMetrics);
      if (cacheOptimization) {
        optimizations.push(cacheOptimization);
      }

      // Optimize batch size
      const batchOptimization = this.optimizeBatchSize(performanceMetrics);
      if (batchOptimization) {
        optimizations.push(batchOptimization);
      }

      // Optimize timeout
      const timeoutOptimization = this.optimizeTimeout(performanceMetrics);
      if (timeoutOptimization) {
        optimizations.push(timeoutOptimization);
      }

      // Optimize concurrency
      const concurrencyOptimization = this.optimizeConcurrency(performanceMetrics);
      if (concurrencyOptimization) {
        optimizations.push(concurrencyOptimization);
      }

      // Apply optimizations
      for (const optimization of optimizations) {
        this.applyOptimization(optimization);
      }

      const result = {
        optimizations,
        applied: optimizations.length,
        timestamp: Date.now()
      };

      this.optimizationHistory.push(result);
      logger.info(`Auto-optimization complete: ${optimizations.length} optimizations applied`);
      return result;
    } catch (error) {
      logger.error('Auto-optimization failed:', error);
      return null;
    }
  }

  /**
   * Optimize cache size
   */
  optimizeCacheSize(metrics) {
    const cacheHitRate = metrics.cacheHitRate || 0;
    const memoryUsage = metrics.memoryUsage || 0;

    const currentSize = this.currentConfig.get('cache_size') || 1000;
    let newSize = currentSize;

    // Increase cache if hit rate is low and memory allows
    if (cacheHitRate < 0.7 && memoryUsage < 70) {
      newSize = Math.min(currentSize * 1.5, 10000);
    }
    // Decrease cache if memory is high
    else if (memoryUsage > 80) {
      newSize = Math.max(currentSize * 0.8, 100);
    }

    if (newSize !== currentSize) {
      return {
        parameter: 'cache_size',
        oldValue: currentSize,
        newValue: Math.round(newSize),
        reason: cacheHitRate < 0.7 ? 'low_hit_rate' : 'high_memory'
      };
    }

    return null;
  }

  /**
   * Optimize batch size
   */
  optimizeBatchSize(metrics) {
    const throughput = metrics.throughput || 0;
    const latency = metrics.avgLatency || 0;

    const currentSize = this.currentConfig.get('batch_size') || 10;
    let newSize = currentSize;

    // Increase batch size if throughput is low and latency is acceptable
    if (throughput < 100 && latency < 200) {
      newSize = Math.min(currentSize * 1.5, 50);
    }
    // Decrease batch size if latency is high
    else if (latency > 500) {
      newSize = Math.max(currentSize * 0.7, 5);
    }

    if (newSize !== currentSize) {
      return {
        parameter: 'batch_size',
        oldValue: currentSize,
        newValue: Math.round(newSize),
        reason: latency > 500 ? 'high_latency' : 'low_throughput'
      };
    }

    return null;
  }

  /**
   * Optimize timeout
   */
  optimizeTimeout(metrics) {
    const timeoutRate = metrics.timeoutRate || 0;
    const avgLatency = metrics.avgLatency || 0;

    const currentTimeout = this.currentConfig.get('timeout') || 5000;
    let newTimeout = currentTimeout;

    // Increase timeout if timeout rate is high
    if (timeoutRate > 0.1) {
      newTimeout = Math.min(currentTimeout * 1.5, 30000);
    }
    // Decrease timeout if latency is consistently low
    else if (avgLatency < 100 && timeoutRate < 0.01) {
      newTimeout = Math.max(currentTimeout * 0.8, 1000);
    }

    if (newTimeout !== currentTimeout) {
      return {
        parameter: 'timeout',
        oldValue: currentTimeout,
        newValue: Math.round(newTimeout),
        reason: timeoutRate > 0.1 ? 'high_timeout_rate' : 'low_latency'
      };
    }

    return null;
  }

  /**
   * Optimize concurrency
   */
  optimizeConcurrency(metrics) {
    const cpuUsage = metrics.cpuUsage || 0;
    const throughput = metrics.throughput || 0;

    const currentConcurrency = this.currentConfig.get('concurrency') || 5;
    let newConcurrency = currentConcurrency;

    // Increase concurrency if CPU is low and throughput could improve
    if (cpuUsage < 60 && throughput < 200) {
      newConcurrency = Math.min(currentConcurrency * 1.5, 20);
    }
    // Decrease concurrency if CPU is high
    else if (cpuUsage > 85) {
      newConcurrency = Math.max(currentConcurrency * 0.8, 2);
    }

    if (newConcurrency !== currentConcurrency) {
      return {
        parameter: 'concurrency',
        oldValue: currentConcurrency,
        newValue: Math.round(newConcurrency),
        reason: cpuUsage > 85 ? 'high_cpu' : 'low_throughput'
      };
    }

    return null;
  }

  /**
   * Apply optimization
   */
  applyOptimization(optimization) {
    this.currentConfig.set(optimization.parameter, optimization.newValue);
    logger.info(`Optimization applied: ${optimization.parameter} = ${optimization.newValue} (was ${optimization.oldValue})`);
  }

  /**
   * Get current configuration
   */
  getCurrentConfig() {
    return Object.fromEntries(this.currentConfig);
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(limit = 50) {
    return this.optimizationHistory.slice(-limit).reverse();
  }
}

// Singleton instance
let instance = null;

function getAutoOptimizer() {
  if (!instance) {
    instance = new AutoOptimizer();
  }
  return instance;
}

module.exports = {
  AutoOptimizer,
  getAutoOptimizer
};

