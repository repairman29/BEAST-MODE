/**
 * BEAST MODE Core Utilities
 * Shared utilities and base classes for the BEAST MODE platform
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Generate unique ID
 */
function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}${timestamp}${random}`;
}

/**
 * Generate license key
 */
function generateLicenseKey() {
    return crypto.randomBytes(16).toString('hex').toUpperCase().match(/.{4}/g).join('-');
}

/**
 * Calculate quality score from metrics
 */
function calculateQualityScore(metrics) {
    const weights = {
        codeQuality: 0.25,
        testCoverage: 0.20,
        security: 0.20,
        performance: 0.15,
        maintainability: 0.15,
        activity: 0.05
    };

    let score = 0;

    if (metrics.codeQuality?.score) {
        score += (metrics.codeQuality.score / 100) * weights.codeQuality * 100;
    }

    if (metrics.testCoverage?.percentage) {
        score += (metrics.testCoverage.percentage / 100) * weights.testCoverage * 100;
    }

    if (metrics.security) {
        const securityScore = Math.max(0, 100 - (metrics.security.vulnerabilities * 20));
        score += (securityScore / 100) * weights.security * 100;
    }

    if (metrics.performance?.score) {
        score += (metrics.performance.score / 100) * weights.performance * 100;
    }

    if (metrics.maintainability?.score) {
        score += (metrics.maintainability.score / 100) * weights.maintainability * 100;
    }

    return Math.min(100, Math.round(score));
}

/**
 * Get system status
 */
async function getSystemStatus() {
    const status = {
        quality: false,
        marketplace: false,
        intelligence: false,
        qualityScore: 0,
        revenue: 0,
        teams: 0,
        plugins: 0,
        alerts: []
    };

    try {
        // Check if systems are initialized
        const qualityPath = path.join(process.cwd(), '.beast-mode', 'data', 'quality-metrics.json');
        status.quality = await fs.access(qualityPath).then(() => true).catch(() => false);

        const marketplacePath = path.join(process.cwd(), '.beast-mode', 'data', 'marketplace.json');
        status.marketplace = await fs.access(marketplacePath).then(() => true).catch(() => false);

        const intelligencePath = path.join(process.cwd(), '.beast-mode', 'data', 'intelligence.json');
        status.intelligence = await fs.access(intelligencePath).then(() => true).catch(() => false);

        // Load basic metrics if available
        if (status.quality) {
            try {
                const qualityData = JSON.parse(await fs.readFile(qualityPath, 'utf8'));
                status.qualityScore = qualityData.overallScore || 0;
                status.alerts = qualityData.alerts || [];
            } catch (e) {
                // Ignore errors
            }
        }

    } catch (error) {
        // System not fully initialized
    }

    return status;
}

/**
 * Validate configuration
 */
function validateConfig(config) {
    const required = ['version'];
    const missing = required.filter(key => !config[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }

    return true;
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Format percentage
 */
function formatPercentage(value, decimals = 1) {
    return `${(value || 0).toFixed(decimals)}%`;
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Safe JSON parse
 */
function safeJsonParse(jsonString, fallback = null) {
    try {
        return JSON.parse(jsonString);
    } catch {
        return fallback;
    }
}

/**
 * Calculate trend
 */
function calculateTrend(data, period = 7) {
    if (!Array.isArray(data) || data.length < period * 2) {
        return 0;
    }

    const recent = data.slice(-period);
    const previous = data.slice(-period * 2, -period);

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const previousAvg = previous.reduce((sum, val) => sum + val, 0) / previous.length;

    if (previousAvg === 0) return 0;

    return (recentAvg - previousAvg) / previousAvg;
}

/**
 * Get trend direction
 */
function getTrendDirection(trend) {
    if (trend > 0.05) return 'increasing';
    if (trend < -0.05) return 'decreasing';
    return 'stable';
}

module.exports = {
    generateId,
    generateLicenseKey,
    calculateQualityScore,
    getSystemStatus,
    validateConfig,
    formatCurrency,
    formatPercentage,
    deepClone,
    safeJsonParse,
    calculateTrend,
    getTrendDirection
};
