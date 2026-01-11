/**
 * Advanced Caching Service with Database Integration
 * Uses new caching tables for predictions, warming jobs, and patterns
 * 
 * Dog Fooding: Built using BEAST MODE's codebase chat API
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
const { getDatabaseWriter } = require('./databaseWriter');
const { getLLMCache } = require('./llmCache');
const crypto = require('crypto');

const logger = createLogger('AdvancedCachingService');

class AdvancedCachingService {
  constructor() {
    this.databaseWriter = null;
    this.llmCache = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.databaseWriter = getDatabaseWriter();
      this.llmCache = getLLMCache({ enabled: true });
      this.initialized = true;
      logger.info('✅ Advanced caching service initialized with database integration');
      return true;
    } catch (error) {
      logger.error('Failed to initialize advanced caching service:', error);
      return false;
    }
  }

  /**
   * Predict cache access and pre-warm
   */
  async predictAndPreWarm(cacheKey, context, predictedValue = null) {
    if (!this.initialized) await this.initialize();

    try {
      const cacheKeyHash = this.hashKey(cacheKey);
      const predictedAccessTime = new Date(Date.now() + 60000); // Predict 1 min from now

      // Check if prediction exists
      const existing = await this.databaseWriter.read({
        table: 'cache_predictions',
        filter: { cache_key_hash: cacheKeyHash }
      });

      if (existing && existing.length > 0) {
        // Update existing prediction
        await this.databaseWriter.update({
          table: 'cache_predictions',
          filter: { id: existing[0].id },
          data: {
            predicted_access_time: predictedAccessTime.toISOString(),
            predicted_value: predictedValue || existing[0].predicted_value,
            prediction_confidence: 0.8
          }
        });
        return { success: true, id: existing[0].id, prewarmed: existing[0].is_prewarmed };
      }

      // Create new prediction
      const result = await this.databaseWriter.write({
        table: 'cache_predictions',
        data: {
          cache_key: cacheKey,
          cache_key_hash: cacheKeyHash,
          predicted_access_time: predictedAccessTime.toISOString(),
          predicted_value: predictedValue,
          prediction_confidence: 0.7,
          cache_tier: 'L1'
        }
      });

      // Pre-warm if high confidence
      if (result.prediction_confidence > 0.7 && predictedValue) {
        await this.preWarmCache(cacheKey, predictedValue, 'L1');
        await this.databaseWriter.update({
          table: 'cache_predictions',
          filter: { id: result.id },
          data: {
            is_prewarmed: true,
            prewarmed_at: new Date().toISOString()
          }
        });
      }

      return { success: true, id: result.id, prewarmed: result.is_prewarmed };
    } catch (error) {
      logger.error('Failed to predict and pre-warm:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create cache warming job
   */
  async createWarmingJob(userId, config) {
    if (!this.initialized) await this.initialize();

    const {
      jobName,
      description,
      warmingStrategy,
      targetCacheTier,
      predictionIds,
      patternIds
    } = config;

    try {
      const result = await this.databaseWriter.write({
        table: 'cache_warming_jobs',
        data: {
          user_id: userId,
          job_name: jobName,
          description,
          warming_strategy: warmingStrategy || 'predictive',
          target_cache_tier: targetCacheTier || 'L1',
          prediction_ids: predictionIds || [],
          pattern_ids: patternIds || [],
          status: 'queued'
        }
      });

      logger.info(`Created cache warming job: ${jobName} (${result.id})`);
      return { success: true, id: result.id, job: result };
    } catch (error) {
      logger.error('Failed to create warming job:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute cache warming job
   */
  async executeWarmingJob(jobId) {
    if (!this.initialized) await this.initialize();

    try {
      // Get job
      const job = await this.databaseWriter.read({
        table: 'cache_warming_jobs',
        filter: { id: jobId }
      });

      if (!job) {
        throw new Error('Warming job not found');
      }

      // Update status
      await this.databaseWriter.update({
        table: 'cache_warming_jobs',
        filter: { id: jobId },
        data: {
          status: 'running',
          started_at: new Date().toISOString()
        }
      });

      let keysWarmed = 0;
      let keysFailed = 0;
      const startTime = Date.now();

      // Warm based on strategy
      if (job.warming_strategy === 'predictive' && job.prediction_ids) {
        for (const predictionId of job.prediction_ids) {
          try {
            const prediction = await this.databaseWriter.read({
              table: 'cache_predictions',
              filter: { id: predictionId }
            });

            if (prediction && prediction.length > 0 && prediction[0].predicted_value) {
              await this.preWarmCache(
                prediction[0].cache_key,
                prediction[0].predicted_value,
                job.target_cache_tier
              );
              keysWarmed++;
            }
          } catch (error) {
            keysFailed++;
            logger.warn(`Failed to warm key from prediction ${predictionId}:`, error);
          }
        }
      } else if (job.warming_strategy === 'pattern-based' && job.pattern_ids) {
        for (const patternId of job.pattern_ids) {
          try {
            const pattern = await this.databaseWriter.read({
              table: 'cache_patterns',
              filter: { id: patternId }
            });

            if (pattern && pattern.length > 0 && pattern[0].associated_keys) {
              for (const key of pattern[0].associated_keys) {
                await this.preWarmCache(key, null, job.target_cache_tier);
                keysWarmed++;
              }
            }
          } catch (error) {
            keysFailed++;
            logger.warn(`Failed to warm keys from pattern ${patternId}:`, error);
          }
        }
      }

      const warmingTime = (Date.now() - startTime) / 1000;

      // Update job
      await this.databaseWriter.update({
        table: 'cache_warming_jobs',
        filter: { id: jobId },
        data: {
          status: 'completed',
          keys_warmed: keysWarmed,
          keys_failed: keysFailed,
          keys_to_warm: keysWarmed + keysFailed,
          warming_time_seconds: warmingTime,
          completed_at: new Date().toISOString()
        }
      });

      return { success: true, keysWarmed, keysFailed, warmingTime };
    } catch (error) {
      logger.error('Failed to execute warming job:', error);
      await this.databaseWriter.update({
        table: 'cache_warming_jobs',
        filter: { id: jobId },
        data: {
          status: 'failed'
        }
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Pre-warm cache
   */
  async preWarmCache(cacheKey, value, tier = 'L1') {
    try {
      if (this.llmCache) {
        await this.llmCache.set(cacheKey, value);
      }
      // Could also warm L2/L3 caches here
      return true;
    } catch (error) {
      logger.warn('Failed to pre-warm cache:', error);
      return false;
    }
  }

  /**
   * Record cache performance metrics
   */
  async recordPerformance(cacheTier, metrics) {
    if (!this.initialized) await this.initialize();

    try {
      const periodEnd = new Date();
      const periodStart = new Date(periodEnd.getTime() - 3600000); // Last hour

      for (const [metricName, metricValue] of Object.entries(metrics)) {
        await this.databaseWriter.write({
          table: 'cache_performance',
          data: {
            cache_tier: cacheTier,
            metric_name: metricName,
            metric_value: metricValue,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString()
          }
        });
      }
      return { success: true };
    } catch (error) {
      logger.warn('Failed to record cache performance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect and store cache patterns
   */
  async detectPattern(patternType, patternSignature, associatedKeys) {
    if (!this.initialized) await this.initialize();

    try {
      // Check if pattern exists
      const existing = await this.databaseWriter.read({
        table: 'cache_patterns',
        filter: {
          pattern_type: patternType,
          pattern_signature: patternSignature
        }
      });

      if (existing && existing.length > 0) {
        // Update existing pattern
        await this.databaseWriter.update({
          table: 'cache_patterns',
          filter: { id: existing[0].id },
          data: {
            frequency: existing[0].frequency + 1,
            associated_keys: associatedKeys,
            last_seen_at: new Date().toISOString()
          }
        });
        return { success: true, id: existing[0].id };
      }

      // Create new pattern
      const result = await this.databaseWriter.write({
        table: 'cache_patterns',
        data: {
          pattern_type: patternType,
          pattern_signature: patternSignature,
          associated_keys: associatedKeys,
          frequency: 1,
          last_seen_at: new Date().toISOString()
        }
      });

      return { success: true, id: result.id };
    } catch (error) {
      logger.error('Failed to detect pattern:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Hash cache key
   */
  hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}

// Singleton instance
let instance = null;

function getAdvancedCachingService() {
  if (!instance) {
    instance = new AdvancedCachingService();
  }
  return instance;
}

module.exports = {
  AdvancedCachingService,
  getAdvancedCachingService
};
