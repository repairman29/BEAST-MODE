/**
 * Prediction Cache
 * Caches predictions for improved performance
 * 
 * Month 2: Performance Optimization
 */

const { createLogger } = require('../utils/logger');
const crypto = require('crypto');
const log = createLogger('PredictionCache');

class PredictionCache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 1000;
        this.ttl = 60 * 60 * 1000; // 1 hour default TTL
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Generate cache key from features
     */
    generateKey(features) {
        // Create deterministic key from features
        const featureString = typeof features === 'object' 
            ? JSON.stringify(features, Object.keys(features).sort())
            : String(features);
        
        return crypto.createHash('sha256')
            .update(featureString)
            .digest('hex');
    }

    /**
     * Get cached prediction
     */
    get(features) {
        const key = this.generateKey(features);
        const entry = this.cache.get(key);

        if (!entry) {
            this.misses++;
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        return entry.prediction;
    }

    /**
     * Set cached prediction
     */
    set(features, prediction, ttl = null) {
        const key = this.generateKey(features);
        const expiresAt = Date.now() + (ttl || this.ttl);

        // Evict if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            prediction,
            expiresAt,
            cachedAt: Date.now()
        });
    }

    /**
     * Evict oldest entry
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.cachedAt < oldestTime) {
                oldestTime = entry.cachedAt;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Clear expired entries
     */
    clearExpired() {
        const now = Date.now();
        let cleared = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleared++;
            }
        }

        if (cleared > 0) {
            log.debug(`Cleared ${cleared} expired cache entries`);
        }

        return cleared;
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        log.info('Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? this.hits / total : 0;

        // Clear expired entries
        this.clearExpired();

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: hitRate,
            ttl: this.ttl
        };
    }

    /**
     * Configure cache
     */
    configure(options) {
        if (options.maxSize !== undefined) {
            this.maxSize = options.maxSize;
        }
        if (options.ttl !== undefined) {
            this.ttl = options.ttl;
        }
    }
}

// Singleton instance
let predictionCacheInstance = null;

function getPredictionCache() {
    if (!predictionCacheInstance) {
        predictionCacheInstance = new PredictionCache();
    }
    return predictionCacheInstance;
}

module.exports = {
    PredictionCache,
    getPredictionCache
};

