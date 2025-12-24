#!/usr/bin/env node

/**
 * Integration Marketplace
 * BEAST MODE Q3 2025: Ecosystem Marketplace
 *
 * Marketplace for discovering, creating, and sharing custom integrations
 * with third-party services, APIs, and development tools
 */

const fs = require('fs').promises;
const path = require('path');
const { createLogger } = require('../server/utils/logger');
const log = createLogger('IntegrationMarketplace');

class IntegrationMarketplace {
    constructor() {
        this.integrationsDir = path.join(__dirname, '..', 'integrations');
        this.templatesDir = path.join(this.integrationsDir, 'templates');
        this.publishedDir = path.join(this.integrationsDir, 'published');
        this.communityDir = path.join(this.integrationsDir, 'community');

        this.availableIntegrations = new Map();
        this.installedIntegrations = new Map();
        this.integrationTemplates = new Map();
        this.integrationStats = new Map();

        this.marketplaceAPI = 'https://integrations.beast-mode.dev/api';
    }

    async initialize() {
        log.info('Initializing Integration Marketplace...');
        await this.ensureDirectories();
        await this.loadIntegrationTemplates();
        await this.syncAvailableIntegrations();
        await this.loadInstalledIntegrations();
        log.info(`Integration Marketplace ready with ${this.availableIntegrations.size} available integrations`);
    }

    /**
     * Discover available integrations
     */
    async discoverIntegrations(filters = {}) {
        const {
            category,
            service,
            complexity,
            sortBy = 'downloads',
            limit = 50
        } = filters;

        let integrations = Array.from(this.availableIntegrations.values());

        // Apply filters
        if (category) {
            integrations = integrations.filter(i => i.category === category);
        }

        if (service) {
            integrations = integrations.filter(i =>
                i.services?.includes(service) ||
                i.name.toLowerCase().includes(service.toLowerCase())
            );
        }

        if (complexity) {
            integrations = integrations.filter(i => i.complexity === complexity);
        }

        // Sort results
        integrations.sort((a, b) => {
            switch (sortBy) {
                case 'downloads':
                    return (b.downloads || 0) - (a.downloads || 0);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'newest':
                    return new Date(b.publishedAt) - new Date(a.publishedAt);
                case 'popularity':
                default:
                    return (b.downloads || 0) - (a.downloads || 0);
            }
        });

        return {
            integrations: integrations.slice(0, limit),
            total: integrations.length,
            filters: filters,
            categories: await this.getIntegrationCategories(),
            services: await this.getSupportedServices()
        };
    }

    /**
     * Create a custom integration
     */
    async createIntegration(integrationSpec, options = {}) {
        const {
            template,
            testConnection = true,
            validateSchema = true
        } = options;

        log.info(`Creating custom integration: ${integrationSpec.name}`);

        // Validate integration specification
        this.validateIntegrationSpec(integrationSpec);

        let integration;

        if (template) {
            // Use template as base
            integration = await this.createFromTemplate(template, integrationSpec);
        } else {
            // Create from scratch
            integration = await this.createCustomIntegration(integrationSpec);
        }

        // Test connection if requested
        if (testConnection) {
            const connectionTest = await this.testIntegrationConnection(integration);
            if (!connectionTest.success) {
                throw new Error(`Connection test failed: ${connectionTest.error}`);
            }
            integration.connectionTested = true;
        }

        // Validate schema if requested
        if (validateSchema) {
            const schemaValidation = await this.validateIntegrationSchema(integration);
            if (!schemaValidation.valid) {
                throw new Error(`Schema validation failed: ${schemaValidation.errors.join(', ')}`);
            }
            integration.schemaValidated = true;
        }

        // Generate integration ID
        integration.id = this.generateIntegrationId(integration.name);
        integration.createdAt = new Date().toISOString();
        integration.version = '1.0.0';

        // Save integration
        await this.saveIntegration(integration);

        log.info(`✅ Created integration: ${integration.name} (${integration.id})`);
        return integration;
    }

