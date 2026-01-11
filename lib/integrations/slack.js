/**
 * Slack Integration
 * 
 * Sends notifications to Slack channels
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
const log = createLogger('SlackIntegration');

class SlackIntegration {
  constructor() {
    this.webhooks = new Map(); // channelId -> webhook URL
    this.notifications = []; // Notification history
  }

  /**
   * Register Slack webhook
   */
  registerWebhook(channelId, webhookUrl) {
    this.webhooks.set(channelId, webhookUrl);
    log.info(`Slack webhook registered: ${channelId}`);
    return { channelId, registered: true };
  }

  /**
   * Send notification to Slack
   */
  async sendNotification(channelId, message, options = {}) {
    const webhookUrl = this.webhooks.get(channelId);
    if (!webhookUrl) {
      throw new Error(`No webhook registered for channel: ${channelId}`);
    }

    const payload = {
      text: message,
      ...options
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const notification = {
        channelId,
        message,
        timestamp: new Date().toISOString(),
        success: response.ok,
        status: response.status
      };

      this.notifications.push(notification);
      if (this.notifications.length > 1000) {
        this.notifications.shift();
      }

      log.info(`Slack notification sent: ${channelId} (${response.status})`);
      return notification;
    } catch (error) {
      log.error(`Slack notification failed: ${channelId}`, error);
      throw error;
    }
  }

  /**
   * Send quality report to Slack
   */
  async sendQualityReport(channelId, qualityData) {
    const message = `📊 *Quality Report*\n` +
      `Repository: ${qualityData.repo}\n` +
      `Quality Score: ${(qualityData.quality * 100).toFixed(1)}%\n` +
      `Issues Found: ${qualityData.issues?.length || 0}\n` +
      `Confidence: ${(qualityData.confidence * 100).toFixed(1)}%`;

    return this.sendNotification(channelId, message, {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ]
    });
  }
}

// Singleton instance
let slackInstance = null;

function getSlackIntegration() {
  if (!slackInstance) {
    slackInstance = new SlackIntegration();
  }
  return slackInstance;
}

module.exports = {
  SlackIntegration,
  getSlackIntegration
};
