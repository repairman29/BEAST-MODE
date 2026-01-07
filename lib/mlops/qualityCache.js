/**
 * Quality Prediction Cache
 * 
 * Caches quality predictions to reduce API latency and costs
 * Uses in-memory cache with TTL (24 hours default)
 */

class QualityCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
  }

  /**
   * Generate cache key from repo and features
   */
  generateKey(repo, features = {}) {
    // Use repo name as primary key
    // Include key features in hash for variation detection
    const featureHash = Object.keys(features)
      .sort()
      .map(key => `${key}:${features[key]}`)
      .join('|');
    
    return `quality:${repo}:${featureHash || 'default'}`;
  }

  /**
   * Get cached quality prediction
   */
  get(repo, features = {}) {
    const key = this.generateKey(repo, features);
    const cached = this.cache.get(key);

    if (!cached) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    this.stats.hits++;
    return cached.data;
  }

  /**
   * Set cached quality prediction
   */
  set(repo, features = {}, data, ttl = null) {
    const key = this.generateKey(repo, features);
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      expiresAt,
      cachedAt: Date.now()
    });

    this.stats.sets++;

    // Clean up expired entries periodically
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of Array.from(this.cache.entries())) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
        cleaned++;
        this.stats.evictions++;
      }
    }

    return cleaned;
  }

  /**
   * Clear cache for a specific repo
   */
  clear(repo) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`quality:${repo}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Clear all cache
   */
  clearAll() {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage (rough)
   */
  estimateMemoryUsage() {
    // Rough estimate: each entry ~1KB
    return `${(this.cache.size * 1024 / 1024 / 1024).toFixed(2)} MB`;
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
}

// Singleton instance
let cacheInstance = null;

function getQualityCache() {
  if (!cacheInstance) {
    cacheInstance = new QualityCache();
  }
  return cacheInstance;
}

module.exports = { QualityCache, getQualityCache };

