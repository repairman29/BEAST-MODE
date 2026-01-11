/**
 * Feedback Loop Service
 * Collects feedback from all services and feeds back to ML system
 * 
 * Month 4: Week 2 - Feedback Loop
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
const { getDataCollection } = require('./dataCollection');
const { getDataStreaming } = require('./dataStreaming');
const { getModelImprovement } = require('./modelImprovement');
const { getProductionMonitoring } = require('./productionMonitoring');
const { getDatabaseWriter } = require('./databaseWriter');

// Optional real-time updates integration
let realTimeUpdates = null;
try {
    const { getRealTimeModelUpdates } = require('./realTimeModelUpdates');
    realTimeUpdates = getRealTimeModelUpdates();
} catch (error) {
    // Real-time updates not available
}

// Optional fine-tuning integration
let modelFineTuning = null;
try {
    const { getModelFineTuning } = require('./modelFineTuning');
    modelFineTuning = getModelFineTuning();
} catch (error) {
    // Fine-tuning not available
}

const log = createLogger('FeedbackLoop');

class FeedbackLoop {
    constructor() {
        this.feedbackQueue = [];
        this.processingInterval = null;
        this.batchSize = 100;
        this.processingIntervalMs = 60000; // Process every minute
        this.initialized = false;
    }

    /**
     * Initialize feedback loop
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Try to get data collection (may not be available)
            try {
                const { getDataCollectionService } = require('./dataCollection');
                this.dataCollection = getDataCollectionService();
            } catch (error) {
                this.dataCollection = null;
            }
            
            // Try to get data streaming (may not be available)
            try {
                this.dataStreaming = getDataStreaming();
            } catch (error) {
                this.dataStreaming = null;
            }
            this.modelImprovement = getModelImprovement();
            this.monitoring = getProductionMonitoring();
            
            await this.modelImprovement.initialize();
            
            // Initialize real-time updates if available
            if (realTimeUpdates) {
                await realTimeUpdates.initialize();
            }
            
            // Initialize fine-tuning if available
            if (modelFineTuning) {
                await modelFineTuning.initialize();
            }
            
            // Start processing interval
            this.startProcessing();
            
            this.initialized = true;
            log.info('✅ Feedback loop initialized');
        } catch (error) {
            log.warn('Feedback loop initialization failed:', error.message);
            this.initialized = true;
        }
    }

    /**
     * Start processing feedback
     */
    startProcessing() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }

        this.processingInterval = setInterval(() => {
            this.processFeedbackBatch();
        }, this.processingIntervalMs);
    }

    /**
     * Record feedback from service
     */
    async recordFeedback(serviceName, prediction, actual, context) {
        await this.initialize();

        const feedback = {
            service: serviceName,
            prediction: prediction.predictedQuality || prediction.quality || prediction,
            actual: actual,
            context: context,
            timestamp: new Date().toISOString()
        };

        // Add to queue
        this.feedbackQueue.push(feedback);

        // Stream to data streaming service
        if (this.dataStreaming) {
            try {
                await this.dataStreaming.streamEvent('feedback', feedback);
            } catch (error) {
                log.debug('Data streaming failed:', error.message);
            }
        }

        // If queue is large, process immediately
        if (this.feedbackQueue.length >= this.batchSize) {
            await this.processFeedbackBatch();
        }
    }

    /**
     * Process feedback batch
     */
    async processFeedbackBatch() {
        if (this.feedbackQueue.length === 0) {
            return;
        }

        const batch = this.feedbackQueue.splice(0, this.batchSize);
        log.debug(`[Feedback Loop] Processing ${batch.length} feedback items`);

        for (const feedback of batch) {
            try {
                // Send to data collection
                if (this.dataCollection) {
                    await this.dataCollection.collectQualityFeedback({
                        context: feedback.context,
                        predictedQuality: feedback.prediction,
                        actualQuality: feedback.actual,
                        error: Math.abs(feedback.prediction - feedback.actual)
                    });
                }

                // Send to model improvement
                if (this.modelImprovement) {
                    await this.modelImprovement.recordFeedback(
                        { predictedQuality: feedback.prediction },
                        feedback.actual,
                        feedback.context
                    );
                }

                // Send to real-time updates if available
                if (realTimeUpdates) {
                    await realTimeUpdates.addFeedback({
                        prediction: feedback.prediction,
                        actual: feedback.actual,
                        features: feedback.context.features || [],
                        context: feedback.context
                    });
                }

                // Record in monitoring
                if (this.monitoring) {
                    const error = Math.abs(feedback.prediction - feedback.actual);
                    if (error > 0.2) {
                        this.monitoring.recordError(
                            new Error(`Prediction error: ${error.toFixed(3)}`),
                            { service: feedback.service, context: feedback.context }
                        );
                    }
                }

                // Write to database
                if (this.databaseWriter) {
                    try {
                        await this.databaseWriter.writePrediction({
                            serviceName: feedback.service,
                            predictionType: 'quality',
                            predictedValue: feedback.prediction,
                            actualValue: feedback.actual,
                            confidence: feedback.context.confidence || null,
                            context: feedback.context,
                            modelVersion: feedback.context.modelVersion || null,
                            source: feedback.context.source || 'ml_model'
                        });
                    } catch (error) {
                        log.debug('Database write failed:', error.message);
                    }
                }
            } catch (error) {
                log.warn(`[Feedback Loop] Failed to process feedback:`, error.message);
            }
        }

        log.info(`[Feedback Loop] Processed ${batch.length} feedback items`);

        // Check if fine-tuning should be triggered
        this.fineTuningTriggerCount += batch.length;
        await this.checkFineTuningTrigger();
    }

    /**
     * Check if fine-tuning should be triggered
     */
    async checkFineTuningTrigger() {
        if (!modelFineTuning) {
            return;
        }

        const now = Date.now();
        const shouldTriggerByCount = this.fineTuningTriggerCount >= this.fineTuningThreshold;
        const shouldTriggerByTime = !this.lastFineTuningTime || 
            (now - this.lastFineTuningTime) >= this.fineTuningInterval;

        if (shouldTriggerByCount || shouldTriggerByTime) {
            try {
                log.info(`[Feedback Loop] Triggering fine-tuning (count: ${this.fineTuningTriggerCount}, time: ${shouldTriggerByTime})`);
                
                // Get recent feedback data for fine-tuning
                const { getDataIntegration } = require('./dataIntegration');
                const dataIntegration = getDataIntegration();
                await dataIntegration.initialize();

                // Collect recent data (last 7 days or last 1000 samples)
                const newData = await dataIntegration.collectQualityData({
                    days: 7,
                    limit: 1000
                });

                if (newData && newData.length >= 100) {
                    // Prepare data for fine-tuning
                    const { getEnhancedFeatureEngineering } = require('../features/enhancedFeatureEngineering');
                    const featureEngine = getEnhancedFeatureEngineering();

                    const preparedData = newData.map(sample => {
                        const features = featureEngine.extractFeatures(sample);
                        return {
                            features,
                            quality: sample.quality_score || sample.quality || 0
                        };
                    });

                    // Fine-tune the current model
                    const currentModelPath = 'quality-predictor-v3-advanced.json';
                    const result = await modelFineTuning.fineTuneModel(
                        currentModelPath,
                        preparedData,
                        {
                            learningRate: 0.001,
                            epochs: 10,
                            batchSize: 32
                        }
                    );

                    if (result.success) {
                        log.info(`[Feedback Loop] Fine-tuning successful: ${result.version}`);
                        this.lastFineTuningTime = now;
                        this.fineTuningTriggerCount = 0;
                    } else {
                        log.warn(`[Feedback Loop] Fine-tuning failed: ${result.error}`);
                    }
                } else {
                    log.debug(`[Feedback Loop] Insufficient data for fine-tuning: ${newData?.length || 0} samples`);
                }
            } catch (error) {
                log.error('[Feedback Loop] Fine-tuning trigger failed:', error.message);
            }
        }
    }

    /**
     * Get feedback statistics
     */
    getFeedbackStats() {
        return {
            queueSize: this.feedbackQueue.length,
            totalProcessed: this.getTotalProcessed(),
            services: this.getServiceStats()
        };
    }

    /**
     * Get total processed (would track this in real implementation)
     */
    getTotalProcessed() {
        // In real implementation, would track this
        return 0;
    }

    /**
     * Get service statistics
     */
    getServiceStats() {
        const serviceCounts = {};
        for (const feedback of this.feedbackQueue) {
            serviceCounts[feedback.service] = (serviceCounts[feedback.service] || 0) + 1;
        }
        return serviceCounts;
    }

    /**
     * Stop processing
     */
    stop() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
    }
}

// Singleton instance
let feedbackLoopInstance = null;

function getFeedbackLoop() {
    if (!feedbackLoopInstance) {
        feedbackLoopInstance = new FeedbackLoop();
    }
    return feedbackLoopInstance;
}

module.exports = {
    FeedbackLoop,
    getFeedbackLoop
};

