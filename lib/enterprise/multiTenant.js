/**
 * Multi-Tenant Support Service
 * Provides tenant isolation and per-tenant model management
 * 
 * Month 7: Enterprise Features
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
const logger = createLogger('MultiTenant');

class MultiTenant {
  constructor() {
    this.tenants = new Map();
    this.tenantModels = new Map();
    this.tenantMetrics = new Map();
    this.tenantQuotas = new Map();
  }

  /**
   * Initialize multi-tenant support
   */
  async initialize() {
    try {
      logger.info('✅ Multi-tenant support initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize multi-tenant support:', error);
      return false;
    }
  }

  /**
   * Register a tenant
   */
  registerTenant(tenantId, config = {}) {
    const tenant = {
      id: tenantId,
      name: config.name || tenantId,
      createdAt: Date.now(),
      status: 'active',
      config: {
        modelTraining: config.modelTraining || false,
        customModels: config.customModels || false,
        analytics: config.analytics || true,
        ...config
      }
    };

    this.tenants.set(tenantId, tenant);
    this.tenantMetrics.set(tenantId, {
      predictions: 0,
      trainingRuns: 0,
      modelVersions: 0,
      lastActivity: Date.now()
    });

    // Set default quotas
    this.tenantQuotas.set(tenantId, {
      maxPredictionsPerDay: config.maxPredictionsPerDay || 100000,
      maxTrainingRunsPerMonth: config.maxTrainingRunsPerMonth || 10,
      maxModelVersions: config.maxModelVersions || 5,
      storageLimit: config.storageLimit || 1024 * 1024 * 1024 // 1GB
    });

    logger.info(`Tenant registered: ${tenantId}`);
    return tenant;
  }

  /**
   * Get tenant configuration
   */
  getTenant(tenantId) {
    return this.tenants.get(tenantId) || null;
  }

  /**
   * Check if tenant exists
   */
  tenantExists(tenantId) {
    return this.tenants.has(tenantId);
  }

  /**
   * Get or create tenant model
   */
  async getTenantModel(tenantId, modelType = 'default') {
    const key = `${tenantId}:${modelType}`;
    
    if (this.tenantModels.has(key)) {
      return this.tenantModels.get(key);
    }

    // Load default model for tenant
    const { getMLModelIntegration } = require('../mlops/mlModelIntegration');
    const mlIntegration = await getMLModelIntegration();
    await mlIntegration.initialize();

    const model = {
      tenantId,
      modelType,
      model: mlIntegration.qualityPredictor,
      loadedAt: Date.now()
    };

    this.tenantModels.set(key, model);
    return model;
  }

  /**
   * Record tenant activity
   */
  recordActivity(tenantId, activityType, metadata = {}) {
    if (!this.tenantMetrics.has(tenantId)) {
      this.tenantMetrics.set(tenantId, {
        predictions: 0,
        trainingRuns: 0,
        modelVersions: 0,
        lastActivity: Date.now()
      });
    }

    const metrics = this.tenantMetrics.get(tenantId);
    metrics.lastActivity = Date.now();

    switch (activityType) {
      case 'prediction':
        metrics.predictions++;
        break;
      case 'training':
        metrics.trainingRuns++;
        break;
      case 'deployment':
        metrics.modelVersions++;
        break;
    }

    // Check quotas
    this.checkQuotas(tenantId);
  }

  /**
   * Check tenant quotas
   */
  checkQuotas(tenantId) {
    const quotas = this.tenantQuotas.get(tenantId);
    const metrics = this.tenantMetrics.get(tenantId);

    if (!quotas || !metrics) return { withinQuota: true };

    const violations = [];

    // Check daily prediction quota (simplified - would need date tracking)
    if (metrics.predictions > quotas.maxPredictionsPerDay) {
      violations.push('maxPredictionsPerDay');
    }

    // Check monthly training quota (simplified)
    if (metrics.trainingRuns > quotas.maxTrainingRunsPerMonth) {
      violations.push('maxTrainingRunsPerMonth');
    }

    // Check model version quota
    if (metrics.modelVersions > quotas.maxModelVersions) {
      violations.push('maxModelVersions');
    }

    return {
      withinQuota: violations.length === 0,
      violations
    };
  }

  /**
   * Get tenant metrics
   */
  getTenantMetrics(tenantId) {
    return this.tenantMetrics.get(tenantId) || null;
  }

  /**
   * Get tenant quota status
   */
  getTenantQuotaStatus(tenantId) {
    const quotas = this.tenantQuotas.get(tenantId);
    const metrics = this.tenantMetrics.get(tenantId);
    const check = this.checkQuotas(tenantId);

    return {
      quotas: quotas || {},
      metrics: metrics || {},
      status: check
    };
  }

  /**
   * List all tenants
   */
  listTenants() {
    return Array.from(this.tenants.values());
  }

  /**
   * Update tenant configuration
   */
  updateTenant(tenantId, updates) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    Object.assign(tenant.config, updates);
    this.tenants.set(tenantId, tenant);
    
    logger.info(`Tenant updated: ${tenantId}`);
    return tenant;
  }

  /**
   * Deactivate tenant
   */
  deactivateTenant(tenantId) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    tenant.status = 'inactive';
    this.tenants.set(tenantId, tenant);
    
    logger.info(`Tenant deactivated: ${tenantId}`);
    return tenant;
  }
}

// Singleton instance
let instance = null;

function getMultiTenant() {
  if (!instance) {
    instance = new MultiTenant();
  }
  return instance;
}

module.exports = {
  MultiTenant,
  getMultiTenant
};

