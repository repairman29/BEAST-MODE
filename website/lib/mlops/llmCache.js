/**
 * LLM Request Cache
 * Caches similar LLM requests to reduce costs and improve performance
 */

const crypto = require('crypto');
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

const log = createLogger('LLMCache');

class LLMCache {
  constructor(options = {}) {
    this.options = {
      maxSize: options.maxSize || 1000,
      ttl: options.ttl || 3600000, // 1 hour default
      enabled: options.enabled !== false,
      semanticSimilarity: options.semanticSimilarity !== false, // NEW: Enable semantic matching
      similarityThreshold: options.similarityThreshold || 0.95 // NEW: Similarity threshold (0-1)
    };
    
    this.cache = new Map();
    this.accessTimes = new Map();
    this.semanticCache = new Map(); // NEW: Store embeddings for semantic matching
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      semanticHits: 0 // NEW: Track semantic cache hits
    };
  }

  /**
   * Generate semantic embedding for message (simplified version)
   * In production, use actual embedding model (OpenAI, etc.)
   * @param {string} text - Text to embed
   * @returns {Promise<string>} Embedding hash
   */
  async generateEmbedding(text) {
    // Simplified: Use normalized hash-based similarity for now
    // TODO: Replace with actual embedding model (OpenAI, etc.)
    const normalized = text.toLowerCase().trim();
    // Remove extra whitespace and normalize
    const cleaned = normalized.replace(/\s+/g, ' ');
    return crypto.createHash('sha256').update(cleaned).digest('hex');
  }

  /**
   * Calculate similarity between two embeddings
   * Simplified: Uses character-based similarity
   * In production, use cosine similarity for real embeddings
   * @param {string} embedding1 - First embedding
   * @param {string} embedding2 - Second embedding
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(embedding1, embedding2) {
    // Simplified: Use hash comparison
    // TODO: Replace with cosine similarity for real embeddings
    if (embedding1 === embedding2) return 1.0;
    
    // Simple character-based similarity for hash strings
    let matches = 0;
    const minLen = Math.min(embedding1.length, embedding2.length);
    for (let i = 0; i < minLen; i++) {
      if (embedding1[i] === embedding2[i]) matches++;
    }
    return matches / Math.max(embedding1.length, embedding2.length);
  }

  /**
   * Find semantically similar cache entry
   * @param {Object} request - LLM request
   * @returns {Promise<Object|null>} Best matching cache entry or null
   */
  async findSemanticMatch(request) {
    if (!this.options.semanticSimilarity) return null;

    const messageText = typeof request.message === 'string' 
      ? request.message 
      : (Array.isArray(request.message) 
        ? request.message.map(m => m.content || m.text || '').join(' ')
        : JSON.stringify(request.message));

    const requestEmbedding = await this.generateEmbedding(messageText);

    let bestMatch = null;
    let bestSimilarity = 0;

    for (const [key, cached] of this.cache.entries()) {
      const cachedEmbedding = this.semanticCache.get(key);
      if (!cachedEmbedding) continue;

      // Check TTL first
      const age = Date.now() - cached.timestamp;
      if (age > this.options.ttl) continue;

      const similarity = this.calculateSimilarity(requestEmbedding, cachedEmbedding);
      if (similarity >= this.options.similarityThreshold && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = { key, cached, similarity };
      }
    }

    return bestMatch;
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
   * Get cached response (with semantic matching)
   * @param {Object} request - LLM request
   * @returns {Promise<Object|null>} Cached response or null
   */
  async get(request) {
    if (!this.options.enabled) {
      return null;
    }

    // First, try exact match
    const key = this.generateKey(request);
    const cached = this.cache.get(key);

    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age <= this.options.ttl) {
        this.accessTimes.set(key, Date.now());
        this.stats.hits++;
        log.debug(`Cache hit (exact) for key: ${key.substring(0, 8)}...`);
        return cached.response;
      }
    }

    // If no exact match, try semantic matching
    const semanticMatch = await this.findSemanticMatch(request);
    if (semanticMatch && semanticMatch.cached) {
      const age = Date.now() - semanticMatch.cached.timestamp;
      if (age <= this.options.ttl) {
        this.accessTimes.set(semanticMatch.key, Date.now());
        this.stats.hits++;
        this.stats.semanticHits++;
        log.debug(`Cache hit (semantic, similarity: ${(semanticMatch.similarity * 100).toFixed(1)}%) for key: ${semanticMatch.key.substring(0, 8)}...`);
        return semanticMatch.cached.response;
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set cached response (with semantic embedding)
   * @param {Object} request - LLM request
   * @param {Object} response - LLM response
   */
  async set(request, response) {
    if (!this.options.enabled) {
      return;
    }

    const key = this.generateKey(request);
    
    // Evict if cache is full
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    // Store response
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
    this.accessTimes.set(key, Date.now());
    
    // Store semantic embedding for semantic matching
    if (this.options.semanticSimilarity) {
      const messageText = typeof request.message === 'string' 
        ? request.message 
        : (Array.isArray(request.message) 
          ? request.message.map(m => m.content || m.text || '').join(' ')
          : JSON.stringify(request.message));
      const embedding = await this.generateEmbedding(messageText);
      this.semanticCache.set(key, embedding);
    }
    
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
    this.semanticCache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
    this.stats.semanticHits = 0;
    log.info('Cache cleared');
  }

  /**
   * Get cache statistics (with semantic stats)
   * @returns {Object} Stats
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    const semanticHitRate = this.stats.hits > 0 
      ? (this.stats.semanticHits / this.stats.hits * 100).toFixed(2) 
      : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: `${hitRate}%`,
      semanticHitRate: `${semanticHitRate}%`,
      ttl: this.options.ttl,
      semanticSimilarity: this.options.semanticSimilarity
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
