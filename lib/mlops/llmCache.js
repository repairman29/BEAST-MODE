/**
 * LLM Request Cache
 * Caches similar LLM requests to reduce costs and improve performance
 */

const crypto = require('crypto');
const { createLogger } = require('../utils/logger');

const log = createLogger('LLMCache');

class LLMCache {
  constructor(options = {}) {
    this.options = {
      maxSize: options.maxSize || 1000,
      ttl: options.ttl || 3600000, // 1 hour default
      enabled: options.enabled !== false
    };
    
    this.cache = new Map();
    this.accessTimes = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  /**
   * Generate cache key from request
   * @param {Object} request - LLM request
   * @returns {string} Cache key
   */
  generateKey(request) {
    // Normalize request for consistent hashing
    const normalized = {
      message: typeof request.message === 'string' ? request.message.trim() : JSON.stringify(request.message),
      model: request.model || 'default',
      temperature: request.temperature || 0.7,
      maxTokens: request.maxTokens || 4000
    };

    const keyString = JSON.stringify(normalized);
    return crypto.createHash('sha256').update(keyString).digest('hex');
  }

  /**
   * Get cached response
   * @param {Object} request - LLM request
   * @returns {Object|null} Cached response or null
   */
  get(request) {
    if (!this.options.enabled) {
      return null;
    }

    const key = this.generateKey(request);
    const cached = this.cache.get(key);

    if (!cached) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    const age = Date.now() - cached.timestamp;
    if (age > this.options.ttl) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access time
    this.accessTimes.set(key, Date.now());
    this.stats.hits++;
    
    log.debug(`Cache hit for key: ${key.substring(0, 8)}...`);
    return cached.response;
  }

  /**
   * Set cached response
   * @param {Object} request - LLM request
   * @param {Object} response - LLM response
   */
  set(request, response) {
    if (!this.options.enabled) {
      return;
    }

    const key = this.generateKey(request);
    
    // Evict if cache is full
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
    this.accessTimes.set(key, Date.now());
    
    log.debug(`Cached response for key: ${key.substring(0, 8)}...`);
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    if (this.accessTimes.size === 0) {
      return;
    }

    // Find least recently used
    let lruKey = null;
    let lruTime = Infinity;

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < lruTime) {
        lruTime = time;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.accessTimes.delete(lruKey);
      this.stats.evictions++;
      log.debug(`Evicted LRU cache entry: ${lruKey.substring(0, 8)}...`);
    }
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
    log.info('Cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Stats
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: `${hitRate}%`,
      ttl: this.options.ttl
    };
  }

  /**
   * Check if cache is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.options.enabled;
  }
}

// Singleton instance
let instance = null;

function getLLMCache(options) {
  if (!instance) {
    instance = new LLMCache(options);
  }
  return instance;
}

module.exports = { LLMCache, getLLMCache };
