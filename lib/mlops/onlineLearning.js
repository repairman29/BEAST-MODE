/**
 * Online Learning
 * Incremental model updates from new data
 * 
 * Month 2: Week 2 - Online Learning
 */

const { createLogger } = require('../utils/logger');
const { getMLModelIntegration } = require('./mlModelIntegration');
const { getModelMonitoring } = require('./modelMonitoring');
const { getDataCollectionService } = require('./dataCollection');
const log = createLogger('OnlineLearning');

class OnlineLearning {
    constructor() {
        this.updateBuffer = [];
        this.bufferSize = 100; // Update model after 100 new samples
        this.learningRate = 0.01; // Small learning rate for incremental updates
        this.enabled = true;
        this.lastUpdate = null;
    }

    /**
     * Record new sample for online learning
     */
    async recordSample(features, actual, prediction = null) {
        if (!this.enabled) {
            return;
        }

        const sample = {
            features,
            actual,
            prediction,
            timestamp: new Date().toISOString()
        };

        this.updateBuffer.push(sample);

        // Check if buffer is full
        if (this.updateBuffer.length >= this.bufferSize) {
            await this.updateModel();
        }

        // Also check time-based update (every 24 hours)
        const now = Date.now();
        if (!this.lastUpdate || (now - this.lastUpdate) > 24 * 60 * 60 * 1000) {
            if (this.updateBuffer.length > 0) {
                await this.updateModel();
            }
        }
    }

    /**
     * Update model incrementally
     */
    async updateModel() {
        if (this.updateBuffer.length === 0) {
            return;
        }

        log.info(`🔄 Updating model with ${this.updateBuffer.length} new samples`);

        try {
            const mlIntegration = await getMLModelIntegration();
            const model = mlIntegration.qualityPredictor;

            if (!model || !model.trained) {
                log.warn('Model not available for online learning');
                this.updateBuffer = [];
                return;
            }

            // For gradient boosting models, we can't easily do incremental updates
            // Instead, we'll retrain periodically with accumulated data
            // This is a simplified version - in production, you'd use proper online learning algorithms

            // Calculate average error from buffer
            let totalError = 0;
            let validSamples = 0;

            for (const sample of this.updateBuffer) {
                if (sample.prediction !== null && sample.actual !== null) {
                    const error = Math.abs(sample.prediction - sample.actual);
                    totalError += error;
                    validSamples++;
                }
            }

            if (validSamples > 0) {
                const avgError = totalError / validSamples;
                log.info(`Average error from new samples: ${avgError.toFixed(2)}`);

                // If error is high, trigger full retraining
                if (avgError > 5.0) {
                    log.warn(`High error detected (${avgError.toFixed(2)}), triggering retraining`);
                    await this.triggerRetraining();
                }
            }

            // Clear buffer
            this.updateBuffer = [];
            this.lastUpdate = Date.now();

            log.info('✅ Online learning update complete');

        } catch (error) {
            log.error('Failed to update model:', error.message);
        }
    }

    /**
     * Trigger full model retraining
     */
    async triggerRetraining() {
        try {
            const { AutoRetrainPipeline } = require('../../scripts/auto-retrain');
            const pipeline = new AutoRetrainPipeline();

            log.info('🔄 Triggering full model retraining...');
            await pipeline.retrain({ force: true, autoDeploy: false });

        } catch (error) {
            log.error('Failed to trigger retraining:', error.message);
        }
    }

    /**
     * Get learning statistics
     */
    getStats() {
        return {
            enabled: this.enabled,
            bufferSize: this.updateBuffer.length,
            maxBufferSize: this.bufferSize,
            lastUpdate: this.lastUpdate ? new Date(this.lastUpdate).toISOString() : null,
            samplesProcessed: this.updateBuffer.length
        };
    }

    /**
     * Enable/disable online learning
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        log.info(`Online learning ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Configure online learning
     */
    configure(options) {
        if (options.bufferSize !== undefined) {
            this.bufferSize = options.bufferSize;
        }
        if (options.learningRate !== undefined) {
            this.learningRate = options.learningRate;
        }
        if (options.enabled !== undefined) {
            this.enabled = options.enabled;
        }
    }

    /**
     * Process feedback for learning
     */
    async processFeedback(predictionId, actual, feedback = {}) {
        try {
            const monitoring = getModelMonitoring();
            
            // Record in monitoring
            await monitoring.recordPrediction(
                feedback.prediction || 0,
                actual,
                feedback.latency || 0,
                { predictionId, ...feedback }
            );

            // Record for online learning
            if (feedback.features) {
                await this.recordSample(
                    feedback.features,
                    actual,
                    feedback.prediction
                );
            }

        } catch (error) {
            log.error('Failed to process feedback:', error.message);
        }
    }
}

// Singleton instance
let onlineLearningInstance = null;

function getOnlineLearning() {
    if (!onlineLearningInstance) {
        onlineLearningInstance = new OnlineLearning();
    }
    return onlineLearningInstance;
}

module.exports = {
    OnlineLearning,
    getOnlineLearning
};

