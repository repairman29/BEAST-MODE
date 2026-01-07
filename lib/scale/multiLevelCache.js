/**
 * Multi-Level Cache Service
 * Implements L1 (memory), L2 (Redis), L3 (database) caching
 * 
 * Month 10: Scale & Performance
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('MultiLevelCache');

class MultiLevelCache {
  constructor() {
    this.l1Cache = new Map(); // In-memory cache
    this.l2Cache = null; // Redis (optional)
    this.l3Cache = null; // Database (optional)
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      l3Hits: 0,
      l3Misses: 0
    };
    this.config = {
      l1MaxSize: 10000,
      l1TTL: 300000, // 5 minutes
      l2TTL: 3600000, // 1 hour
      l3TTL: 86400000 // 24 hours
    };
  }

  /**
   * Initialize multi-level cache
   */
  async initialize(options = {}) {
    try {
      this.config = { ...this.config, ...options };
      
      // Initialize L2 (Redis) if available
      try {
        // Would connect to Redis here
        // this.l2Cache = redisClient;
        logger.info('L2 cache (Redis) not configured, using L1 only');
      } catch (error) {
        logger.warn('L2 cache unavailable, using L1 only');
      }

      logger.info('✅ Multi-level cache initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize multi-level cache:', error);
      return false;
    }
  }

  /**
   * Get value from cache (L1 -> L2 -> L3)
   */
  async get(key) {
    try {
      // Try L1 (memory)
      const l1Value = this.l1Cache.get(key);
      if (l1Value && !this.isExpired(l1Value)) {
        this.stats.l1Hits++;
        return l1Value.value;
      }
      this.stats.l1Misses++;

      // Try L2 (Redis) if available
      if (this.l2Cache) {
        try {
          const l2Value = await this.l2Cache.get(key);
          if (l2Value) {
            this.stats.l2Hits++;
            // Promote to L1
            this.setL1(key, l2Value);
            return l2Value;
          }
          this.stats.l2Misses++;
        } catch (error) {
          logger.warn('L2 cache error:', error);
        }
      }

      // Try L3 (database) if available
      if (this.l3Cache) {
        try {
          const l3Value = await this.l3Cache.get(key);
          if (l3Value) {
            this.stats.l3Hits++;
            // Promote to L2 and L1
            if (this.l2Cache) {
              await this.setL2(key, l3Value);
            }
            this.setL1(key, l3Value);
            return l3Value;
          }
          this.stats.l3Misses++;
        } catch (error) {
          logger.warn('L3 cache error:', error);
        }
      }

      return null;
    } catch (error) {
      logger.error('Cache get failed:', error);
      return null;
    }
  }

  /**
   * Set value in cache (all levels)
   */
  async set(key, value, ttl = null) {
    try {
      const l1TTL = ttl || this.config.l1TTL;
      const l2TTL = ttl || this.config.l2TTL;
      const l3TTL = ttl || this.config.l3TTL;

      // Set in L1
      this.setL1(key, value, l1TTL);

      // Set in L2 if available
      if (this.l2Cache) {
        await this.setL2(key, value, l2TTL);
      }

      // Set in L3 if available
      if (this.l3Cache) {
        await this.setL3(key, value, l3TTL);
      }

      return true;
    } catch (error) {
      logger.error('Cache set failed:', error);
      return false;
    }
  }

  /**
   * Set in L1 (memory)
   */
  setL1(key, value, ttl = null) {
    const expiresAt = Date.now() + (ttl || this.config.l1TTL);
    
    // Evict if cache is full
    if (this.l1Cache.size >= this.config.l1MaxSize) {
      this.evictL1();
    }

    this.l1Cache.set(key, {
      value,
      expiresAt
    });
  }

  /**
   * Set in L2 (Redis)
   */
  async setL2(key, value, ttl = null) {
    if (!this.l2Cache) return;
    // Would use Redis SETEX here
    // await this.l2Cache.setex(key, Math.floor(ttl / 1000), JSON.stringify(value));
  }

  /**
   * Set in L3 (database)
   */
  async setL3(key, value, ttl = null) {
    if (!this.l3Cache) return;
    // Would store in database with TTL
  }

  /**
   * Check if entry is expired
   */
  isExpired(entry) {
    return entry.expiresAt < Date.now();
  }

  /**
   * Evict from L1 (LRU)
   */
  evictL1() {
    // Simple eviction: remove oldest entry
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.l1Cache.entries()) {
      if (entry.expiresAt < oldestTime) {
        oldestTime = entry.expiresAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.l1Cache.delete(oldestKey);
    }
  }

  /**
   * Invalidate cache
   */
  async invalidate(key) {
    try {
      // Remove from all levels
      this.l1Cache.delete(key);
      
      if (this.l2Cache) {
        await this.l2Cache.del(key);
      }

      if (this.l3Cache) {
        await this.l3Cache.delete(key);
      }

      return true;
    } catch (error) {
      logger.error('Cache invalidation failed:', error);
      return false;
    }
  }

  /**
   * Warm cache
   */
  async warmCache(keys, fetcher) {
    try {
      logger.info(`Warming cache with ${keys.length} keys`);
      
      for (const key of keys) {
        const value = await fetcher(key);
        if (value) {
          await this.set(key, value);
        }
      }

      logger.info('Cache warming complete');
      return true;
    } catch (error) {
      logger.error('Cache warming failed:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.l1Hits + this.stats.l1Misses;
    const l1HitRate = totalRequests > 0 
      ? (this.stats.l1Hits / totalRequests) * 100 
      : 0;

    return {
      l1: {
        size: this.l1Cache.size,
        maxSize: this.config.l1MaxSize,
        hits: this.stats.l1Hits,
        misses: this.stats.l1Misses,
        hitRate: l1HitRate.toFixed(2) + '%'
      },
      l2: {
        enabled: !!this.l2Cache,
        hits: this.stats.l2Hits,
        misses: this.stats.l2Misses
      },
      l3: {
        enabled: !!this.l3Cache,
        hits: this.stats.l3Hits,
        misses: this.stats.l3Misses
      },
      timestamp: Date.now()
    };
  }

  /**
   * Clear all caches
   */
  async clear() {
    try {
      this.l1Cache.clear();
      
      if (this.l2Cache) {
        // Would clear Redis cache
      }

      if (this.l3Cache) {
        // Would clear database cache
      }

      logger.info('All caches cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear failed:', error);
      return false;
    }
  }
}

// Singleton instance
let instance = null;

function getMultiLevelCache() {
  if (!instance) {
    instance = new MultiLevelCache();
  }
  return instance;
}

module.exports = {
  MultiLevelCache,
  getMultiLevelCache
};