    /**
     * Install an integration
     */
    async installIntegration(integrationId, config = {}) {
        const integration = this.availableIntegrations.get(integrationId);
        if (!integration) {
            throw new Error(`Integration ${integrationId} not found`);
        }

        // Check if already installed
        if (this.installedIntegrations.has(integrationId)) {
            throw new Error(`Integration ${integrationId} is already installed`);
        }

        log.info(`Installing integration: ${integration.name}`);

        try {
            // Install integration dependencies
            await this.installIntegrationDependencies(integration);

            // Configure integration
            const configuredIntegration = await this.configureIntegration(integration, config);

            // Test integration
            const testResult = await this.testIntegrationConnection(configuredIntegration);
            if (!testResult.success) {
                throw new Error(`Integration test failed: ${testResult.error}`);
            }

            // Register integration
            const installedIntegration = {
                id: integrationId,
                name: integration.name,
                version: integration.version,
                config: configuredIntegration,
                installedAt: new Date().toISOString(),
                status: 'active',
                lastTested: new Date().toISOString()
            };

            this.installedIntegrations.set(integrationId, installedIntegration);
            await this.saveInstalledIntegrations();

            // Update download stats
            await this.updateIntegrationStats(integrationId, 'downloads');

            log.info(`✅ Installed integration: ${integration.name}`);
            return installedIntegration;

        } catch (error) {
            log.error(`Failed to install integration ${integrationId}:`, error.message);
            throw error;
        }
    }

    /**
     * Publish an integration to marketplace
     */
    async publishIntegration(integrationId, options = {}) {
        const {
            price = 0,
            visibility = 'public',
            categories = [],
            tags = []
        } = options;

        const integration = await this.loadIntegration(integrationId);
        if (!integration) {
            throw new Error(`Integration ${integrationId} not found`);
        }

        log.info(`Publishing integration: ${integration.name}`);

        // Prepare for publication
        const publishedIntegration = {
            ...integration,
            price: price,
            visibility: visibility,
            categories: categories,
            tags: tags,
            publishedAt: new Date().toISOString(),
            downloads: 0,
            rating: 0,
            reviews: 0,
            publisher: integration.publisher || 'Community',
            status: 'published'
        };

        try {
            // Upload to marketplace
            const result = await this.uploadToMarketplace(publishedIntegration);

            // Move to published directory
            await this.moveToPublished(integrationId);

            // Update available integrations
            this.availableIntegrations.set(integrationId, publishedIntegration);
            await this.saveAvailableIntegrations();

            log.info(`✅ Published integration: ${integration.name}`);
            return {
                id: integrationId,
                status: 'published',
                marketplaceUrl: result.url
            };

        } catch (error) {
            log.error(`Failed to publish integration:`, error.message);
            throw error;
        }
    }

    /**
     * Test integration connection
     */
    async testIntegration(integrationId) {
        const integration = this.installedIntegrations.get(integrationId);
        if (!integration) {
            throw new Error(`Integration ${integrationId} is not installed`);
        }

        log.info(`Testing integration: ${integration.name}`);

        const testResult = await this.testIntegrationConnection(integration.config);

        // Update test status
        integration.lastTested = new Date().toISOString();
        integration.status = testResult.success ? 'active' : 'error';

        await this.saveInstalledIntegrations();

        return {
            integration: integration.name,
            success: testResult.success,
            responseTime: testResult.responseTime,
            error: testResult.error,
            timestamp: integration.lastTested
        };
    }

    /**
     * Get integration templates
     */
    getIntegrationTemplates() {
        return {
            'rest-api': {
                name: 'REST API Integration',
                description: 'Connect to REST APIs with authentication',
                category: 'api',
                complexity: 'simple',
                features: ['authentication', 'rate-limiting', 'error-handling'],
                configSchema: {
                    baseUrl: 'string',
                    authType: ['none', 'basic', 'bearer', 'api-key'],
                    timeout: 'number'
                }
            },
            'webhook-endpoint': {
                name: 'Webhook Endpoint',
                description: 'Receive webhooks from external services',
                category: 'webhook',
                complexity: 'simple',
                features: ['signature-verification', 'payload-validation', 'error-handling'],
                configSchema: {
                    endpoint: 'string',
                    secret: 'string',
                    events: 'array'
                }
            },
            'database-connector': {
                name: 'Database Connector',
                description: 'Connect to various database systems',
                category: 'database',
                complexity: 'medium',
                features: ['connection-pooling', 'query-builder', 'migrations'],
                configSchema: {
                    type: ['postgres', 'mysql', 'mongodb', 'redis'],
                    host: 'string',
                    port: 'number',
                    database: 'string'
                }
            },
            'message-queue': {
                name: 'Message Queue Integration',
                description: 'Integrate with message queue systems',
                category: 'messaging',
                complexity: 'medium',
                features: ['publish-subscribe', 'dead-letter-queues', 'monitoring'],
                configSchema: {
                    provider: ['rabbitmq', 'kafka', 'sqs', 'redis'],
                    host: 'string',
                    queues: 'array'
                }
            },
            'cloud-service': {
                name: 'Cloud Service Integration',
                description: 'Connect to cloud platforms and services',
                category: 'cloud',
                complexity: 'complex',
                features: ['multi-region', 'auto-scaling', 'monitoring', 'security'],
                configSchema: {
                    provider: ['aws', 'gcp', 'azure'],
                    region: 'string',
                    services: 'array'
                }
            },
            'ci-cd-pipeline': {
                name: 'CI/CD Pipeline Integration',
                description: 'Integrate with continuous integration systems',
                category: 'devops',
                complexity: 'complex',
                features: ['pipeline-triggers', 'status-updates', 'artifact-management'],
                configSchema: {
                    provider: ['github-actions', 'gitlab-ci', 'jenkins', 'circle-ci'],
                    repository: 'string',
                    token: 'string'
                }
            }
        };
    }

