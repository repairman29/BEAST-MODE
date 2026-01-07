/**
 * Cross-Region Monitoring Service
 * Aggregates monitoring data across all regions
 * 
 * Month 7: Week 2 - Multi-Region Deployment
 */

const { createLogger } = require('../utils/logger');
const { getRegionManager } = require('./regionManager');
const logger = createLogger('CrossRegionMonitoring');

class CrossRegionMonitoring {
  constructor() {
    this.regionMetrics = new Map();
    this.aggregatedMetrics = null;
    this.globalAlerts = [];
  }

  /**
   * Initialize cross-region monitoring
   */
  async initialize() {
    try {
      const regionManager = getRegionManager();
      await regionManager.initialize();

      // Start aggregation worker
      this.startAggregationWorker();
      logger.info('✅ Cross-region monitoring initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize cross-region monitoring:', error);
      return false;
    }
  }

  /**
   * Collect metrics from region
   */
  async collectRegionMetrics(regionId) {
    try {
      const regionManager = getRegionManager();
      const region = regionManager.getRegion(regionId);
      const health = regionManager.getRegionHealth(regionId);

      if (!region || !health) {
        return null;
      }

      // Simulate collecting metrics from region endpoint
      const metrics = {
        regionId: region.id,
        regionName: region.name,
        status: health.status,
        responseTime: health.responseTime,
        lastCheck: health.lastCheck,
        consecutiveFailures: health.consecutiveFailures,
        predictions: {
          total: Math.floor(Math.random() * 10000), // Placeholder
          mlModel: Math.floor(Math.random() * 8000),
          avgLatency: health.responseTime || 100
        },
        timestamp: Date.now()
      };

      this.regionMetrics.set(regionId, metrics);
      return metrics;
    } catch (error) {
      logger.error(`Failed to collect metrics from ${regionId}:`, error);
      return null;
    }
  }

  /**
   * Collect metrics from all regions
   */
  async collectAllRegionMetrics() {
    const regionManager = getRegionManager();
    const regions = regionManager.listRegions();

    const results = await Promise.all(
      regions.map(region => this.collectRegionMetrics(region.id))
    );

    return results.filter(r => r !== null);
  }

  /**
   * Aggregate metrics across regions
   */
  aggregateMetrics() {
    const metrics = Array.from(this.regionMetrics.values());

    if (metrics.length === 0) {
      return null;
    }

    const aggregated = {
      totalRegions: metrics.length,
      activeRegions: metrics.filter(m => m.status === 'healthy').length,
      totalPredictions: metrics.reduce((sum, m) => sum + (m.predictions?.total || 0), 0),
      totalMLPredictions: metrics.reduce((sum, m) => sum + (m.predictions?.mlModel || 0), 0),
      avgLatency: this.calculateAverage(metrics.map(m => m.responseTime).filter(l => l !== null)),
      avgResponseTime: this.calculateAverage(metrics.map(m => m.responseTime).filter(r => r !== null)),
      regions: metrics.map(m => ({
        id: m.regionId,
        name: m.regionName,
        status: m.status,
        predictions: m.predictions?.total || 0,
        latency: m.responseTime
      })),
      timestamp: Date.now()
    };

    this.aggregatedMetrics = aggregated;
    return aggregated;
  }

  /**
   * Calculate average
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Start aggregation worker
   */
  startAggregationWorker() {
    setInterval(async () => {
      await this.collectAllRegionMetrics();
      this.aggregateMetrics();
      this.checkGlobalAlerts();
    }, 60000); // Every minute
  }

  /**
   * Check global alerts
   */
  checkGlobalAlerts() {
    const aggregated = this.aggregatedMetrics;
    if (!aggregated) return;

    // Check for global issues
    if (aggregated.activeRegions < aggregated.totalRegions * 0.5) {
      this.addGlobalAlert('critical', 'More than 50% of regions are down', aggregated);
    }

    if (aggregated.avgLatency > 1000) {
      this.addGlobalAlert('warning', 'High average latency across regions', aggregated);
    }

    // Keep only last 100 alerts
    if (this.globalAlerts.length > 100) {
      this.globalAlerts.shift();
    }
  }

  /**
   * Add global alert
   */
  addGlobalAlert(severity, message, data) {
    const alert = {
      id: `alert_${Date.now()}`,
      severity,
      message,
      data,
      timestamp: Date.now()
    };

    this.globalAlerts.push(alert);
    logger.warn(`[Global Alert] ${severity.toUpperCase()}: ${message}`);
    return alert;
  }

  /**
   * Get global dashboard
   */
  getGlobalDashboard() {
    return {
      aggregated: this.aggregatedMetrics,
      regions: Array.from(this.regionMetrics.values()),
      alerts: this.globalAlerts.slice(-20),
      timestamp: Date.now()
    };
  }

  /**
   * Get region-specific metrics
   */
  getRegionMetrics(regionId) {
    return this.regionMetrics.get(regionId) || null;
  }

  /**
   * Get global alerts
   */
  getGlobalAlerts(severity = null, limit = 50) {
    let alerts = this.globalAlerts;

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    return alerts.slice(-limit).reverse();
  }
}

// Singleton instance
let instance = null;

function getCrossRegionMonitoring() {
  if (!instance) {
    instance = new CrossRegionMonitoring();
  }
  return instance;
}

module.exports = {
  CrossRegionMonitoring,
  getCrossRegionMonitoring
};

