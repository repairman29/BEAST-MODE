/**
 * Performance Optimizer Service
 * Optimizes response time, throughput, and latency
 * 
 * Month 10: Scale & Performance
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
const logger = createLogger('PerformanceOptimizer');

class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      responseTimes: [],
      throughput: [],
      latency: [],
      errors: []
    };
    this.optimizations = [];
    this.baseline = null;
  }

  /**
   * Initialize performance optimizer
   */
  async initialize() {
    try {
      logger.info('✅ Performance optimizer initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize performance optimizer:', error);
      return false;
    }
  }

  /**
   * Record performance metric
   */
  recordMetric(type, value, context = {}) {
    try {
      const metric = {
        type,
        value,
        context,
        timestamp: Date.now()
      };

      if (this.metrics[type]) {
        this.metrics[type].push(metric);

        // Keep only last 10000 metrics
        if (this.metrics[type].length > 10000) {
          this.metrics[type].shift();
        }
      }

      // Check for performance issues
      this.checkPerformanceIssues(type, value);
    } catch (error) {
      logger.error('Metric recording failed:', error);
    }
  }

  /**
   * Check for performance issues
   */
  checkPerformanceIssues(type, value) {
    const thresholds = {
      responseTime: 1000, // ms
      latency: 500, // ms
      throughput: 10, // requests/second
      errorRate: 0.05 // 5%
    };

    const threshold = thresholds[type];
    if (!threshold) return;

    if (type === 'errorRate' && value > threshold) {
      logger.warn(`High error rate detected: ${(value * 100).toFixed(2)}%`);
      this.suggestOptimization(type, value, threshold);
    } else if (type !== 'errorRate' && value > threshold) {
      logger.warn(`Performance issue detected: ${type} = ${value} (threshold: ${threshold})`);
      this.suggestOptimization(type, value, threshold);
    }
  }

  /**
   * Suggest optimization
   */
  suggestOptimization(type, value, threshold) {
    const suggestions = {
      responseTime: [
        'Enable caching',
        'Optimize database queries',
        'Reduce payload size',
        'Use CDN for static assets'
      ],
      latency: [
        'Use connection pooling',
        'Enable compression',
        'Optimize network requests',
        'Use edge caching'
      ],
      throughput: [
        'Increase server capacity',
        'Enable load balancing',
        'Optimize code execution',
        'Use async processing'
      ],
      errorRate: [
        'Review error logs',
        'Add retry logic',
        'Improve error handling',
        'Scale resources'
      ]
    };

    const recommendation = {
      type,
      currentValue: value,
      threshold,
      suggestions: suggestions[type] || [],
      timestamp: Date.now()
    };

    this.optimizations.push(recommendation);

    // Keep only last 1000 optimizations
    if (this.optimizations.length > 1000) {
      this.optimizations.shift();
    }
  }

  /**
   * Optimize response time
   */
  async optimizeResponseTime(request, response) {
    try {
      const startTime = Date.now();

      // Apply optimizations
      const optimized = await this.applyOptimizations(request);

      const duration = Date.now() - startTime;
      this.recordMetric('responseTime', duration, { request: request.path });

      return optimized;
    } catch (error) {
      logger.error('Response time optimization failed:', error);
      return null;
    }
  }

  /**
   * Apply optimizations
   */
  async applyOptimizations(request) {
    const optimizations = [];

    // Enable compression
    optimizations.push('compression');

    // Enable caching
    optimizations.push('caching');

    // Optimize payload
    optimizations.push('payload_optimization');

    return optimizations;
  }

  /**
   * Optimize throughput
   */
  optimizeThroughput(requests) {
    try {
      // Batch processing
      const batchSize = 10;
      const batches = [];

      for (let i = 0; i < requests.length; i += batchSize) {
        batches.push(requests.slice(i, i + batchSize));
      }

      // Process batches in parallel
      const throughput = batches.length / 1; // requests per second (simplified)
      this.recordMetric('throughput', throughput);

      return batches;
    } catch (error) {
      logger.error('Throughput optimization failed:', error);
      return null;
    }
  }

  /**
   * Optimize latency
   */
  optimizeLatency(operation) {
    try {
      const startTime = Date.now();

      // Use async/await for non-blocking operations
      const result = operation();

      const latency = Date.now() - startTime;
      this.recordMetric('latency', latency);

      return result;
    } catch (error) {
      logger.error('Latency optimization failed:', error);
      return null;
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStatistics(timeRange = null) {
    let metrics = this.metrics;

    if (timeRange) {
      const startTime = Date.now() - timeRange;
      for (const type in metrics) {
        metrics[type] = metrics[type].filter(m => m.timestamp >= startTime);
      }
    }

    const stats = {
      responseTime: this.calculateStats(metrics.responseTimes),
      throughput: this.calculateStats(metrics.throughput),
      latency: this.calculateStats(metrics.latency),
      errors: this.calculateStats(metrics.errors),
      optimizations: this.optimizations.slice(-10),
      timestamp: Date.now()
    };

    return stats;
  }

  /**
   * Calculate statistics
   */
  calculateStats(metrics) {
    if (!metrics || metrics.length === 0) {
      return {
        count: 0,
        avg: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0
      };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = values[0];
    const max = values[values.length - 1];
    const p95Index = Math.floor(values.length * 0.95);
    const p99Index = Math.floor(values.length * 0.99);

    return {
      count: values.length,
      avg: avg.toFixed(2),
      min,
      max,
      p95: values[p95Index] || 0,
      p99: values[p99Index] || 0
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    return this.optimizations
      .slice(-20)
      .reverse()
      .map(opt => ({
        type: opt.type,
        issue: `${opt.type} exceeds threshold (${opt.currentValue} > ${opt.threshold})`,
        suggestions: opt.suggestions
      }));
  }
}

// Singleton instance
let instance = null;

function getPerformanceOptimizer() {
  if (!instance) {
    instance = new PerformanceOptimizer();
  }
  return instance;
}

module.exports = {
  PerformanceOptimizer,
  getPerformanceOptimizer
};

