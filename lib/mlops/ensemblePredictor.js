/**
 * Multi-Model Ensemble Predictor
 * Combines predictions from multiple models for improved accuracy
 * 
 * Month 2: Advanced Features
 */

const { createLogger } = require('../utils/logger');
const { getMLModelIntegration } = require('./mlModelIntegration');
const log = createLogger('EnsemblePredictor');

class EnsemblePredictor {
    constructor() {
        this.models = [];
        this.weights = [];
        this.strategies = {
            'average': this.averageStrategy,
            'weighted': this.weightedStrategy,
            'voting': this.votingStrategy,
            'stacking': this.stackingStrategy
        };
    }

    /**
     * Initialize ensemble with available models
     */
    async initialize() {
        try {
            const mlIntegration = await getMLModelIntegration();
            
            // Load all available models
            const modelPaths = await this.findAvailableModels();
            
            for (const modelPath of modelPaths) {
                try {
                    const model = await this.loadModel(modelPath);
                    if (model) {
                        this.models.push({
                            path: modelPath,
                            model: model,
                            weight: this.calculateModelWeight(model),
                            version: this.extractVersion(modelPath)
                        });
                    }
                } catch (error) {
                    log.warn(`Failed to load model ${modelPath}:`, error.message);
                }
            }

            // Sort by weight (best models first)
            this.models.sort((a, b) => b.weight - a.weight);

            // Normalize weights
            const totalWeight = this.models.reduce((sum, m) => sum + m.weight, 0);
            this.weights = this.models.map(m => m.weight / totalWeight);

            log.info(`✅ Ensemble initialized with ${this.models.length} models`);
            log.info(`   Models: ${this.models.map(m => m.version).join(', ')}`);

        } catch (error) {
            log.error('Failed to initialize ensemble:', error.message);
        }
    }

    /**
     * Predict using ensemble
     */
    async predict(features, strategy = 'weighted') {
        if (this.models.length === 0) {
            throw new Error('No models available for ensemble');
        }

        const predictions = [];

        // Get predictions from all models
        for (const modelInfo of this.models) {
            try {
                const prediction = this.predictWithModel(modelInfo.model, features);
                predictions.push({
                    prediction,
                    weight: modelInfo.weight,
                    version: modelInfo.version,
                    model: modelInfo
                });
            } catch (error) {
                log.warn(`Prediction failed for ${modelInfo.version}:`, error.message);
            }
        }

        if (predictions.length === 0) {
            throw new Error('All model predictions failed');
        }

        // Combine predictions using strategy
        const strategyFn = this.strategies[strategy] || this.weightedStrategy;
        const ensemblePrediction = strategyFn(predictions);

        return {
            prediction: ensemblePrediction,
            strategy: strategy,
            individualPredictions: predictions,
            confidence: this.calculateConfidence(predictions),
            modelCount: predictions.length
        };
    }

    /**
     * Average strategy: Simple average of all predictions
     */
    averageStrategy(predictions) {
        const sum = predictions.reduce((s, p) => s + p.prediction, 0);
        return sum / predictions.length;
    }

    /**
     * Weighted strategy: Weighted average based on model performance
     */
    weightedStrategy(predictions) {
        const weightedSum = predictions.reduce((s, p) => s + (p.prediction * p.weight), 0);
        const totalWeight = predictions.reduce((s, p) => s + p.weight, 0);
        return totalWeight > 0 ? weightedSum / totalWeight : this.averageStrategy(predictions);
    }

    /**
     * Voting strategy: Majority vote (rounded predictions)
     */
    votingStrategy(predictions) {
        const votes = predictions.map(p => Math.round(p.prediction));
        const voteCounts = {};
        
        votes.forEach(vote => {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        });

        // Find most common vote
        let maxVotes = 0;
        let winner = votes[0];
        
        for (const [vote, count] of Object.entries(voteCounts)) {
            if (count > maxVotes) {
                maxVotes = count;
                winner = parseInt(vote);
            }
        }

        return winner;
    }

    /**
     * Stacking strategy: Use meta-model to combine predictions
     */
    stackingStrategy(predictions) {
        // For now, use weighted average
        // In production, you'd train a meta-model on validation set
        return this.weightedStrategy.call(this, predictions);
    }

