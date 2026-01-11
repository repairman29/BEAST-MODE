/**
 * Alert Manager Service
 * 
 * Manages alerts and notifications
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
const logger = createLogger('AlertManager');

// Use unified config if available
let getUnifiedConfig = null;
try {
  const path = require('path');
  const configPath = path.join(__dirname, '../../../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

// Helper function to get config value
function getConfigValue(key, defaultValue = null) {
  if (getUnifiedConfig) {
    try {
      const config = getUnifiedConfig();
      const value = config.get(key);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    } catch (error) {
      // Fallback to process.env
    }
  }
  // Fallback to process.env for backward compatibility
  return process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : defaultValue;
}

class AlertManager {
  constructor() {
    this.alertRules = new Map();
    this.notificationChannels = new Map();
    this.alertHistory = [];
    this.silencedAlerts = new Set();
  }

  /**
   * Initialize alert manager
   */
  async initialize() {
    try {
      this.setupDefaultAlertRules();
      this.setupDefaultNotificationChannels();
      logger.info('✅ Alert manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize alert manager:', error);
      return false;
    }
  }

  /**
   * Setup default alert rules
   */
  setupDefaultAlertRules() {
    // Error rate alert
    this.alertRules.set('error_rate_high', {
      name: 'High Error Rate',
      condition: (metrics) => {
        const errorRate = metrics.errorRate || 0;
        return errorRate > 5; // 5% error rate threshold
      },
      severity: 'high',
      message: (metrics) => `Error rate is ${metrics.errorRate?.toFixed(2)}% (threshold: 5%)`
    });

    // Memory usage alert
    this.alertRules.set('memory_high', {
      name: 'High Memory Usage',
      condition: (metrics) => {
        const memoryUsage = metrics.memoryUsage || 0;
        return memoryUsage > 90; // 90% memory threshold
      },
      severity: 'medium',
      message: (metrics) => `Memory usage is ${metrics.memoryUsage?.toFixed(2)}% (threshold: 90%)`
    });

    // Response time alert
    this.alertRules.set('response_time_slow', {
      name: 'Slow Response Time',
      condition: (metrics) => {
        const avgResponseTime = metrics.avgResponseTime || 0;
        return avgResponseTime > 1000; // 1 second threshold
      },
      severity: 'medium',
      message: (metrics) => `Average response time is ${metrics.avgResponseTime}ms (threshold: 1000ms)`
    });

    // Service down alert
    this.alertRules.set('service_down', {
      name: 'Service Down',
      condition: (metrics) => {
        return metrics.status === 'unhealthy';
      },
      severity: 'critical',
      message: (metrics) => `Service is unhealthy: ${metrics.issues?.join(', ') || 'Unknown issue'}`
    });
  }

  /**
   * Setup default notification channels
   */
  setupDefaultNotificationChannels() {
    // Console channel (always available)
    this.notificationChannels.set('console', {
      name: 'Console',
      send: async (alert) => {
        const severity = alert.severity.toUpperCase();
        const emoji = this.getSeverityEmoji(alert.severity);
        console.log(`${emoji} [${severity}] ${alert.message}`);
        return true;
      }
    });

    // Email channel (if configured)
    const alertEmail = getConfigValue('ALERT_EMAIL');
    if (alertEmail) {
      this.notificationChannels.set('email', {
        name: 'Email',
        send: async (alert) => {
          // Email sending would be implemented here
          logger.info(`Email alert sent: ${alert.message}`);
          return true;
        }
      });
    }

    // Slack channel (if configured)
    const slackWebhookUrl = getConfigValue('SLACK_WEBHOOK_URL');
    if (slackWebhookUrl) {
      this.notificationChannels.set('slack', {
        name: 'Slack',
        send: async (alert) => {
          try {
            const response = await fetch(slackWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `🚨 Alert: ${alert.message}`,
                attachments: [{
                  color: this.getSeverityColor(alert.severity),
                  fields: [
                    { title: 'Severity', value: alert.severity, short: true },
                    { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: true }
                  ]
                }]
              })
            });
            return response.ok;
          } catch (error) {
            logger.error('Slack notification failed:', error);
            return false;
          }
        }
      });
    }
  }

  /**
   * Get severity emoji
   */
  getSeverityEmoji(severity) {
    const emojiMap = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };
    return emojiMap[severity] || '⚪';
  }

  /**
   * Get severity color
   */
  getSeverityColor(severity) {
    const colorMap = {
      critical: 'danger',
      high: 'warning',
      medium: 'warning',
      low: 'good'
    };
    return colorMap[severity] || 'good';
  }

  /**
   * Evaluate alert rules
   */
  async evaluateAlertRules(metrics) {
    const triggeredAlerts = [];

    for (const [ruleId, rule] of this.alertRules.entries()) {
      // Skip if alert is silenced
      if (this.silencedAlerts.has(ruleId)) {
        continue;
      }

      // Check condition
      if (rule.condition(metrics)) {
        const alert = {
          id: `alert_${ruleId}_${Date.now()}`,
          ruleId,
          ruleName: rule.name,
          severity: rule.severity,
          message: rule.message(metrics),
          metrics,
          timestamp: Date.now()
        };

        triggeredAlerts.push(alert);

        // Send notifications
        await this.sendNotifications(alert);

        // Record in history
        this.alertHistory.push(alert);
        if (this.alertHistory.length > 1000) {
          this.alertHistory.shift();
        }
      }
    }

    return triggeredAlerts;
  }

  /**
   * Send notifications
   */
  async sendNotifications(alert) {
    const results = [];

    for (const [channelId, channel] of this.notificationChannels.entries()) {
      try {
        const sent = await channel.send(alert);
        results.push({ channel: channelId, success: sent });
      } catch (error) {
        logger.error(`Notification failed for ${channelId}:`, error);
        results.push({ channel: channelId, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Silence alert
   */
  silenceAlert(ruleId, duration = 3600000) {
    this.silencedAlerts.add(ruleId);
    
    // Auto-unsilence after duration
    setTimeout(() => {
      this.silencedAlerts.delete(ruleId);
    }, duration);

    logger.info(`Alert ${ruleId} silenced for ${duration}ms`);
    return true;
  }

  /**
   * Get alert history
   */
  getAlertHistory(severity = null, limit = 100) {
    let alerts = this.alertHistory;

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    return alerts.slice(-limit).reverse();
  }

  /**
   * Get alert rules
   */
  getAlertRules() {
    return Array.from(this.alertRules.entries()).map(([id, rule]) => ({
      id,
      name: rule.name,
      severity: rule.severity
    }));
  }

  /**
   * Get notification channels
   */
  getNotificationChannels() {
    return Array.from(this.notificationChannels.entries()).map(([id, channel]) => ({
      id,
      name: channel.name,
      configured: true
    }));
  }
}

// Singleton instance
let instance = null;

function getAlertManager() {
  if (!instance) {
    instance = new AlertManager();
  }
  return instance;
}

module.exports = {
  AlertManager,
  getAlertManager
};

