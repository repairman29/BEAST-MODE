/**
 * Multi-Tier Cache System
 * 
 * 3-tier caching: L1 (memory), L2 (Redis), L3 (database)
 * Fallback logic: L1 → L2 → L3
 */

const { createLogger } = require('../utils/logger');
const { LLMCache } = require('./llmCache');

const log = createLogger('MultiTierCache');

class MultiTierCache {
  constructor(options = {}) {
    this.options = {
      l1Enabled: options.l1Enabled !== false,
      l2Enabled: options.l2Enabled !== false, // Redis
      l3Enabled: options.l3Enabled !== false, // Database
      l1MaxSize: options.l1MaxSize || 1000,
      l1Ttl: options.l1Ttl || 3600000, // 1 hour
      l2Ttl: options.l2Ttl || 7200000, // 2 hours
      l3Ttl: options.l3Ttl || 86400000, // 24 hours
      semanticSimilarity: options.semanticSimilarity !== false
    };

    // L1: In-memory cache (fastest)
    this.l1Cache = this.options.l1Enabled 
      ? new LLMCache({ 
          maxSize: this.options.l1MaxSize, 
          ttl: this.options.l1Ttl,
          semanticSimilarity: this.options.semanticSimilarity
        })
      : null;

    // L2: Redis cache (fast)
    this.l2Client = null;
    this.l2Available = false;
    if (this.options.l2Enabled) {
      this.initializeL2();
    }

    // L3: Database cache (slower but persistent)
    this.l3Available = false;
    if (this.options.l3Enabled) {
      this.initializeL3();
    }

    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      misses: 0,
      l1Writes: 0,
      l2Writes: 0,
      l3Writes: 0
    };
  }

  /**
   * Initialize L2 (Redis) cache
   */
  async initializeL2() {
    try {
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      
      if (!redisUrl) {
        log.warn('⚠️  Redis URL not found, L2 cache disabled');
        this.l2Available = false;
        return;
      }

      // Try Upstash Redis REST API first (most common)
      if (redisUrl.includes('upstash') || redisToken) {
        try {
          const { Redis } = require('@upstash/redis');
          this.l2Client = new Redis({ 
            url: redisUrl, 
            token: redisToken 
          });
          // Test connection
          await this.l2Client.ping();
          this.l2Available = true;
          log.info('✅ L2 cache (Upstash Redis) initialized');
          return;
        } catch (upstashError) {
          log.debug('Upstash Redis failed, trying standard Redis:', upstashError.message);
        }
      }

      // Try standard Redis client
      if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
        try {
          const redis = require('redis');
          this.l2Client = redis.createClient({ url: redisUrl });
          await this.l2Client.connect();
          // Test connection
          await this.l2Client.ping();
          this.l2Available = true;
          log.info('✅ L2 cache (Standard Redis) initialized');
          return;
        } catch (redisError) {
          log.debug('Standard Redis failed:', redisError.message);
        }
      }

      // If we get here, Redis is not available
      log.warn('⚠️  L2 cache (Redis) not available - both Upstash and standard Redis failed');
      this.l2Available = false;
    } catch (error) {
      log.warn('⚠️  L2 cache (Redis) initialization error:', error.message);
      this.l2Available = false;
    }
  }

  /**
   * Initialize L3 (Database) cache
   */
  async initializeL3() {
    try {
      // Check if Supabase is available
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const { createClient } = require('@supabase/supabase-js');
        this.l3Client = createClient(supabaseUrl, supabaseKey);
        this.l3Available = true;
        log.info('✅ L3 cache (Database) initialized');
      } else {
        log.warn('⚠️  Supabase credentials not found, L3 cache disabled');
        this.l3Available = false;
      }
    } catch (error) {
      log.warn('⚠️  L3 cache (Database) not available:', error.message);
      this.l3Available = false;
    }
  }

  /**
   * Generate cache key from request
   */
  generateKey(request) {
    if (this.l1Cache) {
      return this.l1Cache.generateKey(request);
    }
    
    // Fallback key generation
    const crypto = require('crypto');
    const normalized = {
      message: typeof request.message === 'string' 
        ? request.message.trim() 
        : JSON.stringify(request.message),
      model: request.model || 'default',
      temperature: request.temperature || 0.7,
      maxTokens: request.maxTokens || 4000
    };
    const keyString = JSON.stringify(normalized);
    return crypto.createHash('sha256').update(keyString).digest('hex');
  }

  /**
   * Get from L2 (Redis) cache
   */
  async getL2(key) {
    if (!this.l2Available || !this.l2Client) {
      return null;
    }

    try {
      let value;
      if (this.l2Client.get) {
        // Standard Redis client
        value = await this.l2Client.get(key);
      } else {
        // Upstash Redis REST API
        value = await this.l2Client.get(key);
      }

      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      log.debug('L2 cache get failed:', error.message);
      return null;
    }
  }

  /**
   * Set in L2 (Redis) cache
   */
  async setL2(key, value, ttl) {
    if (!this.l2Available || !this.l2Client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (this.l2Client.setEx) {
        // Standard Redis client
        await this.l2Client.setEx(key, Math.floor(ttl / 1000), serialized);
      } else {
        // Upstash Redis REST API
        await this.l2Client.set(key, serialized, { ex: Math.floor(ttl / 1000) });
      }
      return true;
    } catch (error) {
      log.debug('L2 cache set failed:', error.message);
      return false;
    }
  }

  /**
   * Get from L3 (Database) cache
   */
  async getL3(key) {
    if (!this.l3Available || !this.l3Client) {
      return null;
    }

    try {
      const { data, error } = await this.l3Client
        .from('llm_cache')
        .select('value, created_at')
        .eq('key', key)
        .single();

      if (error || !data) {
        return null;
      }

      // Check TTL
      const age = Date.now() - new Date(data.created_at).getTime();
      if (age > this.options.l3Ttl) {
        // Expired, delete it
        await this.l3Client.from('llm_cache').delete().eq('key', key);
        return null;
      }

      // Update access tracking
      await this.l3Client
        .from('llm_cache')
        .update({
          access_count: (data.access_count || 0) + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('key', key);

      return JSON.parse(data.value);
    } catch (error) {
      log.debug('L3 cache get failed:', error.message);
      return null;
    }
  }

  /**
   * Set in L3 (Database) cache
   */
  async setL3(key, value, ttl) {
    if (!this.l3Available || !this.l3Client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const expiresAt = new Date(Date.now() + ttl);

      // Upsert (insert or update)
      const { error } = await this.l3Client
        .from('llm_cache')
        .upsert({
          key,
          value: serialized,
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        log.debug('L3 cache set failed:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      log.debug('L3 cache set failed:', error.message);
      return false;
    }
  }

  /**
   * Get cached response (with multi-tier fallback)
   * @param {Object} request - LLM request
   * @returns {Promise<Object|null>} Cached response or null
   */
  async get(request) {
    const key = this.generateKey(request);

    // Try L1 first (fastest)
    if (this.l1Cache) {
      const cached = await this.l1Cache.get(request);
      if (cached) {
        this.stats.l1Hits++;
        log.debug(`L1 cache hit for key: ${key.substring(0, 8)}...`);
        return cached;
      }
    }

    // Try L2 (Redis)
    if (this.l2Available) {
      const cached = await this.getL2(key);
      if (cached) {
        this.stats.l2Hits++;
        log.debug(`L2 cache hit for key: ${key.substring(0, 8)}...`);
        
        // Promote to L1
        if (this.l1Cache) {
          await this.l1Cache.set(request, cached);
        }
        
        return cached;
      }
    }

    // Try L3 (Database)
    if (this.l3Available) {
      const cached = await this.getL3(key);
      if (cached) {
        this.stats.l3Hits++;
        log.debug(`L3 cache hit for key: ${key.substring(0, 8)}...`);
        
        // Promote to L2 and L1
        if (this.l2Available) {
          await this.setL2(key, cached, this.options.l2Ttl);
        }
        if (this.l1Cache) {
          await this.l1Cache.set(request, cached);
        }
        
        return cached;
      }
    }

    // Cache miss
    this.stats.misses++;
    return null;
  }

  /**
   * Set cached response (write to all tiers)
   * @param {Object} request - LLM request
   * @param {Object} response - LLM response
   */
  async set(request, response) {
    const key = this.generateKey(request);

    // Write to L1 (fastest)
    if (this.l1Cache) {
      await this.l1Cache.set(request, response);
      this.stats.l1Writes++;
    }

    // Write to L2 (Redis)
    if (this.l2Available) {
      const written = await this.setL2(key, response, this.options.l2Ttl);
      if (written) {
        this.stats.l2Writes++;
      }
    }

    // Write to L3 (Database)
    if (this.l3Available) {
      const written = await this.setL3(key, response, this.options.l3Ttl);
      if (written) {
        this.stats.l3Writes++;
      }
    }
  }

  /**
   * Clear all cache tiers
   */
  async clear() {
    // Clear L1
    if (this.l1Cache) {
      this.l1Cache.clear();
    }

    // Clear L2 (Redis)
    if (this.l2Available && this.l2Client) {
      try {
        if (this.l2Client.flushAll) {
          await this.l2Client.flushAll();
        } else {
          // Upstash doesn't support flushAll, skip
          log.warn('L2 cache flush not supported');
        }
      } catch (error) {
        log.debug('L2 cache clear failed:', error.message);
      }
    }

    // Clear L3 (Database)
    if (this.l3Available && this.l3Client) {
      try {
        await this.l3Client.from('llm_cache').delete().neq('key', '');
      } catch (error) {
        log.debug('L3 cache clear failed:', error.message);
      }
    }

    // Reset stats
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      misses: 0,
      l1Writes: 0,
      l2Writes: 0,
      l3Writes: 0
    };

    log.info('All cache tiers cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Stats
   */
  getStats() {
    const totalHits = this.stats.l1Hits + this.stats.l2Hits + this.stats.l3Hits;
    const totalRequests = totalHits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests * 100).toFixed(2) : 0;

    const l1Stats = this.l1Cache ? this.l1Cache.getStats() : null;

    return {
      tiers: {
        l1: {
          enabled: this.options.l1Enabled && !!this.l1Cache,
          available: !!this.l1Cache,
          hits: this.stats.l1Hits,
          writes: this.stats.l1Writes,
          stats: l1Stats
        },
        l2: {
          enabled: this.options.l2Enabled,
          available: this.l2Available,
          hits: this.stats.l2Hits,
          writes: this.stats.l2Writes
        },
        l3: {
          enabled: this.options.l3Enabled,
          available: this.l3Available,
          hits: this.stats.l3Hits,
          writes: this.stats.l3Writes
        }
      },
      overall: {
        totalHits,
        misses: this.stats.misses,
        totalRequests,
        hitRate: `${hitRate}%`
      }
    };
  }

  /**
   * Check if cache is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.options.l1Enabled || this.options.l2Enabled || this.options.l3Enabled;
  }
}

// Singleton instance
let instance = null;

function getMultiTierCache(options) {
  if (!instance) {
    instance = new MultiTierCache(options);
  }
  return instance;
}

module.exports = { MultiTierCache, getMultiTierCache };
