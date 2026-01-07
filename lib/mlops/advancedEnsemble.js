/**
 * Advanced Ensemble Service
 * Implements stacking, meta-learning, and dynamic ensemble selection
 */

const { createLogger } = require('../utils/logger');
const { getEnsemblePredictor } = require('./ensemblePredictor');

const logger = createLogger('AdvancedEnsemble');

class AdvancedEnsemble {
  constructor() {
    this.baseEnsemble = null;
    this.metaLearner = null;
    this.ensembleHistory = [];
    this.performanceWeights = {};
  }

  /**
   * Initialize advanced ensemble
   */
  async initialize() {
    try {
      this.baseEnsemble = getEnsemblePredictor();
      this.metaLearner = this.createMetaLearner();
      this.neuralNetworkModel = null;
      this.transformerModel = null;
      this.hybridEnabled = false;
      logger.info('✅ Advanced ensemble initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize advanced ensemble:', error);
      return false;
    }
  }

  /**
   * Register neural network model
   */
  registerNeuralNetwork(model) {
    this.neuralNetworkModel = model;
    this.hybridEnabled = true;
    logger.info('Neural network model registered for hybrid ensemble');
  }

  /**
   * Register transformer model
   */
  registerTransformer(model) {
    this.transformerModel = model;
    this.hybridEnabled = true;
    logger.info('Transformer model registered for hybrid ensemble');
  }

  /**
   * Stacking ensemble: Use meta-learner to combine base models
   * @param {Array} predictions - Predictions from multiple models
   * @param {Object} context - Prediction context
   */
  async stackingEnsemble(predictions, context = {}) {
    try {
      if (!predictions || predictions.length === 0) {
        throw new Error('No predictions provided');
      }

      // Get base model predictions
      const basePredictions = predictions.map(p => ({
        value: p.prediction || p.value || p,
        confidence: p.confidence || 0.5,
        model: p.model || 'unknown'
      }));

      // Add neural network and transformer if available
      if (this.hybridEnabled && context.features) {
        try {
          if (this.neuralNetworkModel && this.neuralNetworkModel.trained) {
            const nnPred = this.neuralNetworkModel.predict(context.features);
            basePredictions.push({
              value: nnPred,
              confidence: 0.85,
              model: 'neural_network'
            });
          }
          
          if (this.transformerModel && this.transformerModel.trained) {
            const transPred = this.transformerModel.predict(context.features);
            basePredictions.push({
              value: transPred,
              confidence: 0.85,
              model: 'transformer'
            });
          }
        } catch (error) {
          logger.debug('Hybrid model prediction failed:', error.message);
        }
      }

      // Use meta-learner to combine
      const metaPrediction = this.metaLearner.predict(basePredictions, context);

      return {
        prediction: metaPrediction.value,
        confidence: metaPrediction.confidence,
        strategy: 'stacking',
        basePredictions: basePredictions,
        metaWeights: metaPrediction.weights,
        hybridModels: this.hybridEnabled
      };
    } catch (error) {
      logger.error('Stacking ensemble failed:', error);
      throw error;
    }
  }

  /**
   * Dynamic ensemble selection: Choose best models based on context
   * @param {Array} availableModels - Available model predictions
   * @param {Object} context - Prediction context
   */
  async dynamicSelection(availableModels, context = {}) {
    try {
      if (!availableModels || availableModels.length === 0) {
        throw new Error('No models available');
      }

      // Score each model based on context
      const scoredModels = availableModels.map(model => ({
        ...model,
        score: this.scoreModelForContext(model, context)
      }));

      // Sort by score
      scoredModels.sort((a, b) => b.score - a.score);

      // Select top models (top 3 or top 50%)
      const topCount = Math.min(3, Math.ceil(scoredModels.length * 0.5));
      const selectedModels = scoredModels.slice(0, topCount);

      // Weighted average of selected models
      const totalScore = selectedModels.reduce((sum, m) => sum + m.score, 0);
      let weightedSum = 0;
      let totalWeight = 0;

      for (const model of selectedModels) {
        const weight = model.score / totalScore;
        weightedSum += (model.prediction || model.value) * weight;
        totalWeight += weight;
      }

      const finalPrediction = totalWeight > 0 ? weightedSum / totalWeight : 0;
      const avgConfidence = selectedModels.reduce((sum, m) => sum + (m.confidence || 0.5), 0) / selectedModels.length;

      return {
        prediction: finalPrediction,
        confidence: avgConfidence,
        strategy: 'dynamic-selection',
        selectedModels: selectedModels.map(m => ({
          model: m.model || m.name,
          score: m.score,
          prediction: m.prediction || m.value
        })),
        totalModels: availableModels.length,
        selectedCount: selectedModels.length
      };
    } catch (error) {
      logger.error('Dynamic selection failed:', error);
      throw error;
    }
  }

