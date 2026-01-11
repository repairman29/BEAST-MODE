/**
 * Predictive Analyzer
 * 
 * Predicts future trends based on historical data:
 * - Quality trends
 * - Performance patterns
 * - Cost projections
 * - Model performance
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
const log = createLogger('PredictiveAnalyzer');

class PredictiveAnalyzer {
  constructor() {
    this.models = new Map(); // metric -> prediction model
  }

  /**
   * Predict future value using linear regression
   * @param {string} metricName - Name of the metric
   * @param {Array} history - Historical data points [{timestamp, value}]
   * @param {number} daysAhead - Days to predict ahead
   * @returns {object} - Prediction with confidence
   */
  predict(metricName, history, daysAhead = 7) {
    if (!history || history.length < 10) {
      return {
        predicted: null,
        confidence: 0,
        error: 'Insufficient data (need at least 10 data points)'
      };
    }

    // Simple linear regression
    const n = history.length;
    const x = history.map((_, i) => i);
    const y = history.map(h => h.value);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict future value
    const futureX = n + daysAhead;
    const predicted = slope * futureX + intercept;

    // Calculate confidence based on R²
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predictedY = slope * x[i] + intercept;
      return sum + Math.pow(yi - predictedY, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    const confidence = Math.max(0, Math.min(1, rSquared));

    // Calculate prediction interval (simplified)
    const stdError = Math.sqrt(ssRes / (n - 2));
    const margin = stdError * 1.96; // 95% confidence interval

    return {
      predicted,
      confidence,
      lowerBound: predicted - margin,
      upperBound: predicted + margin,
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      slope,
      rSquared
    };
  }

  /**
   * Predict quality trends
   */
  predictQuality(history, daysAhead = 7) {
    return this.predict('quality', history, daysAhead);
  }

  /**
   * Predict performance trends
   */
  predictPerformance(history, daysAhead = 7) {
    return this.predict('performance', history, daysAhead);
  }

  /**
   * Predict cost trends
   */
  predictCost(history, daysAhead = 30) {
    return this.predict('cost', history, daysAhead);
  }

  /**
   * Get prediction for a metric
   */
  getPrediction(metricName, history, daysAhead = 7) {
    if (!this.models.has(metricName)) {
      this.models.set(metricName, {
        history: [],
        lastPrediction: null
      });
    }

    const model = this.models.get(metricName);
    
    // Update history
    if (Array.isArray(history)) {
      model.history = history;
    } else {
      model.history.push(history);
      if (model.history.length > 1000) {
        model.history.shift();
      }
    }

    // Make prediction
    const prediction = this.predict(metricName, model.history, daysAhead);
    model.lastPrediction = {
      ...prediction,
      timestamp: new Date().toISOString(),
      daysAhead
    };

    return prediction;
  }

  /**
   * Get all predictions
   */
  getAllPredictions() {
    const predictions = {};
    for (const [metricName, model] of this.models.entries()) {
      if (model.lastPrediction) {
        predictions[metricName] = model.lastPrediction;
      }
    }
    return predictions;
  }

  /**
   * Clear predictions
   */
  clear() {
    this.models.clear();
    log.info('Predictive analyzer cleared');
  }
}

// Singleton instance
let predictiveAnalyzerInstance = null;

function getPredictiveAnalyzer() {
  if (!predictiveAnalyzerInstance) {
    predictiveAnalyzerInstance = new PredictiveAnalyzer();
  }
  return predictiveAnalyzerInstance;
}

module.exports = {
  PredictiveAnalyzer,
  getPredictiveAnalyzer
};
