/**
 * Trend Analyzer Service
 * Analyzes trends, patterns, and time series data
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
const logger = createLogger('TrendAnalyzer');

class TrendAnalyzer {
  constructor() {
    this.trends = new Map();
    this.patterns = new Map();
  }

  /**
   * Initialize trend analyzer
   */
  async initialize() {
    try {
      logger.info('✅ Trend analyzer initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize trend analyzer:', error);
      return false;
    }
  }

  /**
   * Analyze time series trends
   */
  analyzeTrends(data, options = {}) {
    try {
      const {
        metric = 'value',
        timeWindow = 7, // days
        method = 'linear'
      } = options;

      if (!data || data.length < 2) {
        return { trend: 'insufficient_data' };
      }

      // Extract values
      const values = data.map(d => d[metric] || d.value || 0);
      const timestamps = data.map(d => d.timestamp || d.date || Date.now());

      // Calculate trend
      const trend = this.calculateTrend(values, method);

      // Detect patterns
      const patterns = this.detectPatterns(values);

      // Seasonal analysis
      const seasonal = this.analyzeSeasonality(values, timestamps);

      const analysis = {
        trend: trend.direction,
        slope: trend.slope,
        strength: trend.strength,
        patterns,
        seasonal,
        forecast: this.forecast(values, 7), // 7-day forecast
        timestamp: Date.now()
      };

      this.trends.set(`trend_${Date.now()}`, analysis);
      return analysis;
    } catch (error) {
      logger.error('Trend analysis failed:', error);
      return null;
    }
  }

  /**
   * Calculate trend
   */
  calculateTrend(values, method = 'linear') {
    if (method === 'linear') {
      // Simple linear regression
      const n = values.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = values;

      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Determine direction
      let direction = 'stable';
      if (slope > 0.1) direction = 'increasing';
      else if (slope < -0.1) direction = 'decreasing';

      // Calculate strength (R-squared)
      const yMean = sumY / n;
      const ssRes = y.reduce((sum, yi, i) => {
        const predicted = slope * x[i] + intercept;
        return sum + Math.pow(yi - predicted, 2);
      }, 0);
      const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
      const strength = 1 - (ssRes / ssTot);

      return {
        direction,
        slope,
        intercept,
        strength: Math.max(0, Math.min(1, strength))
      };
    }

    return { direction: 'unknown', slope: 0, strength: 0 };
  }

  /**
   * Detect patterns
   */
  detectPatterns(values) {
    const patterns = {
      cycles: [],
      spikes: [],
      dips: []
    };

    if (values.length < 3) return patterns;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );

    // Detect spikes (values > mean + 2*std)
    for (let i = 0; i < values.length; i++) {
      if (values[i] > mean + 2 * std) {
        patterns.spikes.push({ index: i, value: values[i] });
      }
      if (values[i] < mean - 2 * std) {
        patterns.dips.push({ index: i, value: values[i] });
      }
    }

    // Detect cycles (simplified)
    if (values.length >= 7) {
      const weeklyPattern = this.detectWeeklyCycle(values);
      if (weeklyPattern) {
        patterns.cycles.push(weeklyPattern);
      }
    }

    return patterns;
  }

  /**
   * Detect weekly cycle
   */
  detectWeeklyCycle(values) {
    // Simplified cycle detection
    const weeklyAvg = [];
    for (let i = 0; i < 7; i++) {
      const dayValues = [];
      for (let j = i; j < values.length; j += 7) {
        dayValues.push(values[j]);
      }
      if (dayValues.length > 0) {
        weeklyAvg.push(dayValues.reduce((a, b) => a + b, 0) / dayValues.length);
      }
    }

    if (weeklyAvg.length === 7) {
      const maxDay = weeklyAvg.indexOf(Math.max(...weeklyAvg));
      const minDay = weeklyAvg.indexOf(Math.min(...weeklyAvg));
      
      return {
        type: 'weekly',
        peakDay: maxDay,
        lowDay: minDay,
        amplitude: Math.max(...weeklyAvg) - Math.min(...weeklyAvg)
      };
    }

    return null;
  }

  /**
   * Analyze seasonality
   */
  analyzeSeasonality(values, timestamps) {
    // Simplified seasonality analysis
    if (values.length < 30) {
      return { detected: false };
    }

    // Group by day of week
    const byDay = {};
    for (let i = 0; i < values.length; i++) {
      const date = new Date(timestamps[i]);
      const day = date.getDay();
      if (!byDay[day]) {
        byDay[day] = [];
      }
      byDay[day].push(values[i]);
    }

    const dayAverages = {};
    for (const [day, dayValues] of Object.entries(byDay)) {
      dayAverages[day] = dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
    }

    const hasSeasonality = Object.keys(dayAverages).length > 0 &&
      Math.max(...Object.values(dayAverages)) - Math.min(...Object.values(dayAverages)) > 
      (values.reduce((a, b) => a + b, 0) / values.length) * 0.1;

    return {
      detected: hasSeasonality,
      dayAverages
    };
  }

  /**
   * Forecast future values
   */
  forecast(values, periods = 7) {
    if (values.length < 2) {
      return [];
    }

    // Simple linear forecast
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Forecast
    const forecast = [];
    for (let i = 0; i < periods; i++) {
      const futureX = n + i;
      forecast.push(slope * futureX + intercept);
    }

    return forecast;
  }

  /**
   * Get trend analysis
   */
  getTrendAnalysis(trendId) {
    return this.trends.get(trendId) || null;
  }

  /**
   * Get all trends
   */
  getAllTrends() {
    return Array.from(this.trends.values());
  }
}

// Singleton instance
let instance = null;

function getTrendAnalyzer() {
  if (!instance) {
    instance = new TrendAnalyzer();
  }
  return instance;
}

module.exports = {
  TrendAnalyzer,
  getTrendAnalyzer
};

