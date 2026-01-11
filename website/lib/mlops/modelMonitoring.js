/**
 * Model Monitoring & Alerting
 * Tracks model performance, detects drift, and sends alerts
 * 
 * Month 1: Week 4 - Production Monitoring
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
const { getMLflowService } = require('./mlflowService');
const { getMonitoringDashboard } = require('./monitoringDashboard');

const log = createLogger('ModelMonitoring');

class ModelMonitoring {
    constructor() {
        this.metrics = {
            predictions: [],
            errors: [],
            latencies: [],
            accuracy: [],
            drift: []
        };
        this.alerts = [];
        this.thresholds = {
            accuracy: { min: 0.80, alert: 0.75 },
            latency: { max: 100, alert: 200 }, // milliseconds
            errorRate: { max: 0.01, alert: 0.05 }, // 1% max, 5% alert
            drift: { threshold: 0.1 } // 10% drift threshold
        };
    }

    /**
     * Record prediction for monitoring
     */
    async recordPrediction(prediction, actual, latency, metadata = {}) {
        const timestamp = new Date().toISOString();
        const error = Math.abs(prediction - actual);
        const isAccurate = error <= 5; // Within 5 points

        // Store metrics
        this.metrics.predictions.push({
            timestamp,
            prediction,
            actual,
            error,
            latency,
            isAccurate,
            ...metadata
        });

        this.metrics.errors.push(error);
        this.metrics.latencies.push(latency);

        // Update accuracy (sliding window of last 100 predictions)
        const recentPredictions = this.metrics.predictions.slice(-100);
        const recentAccuracy = recentPredictions.filter(p => p.isAccurate).length / recentPredictions.length;
        this.metrics.accuracy.push({
            timestamp,
            accuracy: recentAccuracy,
            sampleSize: recentPredictions.length
        });

        // Check for alerts
        await this.checkAlerts();

        // Log to MLflow
        const mlflow = getMLflowService();
        if (mlflow) {
            await mlflow.logMetric('prediction_error', error);
            await mlflow.logMetric('prediction_latency', latency);
            await mlflow.logMetric('prediction_accuracy', isAccurate ? 1 : 0);
        }

        // Keep only last 1000 predictions
        if (this.metrics.predictions.length > 1000) {
            this.metrics.predictions = this.metrics.predictions.slice(-1000);
            this.metrics.errors = this.metrics.errors.slice(-1000);
            this.metrics.latencies = this.metrics.latencies.slice(-1000);
        }
    }

    /**
     * Check for alerts
     */
    async checkAlerts() {
        const recent = this.getRecentMetrics(100);

        // Check accuracy
        if (recent.accuracy < this.thresholds.accuracy.alert) {
            await this.sendAlert('accuracy', {
                current: recent.accuracy,
                threshold: this.thresholds.accuracy.alert,
                severity: 'critical'
            });
        }

        // Check latency
        if (recent.avgLatency > this.thresholds.latency.alert) {
            await this.sendAlert('latency', {
                current: recent.avgLatency,
                threshold: this.thresholds.latency.alert,
                severity: 'warning'
            });
        }

        // Check error rate
        if (recent.errorRate > this.thresholds.errorRate.alert) {
            await this.sendAlert('error_rate', {
                current: recent.errorRate,
                threshold: this.thresholds.errorRate.alert,
                severity: 'critical'
            });
        }

        // Check for model drift
        const drift = await this.detectDrift();
        if (drift.detected && drift.magnitude > this.thresholds.drift.threshold) {
            await this.sendAlert('model_drift', {
                magnitude: drift.magnitude,
                threshold: this.thresholds.drift.threshold,
                severity: 'warning',
                details: drift.details
            });
        }
    }

    /**
     * Get recent metrics
     */
    getRecentMetrics(windowSize = 100) {
        const recent = this.metrics.predictions.slice(-windowSize);
        
        if (recent.length === 0) {
            return {
                accuracy: 1.0,
                avgError: 0,
                avgLatency: 0,
                errorRate: 0,
                sampleSize: 0
            };
        }

        const accurate = recent.filter(p => p.isAccurate).length;
        const errors = recent.map(p => p.error);
        const latencies = recent.map(p => p.latency);
        const failed = recent.filter(p => !p.prediction || p.prediction === null).length;

        return {
            accuracy: accurate / recent.length,
            avgError: errors.reduce((a, b) => a + b, 0) / errors.length,
            avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
            errorRate: failed / recent.length,
            sampleSize: recent.length
        };
    }

    /**
     * Detect model drift
     */
    async detectDrift() {
        // Compare recent predictions to baseline
        const baseline = this.getBaselineMetrics();
        const recent = this.getRecentMetrics(200);

        if (baseline.sampleSize < 50 || recent.sampleSize < 50) {
            return { detected: false, magnitude: 0 };
        }

        // Calculate drift magnitude
        const accuracyDrift = Math.abs(baseline.accuracy - recent.accuracy);
        const errorDrift = Math.abs(baseline.avgError - recent.avgError) / baseline.avgError;
        const overallDrift = (accuracyDrift + errorDrift) / 2;

        const magnitude = overallDrift;

        return {
            detected: magnitude > this.thresholds.drift.threshold,
            magnitude,
            details: {
                accuracyDrift,
                errorDrift,
                baselineAccuracy: baseline.accuracy,
                recentAccuracy: recent.accuracy
            }
        };
    }

    /**
     * Get baseline metrics (from first 200 predictions)
     */
    getBaselineMetrics() {
        const baseline = this.metrics.predictions.slice(0, 200);
        
        if (baseline.length === 0) {
            return {
                accuracy: 0.85, // Default baseline
                avgError: 2.8,
                sampleSize: 0
            };
        }

        const accurate = baseline.filter(p => p.isAccurate).length;
        const errors = baseline.map(p => p.error);

        return {
            accuracy: accurate / baseline.length,
            avgError: errors.reduce((a, b) => a + b, 0) / errors.length,
            sampleSize: baseline.length
        };
    }

    /**
     * Send alert
     */
    async sendAlert(type, details) {
        const alert = {
            type,
            timestamp: new Date().toISOString(),
            severity: details.severity || 'warning',
            details
        };

        // Check if we already sent this alert recently (avoid spam)
        const recentAlerts = this.alerts.filter(
            a => a.type === type && 
            new Date(a.timestamp) > new Date(Date.now() - 3600000) // Last hour
        );

        if (recentAlerts.length > 0) {
            return; // Already alerted recently
        }

        this.alerts.push(alert);

        log.warn(`🚨 Alert: ${type}`, details);

        // Log to MLflow
        const mlflow = getMLflowService();
        if (mlflow) {
            await mlflow.logMetric(`alert_${type}`, 1);
        }

        // Send to external alerting system
        try {
            const { getExternalAlerts } = require('./externalAlerts');
            const externalAlerts = getExternalAlerts();
            await externalAlerts.sendAlert(alert);
        } catch (error) {
            // External alerts not configured, that's okay
            log.debug('External alerts not configured:', error.message);
        }
    }

    /**
     * Get monitoring dashboard data
     */
    getDashboardData() {
        const recent = this.getRecentMetrics(100);
        const baseline = this.getBaselineMetrics();
        const drift = this.detectDrift();

        return {
            metrics: {
                accuracy: recent.accuracy,
                avgError: recent.avgError,
                avgLatency: recent.avgLatency,
                errorRate: recent.errorRate,
                sampleSize: recent.sampleSize
            },
            baseline: {
                accuracy: baseline.accuracy,
                avgError: baseline.avgError
            },
            drift: {
                detected: drift.detected,
                magnitude: drift.magnitude
            },
            alerts: this.alerts.slice(-10),
            thresholds: this.thresholds
        };
    }

    /**
     * Get health status
     */
    getHealthStatus() {
        const recent = this.getRecentMetrics(100);
        
        let status = 'healthy';
        const issues = [];

        if (recent.accuracy < this.thresholds.accuracy.min) {
            status = 'critical';
            issues.push(`Accuracy below threshold: ${(recent.accuracy * 100).toFixed(1)}%`);
        }

        if (recent.avgLatency > this.thresholds.latency.max) {
            status = status === 'healthy' ? 'warning' : status;
            issues.push(`Latency above threshold: ${recent.avgLatency.toFixed(0)}ms`);
        }

        if (recent.errorRate > this.thresholds.errorRate.max) {
            status = 'critical';
            issues.push(`Error rate above threshold: ${(recent.errorRate * 100).toFixed(1)}%`);
        }

        return {
            status,
            issues,
            metrics: recent
        };
    }

    /**
     * Clear old metrics
     */
    clearOldMetrics(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
        const cutoff = Date.now() - maxAge;
        
        this.metrics.predictions = this.metrics.predictions.filter(
            p => new Date(p.timestamp).getTime() > cutoff
        );
        
        this.metrics.errors = this.metrics.errors.slice(-1000);
        this.metrics.latencies = this.metrics.latencies.slice(-1000);
        this.metrics.accuracy = this.metrics.accuracy.filter(
            a => new Date(a.timestamp).getTime() > cutoff
        );

        // Clear old alerts (keep last 100)
        this.alerts = this.alerts.slice(-100);
    }
}

// Singleton instance
let modelMonitoringInstance = null;

function getModelMonitoring() {
    if (!modelMonitoringInstance) {
        modelMonitoringInstance = new ModelMonitoring();
    }
    return modelMonitoringInstance;
}

module.exports = {
    ModelMonitoring,
    getModelMonitoring
};

