/**
 * Enterprise Security Service
 * Provides API key management, rate limiting, and audit logging
 * 
 * Month 7: Enterprise Features
 */

const { createLogger } = require('../utils/logger');
const crypto = require('crypto');
const logger = createLogger('EnterpriseSecurity');

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

class EnterpriseSecurity {
  constructor() {
    this.apiKeys = new Map();
    this.rateLimits = new Map();
    this.auditLog = [];
    this.encryptionKey = getConfigValue('ENCRYPTION_KEY') || crypto.randomBytes(32).toString('hex');
  }

  /**
   * Initialize security service
   */
  async initialize() {
    try {
      logger.info('✅ Enterprise security initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize security service:', error);
      return false;
    }
  }

  /**
   * Generate API key
   */
  generateApiKey(tenantId, permissions = ['read', 'predict']) {
    const keyId = crypto.randomBytes(16).toString('hex');
    const secret = crypto.randomBytes(32).toString('hex');
    const apiKey = `${keyId}.${secret}`;

    this.apiKeys.set(keyId, {
      tenantId,
      keyId,
      secret,
      permissions,
      createdAt: Date.now(),
      lastUsed: null,
      status: 'active',
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        requestsPerDay: 10000
      }
    });

    logger.info(`API key generated for tenant: ${tenantId}`);
    return {
      keyId,
      apiKey,
      permissions
    };
  }

  /**
   * Validate API key
   */
  validateApiKey(apiKey) {
    const [keyId, secret] = apiKey.split('.');
    
    if (!keyId || !secret) {
      return { valid: false, error: 'Invalid API key format' };
    }

    const keyData = this.apiKeys.get(keyId);
    
    if (!keyData) {
      return { valid: false, error: 'API key not found' };
    }

    if (keyData.status !== 'active') {
      return { valid: false, error: 'API key is inactive' };
    }

    if (keyData.secret !== secret) {
      return { valid: false, error: 'Invalid API key secret' };
    }

    // Update last used
    keyData.lastUsed = Date.now();
    this.apiKeys.set(keyId, keyData);

    return {
      valid: true,
      tenantId: keyData.tenantId,
      permissions: keyData.permissions
    };
  }

  /**
   * Check rate limit
   */
  checkRateLimit(keyId, endpoint = 'default') {
    const keyData = this.apiKeys.get(keyId);
    if (!keyData) {
      return { allowed: false, error: 'API key not found' };
    }

    const limitKey = `${keyId}:${endpoint}`;
    const now = Date.now();

    if (!this.rateLimits.has(limitKey)) {
      this.rateLimits.set(limitKey, {
        requests: [],
        windowStart: now
      });
    }

    const limit = this.rateLimits.get(limitKey);
    const { requestsPerMinute, requestsPerHour, requestsPerDay } = keyData.rateLimit;

    // Clean old requests
    limit.requests = limit.requests.filter(
      timestamp => now - timestamp < 24 * 60 * 60 * 1000 // 24 hours
    );

    // Check limits
    const lastMinute = limit.requests.filter(t => now - t < 60 * 1000).length;
    const lastHour = limit.requests.filter(t => now - t < 60 * 60 * 1000).length;
    const lastDay = limit.requests.length;

    if (lastMinute >= requestsPerMinute) {
      return { allowed: false, error: 'Rate limit exceeded (per minute)' };
    }
    if (lastHour >= requestsPerHour) {
      return { allowed: false, error: 'Rate limit exceeded (per hour)' };
    }
    if (lastDay >= requestsPerDay) {
      return { allowed: false, error: 'Rate limit exceeded (per day)' };
    }

    // Record request
    limit.requests.push(now);
    this.rateLimits.set(limitKey, limit);

    return {
      allowed: true,
      remaining: {
        perMinute: requestsPerMinute - lastMinute,
        perHour: requestsPerHour - lastHour,
        perDay: requestsPerDay - lastDay
      }
    };
  }

  /**
   * Encrypt data
   */
  encrypt(data) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encrypted,
        iv: iv.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption failed:', error);
      return null;
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData, iv) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Audit log entry
   */
  logAudit(tenantId, action, details = {}) {
    const entry = {
      timestamp: Date.now(),
      tenantId,
      action,
      details,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown'
    };

    this.auditLog.push(entry);

    // Keep only last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog.shift();
    }

    logger.debug(`Audit log: ${action} by ${tenantId}`);
    return entry;
  }

  /**
   * Get audit log
   */
  getAuditLog(tenantId = null, limit = 100) {
    let log = this.auditLog;

    if (tenantId) {
      log = log.filter(entry => entry.tenantId === tenantId);
    }

    return log.slice(-limit).reverse();
  }

  /**
   * Revoke API key
   */
  revokeApiKey(keyId) {
    const keyData = this.apiKeys.get(keyId);
    if (!keyData) {
      throw new Error('API key not found');
    }

    keyData.status = 'revoked';
    this.apiKeys.set(keyId, keyData);

    logger.info(`API key revoked: ${keyId}`);
    return keyData;
  }

  /**
   * List API keys for tenant
   */
  listApiKeys(tenantId) {
    return Array.from(this.apiKeys.values())
      .filter(key => key.tenantId === tenantId);
  }
}

// Singleton instance
let instance = null;

function getEnterpriseSecurity() {
  if (!instance) {
    instance = new EnterpriseSecurity();
  }
  return instance;
}

module.exports = {
  EnterpriseSecurity,
  getEnterpriseSecurity
};

