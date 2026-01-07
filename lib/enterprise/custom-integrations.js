/**
 * BEAST MODE Custom Integrations
 * 
 * API for custom integrations, webhook system, and extensibility
 */

class CustomIntegrations {
  constructor(options = {}) {
    this.options = {
      enableWebhooks: options.enableWebhooks !== false,
      enableAPI: options.enableAPI !== false,
      enablePlugins: options.enablePlugins !== false,
      ...options
    };
  }

  /**
   * Create custom integration
   */
  async createIntegration(integrationData) {
    const {
      name,
      description,
      type, // 'webhook', 'api', 'plugin'
      config,
      events,
      authentication
    } = integrationData;

    return {
      integrationId: `integration-${Date.now()}`,
      name,
      description,
      type,
      config: config || {},
      events: events || [],
      authentication: authentication || {
        type: 'api_key',
        apiKey: this.generateAPIKey()
      },
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate API key
   */
  generateAPIKey() {
    const prefix = 'bm_';
    const random = Buffer.from(Math.random().toString() + Date.now().toString()).toString('base64');
    return prefix + random.substring(0, 32);
  }

  /**
   * Configure webhook
   */
  async configureWebhook(webhookConfig) {
    const {
      url,
      events,
      secret,
      headers,
      retryPolicy
    } = webhookConfig;

    return {
      webhookId: `webhook-${Date.now()}`,
      url,
      events: events || ['quality.scan.completed', 'mission.completed'],
      secret: secret || this.generateWebhookSecret(),
      headers: headers || {},
      retryPolicy: retryPolicy || {
        maxRetries: 3,
        retryDelay: 1000,
        backoff: 'exponential'
      },
      enabled: true,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Generate webhook secret
   */
  generateWebhookSecret() {
    return Buffer.from(Math.random().toString() + Date.now().toString()).toString('base64');
  }

  /**
   * Trigger webhook
   */
  async triggerWebhook(webhookId, event, payload) {
    const webhook = await this.getWebhook(webhookId);
    
    if (!webhook || !webhook.enabled) {
      throw new Error('Webhook not found or disabled');
    }

    if (!webhook.events.includes(event)) {
      return { skipped: true, reason: 'Event not subscribed' };
    }

    // Sign payload
    const signature = this.signWebhookPayload(payload, webhook.secret);

    // Send webhook
    try {
      const response = await this.sendWebhookRequest(webhook.url, {
        event,
        payload,
        signature,
        timestamp: new Date().toISOString()
      }, webhook.headers);

      return {
        success: true,
        webhookId,
        event,
        response: {
          status: response.status,
          statusText: response.statusText
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // Retry logic would go here
      return {
        success: false,
        error: error.message,
        retryable: true
      };
    }
  }

  /**
   * Sign webhook payload
   */
  signWebhookPayload(payload, secret) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Send webhook request
   */
  async sendWebhookRequest(url, data, headers = {}) {
    const https = require('https');
    const http = require('http');
    const { URL } = require('url');
    
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(data);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers
        }
      };

      const req = client.request(options, (res) => {
        resolve(res);
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  /**
   * Get webhook
   */
  async getWebhook(webhookId) {
    // This would fetch from database
    return {
      webhookId,
      url: 'https://example.com/webhook',
      events: ['quality.scan.completed'],
      secret: process.env.SECRET || '',
      enabled: true
    };
  }

  /**
   * Create API integration
   */
  async createAPIIntegration(apiConfig) {
    const {
      name,
      description,
      endpoints,
      rateLimit,
      authentication
    } = apiConfig;

    return {
      apiId: `api-${Date.now()}`,
      name,
      description,
      endpoints: endpoints || [],
      rateLimit: rateLimit || {
        requests: 1000,
        period: 'hour'
      },
      authentication: authentication || {
        type: 'bearer',
        token: this.generateAPIToken()
      },
      enabled: true,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Generate API token
   */
  generateAPIToken() {
    return 'bm_' + Buffer.from(Math.random().toString() + Date.now().toString()).toString('base64').substring(0, 40);
  }

  /**
   * Validate API request
   */
  async validateAPIRequest(apiId, request) {
    const api = await this.getAPIIntegration(apiId);
    
    if (!api || !api.enabled) {
      return { valid: false, error: 'API not found or disabled' };
    }

    // Validate authentication
    const authValid = this.validateAuthentication(api.authentication, request);
    if (!authValid) {
      return { valid: false, error: 'Invalid authentication' };
    }

    // Check rate limit
    const rateLimitValid = await this.checkRateLimit(apiId, api.rateLimit);
    if (!rateLimitValid) {
      return { valid: false, error: 'Rate limit exceeded' };
    }

    return { valid: true };
  }

  /**
   * Validate authentication
   */
  validateAuthentication(authConfig, request) {
    const authHeader = request.headers?.authorization;
    
    if (!authHeader) {
      return false;
    }

    if (authConfig.type === 'bearer') {
      const token = authHeader.replace('Bearer ', '');
      return token === authConfig.token;
    }

    if (authConfig.type === 'api_key') {
      const apiKey = request.headers?.['x-api-key'] || request.query?.api_key;
      return apiKey === authConfig.apiKey;
    }

    return false;
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(apiId, rateLimit) {
    // This would check against rate limit store
    // For now, return true
    return true;
  }

  /**
   * Get API integration
   */
  async getAPIIntegration(apiId) {
    // This would fetch from database
    return {
      apiId,
      name: 'Custom API',
      enabled: true,
      rateLimit: {
        requests: 1000,
        period: 'hour'
      },
      authentication: {
        type: 'bearer',
        token: process.env.TOKEN || ''
      }
    };
  }

  /**
   * List available events
   */
  getAvailableEvents() {
    return [
      {
        category: 'quality',
        events: [
          'quality.scan.started',
          'quality.scan.completed',
          'quality.score.updated',
          'quality.issue.found'
        ]
      },
      {
        category: 'mission',
        events: [
          'mission.created',
          'mission.started',
          'mission.completed',
          'mission.updated'
        ]
      },
      {
        category: 'plugin',
        events: [
          'plugin.installed',
          'plugin.updated',
          'plugin.uninstalled',
          'plugin.executed'
        ]
      },
      {
        category: 'team',
        events: [
          'team.member.added',
          'team.member.removed',
          'team.workspace.created',
          'team.dashboard.shared'
        ]
      }
    ];
  }
}

module.exports = CustomIntegrations;