  /**
   * Confidence-weighted voting: Weight predictions by confidence
   * @param {Array} predictions - Model predictions with confidence
   */
  async confidenceWeightedVoting(predictions) {
    try {
      if (!predictions || predictions.length === 0) {
        throw new Error('No predictions provided');
      }

      let weightedSum = 0;
      let totalWeight = 0;

      for (const pred of predictions) {
        const value = pred.prediction || pred.value || pred;
        const confidence = pred.confidence || 0.5;
        const weight = confidence * confidence; // Square confidence for stronger weighting

        weightedSum += value * weight;
        totalWeight += weight;
      }

      const finalPrediction = totalWeight > 0 ? weightedSum / totalWeight : 0;
      const avgConfidence = predictions.reduce((sum, p) => sum + (p.confidence || 0.5), 0) / predictions.length;

      return {
        prediction: finalPrediction,
        confidence: avgConfidence,
        strategy: 'confidence-weighted',
        weights: predictions.map(p => ({
          model: p.model || 'unknown',
          confidence: p.confidence || 0.5,
          weight: (p.confidence || 0.5) ** 2
        }))
      };
    } catch (error) {
      logger.error('Confidence-weighted voting failed:', error);
      throw error;
    }
  }

  /**
   * Meta-learner: Learns how to combine base models
   */
  createMetaLearner() {
    return {
      // Simple linear combination for now
      predict: (basePredictions, context) => {
        // Weight based on confidence and context
        const weights = basePredictions.map((pred, idx) => {
          let weight = pred.confidence || 0.5;
          
          // Adjust based on context
          if (context.serviceName) {
            // Prefer models that performed well for this service
            const serviceKey = `${context.serviceName}_${pred.model}`;
            const historicalWeight = this.performanceWeights[serviceKey] || 1.0;
            weight *= historicalWeight;
          }

          return weight;
        });

        // Normalize weights
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const normalizedWeights = weights.map(w => w / totalWeight);

        // Weighted average
        const value = basePredictions.reduce((sum, pred, idx) => {
          return sum + (pred.value * normalizedWeights[idx]);
        }, 0);

        const confidence = Math.min(1.0, normalizedWeights.reduce((sum, w, idx) => {
          return sum + (w * basePredictions[idx].confidence);
        }, 0));

        return {
          value,
          confidence,
          weights: normalizedWeights
        };
      },

      // Update meta-learner based on feedback
      update: (basePredictions, actual, context) => {
        // Update performance weights
        for (let i = 0; i < basePredictions.length; i++) {
          const pred = basePredictions[i];
          const error = Math.abs(pred.value - actual);
          const serviceKey = context.serviceName 
            ? `${context.serviceName}_${pred.model}`
            : pred.model;

          // Lower error = higher weight
          const newWeight = 1.0 / (1.0 + error);
          const currentWeight = this.performanceWeights[serviceKey] || 1.0;
          
          // Exponential moving average
          this.performanceWeights[serviceKey] = 0.9 * currentWeight + 0.1 * newWeight;
        }
      }
    };
  }

  /**
   * Score model for specific context
   */
  scoreModelForContext(model, context) {
    let score = 0.5; // Base score

    // Boost if model has high confidence
    if (model.confidence) {
      score += model.confidence * 0.3;
    }

    // Boost if model performed well for this service
    if (context.serviceName && model.model) {
      const serviceKey = `${context.serviceName}_${model.model}`;
      const historicalWeight = this.performanceWeights[serviceKey] || 1.0;
      score *= historicalWeight;
    }

    // Boost if model matches prediction type
    if (context.predictionType && model.predictionType === context.predictionType) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Update ensemble with feedback
   */
  async updateWithFeedback(predictions, actual, context = {}) {
    try {
      // Update meta-learner
      if (this.metaLearner && predictions) {
        this.metaLearner.update(predictions, actual, context);
      }

      // Record in history
      this.ensembleHistory.push({
        timestamp: Date.now(),
        predictions,
        actual,
        context,
        error: predictions ? Math.abs((predictions.prediction || predictions.value) - actual) : null
      });

      // Keep only last 1000 records
      if (this.ensembleHistory.length > 1000) {
        this.ensembleHistory = this.ensembleHistory.slice(-1000);
      }

      logger.debug('Ensemble updated with feedback');
      return true;
    } catch (error) {
      logger.error('Failed to update ensemble:', error);
      return false;
    }
  }

  /**
   * Get ensemble statistics
   */
  getStatistics() {
    return {
      performanceWeights: this.performanceWeights,
      historySize: this.ensembleHistory.length,
      recentErrors: this.ensembleHistory.slice(-100).map(h => h.error).filter(e => e !== null),
      avgError: this.calculateAverageError()
    };
  }

  /**
   * Calculate average error
   */
  calculateAverageError() {
    const errors = this.ensembleHistory
      .map(h => h.error)
      .filter(e => e !== null);

    if (errors.length === 0) return 0;

    return errors.reduce((a, b) => a + b, 0) / errors.length;
  }
}

// Singleton instance
let instance = null;

function getAdvancedEnsemble() {
  if (!instance) {
    instance = new AdvancedEnsemble();
  }
  return instance;
}

module.exports = {
  AdvancedEnsemble,
  getAdvancedEnsemble
};

