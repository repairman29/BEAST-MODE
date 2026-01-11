/**
 * Production Monitor Service
 * 
 * Comprehensive production monitoring and observability
 * 
 * Phase 1: Production Deployment
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
const logger = createLogger('ProductionMonitor');

class ProductionMonitor {
  constructor() {
    this.metrics = new Map();
    this.logs = [];
    this.alerts = [];
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * Initialize production monitor
   */
  async initialize() {
    try {
      // Start metrics collection
      this.startMetricsCollection();
      logger.info('✅ Production monitor initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize production monitor:', error);
      return false;
    }
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect application metrics every minute
    setInterval(() => {
      this.collectApplicationMetrics();
    }, 60000);
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const metrics = {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        unit: 'MB'
      },
      cpu: {
        usage: process.cpuUsage(),
        uptime: process.uptime()
      },
      timestamp: Date.now()
    };

    this.metrics.set('system', metrics);
  }

  /**
   * Collect application metrics
   */
  collectApplicationMetrics() {
    const metrics = {
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        success: this.requestCount - this.errorCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0
      },
      uptime: Date.now() - this.startTime,
      timestamp: Date.now()
    };

    this.metrics.set('application', metrics);
  }

  /**
   * Record request
   */
  recordRequest(endpoint, method, statusCode, duration) {
    this.requestCount++;
    
    if (statusCode >= 400) {
      this.errorCount++;
    }

    const log = {
      type: 'request',
      endpoint,
      method,
      statusCode,
      duration,
      timestamp: Date.now()
    };

    this.logs.push(log);

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }

  /**
   * Record error
   */
  recordError(error, context = {}) {
    this.errorCount++;

    const log = {
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: Date.now()
    };

    this.logs.push(log);

    // Check if alert is needed
    if (this.errorCount > 10 && this.errorCount % 10 === 0) {
      this.createAlert('error_rate', `High error rate: ${this.errorCount} errors`, {
        errorCount: this.errorCount,
        requestCount: this.requestCount
      });
    }

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }

  /**
   * Create alert
   */
  createAlert(type, message, data = {}) {
    const alert = {
      id: `alert_${Date.now()}`,
      type,
      message,
      data,
      severity: this.getAlertSeverity(type),
      timestamp: Date.now()
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    logger.warn(`[Alert] ${type}: ${message}`);
    return alert;
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(type) {
    const severityMap = {
      error_rate: 'high',
      memory_high: 'medium',
      cpu_high: 'medium',
      slow_response: 'low'
    };

    return severityMap[type] || 'low';
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const system = this.metrics.get('system') || {};
    const application = this.metrics.get('application') || {};

    return {
      system,
      application,
      alerts: this.alerts.slice(-10),
      timestamp: Date.now()
    };
  }

  /**
   * Get logs
   */
  getLogs(type = null, limit = 100) {
    let logs = this.logs;

    if (type) {
      logs = logs.filter(log => log.type === type);
    }

    return logs.slice(-limit).reverse();
  }

  /**
   * Get alerts
   */
  getAlerts(severity = null, limit = 50) {
    let alerts = this.alerts;

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    return alerts.slice(-limit).reverse();
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const application = this.metrics.get('application') || {};
    const system = this.metrics.get('system') || {};

    const errorRate = application.requests?.errorRate || 0;
    const memoryUsage = system.memory?.used || 0;
    const memoryTotal = system.memory?.total || 0;
    const memoryPercent = memoryTotal > 0 ? (memoryUsage / memoryTotal) * 100 : 0;

    let status = 'healthy';
    const issues = [];

    if (errorRate > 5) {
      status = 'unhealthy';
      issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
    }

    if (memoryPercent > 90) {
      status = 'degraded';
      issues.push(`High memory usage: ${memoryPercent.toFixed(2)}%`);
    }

    return {
      status,
      issues,
      metrics: {
        errorRate,
        memoryUsage: memoryPercent,
        uptime: application.uptime || 0
      },
      timestamp: Date.now()
    };
  }
}

// Singleton instance
let instance = null;

function getProductionMonitor() {
  if (!instance) {
    instance = new ProductionMonitor();
  }
  return instance;
}

module.exports = {
  ProductionMonitor,
  getProductionMonitor
};

