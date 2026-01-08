/**
 * Anomaly Detector
 * 
 * Detects anomalies in:
 * - Quality scores
 * - Performance metrics
 * - Cost patterns
 * - Model behavior
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('AnomalyDetector');

class AnomalyDetector {
  constructor() {
    this.history = new Map(); // metric -> history array
    this.anomalies = []; // Detected anomalies
  }

  /**
   * Detect anomalies in a metric
   * @param {string} metricName - Name of the metric
   * @param {number} value - Current value
   * @param {object} metadata - Additional context
   * @returns {object|null} - Anomaly object or null
   */
  detectAnomaly(metricName, value, metadata = {}) {
    if (!this.history.has(metricName)) {
      this.history.set(metricName, []);
    }

    const history = this.history.get(metricName);
    history.push({ value, timestamp: Date.now(), metadata });

    // Keep only last 1000 values
    if (history.length > 1000) {
      history.shift();
    }

    // Need at least 10 data points for detection
    if (history.length < 10) {
      return null;
    }

    // Calculate statistics
    const values = history.map(h => h.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Z-score detection (values > 3 standard deviations are anomalies)
    const zScore = stdDev > 0 ? Math.abs((value - mean) / stdDev) : 0;

    if (zScore > 3) {
      const anomaly = {
        id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metric: metricName,
        value,
        expected: mean,
        zScore,
        severity: zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
        metadata
      };

      this.anomalies.push(anomaly);

      // Keep only last 1000 anomalies
      if (this.anomalies.length > 1000) {
        this.anomalies.shift();
      }

      log.warn(`Anomaly detected in ${metricName}: ${value} (expected: ${mean.toFixed(2)}, z-score: ${zScore.toFixed(2)})`);

      return anomaly;
    }

    // Trend-based detection (sudden changes)
    if (history.length >= 20) {
      const recent = values.slice(-10);
      const older = values.slice(-20, -10);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      const change = Math.abs((recentAvg - olderAvg) / olderAvg);

      if (change > 0.5) { // 50% change
        const anomaly = {
          id: `anomaly-trend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          metric: metricName,
          value,
          previousAvg: olderAvg,
          currentAvg: recentAvg,
          changePercent: change * 100,
          severity: change > 1 ? 'high' : 'medium',
          type: 'trend',
          timestamp: new Date().toISOString(),
          metadata
        };

        this.anomalies.push(anomaly);

        if (this.anomalies.length > 1000) {
          this.anomalies.shift();
        }

        log.warn(`Trend anomaly detected in ${metricName}: ${(change * 100).toFixed(1)}% change`);

        return anomaly;
      }
    }

    return null;
  }

  /**
   * Get recent anomalies
   */
  getAnomalies(metricName = null, timeRange = '7d', severity = null) {
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    let filtered = this.anomalies.filter(a => new Date(a.timestamp).getTime() >= cutoff);

    if (metricName) {
      filtered = filtered.filter(a => a.metric === metricName);
    }

    if (severity) {
      filtered = filtered.filter(a => a.severity === severity);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filtered;
  }

  /**
   * Get anomaly statistics
   */
  getStats(timeRange = '7d') {
    const anomalies = this.getAnomalies(null, timeRange);

    const byMetric = {};
    const bySeverity = { critical: 0, high: 0, medium: 0 };

    anomalies.forEach(anomaly => {
      byMetric[anomaly.metric] = (byMetric[anomaly.metric] || 0) + 1;
      bySeverity[anomaly.severity] = (bySeverity[anomaly.severity] || 0) + 1;
    });

    return {
      total: anomalies.length,
      byMetric,
      bySeverity,
      recent: anomalies.slice(0, 10)
    };
  }

  /**
   * Clear anomalies
   */
  clear() {
    this.anomalies = [];
    this.history.clear();
    log.info('Anomaly detector cleared');
  }
}

// Singleton instance
let anomalyDetectorInstance = null;

function getAnomalyDetector() {
  if (!anomalyDetectorInstance) {
    anomalyDetectorInstance = new AnomalyDetector();
  }
  return anomalyDetectorInstance;
}

module.exports = {
  AnomalyDetector,
  getAnomalyDetector
};
