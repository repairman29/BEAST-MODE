/**
 * Predictive Analytics Service
 * Provides forecasting and scenario analysis
 * 
 * Month 9: Advanced Analytics & Intelligence
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
const { getTrendAnalyzer } = require('./trendAnalyzer');
const logger = createLogger('PredictiveAnalytics');

class PredictiveAnalytics {
  constructor() {
    this.predictions = new Map();
    this.models = new Map();
  }

  /**
   * Initialize predictive analytics
   */
  async initialize() {
    try {
      this.trendAnalyzer = getTrendAnalyzer();
      await this.trendAnalyzer.initialize();
      logger.info('✅ Predictive analytics initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize predictive analytics:', error);
      return false;
    }
  }

  /**
   * Forecast future values
   */
  async forecast(metric, historicalData, periods = 7, method = 'trend') {
    try {
      logger.info(`Forecasting ${metric} for ${periods} periods`);

      let forecast = null;

      switch (method) {
        case 'trend':
          forecast = this.trendBasedForecast(historicalData, periods);
          break;
        case 'moving_average':
          forecast = this.movingAverageForecast(historicalData, periods);
          break;
        case 'exponential_smoothing':
          forecast = this.exponentialSmoothingForecast(historicalData, periods);
          break;
        default:
          forecast = this.trendBasedForecast(historicalData, periods);
      }

      const prediction = {
        id: `forecast_${Date.now()}`,
        metric,
        method,
        periods,
        forecast,
        confidence: this.calculateConfidence(historicalData),
        timestamp: Date.now()
      };

      this.predictions.set(prediction.id, prediction);
      return prediction;
    } catch (error) {
      logger.error('Forecast failed:', error);
      return null;
    }
  }

  /**
   * Trend-based forecast
   */
  trendBasedForecast(historicalData, periods) {
    const values = historicalData.map(d => d.value || d);
    const trend = this.trendAnalyzer.calculateTrend(values);
    
    const n = values.length;
    const forecast = [];
    
    for (let i = 0; i < periods; i++) {
      const futureValue = trend.slope * (n + i) + trend.intercept;
      forecast.push({
        period: i + 1,
        value: Math.max(0, futureValue), // Ensure non-negative
        confidence: trend.strength
      });
    }

    return forecast;
  }

  /**
   * Moving average forecast
   */
  movingAverageForecast(historicalData, periods, window = 7) {
    const values = historicalData.map(d => d.value || d);
    const forecast = [];

    // Calculate moving average
    const recentValues = values.slice(-window);
    const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;

    for (let i = 0; i < periods; i++) {
      forecast.push({
        period: i + 1,
        value: avg,
        confidence: 0.7 // Lower confidence for simple average
      });
    }

    return forecast;
  }

  /**
   * Exponential smoothing forecast
   */
  exponentialSmoothingForecast(historicalData, periods, alpha = 0.3) {
    const values = historicalData.map(d => d.value || d);
    const forecast = [];

    // Calculate exponential smoothing
    let smoothed = values[0];
    for (let i = 1; i < values.length; i++) {
      smoothed = alpha * values[i] + (1 - alpha) * smoothed;
    }

    for (let i = 0; i < periods; i++) {
      forecast.push({
        period: i + 1,
        value: smoothed,
        confidence: 0.75
      });
    }

    return forecast;
  }

  /**
   * Calculate confidence
   */
  calculateConfidence(historicalData) {
    if (!historicalData || historicalData.length < 2) {
      return 0.5;
    }

    const values = historicalData.map(d => d.value || d);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    // Higher variance = lower confidence
    const coefficientOfVariation = std / mean;
    const confidence = Math.max(0, Math.min(1, 1 - coefficientOfVariation));

    return confidence;
  }

  /**
   * Scenario analysis
   */
  async scenarioAnalysis(baseForecast, scenarios = []) {
    try {
      logger.info(`Running scenario analysis with ${scenarios.length} scenarios`);

      if (!baseForecast || !baseForecast.forecast) {
        throw new Error('Invalid base forecast');
      }

      const analysis = {
        base: baseForecast,
        scenarios: [],
        timestamp: Date.now()
      };

      for (const scenario of scenarios) {
        const scenarioForecast = this.applyScenario(baseForecast, scenario);
        analysis.scenarios.push({
          name: scenario.name || 'unnamed',
          description: scenario.description || '',
          adjustments: scenario.adjustments || {},
          forecast: scenarioForecast,
          impact: this.calculateImpact(baseForecast.forecast, scenarioForecast)
        });
      }

      return analysis;
    } catch (error) {
      logger.error('Scenario analysis failed:', error);
      return null;
    }
  }

  /**
   * Apply scenario to forecast
   */
  applyScenario(forecast, scenario) {
    const adjusted = forecast.forecast.map(f => {
      let adjustedValue = f.value;

      // Apply percentage adjustments
      if (scenario.adjustments.percentage) {
        adjustedValue = adjustedValue * (1 + scenario.adjustments.percentage / 100);
      }

      // Apply fixed adjustments
      if (scenario.adjustments.fixed) {
        adjustedValue = adjustedValue + scenario.adjustments.fixed;
      }

      return {
        ...f,
        value: Math.max(0, adjustedValue)
      };
    });

    return adjusted;
  }

  /**
   * Calculate impact
   */
  calculateImpact(baseForecast, scenarioForecast) {
    const baseTotal = baseForecast.reduce((sum, f) => sum + f.value, 0);
    const scenarioTotal = scenarioForecast.reduce((sum, f) => sum + f.value, 0);
    
    const difference = scenarioTotal - baseTotal;
    const percentageChange = (difference / baseTotal) * 100;

    return {
      totalDifference: difference,
      percentageChange: percentageChange.toFixed(2),
      direction: difference > 0 ? 'increase' : 'decrease'
    };
  }

  /**
   * Get prediction
   */
  getPrediction(predictionId) {
    return this.predictions.get(predictionId) || null;
  }

  /**
   * Get all predictions
   */
  getAllPredictions() {
    return Array.from(this.predictions.values());
  }
}

// Singleton instance
let instance = null;

function getPredictiveAnalytics() {
  if (!instance) {
    instance = new PredictiveAnalytics();
  }
  return instance;
}

module.exports = {
  PredictiveAnalytics,
  getPredictiveAnalytics
};

