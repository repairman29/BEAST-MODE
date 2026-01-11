/**
 * Batch Prediction Processor
 * Processes multiple predictions efficiently
 * 
 * Month 2: Performance Optimization
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
const { getMLModelIntegration } = require('./mlModelIntegration');
const { getPredictionCache } = require('./predictionCache');
const { getEnsemblePredictor } = require('./ensemblePredictor');
const log = createLogger('BatchPredictor');

class BatchPredictor {
    constructor() {
        this.batchSize = 10;
        this.maxConcurrency = 5;
    }

    /**
     * Predict for multiple contexts
     */
    async predictBatch(contexts, options = {}) {
        const {
            useCache = true,
            useEnsemble = false,
            strategy = 'weighted'
        } = options;

        log.info(`Processing batch of ${contexts.length} predictions`);

        const results = [];
        const cache = useCache ? getPredictionCache() : null;
        const ensemble = useEnsemble ? await getEnsemblePredictor() : null;
        const mlIntegration = await getMLModelIntegration();

        // Process in batches
        for (let i = 0; i < contexts.length; i += this.batchSize) {
            const batch = contexts.slice(i, i + this.batchSize);
            const batchResults = await Promise.all(
                batch.map(async (context) => {
                    try {
                        // Check cache first
                        if (cache) {
                            const cached = cache.get(context);
                            if (cached !== null) {
                                return {
                                    context,
                                    prediction: cached,
                                    cached: true
                                };
                            }
                        }

                        // Get prediction
                        let prediction;
                        if (useEnsemble && ensemble) {
                            const features = mlIntegration.extractFeaturesFromContext(context);
                            const ensembleResult = await ensemble.predict(features, strategy);
                            prediction = {
                                predictedQuality: ensembleResult.prediction / 100,
                                confidence: ensembleResult.confidence,
                                source: 'ensemble',
                                modelCount: ensembleResult.modelCount
                            };
                        } else {
                            prediction = mlIntegration.predictQualitySync(context);
                        }

                        // Cache result
                        if (cache && prediction) {
                            cache.set(context, prediction);
                        }

                        return {
                            context,
                            prediction,
                            cached: false
                        };
                    } catch (error) {
                        log.warn(`Prediction failed for context:`, error.message);
                        return {
                            context,
                            prediction: null,
                            error: error.message
                        };
                    }
                })
            );

            results.push(...batchResults);
        }

        const stats = this.calculateStats(results);
        log.info(`Batch complete: ${stats.success}/${results.length} successful, ${stats.cached} cached`);

        return {
            results,
            stats
        };
    }

    /**
     * Calculate batch statistics
     */
    calculateStats(results) {
        const stats = {
            total: results.length,
            success: 0,
            failed: 0,
            cached: 0,
            avgConfidence: 0,
            avgQuality: 0
        };

        let confidenceSum = 0;
        let qualitySum = 0;

        for (const result of results) {
            if (result.error) {
                stats.failed++;
            } else if (result.prediction) {
                stats.success++;
                if (result.cached) {
                    stats.cached++;
                }
                if (result.prediction.predictedQuality !== undefined) {
                    qualitySum += result.prediction.predictedQuality;
                }
                if (result.prediction.confidence !== undefined) {
                    confidenceSum += result.prediction.confidence;
                }
            }
        }

        if (stats.success > 0) {
            stats.avgQuality = qualitySum / stats.success;
            stats.avgConfidence = confidenceSum / stats.success;
        }

        return stats;
    }

    /**
     * Configure batch processing
     */
    configure(options) {
        if (options.batchSize !== undefined) {
            this.batchSize = options.batchSize;
        }
        if (options.maxConcurrency !== undefined) {
            this.maxConcurrency = options.maxConcurrency;
        }
    }
}

// Singleton instance
let batchPredictorInstance = null;

function getBatchPredictor() {
    if (!batchPredictorInstance) {
        batchPredictorInstance = new BatchPredictor();
    }
    return batchPredictorInstance;
}

module.exports = {
    BatchPredictor,
    getBatchPredictor
};

