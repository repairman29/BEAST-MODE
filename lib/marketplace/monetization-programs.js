/**
 * BEAST MODE Monetization Programs
 * Revenue sharing, affiliate programs, and marketplace economics
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
const log = createLogger('MonetizationPrograms');

class MonetizationPrograms {
  constructor() {
    this.revenueShare = 0.7; // 70% to developers
    this.platformFee = 0.3; // 30% platform fee
    this.affiliateRate = 0.1; // 10% affiliate commission
    this.totalRevenue = 0;
    this.monthlyRevenue = 0;
    this.developerEarnings = new Map();
    this.affiliateEarnings = new Map();
  }

  async initialize() {
    log.info('Initializing Monetization Programs...');
    await this.loadEarnings();
    log.info('✅ Monetization Programs ready');
  }

  /**
   * Check marketplace status and earnings
   */
  async checkMarketplaceStatus() {
    const stats = {
      totalRevenue: this.totalRevenue,
      monthlyRevenue: this.monthlyRevenue,
      platformFee: this.totalRevenue * this.platformFee,
      developerEarnings: this.totalRevenue * this.revenueShare,
      topEarners: Array.from(this.developerEarnings.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([developer, earnings]) => ({ developer, earnings })),
      affiliateEarnings: Array.from(this.affiliateEarnings.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([affiliate, earnings]) => ({ affiliate, earnings }))
    };

    log.info('📊 Marketplace Status:');
    log.info(`   Total Revenue: $${stats.totalRevenue.toFixed(2)}`);
    log.info(`   Monthly Revenue: $${stats.monthlyRevenue.toFixed(2)}`);
    log.info(`   Developer Earnings: $${stats.developerEarnings.toFixed(2)}`);
    log.info(`   Platform Fee: $${stats.platformFee.toFixed(2)}`);
    log.info(`   Top Earners: ${stats.topEarners.length} developers`);

    return stats;
  }

  /**
   * Calculate revenue share for developer
   */
  calculateRevenueShare(price, developerId) {
    const developerShare = price * this.revenueShare;
    const platformFee = price * this.platformFee;

    // Track earnings
    const currentEarnings = this.developerEarnings.get(developerId) || 0;
    this.developerEarnings.set(developerId, currentEarnings + developerShare);

    // Update totals
    this.totalRevenue += price;
    this.monthlyRevenue += price;

    return {
      price,
      developerShare,
      platformFee,
      developerId
    };
  }

  /**
   * Calculate affiliate commission
   */
  calculateAffiliateCommission(price, affiliateId) {
    const commission = price * this.affiliateRate;

    // Track affiliate earnings
    const currentEarnings = this.affiliateEarnings.get(affiliateId) || 0;
    this.affiliateEarnings.set(affiliateId, currentEarnings + commission);

    return {
      price,
      commission,
      affiliateId
    };
  }

  /**
   * Get developer earnings
   */
  getDeveloperEarnings(developerId) {
    return {
      total: this.developerEarnings.get(developerId) || 0,
      monthly: this.monthlyRevenue * this.revenueShare / (this.developerEarnings.size || 1),
      rank: this.getDeveloperRank(developerId)
    };
  }

  /**
   * Get affiliate earnings
   */
  getAffiliateEarnings(affiliateId) {
    return {
      total: this.affiliateEarnings.get(affiliateId) || 0,
      commissionRate: this.affiliateRate,
      rank: this.getAffiliateRank(affiliateId)
    };
  }

  getDeveloperRank(developerId) {
    const sorted = Array.from(this.developerEarnings.entries())
      .sort(([,a], [,b]) => b - a);
    const index = sorted.findIndex(([id]) => id === developerId);
    return index >= 0 ? index + 1 : null;
  }

  getAffiliateRank(affiliateId) {
    const sorted = Array.from(this.affiliateEarnings.entries())
      .sort(([,a], [,b]) => b - a);
    const index = sorted.findIndex(([id]) => id === affiliateId);
    return index >= 0 ? index + 1 : null;
  }

  async loadEarnings() {
    // In production, this would load from database
    // For now, initialize empty
    this.developerEarnings = new Map();
    this.affiliateEarnings = new Map();
  }

  async saveEarnings() {
    // In production, this would save to database
    // For now, just log
    log.debug('Earnings data saved');
  }
}

// CLI wrapper function
async function checkMarketplaceStatus() {
  const monetization = new MonetizationPrograms();
  await monetization.initialize();
  return await monetization.checkMarketplaceStatus();
}

module.exports = {
  MonetizationPrograms,
  checkMarketplaceStatus
};
