/**
 * Unified Enterprise Service
 * Consolidates multi-tenant, RBAC, security, and analytics into a single service
 * 
 * Phase 2, Week 1: Enterprise Unification
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
const { getMultiTenant } = require('./multiTenant');
const { getRBAC } = require('./rbac');
const { getEnterpriseSecurity } = require('./security');
const { getEnterpriseAnalytics } = require('./enterpriseAnalytics');

const logger = createLogger('UnifiedEnterpriseService');

class UnifiedEnterpriseService {
  constructor() {
    this.initialized = false;
    this.multiTenant = null;
    this.rbac = null;
    this.security = null;
    this.analytics = null;
  }

  /**
   * Initialize unified enterprise service
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      // Initialize all enterprise services
      this.multiTenant = getMultiTenant();
      await this.multiTenant.initialize();

      this.rbac = getRBAC();
      await this.rbac.initialize();

      this.security = getEnterpriseSecurity();
      await this.security.initialize();

      this.analytics = getEnterpriseAnalytics();
      await this.analytics.initialize();

      this.initialized = true;
      logger.info('✅ Unified enterprise service initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize unified enterprise service:', error);
      return false;
    }
  }

  // ============================================================================
  // MULTI-TENANT OPERATIONS
  // ============================================================================

  /**
   * Register a new tenant
   */
  async registerTenant(tenantConfig) {
    await this.ensureInitialized();
    const tenantId = tenantConfig.tenantId || `tenant_${Date.now()}`;
    const tenant = this.multiTenant.registerTenant(tenantId, tenantConfig);
    return { tenantId: tenant.id, tenant };
  }

  /**
   * Get tenant configuration
   */
  async getTenantConfig(tenantId) {
    await this.ensureInitialized();
    return await this.multiTenant.getTenant(tenantId);
  }

  /**
   * Set tenant configuration
   */
  async setTenantConfig(tenantId, config) {
    await this.ensureInitialized();
    const tenant = await this.multiTenant.getTenant(tenantId);
    if (tenant) {
      Object.assign(tenant.config, config);
      return tenant;
    }
    throw new Error(`Tenant ${tenantId} not found`);
  }

  /**
   * Get tenant models
   */
  async getTenantModels(tenantId) {
    await this.ensureInitialized();
    const model = await this.multiTenant.getTenantModel(tenantId);
    return model ? [model] : [];
  }

  /**
   * Record tenant activity
   */
  async recordTenantActivity(tenantId, activity) {
    await this.ensureInitialized();
    this.multiTenant.recordActivity(tenantId, activity.type || 'activity');
    return { recorded: true };
  }

  // ============================================================================
  // RBAC OPERATIONS
  // ============================================================================

  /**
   * Create a role
   */
  async createRole(roleName, permissions) {
    await this.ensureInitialized();
    return await this.rbac.createRole(roleName, permissions);
  }

  /**
   * Assign role to user
   */
  async assignRole(userId, roleName, tenantId = null) {
    await this.ensureInitialized();
    return await this.rbac.assignRole(userId, tenantId || 'default', roleName);
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId, permission, tenantId = null) {
    await this.ensureInitialized();
    return await this.rbac.hasPermission(userId, permission, tenantId);
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId, tenantId = null) {
    await this.ensureInitialized();
    return await this.rbac.getUserPermissions(userId, tenantId);
  }

  // ============================================================================
  // SECURITY OPERATIONS
  // ============================================================================

  /**
   * Generate API key
   */
  async generateApiKey(tenantId, userId, permissions = []) {
    await this.ensureInitialized();
    return await this.security.generateApiKey(tenantId, userId, permissions);
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey) {
    await this.ensureInitialized();
    return await this.security.validateApiKey(apiKey);
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(apiKey, endpoint) {
    await this.ensureInitialized();
    return await this.security.checkRateLimit(apiKey, endpoint);
  }

  /**
   * Encrypt data
   */
  async encryptData(data, tenantId) {
    await this.ensureInitialized();
    return await this.security.encryptData(data, tenantId);
  }

  /**
   * Decrypt data
   */
  async decryptData(encryptedData, tenantId) {
    await this.ensureInitialized();
    return await this.security.decryptData(encryptedData, tenantId);
  }

  /**
   * Log audit event
   */
  async logAudit(tenantId, userId, action, details = {}) {
    await this.ensureInitialized();
    return await this.security.logAudit(tenantId, userId, action, details);
  }

  /**
   * Get audit log
   */
  async getAuditLog(tenantId, filters = {}) {
    await this.ensureInitialized();
    return await this.security.getAuditLog(tenantId, filters);
  }

  // ============================================================================
  // ANALYTICS OPERATIONS
  // ============================================================================

  /**
   * Create dashboard
   */
  async createDashboard(tenantId, dashboardConfig) {
    await this.ensureInitialized();
    return await this.analytics.createDashboard(tenantId, dashboardConfig);
  }

  /**
   * Generate report
   */
  async generateReport(tenantId, reportType, options = {}) {
    await this.ensureInitialized();
    return await this.analytics.generateReport(tenantId, { type: reportType, name: reportType, ...options });
  }

  /**
   * Export data
   */
  async exportData(tenantId, dataType, format = 'csv') {
    await this.ensureInitialized();
    return await this.analytics.exportData(tenantId, dataType, format);
  }

  /**
   * Get analytics trends
   */
  async getAnalyticsTrends(tenantId, timeRange = 30) {
    await this.ensureInitialized();
    // Enterprise analytics doesn't have getTrends, use generateReport instead
    return await this.analytics.generateReport(tenantId, 'trends', { days: timeRange });
  }

  // ============================================================================
  // UNIFIED OPERATIONS
  // ============================================================================

  /**
   * Get tenant status (unified view)
   */
  async getTenantStatus(tenantId) {
    await this.ensureInitialized();

    const tenant = await this.multiTenant.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const metrics = this.multiTenant.getTenantMetrics(tenantId);
    let analytics = null;
    try {
      analytics = await this.analytics.generateReport(tenantId, { type: 'trends', name: 'trends' });
    } catch (error) {
      // Analytics not available
    }
    
    let auditLog = [];
    try {
      auditLog = this.security.getAuditLog(tenantId, { limit: 1 });
    } catch (error) {
      // Audit log not available
    }

    return {
      tenant,
      activity: {
        recent: metrics,
        total: metrics.predictions || 0
      },
      analytics: {
        trends: analytics,
        summary: (async () => {
          try {
            return await this.analytics.generateReport(tenantId, { type: 'summary', name: 'summary' });
          } catch (error) {
            return null;
          }
        })()
      },
      security: {
        apiKeys: auditLog.length,
        lastActivity: auditLog[0] || null
      }
    };
  }

  /**
   * Ensure service is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      services: {
        multiTenant: !!this.multiTenant,
        rbac: !!this.rbac,
        security: !!this.security,
        analytics: !!this.analytics
      }
    };
  }
}

// Singleton instance
let unifiedEnterpriseServiceInstance = null;

function getUnifiedEnterpriseService() {
  if (!unifiedEnterpriseServiceInstance) {
    unifiedEnterpriseServiceInstance = new UnifiedEnterpriseService();
  }
  return unifiedEnterpriseServiceInstance;
}

module.exports = {
  UnifiedEnterpriseService,
  getUnifiedEnterpriseService
};

