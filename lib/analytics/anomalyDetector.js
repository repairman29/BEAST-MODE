/**
 * Anomaly Detector Service
 * Detects anomalies using statistical and ML methods
 * 
 * Month 9: Advanced Analytics & Intelligence
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('AnomalyDetector');

class AnomalyDetector {
  constructor() {
    this.detectionHistory = [];
    this.models = new Map();
    this.thresholds = {
      statistical: 3, // 3 standard deviations
      percentile: 0.95, // 95th percentile
      iqr: 1.5 // Interquartile range multiplier
    };
  }

  /**
   * Initialize anomaly detector
   */
  async initialize() {
    try {
      logger.info('✅ Anomaly detector initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize anomaly detector:', error);
      return false;
    }
  }

  /**
   * Detect anomalies using statistical methods
   */
  detectAnomalies(data, method = 'statistical') {
    try {
      if (!data || data.length < 3) {
        return { anomalies: [], method: 'insufficient_data' };
      }

      const values = data.map(d => d.value || d);
      const timestamps = data.map(d => d.timestamp || Date.now());

      let anomalies = [];

      switch (method) {
        case 'statistical':
          anomalies = this.statisticalDetection(values, timestamps);
          break;
        case 'percentile':
          anomalies = this.percentileDetection(values, timestamps);
          break;
        case 'iqr':
          anomalies = this.iqrDetection(values, timestamps);
          break;
        case 'zscore':
          anomalies = this.zScoreDetection(values, timestamps);
          break;
        default:
          anomalies = this.statisticalDetection(values, timestamps);
      }

      // Record detection
      const detection = {
        id: `detection_${Date.now()}`,
        method,
        anomalies: anomalies.length,
        timestamp: Date.now(),
        data: anomalies
      };

      this.detectionHistory.push(detection);

      return {
        anomalies,
        method,
        count: anomalies.length,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Anomaly detection failed:', error);
      return { anomalies: [], error: error.message };
    }
  }

  /**
   * Statistical detection (Z-score)
   */
  statisticalDetection(values, timestamps) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );

    if (std === 0) return [];

    const anomalies = [];
    for (let i = 0; i < values.length; i++) {
      const zScore = Math.abs((values[i] - mean) / std);
      if (zScore > this.thresholds.statistical) {
        anomalies.push({
          index: i,
          value: values[i],
          timestamp: timestamps[i],
          zScore: zScore.toFixed(2),
          severity: zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium'
        });
      }
    }

    return anomalies;
  }

  /**
   * Percentile detection
   */
  percentileDetection(values, timestamps) {
    const sorted = [...values].sort((a, b) => a - b);
    const percentile95 = sorted[Math.floor(sorted.length * this.thresholds.percentile)];
    const percentile5 = sorted[Math.floor(sorted.length * (1 - this.thresholds.percentile))];

    const anomalies = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i] > percentile95 || values[i] < percentile5) {
        anomalies.push({
          index: i,
          value: values[i],
          timestamp: timestamps[i],
          percentile: values[i] > percentile95 ? 'high' : 'low',
          severity: 'medium'
        });
      }
    }

    return anomalies;
  }

  /**
   * IQR (Interquartile Range) detection
   */
  iqrDetection(values, timestamps) {
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    const lowerBound = q1 - this.thresholds.iqr * iqr;
    const upperBound = q3 + this.thresholds.iqr * iqr;

    const anomalies = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i] < lowerBound || values[i] > upperBound) {
        anomalies.push({
          index: i,
          value: values[i],
          timestamp: timestamps[i],
          bound: values[i] < lowerBound ? 'lower' : 'upper',
          severity: 'medium'
        });
      }
    }

    return anomalies;
  }

  /**
   * Z-score detection (alternative)
   */
  zScoreDetection(values, timestamps) {
    return this.statisticalDetection(values, timestamps);
  }

  /**
   * Real-time anomaly detection
   */
  detectRealTime(value, context = {}) {
    try {
      // Get recent history
      const recentHistory = this.detectionHistory
        .slice(-100)
        .flatMap(d => d.data || [])
        .map(a => a.value);

      if (recentHistory.length < 10) {
        return { isAnomaly: false, reason: 'insufficient_history' };
      }

      // Quick statistical check
      const mean = recentHistory.reduce((a, b) => a + b, 0) / recentHistory.length;
      const std = Math.sqrt(
        recentHistory.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / recentHistory.length
      );

      if (std === 0) {
        return { isAnomaly: false, reason: 'no_variance' };
      }

      const zScore = Math.abs((value - mean) / std);
      const isAnomaly = zScore > this.thresholds.statistical;

      if (isAnomaly) {
        const anomaly = {
          value,
          timestamp: Date.now(),
          zScore: zScore.toFixed(2),
          severity: zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium',
          context
        };

        this.detectionHistory.push({
          id: `realtime_${Date.now()}`,
          method: 'realtime',
          anomalies: 1,
          timestamp: Date.now(),
          data: [anomaly]
        });

        logger.warn(`Anomaly detected: value=${value}, zScore=${zScore.toFixed(2)}`);
      }

      return {
        isAnomaly,
        zScore: zScore.toFixed(2),
        value,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Real-time anomaly detection failed:', error);
      return { isAnomaly: false, error: error.message };
    }
  }

  /**
   * Get detection history
   */
  getDetectionHistory(limit = 100) {
    return this.detectionHistory.slice(-limit).reverse();
  }

  /**
   * Get anomaly statistics
   */
  getAnomalyStatistics(timeRange = null) {
    let detections = this.detectionHistory;

    if (timeRange) {
      const startTime = Date.now() - timeRange;
      detections = detections.filter(d => d.timestamp >= startTime);
    }

    const totalAnomalies = detections.reduce((sum, d) => sum + (d.anomalies || 0), 0);
    const byMethod = {};
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const detection of detections) {
      byMethod[detection.method] = (byMethod[detection.method] || 0) + (detection.anomalies || 0);
      
      if (detection.data) {
        for (const anomaly of detection.data) {
          if (anomaly.severity) {
            bySeverity[anomaly.severity] = (bySeverity[anomaly.severity] || 0) + 1;
          }
        }
      }
    }

    return {
      totalAnomalies,
      totalDetections: detections.length,
      byMethod,
      bySeverity,
      timestamp: Date.now()
    };
  }
}

// Singleton instance
let instance = null;

function getAnomalyDetector() {
  if (!instance) {
    instance = new AnomalyDetector();
  }
  return instance;
}

module.exports = {
  AnomalyDetector,
  getAnomalyDetector
};

