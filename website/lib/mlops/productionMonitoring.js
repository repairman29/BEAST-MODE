/**
 * Production Monitoring Service
 * Real-time monitoring for ML system in production
 * 
 * Month 3: Week 1 - Production Monitoring
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
const log = createLogger('ProductionMonitoring');

class ProductionMonitoring {
    constructor() {
        this.metrics = {
            predictions: {
                total: 0,
                mlModel: 0,
                heuristic: 0,
                errors: 0,
                avgLatency: 0,
                latencyHistory: []
            },
            models: {
                loaded: [],
                performance: {},
                health: {}
            },
            services: {
                integrations: {},
                status: {}
            },
            ensemble: {
                usage: 0,
                strategies: {},
                performance: {}
            },
            realTimeUpdates: {
                bufferSize: 0,
                updatesProcessed: 0,
                lastUpdateTime: null
            },
            fineTuning: {
                lastRun: null,
                runsCount: 0,
                status: 'idle',
                lastSuccess: null,
                lastVersion: null
            },
            alerts: []
        };
        
        this.startTime = Date.now();
        this.alertThresholds = {
            errorRate: 0.05, // 5% error rate
            latency: 500, // 500ms
            modelDrift: 0.1, // 10% drift
            availability: 0.95 // 95% availability
        };
    }

    /**
     * Record a prediction
     */
    recordPrediction(prediction, metadata = {}) {
        const startTime = metadata.startTime || Date.now();
        const latency = Date.now() - startTime;
        
        this.metrics.predictions.total++;
        
        if (prediction.source === 'ml_model') {
            this.metrics.predictions.mlModel++;
        } else {
            this.metrics.predictions.heuristic++;
        }
        
        // Update latency history (keep last 100)
        this.metrics.predictions.latencyHistory.push(latency);
        if (this.metrics.predictions.latencyHistory.length > 100) {
            this.metrics.predictions.latencyHistory.shift();
        }
        
        // Calculate average latency
        const sum = this.metrics.predictions.latencyHistory.reduce((a, b) => a + b, 0);
        this.metrics.predictions.avgLatency = sum / this.metrics.predictions.latencyHistory.length;
        
        // Check for alerts
        this.checkAlerts();
        
        return {
            recorded: true,
            latency,
            totalPredictions: this.metrics.predictions.total
        };
    }

    /**
     * Record an error
     */
    recordError(error, context = {}) {
        this.metrics.predictions.errors++;
        
        const errorRecord = {
            timestamp: new Date().toISOString(),
            error: error.message || String(error),
            context,
            stack: error.stack
        };
        
        // Add to alerts if critical
        if (this.metrics.predictions.errors / this.metrics.predictions.total > this.alertThresholds.errorRate) {
            this.addAlert('high_error_rate', {
                errorRate: this.metrics.predictions.errors / this.metrics.predictions.total,
                threshold: this.alertThresholds.errorRate
            });
        }
        
        return errorRecord;
    }

    /**
     * Record model performance
     */
    recordModelPerformance(modelId, performance) {
        if (!this.metrics.models.performance[modelId]) {
            this.metrics.models.performance[modelId] = {
                predictions: 0,
                avgAccuracy: 0,
                accuracyHistory: []
            };
        }
        
        const modelMetrics = this.metrics.models.performance[modelId];
        modelMetrics.predictions++;
        
        if (performance.accuracy !== undefined) {
            modelMetrics.accuracyHistory.push(performance.accuracy);
            if (modelMetrics.accuracyHistory.length > 100) {
                modelMetrics.accuracyHistory.shift();
            }
            
            const sum = modelMetrics.accuracyHistory.reduce((a, b) => a + b, 0);
            modelMetrics.avgAccuracy = sum / modelMetrics.accuracyHistory.length;
        }
    }

    /**
     * Record service integration status
     */
    recordServiceStatus(serviceName, status) {
        this.metrics.services.integrations[serviceName] = {
            status,
            lastChecked: new Date().toISOString(),
            available: status === 'available'
        };
    }

    /**
     * Check for alerts
     */
    checkAlerts() {
        const total = this.metrics.predictions.total;
        if (total === 0) return;
        
        // Check error rate
        const errorRate = this.metrics.predictions.errors / total;
        if (errorRate > this.alertThresholds.errorRate) {
            this.addAlert('high_error_rate', {
                errorRate,
                threshold: this.alertThresholds.errorRate,
                errors: this.metrics.predictions.errors,
                total
            });
        }
        
        // Check latency
        if (this.metrics.predictions.avgLatency > this.alertThresholds.latency) {
            this.addAlert('high_latency', {
                avgLatency: this.metrics.predictions.avgLatency,
                threshold: this.alertThresholds.latency
            });
        }
        
        // Check availability
        const mlModelRate = this.metrics.predictions.mlModel / total;
        if (mlModelRate < this.alertThresholds.availability) {
            this.addAlert('low_ml_availability', {
                mlModelRate,
                threshold: this.alertThresholds.availability
            });
        }
    }

    /**
     * Add alert
     */
    addAlert(type, data) {
        const alert = {
            type,
            severity: this.getAlertSeverity(type),
            timestamp: new Date().toISOString(),
            data
        };
        
        // Check if alert already exists (avoid duplicates)
        const existingAlert = this.metrics.alerts.find(
            a => a.type === type && 
            Date.now() - new Date(a.timestamp).getTime() < 60000 // Within last minute
        );
        
        if (!existingAlert) {
            this.metrics.alerts.push(alert);
            log.warn(`[Alert] ${type}:`, data);
            
            // Keep only last 100 alerts
            if (this.metrics.alerts.length > 100) {
                this.metrics.alerts.shift();
            }
        }
        
        return alert;
    }

    /**
     * Get alert severity
     */
    getAlertSeverity(type) {
        const severityMap = {
            'high_error_rate': 'critical',
            'high_latency': 'warning',
            'low_ml_availability': 'warning',
            'model_drift': 'critical',
            'service_down': 'critical'
        };
        
        return severityMap[type] || 'info';
    }

    /**
     * Record ensemble usage
     */
    recordEnsembleUsage(strategy, performance = {}) {
        this.metrics.ensemble.usage++;
        this.metrics.ensemble.strategies[strategy] = 
            (this.metrics.ensemble.strategies[strategy] || 0) + 1;
        
        if (performance.error !== undefined) {
            if (!this.metrics.ensemble.performance[strategy]) {
                this.metrics.ensemble.performance[strategy] = {
                    errors: [],
                    avgError: 0
                };
            }
            this.metrics.ensemble.performance[strategy].errors.push(performance.error);
            const errors = this.metrics.ensemble.performance[strategy].errors;
            if (errors.length > 100) errors.shift();
            this.metrics.ensemble.performance[strategy].avgError = 
                errors.reduce((a, b) => a + b, 0) / errors.length;
        }
    }

    /**
     * Record real-time update
     */
    recordRealTimeUpdate(bufferSize, processed) {
        this.metrics.realTimeUpdates.bufferSize = bufferSize;
        this.metrics.realTimeUpdates.updatesProcessed += processed;
        this.metrics.realTimeUpdates.lastUpdateTime = Date.now();
    }

    /**
     * Record fine-tuning run
     */
    recordFineTuningRun(status, result = null) {
        this.metrics.fineTuning.lastRun = Date.now();
        this.metrics.fineTuning.runsCount++;
        this.metrics.fineTuning.status = status;
        
        if (result && result.success) {
            this.metrics.fineTuning.lastSuccess = Date.now();
            this.metrics.fineTuning.lastVersion = result.version;
        }
    }

    /**
     * Record explainability usage
     */
    recordExplainabilityUsage(explanationType, latency) {
        if (!this.metrics.explainability) {
            this.metrics.explainability = {
                totalRequests: 0,
                avgLatency: 0,
                byType: {}
            };
        }

        this.metrics.explainability.totalRequests++;
        this.metrics.explainability.avgLatency = 
            (this.metrics.explainability.avgLatency * (this.metrics.explainability.totalRequests - 1) + latency) /
            this.metrics.explainability.totalRequests;

        if (!this.metrics.explainability.byType[explanationType]) {
            this.metrics.explainability.byType[explanationType] = 0;
        }
        this.metrics.explainability.byType[explanationType]++;
    }

    /**
     * Record model comparison
     */
    recordModelComparison(comparisonType, latency) {
        if (!this.metrics.comparisons) {
            this.metrics.comparisons = {
                totalComparisons: 0,
                avgLatency: 0,
                byType: {}
            };
        }

        this.metrics.comparisons.totalComparisons++;
        this.metrics.comparisons.avgLatency = 
            (this.metrics.comparisons.avgLatency * (this.metrics.comparisons.totalComparisons - 1) + latency) /
            this.metrics.comparisons.totalComparisons;

        if (!this.metrics.comparisons.byType[comparisonType]) {
            this.metrics.comparisons.byType[comparisonType] = 0;
        }
        this.metrics.comparisons.byType[comparisonType]++;
    }

    /**
     * Get monitoring dashboard data
     */
    getDashboard() {
        const uptime = Date.now() - this.startTime;
        const total = this.metrics.predictions.total;
        
        return {
            uptime: {
                seconds: Math.floor(uptime / 1000),
                formatted: this.formatUptime(uptime)
            },
            predictions: {
                total,
                mlModel: this.metrics.predictions.mlModel,
                heuristic: this.metrics.predictions.heuristic,
                mlModelRate: total > 0 ? this.metrics.predictions.mlModel / total : 0,
                errors: this.metrics.predictions.errors,
                errorRate: total > 0 ? this.metrics.predictions.errors / total : 0,
                avgLatency: this.metrics.predictions.avgLatency
            },
            models: {
                loaded: this.metrics.models.loaded.length,
                performance: this.metrics.models.performance
            },
            services: {
                integrations: this.metrics.services.integrations,
                total: Object.keys(this.metrics.services.integrations).length,
                available: Object.values(this.metrics.services.integrations)
                    .filter(s => s.available).length
            },
            ensemble: {
                usage: this.metrics.ensemble.usage,
                strategies: this.metrics.ensemble.strategies,
                performance: this.metrics.ensemble.performance
            },
            realTimeUpdates: {
                bufferSize: this.metrics.realTimeUpdates.bufferSize,
                updatesProcessed: this.metrics.realTimeUpdates.updatesProcessed,
                lastUpdateTime: this.metrics.realTimeUpdates.lastUpdateTime
            },
            fineTuning: {
                lastRun: this.metrics.fineTuning.lastRun,
                runsCount: this.metrics.fineTuning.runsCount,
                status: this.metrics.fineTuning.status,
                lastSuccess: this.metrics.fineTuning.lastSuccess,
                lastVersion: this.metrics.fineTuning.lastVersion
            },
            alerts: {
                total: this.metrics.alerts.length,
                critical: this.metrics.alerts.filter(a => a.severity === 'critical').length,
                warning: this.metrics.alerts.filter(a => a.severity === 'warning').length,
                recent: this.metrics.alerts.slice(-10)
            },
            health: {
                status: this.getHealthStatus(),
                score: this.calculateHealthScore()
            }
        };
    }

    /**
     * Get health status
     */
    getHealthStatus() {
        const total = this.metrics.predictions.total;
        if (total === 0) return 'unknown';
        
        const errorRate = this.metrics.predictions.errors / total;
        const criticalAlerts = this.metrics.alerts.filter(a => a.severity === 'critical').length;
        
        if (criticalAlerts > 0 || errorRate > 0.1) {
            return 'unhealthy';
        }
        
        if (errorRate > 0.05 || this.metrics.predictions.avgLatency > 500) {
            return 'degraded';
        }
        
        return 'healthy';
    }

    /**
     * Calculate health score (0-100)
     */
    calculateHealthScore() {
        const total = this.metrics.predictions.total;
        if (total === 0) return 50; // Unknown
        
        let score = 100;
        
        // Deduct for errors
        const errorRate = this.metrics.predictions.errors / total;
        score -= errorRate * 100 * 2; // Double penalty for errors
        
        // Deduct for latency
        if (this.metrics.predictions.avgLatency > 100) {
            score -= (this.metrics.predictions.avgLatency - 100) / 10;
        }
        
        // Deduct for alerts
        const criticalAlerts = this.metrics.alerts.filter(a => a.severity === 'critical').length;
        score -= criticalAlerts * 10;
        
        const warningAlerts = this.metrics.alerts.filter(a => a.severity === 'warning').length;
        score -= warningAlerts * 5;
        
        // Bonus for ML model usage
        const mlModelRate = this.metrics.predictions.mlModel / total;
        if (mlModelRate > 0.8) {
            score += 5; // Bonus for high ML usage
        }
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Format uptime
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Get metrics summary
     */
    getSummary() {
        return {
            uptime: this.formatUptime(Date.now() - this.startTime),
            predictions: {
                total: this.metrics.predictions.total,
                mlModel: this.metrics.predictions.mlModel,
                heuristic: this.metrics.predictions.heuristic,
                errors: this.metrics.predictions.errors
            },
            performance: {
                avgLatency: this.metrics.predictions.avgLatency.toFixed(2) + 'ms',
                errorRate: this.metrics.predictions.total > 0 
                    ? ((this.metrics.predictions.errors / this.metrics.predictions.total) * 100).toFixed(2) + '%'
                    : '0%'
            },
            health: {
                status: this.getHealthStatus(),
                score: this.calculateHealthScore().toFixed(1)
            },
            alerts: {
                total: this.metrics.alerts.length,
                critical: this.metrics.alerts.filter(a => a.severity === 'critical').length
            }
        };
    }

    /**
     * Reset metrics (for testing)
     */
    reset() {
        this.metrics = {
            predictions: {
                total: 0,
                mlModel: 0,
                heuristic: 0,
                errors: 0,
                avgLatency: 0,
                latencyHistory: []
            },
            models: {
                loaded: [],
                performance: {},
                health: {}
            },
            services: {
                integrations: {},
                status: {}
            },
            alerts: []
        };
        this.startTime = Date.now();
    }
}

// Singleton instance
let productionMonitoringInstance = null;

function getProductionMonitoring() {
    if (!productionMonitoringInstance) {
        productionMonitoringInstance = new ProductionMonitoring();
    }
    return productionMonitoringInstance;
}

module.exports = {
    ProductionMonitoring,
    getProductionMonitoring
};

