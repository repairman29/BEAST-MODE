/**
 * BEAST MODE License Validator
 * Validates API keys and subscription tiers for feature gating
 */

const axios = require('axios');
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
const log = createLogger('LicenseValidator');

/**
 * Subscription tiers and their limits
 */
const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    apiCalls: 10000,
    features: [
      'basic-quality-checks',
      'community-support',
      'self-hosted'
    ]
  },
  developer: {
    name: 'Developer',
    apiCalls: 100000,
    features: [
      'basic-quality-checks',
      'community-support',
      'self-hosted',
      'day2-operations',
      'priority-support',
      'advanced-analytics',
      'quality-tracking',
      'overnight-janitor',
      'silent-refactoring'
    ]
  },
  team: {
    name: 'Team',
    apiCalls: 500000,
    features: [
      'basic-quality-checks',
      'community-support',
      'self-hosted',
      'day2-operations',
      'priority-support',
      'advanced-analytics',
      'quality-tracking',
      'overnight-janitor',
      'silent-refactoring',
      'team-collaboration',
      'enterprise-guardrail',
      'plain-english-diffs',
      'team-analytics',
      'phone-support',
      'sla'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    apiCalls: 2000000,
    features: [
      'basic-quality-checks',
      'community-support',
      'self-hosted',
      'day2-operations',
      'priority-support',
      'advanced-analytics',
      'quality-tracking',
      'overnight-janitor',
      'silent-refactoring',
      'team-collaboration',
      'enterprise-guardrail',
      'plain-english-diffs',
      'team-analytics',
      'phone-support',
      'sla',
      'unlimited-api-calls',
      'white-label',
      'sso',
      'custom-integrations',
      'dedicated-manager',
      '24-7-support',
      'on-premise',
      'custom-ai-models'
    ]
  }
};

/**
 * License Validator Class
 */
class LicenseValidator {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.BEAST_MODE_API_KEY;
    this.apiUrl = options.apiUrl || process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev/api';
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 5 * 60 * 1000; // 5 minutes
    this.subscriptionTier = 'free'; // Default to free
    this.validated = false;
  }

  /**
   * Validate API key and get subscription tier
   */
  async validate(apiKey = this.apiKey) {
    if (!apiKey) {
      log.debug('No API key provided, using free tier');
      this.subscriptionTier = 'free';
      this.validated = true;
      return {
        valid: true,
        tier: 'free',
        subscription: SUBSCRIPTION_TIERS.free
      };
    }

    // Check cache
    const cacheKey = `license_${apiKey.substring(0, 8)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      log.debug('Using cached license validation');
      this.subscriptionTier = cached.tier;
      return cached.result;
    }

    try {
      // Validate with BEAST MODE API
      const response = await axios.get(`${this.apiUrl}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data && response.data.valid) {
        const tier = response.data.tier || 'free';
        this.subscriptionTier = tier;
        this.validated = true;

        const result = {
          valid: true,
          tier: tier,
          subscription: SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free,
          apiCallsUsed: response.data.apiCallsUsed || 0,
          apiCallsLimit: response.data.apiCallsLimit || SUBSCRIPTION_TIERS[tier]?.apiCalls || 10000
        };

        // Cache result
        this.cache.set(cacheKey, {
          timestamp: Date.now(),
          tier: tier,
          result: result
        });

        log.info(`✅ License validated: ${tier} tier`);
        return result;
      } else {
        throw new Error('Invalid API key');
      }
    } catch (error) {
      // If API validation fails, fall back to free tier
      log.warn('API key validation failed, using free tier:', error.message);
      this.subscriptionTier = 'free';
      this.validated = true;

      const result = {
        valid: false,
        tier: 'free',
        subscription: SUBSCRIPTION_TIERS.free,
        error: error.message
      };

      return result;
    }
  }

  /**
   * Check if a feature is available for current subscription tier
   */
  checkFeature(feature) {
    if (!this.validated) {
      log.warn('License not validated, checking feature availability');
      return false;
    }

    const subscription = SUBSCRIPTION_TIERS[this.subscriptionTier];
    if (!subscription) {
      return false;
    }

    return subscription.features.includes(feature);
  }

  /**
   * Check if API call limit is exceeded
   */
  async checkApiLimit() {
    if (this.subscriptionTier === 'free') {
      // For free tier, we can't check usage without API key
      return { allowed: true, remaining: 10000 };
    }

    try {
      const response = await axios.get(`${this.apiUrl}/auth/usage`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data) {
        const used = response.data.used || 0;
        const limit = response.data.limit || SUBSCRIPTION_TIERS[this.subscriptionTier]?.apiCalls || 10000;
        const remaining = Math.max(0, limit - used);

        return {
          allowed: remaining > 0,
          used: used,
          limit: limit,
          remaining: remaining
        };
      }
    } catch (error) {
      log.warn('Failed to check API limit:', error.message);
      // Allow on error (fail open)
      return { allowed: true, remaining: 10000 };
    }

    return { allowed: true, remaining: 10000 };
  }

  /**
   * Get current subscription tier
   */
  getTier() {
    return this.subscriptionTier;
  }

  /**
   * Get subscription details
   */
  getSubscription() {
    return SUBSCRIPTION_TIERS[this.subscriptionTier] || SUBSCRIPTION_TIERS.free;
  }

  /**
   * Check if tier has access to feature
   */
  static hasFeature(tier, feature) {
    const subscription = SUBSCRIPTION_TIERS[tier];
    if (!subscription) {
      return false;
    }
    return subscription.features.includes(feature);
  }

  /**
   * Get all available tiers
   */
  static getTiers() {
    return Object.keys(SUBSCRIPTION_TIERS);
  }

  /**
   * Get tier details
   */
  static getTierDetails(tier) {
    return SUBSCRIPTION_TIERS[tier] || null;
  }
}

module.exports = {
  LicenseValidator,
  SUBSCRIPTION_TIERS
};

