/**
 * ML Monitoring Dashboard
 * Real-time monitoring of ML model performance
 * 
 * Month 1: Week 2 - Monitoring
 */

const { createLogger } = require('../utils/logger');
const { getMLModelIntegration } = require('./mlModelIntegration');
const { getDataCollectionService } = require('./dataCollection');
const { getMLflowService } = require('./mlflowService');
const log = createLogger('MonitoringDashboard');

class MonitoringDashboard {
    constructor() {
        this.metrics = {
            predictions: [],
            accuracy: [],
            latency: [],
            errors: []
        };
        this.windowSize = 100; // Keep last 100 predictions
        this.initialized = false;
    }

    /**
     * Initialize monitoring
     */
    async initialize() {
        if (this.initialized) return;

        this.initialized = true;
        log.info('Monitoring dashboard initialized');
    }

    /**
     * Record a prediction
     */
    recordPrediction(prediction, actual = null, metadata = {}) {
        const record = {
            timestamp: new Date().toISOString(),
            prediction: prediction,
            actual: actual,
            error: actual !== null ? Math.abs(prediction - actual) : null,
            metadata: metadata
        };

        this.metrics.predictions.push(record);
        
        // Keep only last windowSize predictions
        if (this.metrics.predictions.length > this.windowSize) {
            this.metrics.predictions.shift();
        }

        // Update accuracy if actual is available
        if (actual !== null) {
            const accuracy = this.calculateAccuracy(prediction, actual);
            this.metrics.accuracy.push({
                timestamp: record.timestamp,
                accuracy: accuracy
            });

            if (this.metrics.accuracy.length > this.windowSize) {
                this.metrics.accuracy.shift();
            }
        }

        return record;
    }

    /**
     * Calculate accuracy (within 5 points)
     */
    calculateAccuracy(prediction, actual) {
        const error = Math.abs(prediction - actual);
        return error <= 5 ? 1 : 0;
    }

    /**
     * Record latency
     */
    recordLatency(latencyMs, operation = 'prediction') {
        this.metrics.latency.push({
            timestamp: new Date().toISOString(),
            latency: latencyMs,
            operation: operation
        });

        if (this.metrics.latency.length > this.windowSize) {
            this.metrics.latency.shift();
        }
    }

    /**
     * Record error
     */
    recordError(error, context = {}) {
        this.metrics.errors.push({
            timestamp: new Date().toISOString(),
            error: error.message || String(error),
            stack: error.stack,
            context: context
        });

        if (this.metrics.errors.length > this.windowSize) {
            this.metrics.errors.shift();
        }
    }

    /**
     * Get dashboard data
     */
    async getDashboardData() {
        const mlIntegration = await getMLModelIntegration();
        const dataCollection = await getDataCollectionService();
        const mlflow = getMLflowService();

        const modelInfo = mlIntegration.getModelInfo();
        const dataStats = dataCollection.getDataStatistics();

        // Calculate current metrics
        const recentPredictions = this.metrics.predictions.slice(-50);
        const predictionsWithActual = recentPredictions.filter(p => p.actual !== null);
        
        const avgAccuracy = predictionsWithActual.length > 0
            ? predictionsWithActual.reduce((sum, p) => sum + (p.error <= 5 ? 1 : 0), 0) / predictionsWithActual.length
            : null;

        const avgError = predictionsWithActual.length > 0
            ? predictionsWithActual.reduce((sum, p) => sum + p.error, 0) / predictionsWithActual.length
            : null;

        const avgLatency = this.metrics.latency.length > 0
            ? this.metrics.latency.reduce((sum, l) => sum + l.latency, 0) / this.metrics.latency.length
            : null;

        return {
            model: {
                available: modelInfo.available,
                version: modelInfo.version || '1.0',
                path: modelInfo.modelPath
            },
            data: {
                qualitySamples: dataStats.quality.count,
                fixSamples: dataStats.fixes.count,
                csatSamples: dataStats.csat.count,
                modelPerformanceSamples: dataStats.modelPerformance.count
            },
            performance: {
                accuracy: avgAccuracy ? (avgAccuracy * 100).toFixed(1) + '%' : 'N/A',
                avgError: avgError ? avgError.toFixed(2) : 'N/A',
                avgLatency: avgLatency ? avgLatency.toFixed(0) + 'ms' : 'N/A',
                totalPredictions: this.metrics.predictions.length,
                predictionsWithActual: predictionsWithActual.length
            },
            errors: {
                count: this.metrics.errors.length,
                recent: this.metrics.errors.slice(-5)
            },
            mlflow: {
                connected: !mlflow.useLocalTracking,
                url: mlflow.mlflowUrl
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get performance trends
     */
    getPerformanceTrends() {
        const accuracyTrend = this.metrics.accuracy.slice(-20);
        
        if (accuracyTrend.length < 2) {
            return { trend: 'insufficient_data' };
        }

        const recent = accuracyTrend.slice(-10);
        const previous = accuracyTrend.slice(-20, -10);

        const recentAvg = recent.reduce((sum, a) => sum + a.accuracy, 0) / recent.length;
        const previousAvg = previous.reduce((sum, a) => sum + a.accuracy, 0) / previous.length;

        const change = recentAvg - previousAvg;
        const percentChange = previousAvg > 0 ? (change / previousAvg) * 100 : 0;

        return {
            trend: change > 0.05 ? 'improving' : change < -0.05 ? 'declining' : 'stable',
            change: percentChange.toFixed(1) + '%',
            recentAvg: (recentAvg * 100).toFixed(1) + '%',
            previousAvg: (previousAvg * 100).toFixed(1) + '%'
        };
    }

    /**
     * Get health status
     */
    getHealthStatus() {
        const issues = [];

        // Check model availability
        if (this.metrics.predictions.length === 0) {
            issues.push('No predictions recorded');
        }

        // Check error rate
        const errorRate = this.metrics.errors.length / Math.max(this.metrics.predictions.length, 1);
        if (errorRate > 0.1) {
            issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
        }

        // Check latency
        if (this.metrics.latency.length > 0) {
            const avgLatency = this.metrics.latency.reduce((sum, l) => sum + l.latency, 0) / this.metrics.latency.length;
            if (avgLatency > 1000) {
                issues.push(`High latency: ${avgLatency.toFixed(0)}ms`);
            }
        }

        return {
            status: issues.length === 0 ? 'healthy' : 'warning',
            issues: issues
        };
    }

    /**
     * Export metrics
     */
    exportMetrics() {
        return {
            predictions: this.metrics.predictions,
            accuracy: this.metrics.accuracy,
            latency: this.metrics.latency,
            errors: this.metrics.errors,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Clear metrics
     */
    clearMetrics() {
        this.metrics = {
            predictions: [],
            accuracy: [],
            latency: [],
            errors: []
        };
        log.info('Metrics cleared');
    }
}

// Singleton instance
let monitoringDashboardInstance = null;

function getMonitoringDashboard() {
    if (!monitoringDashboardInstance) {
        monitoringDashboardInstance = new MonitoringDashboard();
        monitoringDashboardInstance.initialize();
    }
    return monitoringDashboardInstance;
}

module.exports = {
    MonitoringDashboard,
    getMonitoringDashboard
};