    /**
     * Calculate confidence based on prediction agreement
     */
    calculateConfidence(predictions) {
        if (predictions.length === 1) {
            return 0.85; // Single model confidence
        }

        // Calculate variance of predictions
        const mean = predictions.reduce((s, p) => s + p.prediction, 0) / predictions.length;
        const variance = predictions.reduce((s, p) => s + Math.pow(p.prediction - mean, 2), 0) / predictions.length;
        const stdDev = Math.sqrt(variance);

        // Lower variance = higher confidence
        // Normalize to 0-1 scale (assuming max stdDev of 20)
        const normalizedStdDev = Math.min(stdDev / 20, 1);
        const confidence = 1 - normalizedStdDev;

        // Boost confidence if multiple models agree
        const agreementBonus = Math.min(predictions.length / 5, 0.1);
        
        return Math.min(0.95, Math.max(0.7, confidence + agreementBonus));
    }

    /**
     * Predict with a single model
     */
    predictWithModel(model, features) {
        if (typeof model.predict === 'function') {
            return model.predict(features);
        } else {
            throw new Error('Model does not have predict method');
        }
    }

    /**
     * Find all available models
     */
    async findAvailableModels() {
        const path = require('path');
        const fs = require('fs').promises;
        
        const modelsDir = path.join(process.cwd(), '.beast-mode', 'models');
        const possibleDirs = [
            modelsDir,
            path.join(__dirname, '../../.beast-mode/models'),
            path.join(process.cwd(), '../.beast-mode/models')
        ];

        const modelPaths = [];

        for (const dir of possibleDirs) {
            try {
                const files = await fs.readdir(dir);
                const jsonFiles = files.filter(f => f.endsWith('.json') && f.includes('quality-predictor'));
                
                for (const file of jsonFiles) {
                    const modelPath = path.join(dir, file);
                    try {
                        await fs.access(modelPath);
                        modelPaths.push(modelPath);
                    } catch (error) {
                        // Skip inaccessible files
                    }
                }
            } catch (error) {
                // Directory doesn't exist, skip
            }
        }

        return [...new Set(modelPaths)]; // Remove duplicates
    }

    /**
     * Load a model from file
     */
    async loadModel(modelPath) {
        try {
            const fs = require('fs').promises;
            const modelData = JSON.parse(await fs.readFile(modelPath, 'utf8'));

            // Determine model type and load appropriate trainer
            if (modelPath.includes('v3-advanced') || modelData.algorithm === 'xgboost_advanced') {
                const { QualityPredictorTrainerAdvanced } = require('../models/trainQualityPredictorAdvanced');
                const trainer = new QualityPredictorTrainerAdvanced();
                await trainer.loadModel(modelPath);
                return trainer;
            } else if (modelPath.includes('enhanced') || modelData.algorithm === 'enhanced') {
                const { QualityPredictorTrainer } = require('../models/trainQualityPredictor');
                const trainer = new QualityPredictorTrainer();
                await trainer.loadModel(modelPath);
                return trainer;
            } else {
                const { QualityPredictorTrainer } = require('../models/trainQualityPredictor');
                const trainer = new QualityPredictorTrainer();
                await trainer.loadModel(modelPath);
                return trainer;
            }
        } catch (error) {
            log.warn(`Failed to load model ${modelPath}:`, error.message);
            return null;
        }
    }

    /**
     * Calculate model weight based on version and performance
     */
    calculateModelWeight(model) {
        // Weight models based on version
        // Advanced models get higher weight
        if (model.model?.type === 'xgboost_advanced') {
            return 1.0;
        } else if (model.model?.type === 'enhanced') {
            return 0.8;
        } else {
            return 0.6;
        }
    }

    /**
     * Extract version from model path
     */
    extractVersion(modelPath) {
        const match = modelPath.match(/quality-predictor-([^/]+)\.json/);
        return match ? match[1] : 'unknown';
    }

    /**
     * Get ensemble info
     */
    getInfo() {
        return {
            modelCount: this.models.length,
            models: this.models.map(m => ({
                version: m.version,
                weight: m.weight
            })),
            strategies: Object.keys(this.strategies)
        };
    }
}

// Singleton instance
let ensemblePredictorInstance = null;

async function getEnsemblePredictor() {
    if (!ensemblePredictorInstance) {
        ensemblePredictorInstance = new EnsemblePredictor();
        await ensemblePredictorInstance.initialize();
    }
    return ensemblePredictorInstance;
}

module.exports = {
    EnsemblePredictor,
    getEnsemblePredictor
};

