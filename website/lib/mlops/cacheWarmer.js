/**
 * Cache Warmer
 * 
 * Predicts common LLM requests and pre-warms the cache
 * Analyzes historical request patterns and pre-executes common requests
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
const { getModelRouter } = require('./modelRouter');
const { getCustomModelMonitoring } = require('./customModelMonitoring');

const log = createLogger('CacheWarmer');

class CacheWarmer {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      topN: options.topN || 10, // Top N most common requests to warm
      warmingStrategy: options.warmingStrategy || 'frequency', // 'frequency', 'recent', 'pattern'
      scheduleInterval: options.scheduleInterval || 86400000, // 24 hours
      minFrequency: options.minFrequency || 3, // Minimum times a request must appear
      autoWarm: options.autoWarm !== false // Auto-warm on schedule
    };

    this.warmingHistory = [];
    this.isWarming = false;
    this.scheduleTimer = null;

    if (this.options.autoWarm) {
      this.startScheduling();
    }
  }

  /**
   * Start scheduled warming
   */
  startScheduling() {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
    }

    // Warm immediately on start
    this.warmCache().catch(err => {
      log.warn('Initial cache warm failed:', err.message);
    });

    // Then schedule periodic warming
    this.scheduleTimer = setInterval(() => {
      this.warmCache().catch(err => {
        log.warn('Scheduled cache warm failed:', err.message);
      });
    }, this.options.scheduleInterval);

    log.info(`✅ Cache warming scheduled (every ${this.options.scheduleInterval / 3600000} hours)`);
  }

  /**
   * Stop scheduled warming
   */
  stopScheduling() {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
      log.info('Cache warming schedule stopped');
    }
  }

  /**
   * Analyze historical request patterns
   */
  async analyzePatterns() {
    try {
      const monitoring = getCustomModelMonitoring();
      const metrics = monitoring.getMetrics();

      // Get request patterns from monitoring
      const patterns = {
        byModel: metrics.requests.byModel || {},
        byEndpoint: metrics.requests.byEndpoint || {},
        recentErrors: metrics.errors || []
      };

      // Analyze frequency patterns
      const frequencyPatterns = this.analyzeFrequency(patterns);
      
      // Analyze temporal patterns (if we have timestamp data)
      const temporalPatterns = this.analyzeTemporal(patterns);

      return {
        frequency: frequencyPatterns,
        temporal: temporalPatterns,
        totalRequests: metrics.requests.total
      };
    } catch (error) {
      log.warn('Pattern analysis failed:', error.message);
      return null;
    }
  }

  /**
   * Analyze frequency patterns
   */
  analyzeFrequency(patterns) {
    const modelFreq = Object.entries(patterns.byModel || {})
      .map(([model, count]) => ({ model, count, type: 'model' }))
      .sort((a, b) => b.count - a.count)
      .slice(0, this.options.topN);

    const endpointFreq = Object.entries(patterns.byEndpoint || {})
      .map(([endpoint, count]) => ({ endpoint, count, type: 'endpoint' }))
      .sort((a, b) => b.count - a.count)
      .slice(0, this.options.topN);

    return {
      models: modelFreq,
      endpoints: endpointFreq
    };
  }

  /**
   * Analyze temporal patterns
   */
  analyzeTemporal(patterns) {
    // For now, return recent patterns
    // In production, analyze time-based patterns (hourly, daily, etc.)
    const recentErrors = (patterns.recentErrors || [])
      .slice(-this.options.topN)
      .map(err => ({
        model: err.modelId,
        endpoint: err.endpoint,
        type: 'error_recovery'
      }));

    return {
      recent: recentErrors
    };
  }

  /**
   * Generate common requests to warm
   */
  async generateWarmRequests(patterns) {
    const warmRequests = [];

    if (!patterns) {
      // Default warm requests if no patterns available
      return this.getDefaultWarmRequests();
    }

    // Generate requests based on frequency patterns
    if (patterns.frequency && patterns.frequency.models) {
      for (const modelPattern of patterns.frequency.models) {
        if (modelPattern.count >= this.options.minFrequency) {
          warmRequests.push({
            model: modelPattern.model,
            message: this.generateCommonMessage(modelPattern.model),
            priority: modelPattern.count,
            reason: `High frequency: ${modelPattern.count} requests`
          });
        }
      }
    }

    // Add default requests if we don't have enough patterns
    if (warmRequests.length < this.options.topN) {
      const defaults = this.getDefaultWarmRequests();
      warmRequests.push(...defaults.slice(0, this.options.topN - warmRequests.length));
    }

    // Sort by priority
    return warmRequests
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.options.topN);
  }

  /**
   * Get default warm requests
   */
  getDefaultWarmRequests() {
    return [
      {
        model: 'custom:default',
        message: 'Hello, how can I help you?',
        priority: 10,
        reason: 'Default greeting'
      },
      {
        model: 'custom:default',
        message: 'What is the status?',
        priority: 9,
        reason: 'Common status query'
      },
      {
        model: 'custom:default',
        message: 'Explain this code',
        priority: 8,
        reason: 'Common code explanation'
      }
    ];
  }

  /**
   * Generate common message for a model
   */
  generateCommonMessage(modelId) {
    // Generate a generic but useful message based on model type
    if (modelId.includes('code') || modelId.includes('roach')) {
      return 'Review this code for quality issues';
    } else if (modelId.includes('narrative') || modelId.includes('gm')) {
      return 'Generate a narrative for this scenario';
    } else if (modelId.includes('oracle') || modelId.includes('search')) {
      return 'Search for information about this topic';
    } else {
      return 'How can I help you with this?';
    }
  }

  /**
   * Warm cache by executing common requests
   */
  async warmCache() {
    if (this.isWarming) {
      log.debug('Cache warming already in progress');
      return;
    }

    if (!this.options.enabled) {
      log.debug('Cache warming disabled');
      return;
    }

    this.isWarming = true;
    const startTime = Date.now();

    try {
      log.info('🔥 Starting cache warming...');

      // Analyze patterns
      const patterns = await this.analyzePatterns();
      log.debug(`Analyzed ${patterns?.totalRequests || 0} historical requests`);

      // Generate warm requests
      const warmRequests = await this.generateWarmRequests(patterns);
      log.info(`📋 Generated ${warmRequests.length} requests to warm`);

      // Execute warm requests
      const router = getModelRouter();
      let successCount = 0;
      let failureCount = 0;

      for (const warmReq of warmRequests) {
        try {
          // Execute request to populate cache
          await router.route(
            warmReq.model,
            {
              messages: Array.isArray(warmReq.message) 
                ? warmReq.message 
                : [{ role: 'user', content: warmReq.message }],
              temperature: 0.7,
              maxTokens: 1000
            },
            null // No user ID for warming
          );

          successCount++;
          log.debug(`✅ Warmed: ${warmReq.model} - ${warmReq.reason}`);
        } catch (error) {
          failureCount++;
          log.debug(`⚠️  Warm failed: ${warmReq.model} - ${error.message}`);
        }
      }

      const duration = Date.now() - startTime;
      const result = {
        success: true,
        requestsWarmed: warmRequests.length,
        successCount,
        failureCount,
        duration,
        timestamp: new Date().toISOString()
      };

      this.warmingHistory.push(result);
      if (this.warmingHistory.length > 100) {
        this.warmingHistory.shift();
      }

      log.info(`✅ Cache warming complete: ${successCount}/${warmRequests.length} successful (${duration}ms)`);
      
      return result;
    } catch (error) {
      log.error('Cache warming failed:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Get warming statistics
   */
  getStats() {
    const totalWarms = this.warmingHistory.length;
    const successfulWarms = this.warmingHistory.filter(w => w.success).length;
    const totalRequestsWarmed = this.warmingHistory.reduce((sum, w) => sum + (w.requestsWarmed || 0), 0);

    return {
      enabled: this.options.enabled,
      autoWarm: this.options.autoWarm,
      isWarming: this.isWarming,
      totalWarms,
      successfulWarms,
      successRate: totalWarms > 0 ? ((successfulWarms / totalWarms) * 100).toFixed(2) + '%' : '0%',
      totalRequestsWarmed,
      lastWarm: this.warmingHistory[this.warmingHistory.length - 1] || null,
      scheduleInterval: this.options.scheduleInterval
    };
  }
}

// Singleton instance
let instance = null;

function getCacheWarmer(options) {
  if (!instance) {
    instance = new CacheWarmer(options);
  }
  return instance;
}

module.exports = { CacheWarmer, getCacheWarmer };
