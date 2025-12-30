/**
 * BEAST MODE Caching System
 * 
 * Provides in-memory caching with TTL support for API responses,
 * scan results, and frequently accessed data.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 1000; // Maximum number of cache entries

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T, ttl: number = 300000): void { // Default 5 minutes
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Check if a key exists in cache (and is not expired)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict the oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    this.clearExpired();
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
const globalCache = new Cache();

// Clean up expired entries every 5 minutes
if (typeof global !== 'undefined') {
  if (!global.cacheCleanupInterval) {
    global.cacheCleanupInterval = setInterval(() => {
      globalCache.clearExpired();
    }, 300000); // 5 minutes
  }
}

export default globalCache;

/**
 * Cache key generators for common use cases
 */
export const cacheKeys = {
  scanResult: (repoUrl: string) => `scan:${repoUrl}`,
  pluginRegistry: () => 'plugins:registry',
  pluginDetails: (pluginId: string) => `plugin:${pluginId}`,
  userPlugins: (userId: string) => `user:${userId}:plugins`,
  qualityScore: (repoUrl: string) => `quality:${repoUrl}`,
  recommendations: (userId: string) => `recommendations:${userId}`,
  missions: (userId: string) => `missions:${userId}`,
  analytics: (userId: string, type: string) => `analytics:${userId}:${type}`
};

/**
 * Cache TTL constants (in milliseconds)
 */
export const cacheTTL = {
  short: 60000,      // 1 minute
  medium: 300000,   // 5 minutes
  long: 1800000,     // 30 minutes
  veryLong: 3600000 // 1 hour
};

