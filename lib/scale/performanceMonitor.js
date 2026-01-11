/**
 * Performance Monitor Service
 * Real-time performance monitoring and alerting
 * 
 * Month 10: Advanced Scaling & Performance Monitoring
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
const logger = createLogger('PerformanceMonitor');

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
    this.dashboards = new Map();
    this.thresholds = {
      responseTime: 1000,
      latency: 500,
      errorRate: 0.05,
      cpuUsage: 80,
      memoryUsage: 85
    };
  }

  /**
   * Initialize performance monitor
   */
  async initialize() {
    try {
      this.setupDefaultDashboards();
      logger.info('✅ Performance monitor initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize performance monitor:', error);
      return false;
    }
  }

  /**
   * Setup default dashboards
   */
  setupDefaultDashboards() {
    this.dashboards.set('overview', {
      name: 'Overview',
      metrics: ['responseTime', 'throughput', 'errorRate', 'cpuUsage', 'memoryUsage'],
      refreshInterval: 5000
    });

    this.dashboards.set('performance', {
      name: 'Performance',
      metrics: ['responseTime', 'latency', 'throughput', 'p95', 'p99'],
      refreshInterval: 10000
    });

    this.dashboards.set('resources', {
      name: 'Resources',
      metrics: ['cpuUsage', 'memoryUsage', 'diskUsage', 'networkUsage'],
      refreshInterval: 5000
    });
  }

  /**
   * Record metric
   */
  recordMetric(name, value, tags = {}) {
    try {
      const metric = {
        name,
        value,
        tags,
        timestamp: Date.now()
      };

      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }

      this.metrics.get(name).push(metric);

      // Keep only last 10000 metrics per type
      const metricList = this.metrics.get(name);
      if (metricList.length > 10000) {
        metricList.shift();
      }

      // Check thresholds
      this.checkThresholds(name, value, tags);

      return metric;
    } catch (error) {
      logger.error('Metric recording failed:', error);
      return null;
    }
  }

  /**
   * Check thresholds
   */
  checkThresholds(name, value, tags) {
    const threshold = this.thresholds[name];
    if (!threshold) return;

    let shouldAlert = false;
    let severity = 'warning';

    if (name === 'errorRate') {
      shouldAlert = value > threshold;
      severity = value > threshold * 2 ? 'critical' : 'warning';
    } else {
      shouldAlert = value > threshold;
      severity = value > threshold * 1.5 ? 'critical' : 'warning';
    }

    if (shouldAlert) {
      this.createAlert(name, value, threshold, severity, tags);
    }
  }

  /**
   * Create alert
   */
  createAlert(metric, value, threshold, severity, tags) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metric,
      value,
      threshold,
      severity,
      tags,
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.push(alert);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }

    logger.warn(`Performance alert: ${metric} = ${value} (threshold: ${threshold}, severity: ${severity})`);

    // Send alert (would integrate with alerting system)
    this.sendAlert(alert);

    return alert;
  }

  /**
   * Send alert
   */
  sendAlert(alert) {
    // Would integrate with external alerting (Slack, PagerDuty, etc.)
    // For now, just log
    logger.info(`Alert sent: ${alert.id}`);
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics(dashboardId = 'overview') {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      return { error: 'Dashboard not found' };
    }

    const metrics = {};
    const now = Date.now();
    const timeWindow = 60000; // Last minute

    for (const metricName of dashboard.metrics) {
      const metricList = this.metrics.get(metricName) || [];
      const recentMetrics = metricList.filter(m => m.timestamp > now - timeWindow);

      if (recentMetrics.length > 0) {
        const values = recentMetrics.map(m => m.value);
        metrics[metricName] = {
          current: values[values.length - 1],
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    }

    return {
      dashboard: dashboard.name,
      metrics,
      timestamp: now
    };
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(metricName, timeRange = 3600000) {
    const metricList = this.metrics.get(metricName) || [];
    const startTime = Date.now() - timeRange;
    const filtered = metricList.filter(m => m.timestamp >= startTime);

    if (filtered.length === 0) {
      return { metric: metricName, data: [], timeRange };
    }

    const values = filtered.map(m => m.value);
    const timestamps = filtered.map(m => m.timestamp);

    return {
      metric: metricName,
      data: filtered,
      summary: {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p95: this.percentile(values, 0.95),
        p99: this.percentile(values, 0.99)
      },
      timeRange,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate percentile
   */
  percentile(values, p) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * p);
    return sorted[index] || 0;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(severity = null) {
    let alerts = this.alerts.filter(a => !a.acknowledged);

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Create custom dashboard
   */
  createDashboard(id, name, metrics, refreshInterval = 5000) {
    const dashboard = {
      id,
      name,
      metrics,
      refreshInterval,
      createdAt: Date.now()
    };

    this.dashboards.set(id, dashboard);
    return dashboard;
  }

  /**
   * Get dashboard
   */
  getDashboard(dashboardId) {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * Get all dashboards
   */
  getAllDashboards() {
    return Array.from(this.dashboards.values());
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {
      metrics: {},
      alerts: {
        total: this.alerts.length,
        active: this.getActiveAlerts().length,
        critical: this.getActiveAlerts('critical').length,
        warning: this.getActiveAlerts('warning').length
      },
      dashboards: this.dashboards.size,
      timestamp: Date.now()
    };

    // Calculate summary for each metric
    for (const [name, metricList] of this.metrics.entries()) {
      if (metricList.length > 0) {
        const values = metricList.map(m => m.value);
        summary.metrics[name] = {
          count: values.length,
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    }

    return summary;
  }
}

// Singleton instance
let instance = null;

function getPerformanceMonitor() {
  if (!instance) {
    instance = new PerformanceMonitor();
  }
  return instance;
}

module.exports = {
  PerformanceMonitor,
  getPerformanceMonitor
};

