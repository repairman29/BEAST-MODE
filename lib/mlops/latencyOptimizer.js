/**
 * Latency Optimizer
 * 
 * Optimizes request latency through:
 * - Request deduplication
 * - Response caching
 * - Connection pooling
 * - Request prioritization
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('LatencyOptimizer');

class LatencyOptimizer {
  constructor() {
    this.requestCache = new Map(); // Cache key -> { response, timestamp, ttl }
    this.activeRequests = new Map(); // Cache key -> Promise
    this.requestQueue = []; // Priority queue
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      deduplications: 0,
      totalRequests: 0
    };
  }

  /**
   * Optimize a request with caching and deduplication
   * @param {string} cacheKey - Unique cache key
   * @param {Function} requestFn - Function that makes the request
   * @param {number} ttl - Time to live in ms (default: 5000)
   * @returns {Promise} - Request result
   */
  async optimizeRequest(cacheKey, requestFn, ttl = 5000) {
    this.stats.totalRequests++;

    // Check cache
    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      this.stats.cacheHits++;
      log.debug(`Cache hit for ${cacheKey}`);
      return cached.response;
    }

    // Check if same request is already in flight (deduplication)
    if (this.activeRequests.has(cacheKey)) {
      this.stats.deduplications++;
      log.debug(`Deduplicating request for ${cacheKey}`);
      return this.activeRequests.get(cacheKey);
    }

    // Make request
    this.stats.cacheMisses++;
    const requestPromise = requestFn().then(response => {
      // Cache response
      this.requestCache.set(cacheKey, {
        response,
        timestamp: Date.now(),
        ttl
      });

      // Remove from active requests
      this.activeRequests.delete(cacheKey);

      // Clean old cache entries periodically
      this.cleanCache();

      return response;
    }).catch(error => {
      // Remove from active requests on error
      this.activeRequests.delete(cacheKey);
      throw error;
    });

    // Track active request
    this.activeRequests.set(cacheKey, requestPromise);

    return requestPromise;
  }

  /**
   * Clean old cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.requestCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.requestCache.delete(key);
      }
    }
  }

  /**
   * Generate cache key from request
   */
  generateCacheKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${endpoint}|${sortedParams}`;
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    const cacheHitRate = this.stats.totalRequests > 0
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100
      : 0;

    const deduplicationRate = this.stats.totalRequests > 0
      ? (this.stats.deduplications / this.stats.totalRequests) * 100
      : 0;

    return {
      ...this.stats,
      cacheHitRate: `${cacheHitRate.toFixed(1)}%`,
      deduplicationRate: `${deduplicationRate.toFixed(1)}%`,
      cacheSize: this.requestCache.size,
      activeRequests: this.activeRequests.size
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.requestCache.clear();
    log.info('Cache cleared');
  }

  /**
   * Clear all
   */
  clear() {
    this.requestCache.clear();
    this.activeRequests.clear();
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      deduplications: 0,
      totalRequests: 0
    };
    log.info('Latency optimizer cleared');
  }
}

// Singleton instance
let latencyOptimizerInstance = null;

function getLatencyOptimizer() {
  if (!latencyOptimizerInstance) {
    latencyOptimizerInstance = new LatencyOptimizer();
  }
  return latencyOptimizerInstance;
}

module.exports = {
  LatencyOptimizer,
  getLatencyOptimizer
};
