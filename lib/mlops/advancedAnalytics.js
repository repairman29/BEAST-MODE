/**
 * Advanced Analytics Service
 * Deep analytics and insights for ML system performance
 * 
 * Month 4: Week 2 - Advanced Analytics
 */

const { createLogger } = require('../utils/logger');
const { getProductionMonitoring } = require('./productionMonitoring');
const { getModelImprovement } = require('./modelImprovement');
const { getPerformanceOptimizer } = require('./performanceOptimizer');
const log = createLogger('AdvancedAnalytics');

class AdvancedAnalytics {
    constructor() {
        this.analyticsHistory = [];
        this.initialized = false;
    }

    /**
     * Initialize analytics service
     */
    async initialize() {
        if (this.initialized) return;

        try {
            this.monitoring = getProductionMonitoring();
            this.modelImprovement = getModelImprovement();
            this.performanceOptimizer = getPerformanceOptimizer();
            
            await this.modelImprovement.initialize();
            await this.performanceOptimizer.initialize();
            
            this.initialized = true;
            log.info('✅ Advanced analytics initialized');
        } catch (error) {
            log.warn('Advanced analytics initialization failed:', error.message);
            this.initialized = true;
        }
    }

    /**
     * Generate comprehensive analytics report
     */
    async generateReport() {
        await this.initialize();

        const dashboard = this.monitoring.getDashboard();
        const improvementStats = this.modelImprovement.getImprovementStats();
        const performanceMetrics = this.performanceOptimizer.getMetrics();
        const recommendations = this.modelImprovement.getRecommendations();

        const report = {
            timestamp: new Date().toISOString(),
            systemHealth: {
                status: dashboard.health.status,
                score: dashboard.health.score,
                uptime: dashboard.uptime.formatted
            },
            predictions: {
                total: dashboard.predictions.total,
                mlModel: dashboard.predictions.mlModel,
                heuristic: dashboard.predictions.heuristic,
                mlModelRate: dashboard.predictions.mlModelRate,
                errorRate: dashboard.predictions.errorRate,
                avgLatency: dashboard.predictions.avgLatency
            },
            performance: {
                cache: performanceMetrics.cache,
                batch: performanceMetrics.batch,
                optimizations: performanceMetrics.optimizations
            },
            modelImprovement: {
                totalImprovements: improvementStats.totalImprovements,
                avgImprovement: improvementStats.avgImprovement,
                bestImprovement: improvementStats.bestImprovement
            },
            services: {
                total: dashboard.services.total,
                available: dashboard.services.available,
                integrations: dashboard.services.integrations
            },
            alerts: {
                total: dashboard.alerts.total,
                critical: dashboard.alerts.critical,
                warning: dashboard.alerts.warning
            },
            recommendations: recommendations,
            trends: this.calculateTrends(),
            insights: this.generateInsights(dashboard, improvementStats, performanceMetrics)
        };

        // Store in history
        this.analyticsHistory.push(report);
        if (this.analyticsHistory.length > 100) {
            this.analyticsHistory.shift();
        }

        return report;
    }

    /**
     * Calculate trends
     */
    calculateTrends() {
        if (this.analyticsHistory.length < 2) {
            return {
                predictions: 'insufficient_data',
                errorRate: 'insufficient_data',
                latency: 'insufficient_data'
            };
        }

        const recent = this.analyticsHistory.slice(-5);
        const older = this.analyticsHistory.slice(-10, -5);

        const recentAvgError = recent.reduce((sum, r) => sum + (r.predictions.errorRate || 0), 0) / recent.length;
        const olderAvgError = older.length > 0 
            ? older.reduce((sum, r) => sum + (r.predictions.errorRate || 0), 0) / older.length
            : recentAvgError;

        const recentAvgLatency = recent.reduce((sum, r) => sum + (r.predictions.avgLatency || 0), 0) / recent.length;
        const olderAvgLatency = older.length > 0
            ? older.reduce((sum, r) => sum + (r.predictions.avgLatency || 0), 0) / older.length
            : recentAvgLatency;

        return {
            predictions: recent[recent.length - 1].predictions.total > older[older.length - 1]?.predictions.total 
                ? 'increasing' : 'decreasing',
            errorRate: recentAvgError < olderAvgError ? 'improving' : recentAvgError > olderAvgError ? 'degrading' : 'stable',
            latency: recentAvgLatency < olderAvgLatency ? 'improving' : recentAvgLatency > olderAvgLatency ? 'degrading' : 'stable'
        };
    }

    /**
     * Generate insights
     */
    generateInsights(dashboard, improvementStats, performanceMetrics) {
        const insights = [];

        // Performance insights
        if (performanceMetrics.cache.hitRate < 50) {
            insights.push({
                type: 'performance',
                priority: 'medium',
                message: `Cache hit rate is ${performanceMetrics.cache.hitRate}. Consider optimizing cache key generation or increasing TTL.`,
                impact: 'medium'
            });
        }

        // Model insights
        if (dashboard.predictions.mlModelRate < 0.8) {
            insights.push({
                type: 'model',
                priority: 'high',
                message: `Only ${(dashboard.predictions.mlModelRate * 100).toFixed(1)}% of predictions use ML model. Check model availability.`,
                impact: 'high'
            });
        }

        // Error insights
        if (dashboard.predictions.errorRate > 0.05) {
            insights.push({
                type: 'error',
                priority: 'critical',
                message: `Error rate is ${(dashboard.predictions.errorRate * 100).toFixed(1)}%. Consider model retraining.`,
                impact: 'critical'
            });
        }

        // Improvement insights
        if (improvementStats.totalImprovements === 0 && dashboard.predictions.total > 1000) {
            insights.push({
                type: 'improvement',
                priority: 'low',
                message: 'No model improvements recorded. Consider collecting more feedback data.',
                impact: 'low'
            });
        }

        return insights;
    }

    /**
     * Get analytics dashboard
     */
    async getDashboard() {
        const report = await this.generateReport();
        
        return {
            ...report,
            summary: {
                health: report.systemHealth.status,
                predictions: report.predictions.total,
                errorRate: `${(report.predictions.errorRate * 100).toFixed(2)}%`,
                avgLatency: `${report.predictions.avgLatency.toFixed(0)}ms`,
                cacheHitRate: report.performance.cache.hitRate,
                improvements: report.modelImprovement.totalImprovements
            }
        };
    }
}

// Singleton instance
let advancedAnalyticsInstance = null;

function getAdvancedAnalytics() {
    if (!advancedAnalyticsInstance) {
        advancedAnalyticsInstance = new AdvancedAnalytics();
    }
    return advancedAnalyticsInstance;
}

module.exports = {
    AdvancedAnalytics,
    getAdvancedAnalytics
};

