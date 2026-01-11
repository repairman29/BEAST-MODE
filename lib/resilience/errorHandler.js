/**
 * Comprehensive Error Handler
 * Provides robust error handling, recovery, and reporting
 * 
 * Month 8: Week 2 - Production Hardening
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
const logger = createLogger('ErrorHandler');

class ErrorHandler {
  constructor() {
    this.errorHistory = [];
    this.errorStats = new Map();
    this.recoveryStrategies = new Map();
  }

  /**
   * Initialize error handler
   */
  async initialize() {
    try {
      this.setupDefaultRecoveryStrategies();
      logger.info('✅ Error handler initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize error handler:', error);
      return false;
    }
  }

  /**
   * Setup default recovery strategies
   */
  setupDefaultRecoveryStrategies() {
    // Retry strategy
    this.recoveryStrategies.set('retry', {
      maxRetries: 3,
      retryDelay: 1000,
      backoff: 'exponential'
    });

    // Fallback strategy
    this.recoveryStrategies.set('fallback', {
      useDefault: true,
      logError: true
    });

    // Circuit breaker strategy
    this.recoveryStrategies.set('circuit_breaker', {
      failureThreshold: 5,
      timeout: 60000,
      halfOpenTimeout: 30000
    });
  }

  /**
   * Handle error with recovery
   */
  async handleError(error, context = {}) {
    try {
      // Classify error
      const errorType = this.classifyError(error);
      
      // Record error
      this.recordError(error, errorType, context);

      // Attempt recovery
      const recovery = await this.attemptRecovery(error, errorType, context);

      // Report error
      this.reportError(error, errorType, context, recovery);

      return {
        handled: true,
        errorType,
        recovery,
        timestamp: Date.now()
      };
    } catch (handlingError) {
      logger.error('Error handling failed:', handlingError);
      return {
        handled: false,
        error: handlingError.message
      };
    }
  }

  /**
   * Classify error
   */
  classifyError(error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'network_error';
    }
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return 'timeout_error';
    }
    if (error.message.includes('rate limit') || error.status === 429) {
      return 'rate_limit_error';
    }
    if (error.status >= 500) {
      return 'server_error';
    }
    if (error.status >= 400) {
      return 'client_error';
    }
    if (error.message.includes('memory') || error.message.includes('out of memory')) {
      return 'resource_error';
    }
    return 'unknown_error';
  }

  /**
   * Record error
   */
  recordError(error, errorType, context) {
    const errorRecord = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: errorType,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    };

    this.errorHistory.push(errorRecord);

    // Update stats
    const stats = this.errorStats.get(errorType) || {
      count: 0,
      lastOccurrence: null,
      firstOccurrence: null
    };
    stats.count++;
    stats.lastOccurrence = Date.now();
    if (!stats.firstOccurrence) {
      stats.firstOccurrence = Date.now();
    }
    this.errorStats.set(errorType, stats);

    // Keep only last 10000 errors
    if (this.errorHistory.length > 10000) {
      this.errorHistory.shift();
    }

    return errorRecord;
  }

  /**
   * Attempt recovery
   */
  async attemptRecovery(error, errorType, context) {
    const recovery = {
      attempted: false,
      strategy: null,
      success: false,
      result: null
    };

    // Network errors - retry
    if (errorType === 'network_error' || errorType === 'timeout_error') {
      recovery.attempted = true;
      recovery.strategy = 'retry';
      recovery.result = await this.retryOperation(context.operation, context.retries || 3);
      recovery.success = recovery.result !== null;
    }

    // Rate limit errors - wait and retry
    if (errorType === 'rate_limit_error') {
      recovery.attempted = true;
      recovery.strategy = 'wait_and_retry';
      const waitTime = error.retryAfter || 5000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      recovery.result = await this.retryOperation(context.operation, 1);
      recovery.success = recovery.result !== null;
    }

    // Server errors - fallback
    if (errorType === 'server_error') {
      recovery.attempted = true;
      recovery.strategy = 'fallback';
      recovery.result = context.fallback || null;
      recovery.success = recovery.result !== null;
    }

    // Resource errors - scale or degrade
    if (errorType === 'resource_error') {
      recovery.attempted = true;
      recovery.strategy = 'degrade';
      recovery.result = context.degradedMode || null;
      recovery.success = recovery.result !== null;
    }

    return recovery;
  }

  /**
   * Retry operation
   */
  async retryOperation(operation, maxRetries = 3) {
    if (!operation || typeof operation !== 'function') {
      return null;
    }

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return null;
  }

  /**
   * Report error
   */
  reportError(error, errorType, context, recovery) {
    // Log error
    logger.error(`[${errorType}] ${error.message}`, {
      context,
      recovery: recovery.success ? 'recovered' : 'failed'
    });

    // Send to monitoring (if available)
    try {
      const { getProductionMonitoring } = require('../mlops/productionMonitoring');
      const monitoring = getProductionMonitoring();
      if (monitoring) {
        monitoring.sendAlert('error_rate', {
          errorType,
          message: error.message,
          recovery: recovery.success
        });
      }
    } catch (e) {
      // Monitoring not available
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(timeRange = null) {
    let errors = this.errorHistory;

    if (timeRange) {
      const startTime = Date.now() - timeRange;
      errors = errors.filter(e => e.timestamp >= startTime);
    }

    const byType = {};
    for (const error of errors) {
      if (!byType[error.type]) {
        byType[error.type] = 0;
      }
      byType[error.type]++;
    }

    return {
      total: errors.length,
      byType,
      stats: Object.fromEntries(this.errorStats),
      timestamp: Date.now()
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 100) {
    return this.errorHistory.slice(-limit).reverse();
  }
}

// Singleton instance
let instance = null;

function getErrorHandler() {
  if (!instance) {
    instance = new ErrorHandler();
  }
  return instance;
}

module.exports = {
  ErrorHandler,
  getErrorHandler
};

