/**
 * BEAST MODE Slack Integration
 * 
 * Provides utilities for sending notifications to Slack
 */

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

class SlackIntegration {
  constructor(options = {}) {
    this.webhookUrl = options.webhookUrl || getConfigValue('SLACK_WEBHOOK_URL');
    this.channel = options.channel || getConfigValue('SLACK_CHANNEL', '#beast-mode');
    this.username = options.username || 'BEAST MODE';
    this.iconEmoji = options.iconEmoji || ':robot_face:';
  }

  /**
   * Send quality alert to Slack
   */
  async sendQualityAlert(qualityData) {
    const { score, issues = [], recommendations = [] } = qualityData;
    const status = score >= 80 ? 'good' : score >= 70 ? 'warning' : 'danger';
    
    const message = {
      channel: this.channel,
      username: this.username,
      icon_emoji: this.iconEmoji,
      attachments: [
        {
          color: status === 'good' ? 'good' : status === 'warning' ? 'warning' : 'danger',
          title: '🔍 BEAST MODE Quality Alert',
          fields: [
            {
              title: 'Quality Score',
              value: `${score}/100`,
              short: true
            },
            {
              title: 'Issues Found',
              value: `${issues.length}`,
              short: true
            },
            {
              title: 'Status',
              value: status === 'good' ? '✅ Good' : status === 'warning' ? '⚠️ Needs Attention' : '❌ Critical',
              short: true
            }
          ],
          footer: 'BEAST MODE Quality Intelligence',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    if (issues.length > 0) {
      message.attachments[0].fields.push({
        title: 'Top Issues',
        value: issues.slice(0, 5).map((issue, idx) => `${idx + 1}. ${issue.message}`).join('\n'),
        short: false
      });
    }

    return this.sendMessage(message);
  }

  /**
   * Send mission notification
   */
  async sendMissionNotification(mission) {
    const { id, title, status, priority, assignee } = mission;
    
    const message = {
      channel: this.channel,
      username: this.username,
      icon_emoji: this.iconEmoji,
      attachments: [
        {
          color: status === 'completed' ? 'good' : status === 'active' ? 'warning' : '#36a64f',
          title: `🎯 Mission: ${title}`,
          fields: [
            {
              title: 'Status',
              value: status,
              short: true
            },
            {
              title: 'Priority',
              value: priority || 'Normal',
              short: true
            }
          ],
          footer: 'BEAST MODE Mission Management',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    if (assignee) {
      message.attachments[0].fields.push({
        title: 'Assigned To',
        value: assignee,
        short: true
      });
    }

    return this.sendMessage(message);
  }

  /**
   * Send team update
   */
  async sendTeamUpdate(update) {
    const { type, message, metrics } = update;
    
    const messageObj = {
      channel: this.channel,
      username: this.username,
      icon_emoji: this.iconEmoji,
      text: `📊 Team Update: ${message}`,
      attachments: []
    };

    if (metrics) {
      messageObj.attachments.push({
        color: 'good',
        fields: Object.entries(metrics).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        })),
        footer: 'BEAST MODE Team Intelligence',
        ts: Math.floor(Date.now() / 1000)
      });
    }

    return this.sendMessage(messageObj);
  }

  /**
   * Send custom message
   */
  async sendMessage(message) {
    if (!this.webhookUrl) {
      console.warn('Slack webhook URL not configured');
      return { success: false, error: 'Webhook URL not configured' };
    }

    try {
      const https = require('https');
      const { URL } = require('url');
      const url = new URL(this.webhookUrl);

      const payload = JSON.stringify(message);

      return new Promise((resolve, reject) => {
        const req = https.request({
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, statusCode: res.statusCode });
            } else {
              reject(new Error(`Slack API error: ${res.statusCode} - ${data}`));
            }
          });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    } catch (error) {
      console.error('Slack integration error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Slack connection
   */
  async testConnection() {
    return this.sendMessage({
      channel: this.channel,
      username: this.username,
      icon_emoji: this.iconEmoji,
      text: '✅ BEAST MODE Slack integration is working!'
    });
  }
}

module.exports = SlackIntegration;

