/**
 * Model Improvement Service
 * Continuously improves models based on feedback and performance data
 * 
 * Month 4: Week 2 - Model Improvement
 */

const { createLogger } = require('../utils/logger');
const { getMLModelIntegration } = require('./mlModelIntegration');
const { getProductionMonitoring } = require('./productionMonitoring');
const { getDataCollection } = require('./dataCollection');
const log = createLogger('ModelImprovement');

class ModelImprovement {
    constructor() {
        this.improvementHistory = [];
        this.feedbackBuffer = [];
        this.retrainThreshold = 1000; // Retrain after 1000 new predictions
        this.performanceThreshold = 0.05; // Retrain if performance drops 5%
        this.initialized = false;
    }

    /**
     * Initialize improvement service
     */
    async initialize() {
        if (this.initialized) return;

        try {
            this.mlIntegration = await getMLModelIntegration();
            this.monitoring = getProductionMonitoring();
            
            // Try to get data collection (may not be available)
            try {
                const { getDataCollectionService } = require('./dataCollection');
                this.dataCollection = getDataCollectionService();
            } catch (error) {
                this.dataCollection = null;
            }
            
            this.initialized = true;
            log.info('✅ Model improvement service initialized');
        } catch (error) {
            log.warn('Model improvement initialization failed:', error.message);
            this.initialized = true;
        }
    }

    /**
     * Record feedback for model improvement
     */
    async recordFeedback(prediction, actual, context) {
        await this.initialize();

        const feedback = {
            prediction: prediction.predictedQuality,
            actual: actual,
            error: Math.abs(prediction.predictedQuality - actual),
            context: context,
            timestamp: new Date().toISOString()
        };

        this.feedbackBuffer.push(feedback);

        // Check if we should trigger retraining
        if (this.feedbackBuffer.length >= this.retrainThreshold) {
            await this.checkRetrainNeeded();
        }

        // Also send to data collection
        if (this.dataCollection) {
            try {
                await this.dataCollection.collectQualityFeedback({
                    context: context,
                    predictedQuality: prediction.predictedQuality,
                    actualQuality: actual,
                    error: feedback.error
                });
            } catch (error) {
                log.debug('Data collection failed:', error.message);
            }
        }
    }

    /**
     * Check if retraining is needed
     */
    async checkRetrainNeeded() {
        if (this.feedbackBuffer.length < this.retrainThreshold) {
            return false;
        }

        // Calculate current performance
        const recentFeedback = this.feedbackBuffer.slice(-this.retrainThreshold);
        const avgError = recentFeedback.reduce((sum, f) => sum + f.error, 0) / recentFeedback.length;
        const baselineError = this.getBaselineError();

        // Check if performance has degraded
        if (avgError > baselineError * (1 + this.performanceThreshold)) {
            log.warn(`[Model Improvement] Performance degraded: ${avgError.toFixed(3)} vs baseline ${baselineError.toFixed(3)}`);
            return true;
        }

        return false;
    }

    /**
     * Get baseline error (from initial training)
     */
    getBaselineError() {
        // Default baseline - would be loaded from model metadata
        return 0.15; // 15% average error
    }

    /**
     * Trigger model retraining
     */
    async triggerRetraining() {
        await this.initialize();

        log.info('[Model Improvement] Triggering model retraining...');

        try {
            // Collect training data
            const trainingData = this.prepareTrainingData();

            // Train new model (would call training script)
            const newModel = await this.trainNewModel(trainingData);

            // Evaluate new model
            const evaluation = await this.evaluateModel(newModel);

            // Compare with current model
            const currentEvaluation = await this.evaluateCurrentModel();

            if (evaluation.error < currentEvaluation.error) {
                log.info(`[Model Improvement] New model is better: ${evaluation.error.toFixed(3)} vs ${currentEvaluation.error.toFixed(3)}`);
                
                // Deploy new model
                await this.deployModel(newModel, evaluation);
                
                // Record improvement
                this.recordImprovement({
                    oldError: currentEvaluation.error,
                    newError: evaluation.error,
                    improvement: ((currentEvaluation.error - evaluation.error) / currentEvaluation.error) * 100,
                    timestamp: new Date().toISOString()
                });

                return true;
            } else {
                log.info(`[Model Improvement] New model not better, keeping current model`);
                return false;
            }
        } catch (error) {
            log.error('[Model Improvement] Retraining failed:', error.message);
            return false;
        }
    }

    /**
     * Prepare training data from feedback
     */
    prepareTrainingData() {
        // Convert feedback to training format
        return this.feedbackBuffer.map(f => ({
            features: this.extractFeatures(f.context),
            label: f.actual
        }));
    }