    /**
     * Create integration from template
     */
    async createFromTemplate(templateName, customSpec) {
        const templates = this.getIntegrationTemplates();
        const template = templates[templateName];

        if (!template) {
            throw new Error(`Template ${templateName} not found`);
        }

        // Merge template with custom specification
        const integration = {
            ...template,
            ...customSpec,
            template: templateName,
            features: [...(template.features || []), ...(customSpec.features || [])],
            configSchema: { ...template.configSchema, ...(customSpec.configSchema || {}) }
        };

        // Generate implementation based on template
        integration.implementation = await this.generateTemplateImplementation(templateName, customSpec);

        return integration;
    }

    /**
     * Generate template implementation
     */
    async generateTemplateImplementation(templateName, customSpec) {
        const implementations = {
            'rest-api': this.generateRestApiImplementation(customSpec),
            'webhook-endpoint': this.generateWebhookImplementation(customSpec),
            'database-connector': this.generateDatabaseImplementation(customSpec),
            'message-queue': this.generateMessageQueueImplementation(customSpec),
            'cloud-service': this.generateCloudServiceImplementation(customSpec),
            'ci-cd-pipeline': this.generateCiCdImplementation(customSpec)
        };

        const generator = implementations[templateName];
        if (!generator) {
            throw new Error(`No implementation generator for template ${templateName}`);
        }

        return generator;
    }

    /**
     * Generate REST API implementation
     */
    generateRestApiImplementation(spec) {
        return {
            language: 'javascript',
            files: {
                'index.js': `
const axios = require('axios');

class ${spec.name.replace(/[^a-zA-Z0-9]/g, '')}Integration {
    constructor(config) {
        this.config = config;
        this.client = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 30000
        });

        // Configure authentication
        this.setupAuthentication(config);
    }

    setupAuthentication(config) {
        switch (config.authType) {
            case 'basic':
                this.client.defaults.auth = {
                    username: config.username,
                    password: config.password
                };
                break;
            case 'bearer':
                this.client.defaults.headers.common['Authorization'] = \`Bearer \${config.token}\`;
                break;
            case 'api-key':
                this.client.defaults.headers.common[config.apiKeyHeader || 'X-API-Key'] = config.apiKey;
                break;
        }
    }

    async get(endpoint, params = {}) {
        try {
            const response = await this.client.get(endpoint, { params });
            return response.data;
        } catch (error) {
            throw new Error(\`API GET failed: \${error.message}\`);
        }
    }

    async post(endpoint, data = {}) {
        try {
            const response = await this.client.post(endpoint, data);
            return response.data;
        } catch (error) {
            throw new Error(\`API POST failed: \${error.message}\`);
        }
    }

    async testConnection() {
        try {
            await this.client.get('/health');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = ${spec.name.replace(/[^a-zA-Z0-9]/g, '')}Integration;
`,
                'package.json': JSON.stringify({
                    name: spec.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                    version: '1.0.0',
                    main: 'index.js',
                    dependencies: {
                        'axios': '^1.6.0'
                    }
                }, null, 2)
            }
        };
    }

