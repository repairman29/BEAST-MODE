/**
 * BEAST MODE Discord Integration
 * 
 * Provides utilities for sending notifications to Discord
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

class DiscordIntegration {
  constructor(options = {}) {
    this.webhookUrl = options.webhookUrl || getConfigValue('DISCORD_WEBHOOK_URL');
    this.username = options.username || 'BEAST MODE';
    this.avatarUrl = options.avatarUrl || 'https://beastmode.dev/favicon.ico';
  }

  /**
   * Send community notification
   */
  async sendCommunityNotification(notification) {
    const { title, message, type = 'info' } = notification;
    
    const color = {
      info: 3447003,      // Blue
      success: 3066993,   // Green
      warning: 15105570,  // Orange
      error: 15158332     // Red
    }[type] || 3447003;

    const embed = {
      title: title,
      description: message,
      color: color,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'BEAST MODE Community'
      }
    };

    return this.sendMessage({ embeds: [embed] });
  }

  /**
   * Send plugin update notification
   */
  async sendPluginUpdate(update) {
    const { pluginName, version, changelog } = update;
    
    const embed = {
      title: `🔄 Plugin Update: ${pluginName}`,
      description: `Version ${version} is now available!`,
      color: 3066993, // Green
      fields: [
        {
          name: 'Version',
          value: version,
          inline: true
        },
        {
          name: 'Status',
          value: '✅ Available',
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'BEAST MODE Marketplace'
      }
    };

    if (changelog) {
      embed.fields.push({
        name: 'Changelog',
        value: changelog.substring(0, 1024) // Discord limit
      });
    }

    return this.sendMessage({ embeds: [embed] });
  }

  /**
   * Send system status update
   */
  async sendSystemStatus(status) {
    const { service, status: serviceStatus, message, metrics } = status;
    
    const color = serviceStatus === 'healthy' ? 3066993 : serviceStatus === 'degraded' ? 15105570 : 15158332;
    
    const embed = {
      title: `📊 System Status: ${service}`,
      description: message || `Service is ${serviceStatus}`,
      color: color,
      fields: [],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'BEAST MODE System Monitor'
      }
    };

    if (metrics) {
      Object.entries(metrics).forEach(([key, value]) => {
        embed.fields.push({
          name: key,
          value: String(value),
          inline: true
        });
      });
    }

    return this.sendMessage({ embeds: [embed] });
  }

  /**
   * Send custom message
   */
  async sendMessage(message) {
    if (!this.webhookUrl) {
      console.warn('Discord webhook URL not configured');
      return { success: false, error: 'Webhook URL not configured' };
    }

    try {
      const https = require('https');
      const { URL } = require('url');
      const url = new URL(this.webhookUrl);

      // Add username and avatar if not in message
      if (!message.username) {
        message.username = this.username;
      }
      if (!message.avatar_url) {
        message.avatar_url = this.avatarUrl;
      }

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
              reject(new Error(`Discord API error: ${res.statusCode} - ${data}`));
            }
          });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    } catch (error) {
      console.error('Discord integration error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Discord connection
   */
  async testConnection() {
    return this.sendMessage({
      content: '✅ BEAST MODE Discord integration is working!',
      embeds: [{
        title: 'Connection Test',
        description: 'If you see this, the integration is working correctly!',
        color: 3066993,
        timestamp: new Date().toISOString()
      }]
    });
  }
}

module.exports = DiscordIntegration;

