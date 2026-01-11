/**
 * Performance Analytics
 * Advanced analytics and insights for model performance
 * 
 * Month 2: Week 2 - Performance Analytics
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
const { getModelMonitoring } = require('./modelMonitoring');
const { getProductionDeployment } = require('./productionDeployment');
const { getMLModelIntegration } = require('./mlModelIntegration');
const log = createLogger('PerformanceAnalytics');

class PerformanceAnalytics {
    constructor() {
        this.metrics = {
            daily: [],
            weekly: [],
            monthly: []
        };
    }

    /**
     * Get comprehensive analytics
     */
    async getAnalytics(timeRange = '7d') {
        const monitoring = getModelMonitoring();
        const deployment = getProductionDeployment();
        const mlIntegration = await getMLModelIntegration();

        const dashboard = monitoring.getDashboardData();
        const health = monitoring.getHealthStatus();
        const deploymentStatus = await deployment.getDeploymentStatus();

        // Calculate trends
        const trends = this.calculateTrends(dashboard);

        // Performance breakdown
        const breakdown = this.getPerformanceBreakdown(dashboard);

        // Model comparison
        const modelComparison = await this.compareModels();

        return {
            summary: {
                health: health.status,
                accuracy: dashboard.metrics.accuracy,
                avgError: dashboard.metrics.avgError,
                avgLatency: dashboard.metrics.avgLatency,
                errorRate: dashboard.metrics.errorRate,
                sampleSize: dashboard.metrics.sampleSize
            },
            trends: trends,
            breakdown: breakdown,
            modelComparison: modelComparison,
            deployment: {
                currentModel: deploymentStatus.currentModel?.version || 'None',
                totalDeployments: deploymentStatus.totalDeployments,
                activeABTests: deploymentStatus.activeABTests
            },
            alerts: dashboard.alerts.slice(-10),
            thresholds: dashboard.thresholds
        };
    }

    /**
     * Calculate performance trends
     */
    calculateTrends(dashboard) {
        const recent = dashboard.metrics;
        const baseline = dashboard.baseline;

        const trends = {
            accuracy: this.calculateTrend(recent.accuracy, baseline.accuracy),
            error: this.calculateTrend(recent.avgError, baseline.avgError, true), // Lower is better
            latency: this.calculateTrend(recent.avgLatency, 0, true), // Lower is better
            errorRate: this.calculateTrend(recent.errorRate, 0, true) // Lower is better
        };

        return trends;
    }

    /**
     * Calculate trend direction
     */
    calculateTrend(current, baseline, lowerIsBetter = false) {
        if (baseline === 0 || baseline === undefined) {
            return 'stable';
        }

        const change = ((current - baseline) / baseline) * 100;
        const threshold = 5; // 5% change threshold

        if (lowerIsBetter) {
            if (change < -threshold) {
                return 'improving';
            } else if (change > threshold) {
                return 'declining';
            }
        } else {
            if (change > threshold) {
                return 'improving';
            } else if (change < -threshold) {
                return 'declining';
            }
        }

        return 'stable';
    }

    /**
     * Get performance breakdown
     */
    getPerformanceBreakdown(dashboard) {
        return {
            accuracy: {
                current: dashboard.metrics.accuracy,
                baseline: dashboard.baseline.accuracy,
                target: dashboard.thresholds.accuracy.min,
                status: dashboard.metrics.accuracy >= dashboard.thresholds.accuracy.min ? 'good' : 'poor'
            },
            error: {
                current: dashboard.metrics.avgError,
                baseline: dashboard.baseline.avgError,
                target: 3.0,
                status: dashboard.metrics.avgError <= 3.0 ? 'good' : 'poor'
            },
            latency: {
                current: dashboard.metrics.avgLatency,
                target: dashboard.thresholds.latency.max,
                status: dashboard.metrics.avgLatency <= dashboard.thresholds.latency.max ? 'good' : 'poor'
            },
            errorRate: {
                current: dashboard.metrics.errorRate,
                target: dashboard.thresholds.errorRate.max,
                status: dashboard.metrics.errorRate <= dashboard.thresholds.errorRate.max ? 'good' : 'poor'
            }
        };
    }

    /**
     * Compare different models
     */
    async compareModels() {
        try {
            const { getEnsemblePredictor } = require('./ensemblePredictor');
            const ensemble = await getEnsemblePredictor();
            const info = ensemble.getInfo();

            return {
                availableModels: info.models.length,
                models: info.models.map(m => ({
                    version: m.version,
                    weight: m.weight
                })),
                strategies: info.strategies
            };
        } catch (error) {
            log.warn('Failed to get model comparison:', error.message);
            return {
                availableModels: 0,
                models: [],
                strategies: []
            };
        }
    }

    /**
     * Get performance report
     */
    async getReport(timeRange = '7d') {
        const analytics = await this.getAnalytics(timeRange);

        return {
            generatedAt: new Date().toISOString(),
            timeRange: timeRange,
            summary: analytics.summary,
            trends: analytics.trends,
            breakdown: analytics.breakdown,
            recommendations: this.getRecommendations(analytics),
            deployment: analytics.deployment
        };
    }

    /**
     * Get recommendations based on analytics
     */
    getRecommendations(analytics) {
        const recommendations = [];

        // Accuracy recommendations
        if (analytics.summary.accuracy < 0.85) {
            recommendations.push({
                type: 'accuracy',
                priority: 'high',
                message: 'Model accuracy is below target. Consider retraining with more data.',
                action: 'retrain'
            });
        }

        // Error rate recommendations
        if (analytics.summary.errorRate > 0.05) {
            recommendations.push({
                type: 'error_rate',
                priority: 'critical',
                message: 'Error rate is high. Check model health and consider rollback.',
                action: 'investigate'
            });
        }

        // Latency recommendations
        if (analytics.summary.avgLatency > 200) {
            recommendations.push({
                type: 'latency',
                priority: 'medium',
                message: 'Prediction latency is high. Consider enabling caching or optimizing model.',
                action: 'optimize'
            });
        }

        // Trend recommendations
        if (analytics.trends.accuracy === 'declining') {
            recommendations.push({
                type: 'trend',
                priority: 'high',
                message: 'Accuracy is declining. Model may be experiencing drift.',
                action: 'retrain'
            });
        }

        return recommendations;
    }

    /**
     * Export analytics data
     */
    async exportAnalytics(format = 'json') {
        const analytics = await this.getAnalytics('30d');

        if (format === 'json') {
            return JSON.stringify(analytics, null, 2);
        } else if (format === 'csv') {
            // Convert to CSV format
            return this.toCSV(analytics);
        }

        return analytics;
    }

    /**
     * Convert analytics to CSV
     */
    toCSV(analytics) {
        const lines = [
            'Metric,Current,Baseline,Target,Status',
            `Accuracy,${analytics.summary.accuracy},${analytics.breakdown.accuracy.baseline},${analytics.breakdown.accuracy.target},${analytics.breakdown.accuracy.status}`,
            `Error,${analytics.summary.avgError},${analytics.breakdown.error.baseline},${analytics.breakdown.error.target},${analytics.breakdown.error.status}`,
            `Latency,${analytics.summary.avgLatency},,${analytics.breakdown.latency.target},${analytics.breakdown.latency.status}`,
            `ErrorRate,${analytics.summary.errorRate},,${analytics.breakdown.errorRate.target},${analytics.breakdown.errorRate.status}`
        ];

        return lines.join('\n');
    }
}

// Singleton instance
let performanceAnalyticsInstance = null;

function getPerformanceAnalytics() {
    if (!performanceAnalyticsInstance) {
        performanceAnalyticsInstance = new PerformanceAnalytics();
    }
    return performanceAnalyticsInstance;
}

module.exports = {
    PerformanceAnalytics,
    getPerformanceAnalytics
};