    /**
     * Generate webhook implementation
     */
    generateWebhookImplementation(spec) {
        return {
            language: 'javascript',
            files: {
                'index.js': `
const crypto = require('crypto');
const express = require('express');

class ${spec.name.replace(/[^a-zA-Z0-9]/g, '')}WebhookIntegration {
    constructor(config) {
        this.config = config;
        this.app = express();
        this.setupWebhookEndpoint();
    }

    setupWebhookEndpoint() {
        this.app.use(express.json());

        this.app.post(this.config.endpoint, (req, res) => {
            try {
                // Verify webhook signature if configured
                if (this.config.secret) {
                    const signature = req.headers['x-hub-signature-256'] ||
                                    req.headers['x-signature'];
                    if (!this.verifySignature(req.body, signature, this.config.secret)) {
                        return res.status(401).json({ error: 'Invalid signature' });
                    }
                }

                // Process webhook payload
                this.processWebhook(req.body, req.headers);
                res.json({ received: true });
            } catch (error) {
                console.error('Webhook processing failed:', error);
                res.status(500).json({ error: 'Processing failed' });
            }
        });
    }

    verifySignature(payload, signature, secret) {
        if (!signature) return false;

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');

        return signature === \`sha256=\${expectedSignature}\` ||
               signature === expectedSignature;
    }

    processWebhook(payload, headers) {
        // Process webhook based on event type
        const eventType = headers['x-github-event'] ||
                         headers['x-gitlab-event'] ||
                         payload.eventType;

        console.log(\`Processing \${eventType} webhook\`, payload);

        // Emit event for further processing
        if (this.onWebhook) {
            this.onWebhook(eventType, payload, headers);
        }
    }

    listen(port = 3000) {
        this.app.listen(port, () => {
            console.log(\`Webhook endpoint listening on port \${port}\`);
        });
    }

    onWebhook(callback) {
        this.onWebhook = callback;
    }
}

module.exports = ${spec.name.replace(/[^a-zA-Z0-9]/g, '')}WebhookIntegration;
`,
                'package.json': JSON.stringify({
                    name: spec.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                    version: '1.0.0',
                    main: 'index.js',
                    dependencies: {
                        'express': '^4.18.0'
                    }
                }, null, 2)
            }
        };
    }

    /**
     * Generate database implementation
     */
    generateDatabaseImplementation(spec) {
        return {
            language: 'javascript',
            files: {
                'index.js': `
const { Pool } = require('pg'); // For PostgreSQL
// Add other database drivers as needed

class ${spec.name.replace(/[^a-zA-Z0-9]/g, '')}DatabaseIntegration {
    constructor(config) {
        this.config = config;
        this.pool = null;
        this.setupConnection();
    }

    setupConnection() {
        switch (this.config.type) {
            case 'postgres':
                this.pool = new Pool({
                    host: this.config.host,
                    port: this.config.port,
                    database: this.config.database,
                    user: this.config.username,
                    password: this.config.password,
                    max: 20,
                    idleTimeoutMillis: 30000
                });
                break;
            // Add other database types
            default:
                throw new Error(\`Unsupported database type: \${this.config.type}\`);
        }
    }

    async query(sql, params = []) {
        try {
            const result = await this.pool.query(sql, params);
            return result.rows;
        } catch (error) {
            throw new Error(\`Database query failed: \${error.message}\`);
        }
    }

    async testConnection() {
        try {
            await this.pool.query('SELECT 1');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

module.exports = ${spec.name.replace(/[^a-zA-Z0-9]/g, '')}DatabaseIntegration;
`,
                'package.json': JSON.stringify({
                    name: spec.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                    version: '1.0.0',
                    main: 'index.js',
                    dependencies: {
                        'pg': '^8.11.0'
                    }
                }, null, 2)
            }
        };
    }

    // Placeholder implementations for other templates
    generateMessageQueueImplementation(spec) { return { language: 'javascript', files: {} }; }
    generateCloudServiceImplementation(spec) { return { language: 'javascript', files: {} }; }
    generateCiCdImplementation(spec) { return { language: 'javascript', files: {} }; }

    // Utility methods

