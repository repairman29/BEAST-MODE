/**
 * External Alerting System
 * Integrates with Slack, email, PagerDuty, etc.
 * 
 * Month 2: Week 3 - Advanced Monitoring
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
const log = createLogger('ExternalAlerts');

class ExternalAlerts {
    constructor() {
        this.providers = {
            slack: null,
            email: null,
            pagerduty: null,
            webhook: null
        };
        this.enabled = true;
    }

    /**
     * Configure alerting providers
     */
    configure(config) {
        if (config.slack) {
            this.providers.slack = config.slack;
        }
        if (config.email) {
            this.providers.email = config.email;
        }
        if (config.pagerduty) {
            this.providers.pagerduty = config.pagerduty;
        }
        if (config.webhook) {
            this.providers.webhook = config.webhook;
        }
        if (config.enabled !== undefined) {
            this.enabled = config.enabled;
        }
    }

    /**
     * Send alert to all configured providers
     */
    async sendAlert(alert) {
        if (!this.enabled) {
            return;
        }

        const promises = [];

        // Slack
        if (this.providers.slack) {
            promises.push(this.sendToSlack(alert));
        }

        // Email
        if (this.providers.email) {
            promises.push(this.sendToEmail(alert));
        }

        // PagerDuty
        if (this.providers.pagerduty && alert.severity === 'critical') {
            promises.push(this.sendToPagerDuty(alert));
        }

        // Webhook
        if (this.providers.webhook) {
            promises.push(this.sendToWebhook(alert));
        }

        await Promise.allSettled(promises);
    }

    /**
     * Send alert to Slack
     */
    async sendToSlack(alert) {
        try {
            const fetch = require('node-fetch');
            const color = alert.severity === 'critical' ? 'danger' : 
                         alert.severity === 'warning' ? 'warning' : 'good';

            const payload = {
                text: `🚨 ML Model Alert: ${alert.type}`,
                attachments: [{
                    color: color,
                    fields: [
                        { title: 'Severity', value: alert.severity, short: true },
                        { title: 'Type', value: alert.type, short: true },
                        { title: 'Message', value: alert.details?.message || 'No message', short: false },
                        { title: 'Timestamp', value: new Date(alert.timestamp).toLocaleString(), short: true }
                    ]
                }]
            };

            await fetch(this.providers.slack.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            log.debug('Alert sent to Slack');
        } catch (error) {
            log.warn('Failed to send alert to Slack:', error.message);
        }
    }

    /**
     * Send alert to Email
     */
    async sendToEmail(alert) {
        try {
            // Simple email implementation
            // In production, use nodemailer or similar
            log.info(`Email alert: ${alert.type} - ${alert.severity}`);
            // TODO: Implement email sending
        } catch (error) {
            log.warn('Failed to send alert to email:', error.message);
        }
    }

    /**
     * Send alert to PagerDuty
     */
    async sendToPagerDuty(alert) {
        try {
            const fetch = require('node-fetch');
            
            const payload = {
                routing_key: this.providers.pagerduty.routingKey,
                event_action: 'trigger',
                payload: {
                    summary: `ML Model Alert: ${alert.type}`,
                    severity: alert.severity === 'critical' ? 'critical' : 'warning',
                    source: 'beast-mode-ml',
                    custom_details: alert.details
                }
            };

            await fetch('https://events.pagerduty.com/v2/enqueue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            log.debug('Alert sent to PagerDuty');
        } catch (error) {
            log.warn('Failed to send alert to PagerDuty:', error.message);
        }
    }

    /**
     * Send alert to Webhook
     */
    async sendToWebhook(alert) {
        try {
            const fetch = require('node-fetch');
            
            await fetch(this.providers.webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.providers.webhook.headers || {})
                },
                body: JSON.stringify(alert)
            });

            log.debug('Alert sent to webhook');
        } catch (error) {
            log.warn('Failed to send alert to webhook:', error.message);
        }
    }
}

// Singleton instance
let externalAlertsInstance = null;

function getExternalAlerts() {
    if (!externalAlertsInstance) {
        externalAlertsInstance = new ExternalAlerts();
    }
    return externalAlertsInstance;
}

module.exports = {
    ExternalAlerts,
    getExternalAlerts
};

