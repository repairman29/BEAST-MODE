/**
 * Compliance Features
 * 
 * GDPR, SOC2, HIPAA compliance features
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
const log = createLogger('Compliance');

class Compliance {
  constructor() {
    this.complianceRecords = new Map(); // recordId -> record
    this.dataRetentionPolicies = new Map(); // policyId -> policy
    this.initializePolicies();
  }

  /**
   * Initialize compliance policies
   */
  initializePolicies() {
    // GDPR compliance
    this.dataRetentionPolicies.set('gdpr', {
      id: 'gdpr',
      name: 'GDPR Data Retention',
      description: 'EU General Data Protection Regulation compliance',
      retentionPeriod: 90, // days
      autoDelete: true,
      encryptionRequired: true,
      rightToErasure: true,
      dataPortability: true
    });

    // SOC2 compliance
    this.dataRetentionPolicies.set('soc2', {
      id: 'soc2',
      name: 'SOC2 Compliance',
      description: 'Security, availability, processing integrity compliance',
      retentionPeriod: 365, // days
      autoDelete: false,
      encryptionRequired: true,
      auditLogging: true,
      accessControls: true
    });

    // HIPAA compliance
    this.dataRetentionPolicies.set('hipaa', {
      id: 'hipaa',
      name: 'HIPAA Compliance',
      description: 'Health Insurance Portability and Accountability Act',
      retentionPeriod: 2555, // 7 years
      autoDelete: false,
      encryptionRequired: true,
      accessControls: true,
      auditLogging: true,
      breachNotification: true
    });
  }

  /**
   * Apply compliance policy
   */
  applyPolicy(userId, policyId, resources = []) {
    const policy = this.dataRetentionPolicies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    const record = {
      id: `compliance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      policyId,
      policy,
      resources,
      appliedAt: new Date().toISOString(),
      status: 'active'
    };

    this.complianceRecords.set(record.id, record);
    log.info(`Compliance policy applied: ${policyId} for ${userId}`);
    return record;
  }

  /**
   * Check data retention requirements
   */
  checkDataRetention(dataType, createdAt) {
    const age = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const policies = Array.from(this.dataRetentionPolicies.values());
    
    const applicablePolicies = policies.filter(p => {
      // Check if policy applies to this data type
      return p.retentionPeriod && age > p.retentionPeriod;
    });

    return {
      age: Math.floor(age),
      applicablePolicies,
      shouldDelete: applicablePolicies.some(p => p.autoDelete),
      requiresAction: applicablePolicies.length > 0
    };
  }

  /**
   * Process right to erasure (GDPR)
   */
  processRightToErasure(userId, dataTypes = []) {
    const record = {
      id: `erasure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      dataTypes,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      completedAt: null
    };

    // In production, this would trigger actual data deletion
    log.info(`Right to erasure requested: ${userId}`, dataTypes);
    return record;
  }

  /**
   * Export user data (GDPR data portability)
   */
  exportUserData(userId, format = 'json') {
    const exportData = {
      userId,
      exportedAt: new Date().toISOString(),
      format,
      data: {
        profile: this.getUserProfile(userId),
        activity: this.getUserActivity(userId),
        preferences: this.getUserPreferences(userId),
        models: this.getUserModels(userId),
        apiKeys: this.getUserApiKeys(userId)
      }
    };

    log.info(`User data exported: ${userId} (${format})`);
    return exportData;
  }

  /**
   * Get user profile (placeholder)
   */
  getUserProfile(userId) {
    return {
      userId,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
  }

  /**
   * Get user activity (placeholder)
   */
  getUserActivity(userId) {
    return {
      totalRequests: 0,
      lastRequest: new Date().toISOString()
    };
  }

  /**
   * Get user preferences (placeholder)
   */
  getUserPreferences(userId) {
    return {};
  }

  /**
   * Get user models (placeholder)
   */
  getUserModels(userId) {
    return [];
  }

  /**
   * Get user API keys (placeholder - would be encrypted)
   */
  getUserApiKeys(userId) {
    return {
      providers: [],
      count: 0
    };
  }

  /**
   * Check compliance status
   */
  checkComplianceStatus(userId) {
    const records = Array.from(this.complianceRecords.values())
      .filter(r => r.userId === userId);

    const activePolicies = records
      .filter(r => r.status === 'active')
      .map(r => r.policy);

    const status = {
      userId,
      compliant: true,
      policies: activePolicies,
      requirements: {
        encryption: activePolicies.some(p => p.encryptionRequired),
        auditLogging: activePolicies.some(p => p.auditLogging),
        accessControls: activePolicies.some(p => p.accessControls),
        dataRetention: activePolicies.some(p => p.retentionPeriod)
      },
      lastChecked: new Date().toISOString()
    };

    return status;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(userId, timeRange = '30d') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    const records = Array.from(this.complianceRecords.values())
      .filter(r => r.userId === userId && new Date(r.appliedAt).getTime() >= cutoff);

    const report = {
      userId,
      timeRange,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRecords: records.length,
        activePolicies: records.filter(r => r.status === 'active').length,
        complianceScore: this.calculateComplianceScore(records)
      },
      policies: records.map(r => ({
        policy: r.policy.name,
        appliedAt: r.appliedAt,
        status: r.status
      })),
      recommendations: this.generateRecommendations(records)
    };

    return report;
  }

  /**
   * Calculate compliance score
   */
  calculateComplianceScore(records) {
    if (records.length === 0) return 0;

    const activeCount = records.filter(r => r.status === 'active').length;
    return Math.min(100, (activeCount / records.length) * 100);
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(records) {
    const recommendations = [];

    const hasGDPR = records.some(r => r.policyId === 'gdpr');
    const hasSOC2 = records.some(r => r.policyId === 'soc2');
    const hasHIPAA = records.some(r => r.policyId === 'hipaa');

    if (!hasGDPR) {
      recommendations.push({
        type: 'policy',
        priority: 'medium',
        message: 'Consider applying GDPR compliance policy for EU users'
      });
    }

    if (!hasSOC2) {
      recommendations.push({
        type: 'policy',
        priority: 'high',
        message: 'SOC2 compliance recommended for enterprise customers'
      });
    }

    return recommendations;
  }

  /**
   * Audit compliance actions
   */
  auditComplianceAction(action, userId, details = {}) {
    const audit = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      userId,
      timestamp: new Date().toISOString(),
      details,
      compliance: true
    };

    log.info(`Compliance audit: ${action} by ${userId}`, details);
    return audit;
  }
}

// Singleton instance
let complianceInstance = null;

function getCompliance() {
  if (!complianceInstance) {
    complianceInstance = new Compliance();
  }
  return complianceInstance;
}

module.exports = {
  Compliance,
  getCompliance
};
