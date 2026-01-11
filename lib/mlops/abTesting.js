/**
 * A/B Testing Framework for ML Models
 * Compare model performance in production
 * 
 * Month 1: Week 3 - Production Testing
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
const log = createLogger('ABTesting');

class ABTestingFramework {
    constructor() {
        this.experiments = new Map();
        this.activeExperiments = new Map();
    }

    /**
     * Create a new A/B test experiment
     */
    async createExperiment(name, variants) {
        const experiment = {
            name,
            variants: variants.map(v => ({
                ...v,
                id: v.id || `variant-${variants.indexOf(v)}`,
                traffic: v.traffic || 0.5, // Default 50% traffic
                metrics: {
                    predictions: 0,
                    correct: 0,
                    totalError: 0,
                    avgLatency: 0,
                    errors: 0
                }
            })),
            startTime: new Date(),
            status: 'active',
            results: null
        };

        this.experiments.set(name, experiment);
        this.activeExperiments.set(name, experiment);

        log.info(`Created A/B test: ${name} with ${variants.length} variants`);
        return experiment;
    }

    /**
     * Get variant for a user/request (traffic splitting)
     */
    getVariant(experimentName, userId = null) {
        const experiment = this.activeExperiments.get(experimentName);
        if (!experiment) {
            log.warn(`Experiment ${experimentName} not found`);
            return null;
        }

        // Simple hash-based assignment for consistent user assignment
        let hash = 0;
        if (userId) {
            for (let i = 0; i < userId.length; i++) {
                hash = ((hash << 5) - hash) + userId.charCodeAt(i);
                hash = hash & hash; // Convert to 32-bit integer
            }
        } else {
            hash = Math.random() * 1000000;
        }

        const random = Math.abs(hash) % 100 / 100;
        let cumulative = 0;

        for (const variant of experiment.variants) {
            cumulative += variant.traffic;
            if (random <= cumulative) {
                return variant;
            }
        }

        // Fallback to last variant
        return experiment.variants[experiment.variants.length - 1];
    }

    /**
     * Record prediction result
     */
    async recordResult(experimentName, variantId, result) {
        const experiment = this.activeExperiments.get(experimentName);
        if (!experiment) return;

        const variant = experiment.variants.find(v => v.id === variantId);
        if (!variant) return;

        const { prediction, actual, latency, error } = result;

        variant.metrics.predictions++;
        variant.metrics.totalError += Math.abs(prediction - actual);
        
        if (Math.abs(prediction - actual) <= 5) {
            variant.metrics.correct++;
        }

        // Update average latency (exponential moving average)
        if (latency) {
            variant.metrics.avgLatency = 
                variant.metrics.avgLatency * 0.9 + latency * 0.1;
        }

        if (error) {
            variant.metrics.errors++;
        }

        // Log to MLflow
        const mlflow = getMLflowService();
        if (mlflow) {
            await mlflow.logMetric(`ab_test_${experimentName}_${variantId}_error`, Math.abs(prediction - actual));
            await mlflow.logMetric(`ab_test_${experimentName}_${variantId}_latency`, latency || 0);
        }
    }

    /**
     * Get experiment results
     */
    getResults(experimentName) {
        const experiment = this.experiments.get(experimentName);
        if (!experiment) return null;

        const results = experiment.variants.map(variant => {
            const accuracy = variant.metrics.predictions > 0
                ? variant.metrics.correct / variant.metrics.predictions
                : 0;
            const mae = variant.metrics.predictions > 0
                ? variant.metrics.totalError / variant.metrics.predictions
                : 0;

            return {
                id: variant.id,
                name: variant.name,
                traffic: variant.traffic,
                metrics: {
                    ...variant.metrics,
                    accuracy,
                    mae,
                    errorRate: variant.metrics.predictions > 0
                        ? variant.metrics.errors / variant.metrics.predictions
                        : 0
                }
            };
        });

        // Determine winner
        const winner = results.reduce((best, current) => {
            if (current.metrics.predictions < 10) return best; // Need minimum samples
            if (!best) return current;
            
            // Compare by accuracy, then MAE, then latency
            if (current.metrics.accuracy > best.metrics.accuracy) return current;
            if (current.metrics.accuracy === best.metrics.accuracy) {
                if (current.metrics.mae < best.metrics.mae) return current;
                if (current.metrics.mae === best.metrics.mae) {
                    if (current.metrics.avgLatency < best.metrics.avgLatency) return current;
                }
            }
            return best;
        }, null);

        return {
            experiment: experiment.name,
            status: experiment.status,
            startTime: experiment.startTime,
            results,
            winner: winner ? winner.id : null,
            totalPredictions: results.reduce((sum, r) => sum + r.metrics.predictions, 0)
        };
    }

    /**
     * End experiment and determine winner
     */
    async endExperiment(experimentName) {
        const experiment = this.activeExperiments.get(experimentName);
        if (!experiment) return null;

        experiment.status = 'completed';
        experiment.endTime = new Date();
        const results = this.getResults(experimentName);
        experiment.results = results;

        this.activeExperiments.delete(experimentName);

        log.info(`Experiment ${experimentName} completed. Winner: ${results.winner}`);

        // Log final results to MLflow
        const mlflow = getMLflowService();
        if (mlflow) {
            await mlflow.logParam(`ab_test_${experimentName}_winner`, results.winner || 'none');
            await mlflow.logParam(`ab_test_${experimentName}_total_predictions`, results.totalPredictions);
        }

        return results;
    }

    /**
     * Get all active experiments
     */
    getActiveExperiments() {
        return Array.from(this.activeExperiments.values());
    }

    /**
     * Get all experiments
     */
    getAllExperiments() {
        return Array.from(this.experiments.values());
    }
}

// Singleton instance
let abTestingInstance = null;

function getABTestingFramework() {
    if (!abTestingInstance) {
        abTestingInstance = new ABTestingFramework();
    }
    return abTestingInstance;
}

module.exports = {
    ABTestingFramework,
    getABTestingFramework
};