    validateIntegrationSpec(spec) {
        const required = ['name', 'description', 'category'];
        for (const field of required) {
            if (!spec[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (!['simple', 'medium', 'complex'].includes(spec.complexity)) {
            spec.complexity = 'medium'; // Default
        }
    }

    async createCustomIntegration(spec) {
        // Create integration from scratch
        return {
            ...spec,
            implementation: {
                language: 'javascript',
                files: {
                    'index.js': `// Custom integration: ${spec.name}\n// TODO: Implement integration logic\n`,
                    'package.json': JSON.stringify({
                        name: spec.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                        version: '1.0.0',
                        main: 'index.js'
                    }, null, 2)
                }
            }
        };
    }

    async testIntegrationConnection(integration) {
        // Test integration connection
        // This would implement actual connection testing based on integration type
        return { success: true, responseTime: 100 };
    }

    async validateIntegrationSchema(integration) {
        // Validate integration configuration schema
        return { valid: true, errors: [] };
    }

    async installIntegrationDependencies(integration) {
        // Install npm dependencies if any
        if (integration.implementation?.files?.['package.json']) {
            const packageJson = JSON.parse(integration.implementation.files['package.json']);
            if (packageJson.dependencies) {
                // In a real implementation, this would run npm install
                log.info(`Would install dependencies: ${Object.keys(packageJson.dependencies).join(', ')}`);
            }
        }
    }

    async configureIntegration(integration, config) {
        // Apply configuration to integration
        return { ...integration, ...config };
    }

    generateIntegrationId(name) {
        const crypto = require('crypto');
        const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const random = crypto.randomBytes(4).toString('hex');
        return `${baseId}-${random}`;
    }

    async saveIntegration(integration) {
        const integrationPath = path.join(this.integrationsDir, `${integration.id}.json`);
        await fs.writeFile(integrationPath, JSON.stringify(integration, null, 2));
    }

    async loadIntegration(integrationId) {
        const integrationPath = path.join(this.integrationsDir, `${integrationId}.json`);
        try {
            const data = await fs.readFile(integrationPath, 'utf8');
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    async uploadToMarketplace(integration) {
        // In a real implementation, this would upload to the marketplace API
        return {
            success: true,
            url: `${this.marketplaceAPI}/integrations/${integration.id}`
        };
    }

    async moveToPublished(integrationId) {
        const sourcePath = path.join(this.integrationsDir, `${integrationId}.json`);
        const destPath = path.join(this.publishedDir, `${integrationId}.json`);

        await fs.copyFile(sourcePath, destPath);
    }

    async updateIntegrationStats(integrationId, statType) {
        const stats = this.integrationStats.get(integrationId) || {
            downloads: 0,
            rating: 0,
            reviews: 0
        };

        if (statType === 'downloads') {
            stats.downloads++;
        }

        this.integrationStats.set(integrationId, stats);
    }

    async getIntegrationCategories() {
        const categories = {};
        for (const integration of this.availableIntegrations.values()) {
            categories[integration.category] = (categories[integration.category] || 0) + 1;
        }
        return categories;
    }

    async getSupportedServices() {
        const services = new Set();
        for (const integration of this.availableIntegrations.values()) {
            if (integration.services) {
                integration.services.forEach(service => services.add(service));
            }
        }
        return Array.from(services);
    }

    async syncAvailableIntegrations() {
        // In a real implementation, this would sync with the marketplace API
        await this.loadAvailableIntegrations();
    }

    async loadAvailableIntegrations() {
        try {
            const data = await fs.readFile(path.join(this.integrationsDir, 'available-integrations.json'), 'utf8');
            const integrations = JSON.parse(data);
            this.availableIntegrations = new Map(Object.entries(integrations));
        } catch {
            // Initialize with some sample integrations
            this.availableIntegrations = new Map([
                ['github-webhook', {
                    id: 'github-webhook',
                    name: 'GitHub Webhook Integration',
                    description: 'Receive GitHub webhooks for PR and issue events',
                    category: 'webhook',
                    complexity: 'simple',
                    services: ['github'],
                    downloads: 450,
                    rating: 4.6,
                    version: '1.2.0'
                }],
                ['slack-notifications', {
                    id: 'slack-notifications',
                    name: 'Slack Notifications',
                    description: 'Send quality analysis notifications to Slack',
                    category: 'communication',
                    complexity: 'simple',
                    services: ['slack'],
                    downloads: 320,
                    rating: 4.4,
                    version: '1.0.5'
                }]
            ]);
            await this.saveAvailableIntegrations();
        }
    }

    async saveAvailableIntegrations() {
        const integrationsObj = Object.fromEntries(this.availableIntegrations);
        await fs.writeFile(
            path.join(this.integrationsDir, 'available-integrations.json'),
            JSON.stringify(integrationsObj, null, 2)
        );
    }

    async loadInstalledIntegrations() {
        try {
            const data = await fs.readFile(path.join(this.integrationsDir, 'installed-integrations.json'), 'utf8');
            const integrations = JSON.parse(data);
            this.installedIntegrations = new Map(Object.entries(integrations));
        } catch {
            this.installedIntegrations = new Map();
        }
    }

    async saveInstalledIntegrations() {
        const integrationsObj = Object.fromEntries(this.installedIntegrations);
        await fs.writeFile(
            path.join(this.integrationsDir, 'installed-integrations.json'),
            JSON.stringify(integrationsObj, null, 2)
        );
    }

    async loadIntegrationTemplates() {
        this.integrationTemplates = new Map(Object.entries(this.getIntegrationTemplates()));
    }

    async ensureDirectories() {
        await fs.mkdir(this.integrationsDir, { recursive: true });
        await fs.mkdir(this.templatesDir, { recursive: true });
        await fs.mkdir(this.publishedDir, { recursive: true });
        await fs.mkdir(this.communityDir, { recursive: true });
    }
}

module.exports = IntegrationMarketplace;
