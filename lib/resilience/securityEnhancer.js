/**
 * Security Enhancer Service
 * Provides input validation, output sanitization, and security headers
 * 
 * Month 8: Week 2 - Production Hardening
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('SecurityEnhancer');

class SecurityEnhancer {
  constructor() {
    this.validationRules = new Map();
    this.sanitizationRules = new Map();
    this.securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'"
    };
  }

  /**
   * Initialize security enhancer
   */
  async initialize() {
    try {
      this.setupDefaultValidationRules();
      this.setupDefaultSanitizationRules();
      logger.info('✅ Security enhancer initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize security enhancer:', error);
      return false;
    }
  }

  /**
   * Setup default validation rules
   */
  setupDefaultValidationRules() {
    // String validation
    this.validationRules.set('string', {
      maxLength: 10000,
      minLength: 0,
      pattern: null,
      required: false
    });

    // Number validation
    this.validationRules.set('number', {
      min: -Infinity,
      max: Infinity,
      integer: false,
      required: false
    });

    // Email validation
    this.validationRules.set('email', {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      required: false
    });

    // URL validation
    this.validationRules.set('url', {
      pattern: /^https?:\/\/.+/,
      required: false
    });
  }

  /**
   * Setup default sanitization rules
   */
  setupDefaultSanitizationRules() {
    // HTML sanitization
    this.sanitizationRules.set('html', (input) => {
      if (typeof input !== 'string') return input;
      // Remove HTML tags (simplified)
      return input.replace(/<[^>]*>/g, '');
    });

    // SQL injection prevention
    this.sanitizationRules.set('sql', (input) => {
      if (typeof input !== 'string') return input;
      // Remove SQL keywords (simplified)
      return input.replace(/['";\\]/g, '');
    });

    // XSS prevention
    this.sanitizationRules.set('xss', (input) => {
      if (typeof input !== 'string') return input;
      // Escape HTML entities
      return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    });
  }

  /**
   * Validate input
   */
  validateInput(input, type, rules = {}) {
    const defaultRules = this.validationRules.get(type) || {};
    const mergedRules = { ...defaultRules, ...rules };

    // Required check
    if (mergedRules.required && (input === null || input === undefined || input === '')) {
      return {
        valid: false,
        error: `${type} is required`
      };
    }

    // Type check
    if (input === null || input === undefined) {
      return { valid: true }; // Optional fields can be null
    }

    switch (type) {
      case 'string':
        if (typeof input !== 'string') {
          return { valid: false, error: 'Expected string' };
        }
        if (mergedRules.maxLength && input.length > mergedRules.maxLength) {
          return { valid: false, error: `String too long (max: ${mergedRules.maxLength})` };
        }
        if (mergedRules.minLength && input.length < mergedRules.minLength) {
          return { valid: false, error: `String too short (min: ${mergedRules.minLength})` };
        }
        if (mergedRules.pattern && !mergedRules.pattern.test(input)) {
          return { valid: false, error: 'Pattern validation failed' };
        }
        break;

      case 'number':
        const num = typeof input === 'string' ? parseFloat(input) : input;
        if (isNaN(num)) {
          return { valid: false, error: 'Expected number' };
        }
        if (mergedRules.min !== undefined && num < mergedRules.min) {
          return { valid: false, error: `Number too small (min: ${mergedRules.min})` };
        }
        if (mergedRules.max !== undefined && num > mergedRules.max) {
          return { valid: false, error: `Number too large (max: ${mergedRules.max})` };
        }
        if (mergedRules.integer && !Number.isInteger(num)) {
          return { valid: false, error: 'Expected integer' };
        }
        break;

      case 'email':
        if (typeof input !== 'string') {
          return { valid: false, error: 'Expected string' };
        }
        if (!mergedRules.pattern.test(input)) {
          return { valid: false, error: 'Invalid email format' };
        }
        break;

      case 'url':
        if (typeof input !== 'string') {
          return { valid: false, error: 'Expected string' };
        }
        if (!mergedRules.pattern.test(input)) {
          return { valid: false, error: 'Invalid URL format' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Sanitize output
   */
  sanitizeOutput(output, type = 'xss') {
    const sanitizer = this.sanitizationRules.get(type);
    if (!sanitizer) {
      return output;
    }

    if (typeof output === 'string') {
      return sanitizer(output);
    }

    if (Array.isArray(output)) {
      return output.map(item => this.sanitizeOutput(item, type));
    }

    if (typeof output === 'object' && output !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(output)) {
        sanitized[key] = this.sanitizeOutput(value, type);
      }
      return sanitized;
    }

    return output;
  }

  /**
   * Get security headers
   */
  getSecurityHeaders(customHeaders = {}) {
    return {
      ...this.securityHeaders,
      ...customHeaders
    };
  }

  /**
   * Validate request
   */
  validateRequest(request, schema) {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = request[field];
      const validation = this.validateInput(value, rules.type || 'string', rules);

      if (!validation.valid) {
        errors.push({
          field,
          error: validation.error
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Scan for vulnerabilities (simplified)
   */
  scanVulnerabilities(input) {
    const vulnerabilities = [];

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\bDROP\b.*\bTABLE\b)/i,
      /(\bDELETE\b.*\bFROM\b)/i,
      /('.*OR.*'.*=.*')/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        vulnerabilities.push({
          type: 'sql_injection',
          severity: 'high',
          pattern: pattern.toString()
        });
      }
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        vulnerabilities.push({
          type: 'xss',
          severity: 'high',
          pattern: pattern.toString()
        });
      }
    }

    return vulnerabilities;
  }
}

// Singleton instance
let instance = null;

function getSecurityEnhancer() {
  if (!instance) {
    instance = new SecurityEnhancer();
  }
  return instance;
}

module.exports = {
  SecurityEnhancer,
  getSecurityEnhancer
};