    /**
     * Extract features from context
     */
    extractFeatures(context) {
        return {
            provider: this.mapProviderToScore(context.provider),
            model: this.mapModelToScore(context.model),
            actionType: this.mapActionTypeToScore(context.actionType),
            statValue: context.statValue || 5
        };
    }

    /**
     * Map provider to score
     */
    mapProviderToScore(provider) {
        const scores = {
            'openai': 85,
            'anthropic': 88,
            'gemini': 82,
            'mistral': 80,
            'together': 78,
            'groq': 75
        };
        return scores[provider] || 75;
    }

    /**
     * Map model to score
     */
    mapModelToScore(model) {
        if (!model) return 70;
        if (model.includes('gpt-4') || model.includes('claude-opus')) return 90;
        if (model.includes('ft:') || model.includes('fine-tuned')) return 85;
        return 70;
    }

    /**
     * Map action type to score
     */
    mapActionTypeToScore(actionType) {
        if (!actionType) return 75;
        if (actionType.includes('critical') || actionType.includes('combat')) return 90;
        return 75;
    }

    /**
     * Train new model (placeholder - would call actual training)
     */
    async trainNewModel(trainingData) {
        // This would call the actual training script
        log.info(`[Model Improvement] Training new model with ${trainingData.length} samples`);
        
        // Placeholder - in real implementation, would call training script
        return {
            modelId: `improved-${Date.now()}`,
            trainingDataSize: trainingData.length,
            trainedAt: new Date().toISOString()
        };
    }

    /**
     * Evaluate model
     */
    async evaluateModel(model) {
        // Placeholder - would evaluate on test set
        return {
            error: 0.12, // 12% average error
            accuracy: 0.88,
            r2: 0.85
        };
    }

    /**
     * Evaluate current model
     */
    async evaluateCurrentModel() {
        // Get current model performance from monitoring
        const dashboard = this.monitoring.getDashboard();
        const errorRate = dashboard.predictions.errorRate || 0.15;
        
        return {
            error: errorRate,
            accuracy: 1 - errorRate
        };
    }

    /**
     * Deploy new model
     */
    async deployModel(model, evaluation) {
        log.info(`[Model Improvement] Deploying new model: ${model.modelId}`);
        // This would call deployment script
        // In real implementation, would use productionDeployment service
    }

    /**
     * Record improvement
     */
    recordImprovement(improvement) {
        this.improvementHistory.push(improvement);
        
        // Keep only last 50 improvements
        if (this.improvementHistory.length > 50) {
            this.improvementHistory.shift();
        }

        log.info(`[Model Improvement] Improvement recorded: ${improvement.improvement.toFixed(1)}% better`);
    }

    /**
     * Get improvement statistics
     */
    getImprovementStats() {
        if (this.improvementHistory.length === 0) {
            return {
                totalImprovements: 0,
                avgImprovement: 0,
                bestImprovement: 0
            };
        }

        const improvements = this.improvementHistory.map(i => i.improvement);
        return {
            totalImprovements: this.improvementHistory.length,
            avgImprovement: improvements.reduce((a, b) => a + b, 0) / improvements.length,
            bestImprovement: Math.max(...improvements),
            recentImprovements: this.improvementHistory.slice(-5)
        };
    }

    /**
     * Get recommendations for improvement
     */
    getRecommendations() {
        const recommendations = [];
        const stats = this.getImprovementStats();

        // Check feedback buffer size
        if (this.feedbackBuffer.length < 100) {
            recommendations.push({
                type: 'data',
                priority: 'high',
                message: `Only ${this.feedbackBuffer.length} feedback samples. Need more data for retraining.`,
                action: 'Collect more feedback data'
            });
        }

        // Check performance
        const dashboard = this.monitoring.getDashboard();
        if (dashboard.predictions.errorRate > 0.1) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: `Error rate is ${(dashboard.predictions.errorRate * 100).toFixed(1)}%. Consider retraining.`,
                action: 'Trigger model retraining'
            });
        }

        // Check improvement history
        if (stats.totalImprovements === 0) {
            recommendations.push({
                type: 'improvement',
                priority: 'medium',
                message: 'No model improvements recorded yet.',
                action: 'Monitor performance and collect feedback'
            });
        }

        return recommendations;
    }
}

// Singleton instance
let modelImprovementInstance = null;

function getModelImprovement() {
    if (!modelImprovementInstance) {
        modelImprovementInstance = new ModelImprovement();
    }
    return modelImprovementInstance;
}

module.exports = {
    ModelImprovement,
    getModelImprovement
};

