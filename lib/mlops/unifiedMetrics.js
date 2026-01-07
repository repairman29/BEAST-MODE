/**
 * Unified Metrics & Analytics
 * Tracks predictions from all services and compares performance
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('UnifiedMetrics');

class UnifiedMetrics {
  constructor() {
    this.metrics = {
      predictions: {
        total: 0,
        byService: {},
        byType: {},
        accuracy: {},
        responseTimes: {}
      },
      services: {
        usage: {},
        success: {},
        failures: {}
      },
      comparisons: {
        serviceVsBeastMode: {},
        accuracyImprovements: {}
      }
    };
    
    this.maxHistory = 1000; // Keep last 1000 predictions
    this.history = [];
  }

  /**
   * Record a prediction
   */
  recordPrediction(prediction) {
    this.metrics.predictions.total++;
    
    const service = prediction.source || 'unknown';
    const type = prediction.predictionType || 'unknown';
    
    // Track by service
    if (!this.metrics.predictions.byService[service]) {
      this.metrics.predictions.byService[service] = 0;
    }
    this.metrics.predictions.byService[service]++;
    
    // Track by type
    if (!this.metrics.predictions.byType[type]) {
      this.metrics.predictions.byType[type] = 0;
    }
    this.metrics.predictions.byType[type]++;
    
    // Track response time
    if (prediction.responseTime) {
      if (!this.metrics.predictions.responseTimes[service]) {
        this.metrics.predictions.responseTimes[service] = [];
      }
      this.metrics.predictions.responseTimes[service].push(prediction.responseTime);
      
      // Keep only last 100
      if (this.metrics.predictions.responseTimes[service].length > 100) {
        this.metrics.predictions.responseTimes[service].shift();
      }
    }
    
    // Add to history
    this.history.push({
      ...prediction,
      timestamp: new Date().toISOString()
    });
    
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    // Track service usage
    if (!this.metrics.services.usage[service]) {
      this.metrics.services.usage[service] = 0;
    }
    this.metrics.services.usage[service]++;
  }

  /**
   * Record prediction accuracy (when feedback available)
   */
  recordAccuracy(service, actualQuality, predictedQuality) {
    if (!this.metrics.predictions.accuracy[service]) {
      this.metrics.predictions.accuracy[service] = {
        total: 0,
        correct: 0,
        errors: [],
        mae: 0 // Mean Absolute Error
      };
    }
    
    const acc = this.metrics.predictions.accuracy[service];
    acc.total++;
    
    const error = Math.abs(actualQuality - predictedQuality);
    acc.errors.push(error);
    if (acc.errors.length > 100) {
      acc.errors.shift();
    }
    
    acc.mae = acc.errors.reduce((sum, e) => sum + e, 0) / acc.errors.length;
    
    if (error < 0.1) { // Within 10% is considered "correct"
      acc.correct++;
    }
  }

  /**
   * Record service success/failure
   */
  recordServiceResult(service, success) {
    if (!this.metrics.services.success[service]) {
      this.metrics.services.success[service] = 0;
      this.metrics.services.failures[service] = 0;
    }
    
    if (success) {
      this.metrics.services.success[service]++;
    } else {
      this.metrics.services.failures[service]++;
    }
  }

  /**
   * Compare service vs BEAST MODE
   */
  compareServiceVsBeastMode(service) {
    const serviceAcc = this.metrics.predictions.accuracy[service];
    const beastModeAcc = this.metrics.predictions.accuracy['beast-mode'] || 
                        this.metrics.predictions.accuracy['ml_model'];
    
    if (!serviceAcc || !beastModeAcc) {
      return null;
    }
    
    const improvement = {
      service: service,
      serviceAccuracy: serviceAcc.correct / serviceAcc.total,
      beastModeAccuracy: beastModeAcc.correct / beastModeAcc.total,
      improvement: (serviceAcc.correct / serviceAcc.total) - (beastModeAcc.correct / beastModeAcc.total),
      serviceMAE: serviceAcc.mae,
      beastModeMAE: beastModeAcc.mae,
      maeImprovement: beastModeAcc.mae - serviceAcc.mae
    };
    
    this.metrics.comparisons.serviceVsBeastMode[service] = improvement;
    
    return improvement;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const stats = {
      total: this.metrics.predictions.total,
      byService: { ...this.metrics.predictions.byService },
      byType: { ...this.metrics.predictions.byType },
      serviceUsage: { ...this.metrics.services.usage },
      serviceSuccess: { ...this.metrics.services.success },
      serviceFailures: { ...this.metrics.services.failures },
      averageResponseTimes: {},
      accuracy: {},
      comparisons: { ...this.metrics.comparisons.serviceVsBeastMode }
    };
    
    // Calculate average response times
    for (const [service, times] of Object.entries(this.metrics.predictions.responseTimes)) {
      if (times.length > 0) {
        stats.averageResponseTimes[service] = times.reduce((sum, t) => sum + t, 0) / times.length;
      }
    }
    
    // Calculate accuracy rates
    for (const [service, acc] of Object.entries(this.metrics.predictions.accuracy)) {
      if (acc.total > 0) {
        stats.accuracy[service] = {
          rate: acc.correct / acc.total,
          mae: acc.mae,
          total: acc.total
        };
      }
    }
    
    return stats;
  }

  /**
   * Get recent history
   */
  getRecentHistory(limit = 50) {
    return this.history.slice(-limit).reverse();
  }

  /**
   * Get service performance summary
   */
  getServicePerformance(service) {
    const usage = this.metrics.services.usage[service] || 0;
    const success = this.metrics.services.success[service] || 0;
    const failures = this.metrics.services.failures[service] || 0;
    const total = success + failures;
    
    const accuracy = this.metrics.predictions.accuracy[service];
    const responseTimes = this.metrics.predictions.responseTimes[service] || [];
    
    return {
      service,
      usage,
      successRate: total > 0 ? success / total : 0,
      success,
      failures,
      accuracy: accuracy ? {
        rate: accuracy.correct / accuracy.total,
        mae: accuracy.mae,
        total: accuracy.total
      } : null,
      averageResponseTime: responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : null
    };
  }
}

// Singleton instance
let unifiedMetricsInstance = null;

function getUnifiedMetrics() {
  if (!unifiedMetricsInstance) {
    unifiedMetricsInstance = new UnifiedMetrics();
  }
  return unifiedMetricsInstance;
}

module.exports = {
  getUnifiedMetrics,
  UnifiedMetrics
};

