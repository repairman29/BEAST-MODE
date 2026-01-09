/**
 * Ensemble Service with Database Integration
 * Uses new ensemble tables for configuration, predictions, and performance tracking
 * 
 * Dog Fooding: Built using BEAST MODE's codebase chat API
 */

const { createLogger } = require('../utils/logger');
const { getDatabaseWriter } = require('./databaseWriter');
const { getAdvancedEnsemble } = require('./advancedEnsemble');

const logger = createLogger('EnsembleService');

class EnsembleService {
  constructor() {
    this.advancedEnsemble = null;
    this.databaseWriter = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.advancedEnsemble = getAdvancedEnsemble();
      this.databaseWriter = getDatabaseWriter();
      await this.advancedEnsemble.initialize();
      this.initialized = true;
      logger.info('✅ Ensemble service initialized with database integration');
      return true;
    } catch (error) {
      logger.error('Failed to initialize ensemble service:', error);
      return false;
    }
  }

  /**
   * Create ensemble configuration
   */
  async createEnsembleConfig(userId, config) {
    if (!this.initialized) await this.initialize();

    const { name, description, modelIds, ensembleType, weights, metaLearnerConfig } = config;

    try {
      const result = await this.databaseWriter.write({
        table: 'ensemble_configurations',
        data: {
          user_id: userId,
          name,
          description,
          model_ids: modelIds,
          ensemble_type: ensembleType,
          weights: weights || {},
          meta_learner_config: metaLearnerConfig || {},
          is_active: true
        }
      });

      logger.info(`Created ensemble configuration: ${name} (${result.id})`);
      return { success: true, id: result.id, config: result };
    } catch (error) {
      logger.error('Failed to create ensemble configuration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Make ensemble prediction and store in database
   */
  async predict(context, ensembleConfigId, serviceName = 'code-roach') {
    if (!this.initialized) await this.initialize();

    try {
      // Get ensemble configuration
      const config = await this.databaseWriter.read({
        table: 'ensemble_configurations',
        filter: { id: ensembleConfigId }
      });

      if (!config || !config.is_active) {
        throw new Error('Ensemble configuration not found or inactive');
      }

      // Get individual model predictions
      const individualPredictions = {};
      const predictions = [];

      for (const modelId of config.model_ids) {
        try {
          // Get prediction from model (placeholder - integrate with actual model service)
          const prediction = await this.getModelPrediction(modelId, context);
          individualPredictions[modelId] = prediction.value;
          predictions.push({
            model: modelId,
            value: prediction.value,
            confidence: prediction.confidence || 0.5
          });
        } catch (error) {
          logger.warn(`Model ${modelId} prediction failed:`, error.message);
        }
      }

      // Combine predictions using ensemble
      let ensemblePrediction;
      let modelWeightsUsed = config.weights;

      switch (config.ensemble_type) {
        case 'voting':
          ensemblePrediction = this.votingEnsemble(predictions, modelWeightsUsed);
          break;
        case 'stacking':
          ensemblePrediction = await this.advancedEnsemble.stackingEnsemble(predictions, context);
          break;
        case 'blending':
          ensemblePrediction = this.blendingEnsemble(predictions, modelWeightsUsed);
          break;
        case 'dynamic':
          // Update weights based on recent performance
          modelWeightsUsed = await this.getDynamicWeights(ensembleConfigId, config.model_ids);
          ensemblePrediction = this.weightedAverage(predictions, modelWeightsUsed);
          break;
        default:
          ensemblePrediction = this.averageEnsemble(predictions);
      }

      // Store prediction in database
      const predictionRecord = await this.databaseWriter.write({
        table: 'ensemble_predictions',
        data: {
          ensemble_config_id: ensembleConfigId,
          service_name: serviceName,
          prediction_type: context.predictionType || 'quality',
          input_context: context,
          individual_predictions: individualPredictions,
          ensemble_prediction: ensemblePrediction.value || ensemblePrediction,
          confidence: ensemblePrediction.confidence || 0.5,
          model_weights_used: modelWeightsUsed
        }
      });

      // Update model weights if dynamic
      if (config.ensemble_type === 'dynamic') {
        await this.updateModelWeights(ensembleConfigId, config.model_ids, modelWeightsUsed);
      }

      return {
        success: true,
        prediction: ensemblePrediction.value || ensemblePrediction,
        confidence: ensemblePrediction.confidence || 0.5,
        individualPredictions,
        predictionId: predictionRecord.id
      };
    } catch (error) {
      logger.error('Ensemble prediction failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get model prediction (placeholder - integrate with actual model service)
   */
  async getModelPrediction(modelId, context) {
    // TODO: Integrate with actual model prediction service
    // For now, return placeholder
    return {
      value: Math.random() * 0.3 + 0.5, // Placeholder
      confidence: 0.8
    };
  }

  /**
   * Voting ensemble
   */
  votingEnsemble(predictions, weights) {
    if (!weights || Object.keys(weights).length === 0) {
      // Simple average
      const sum = predictions.reduce((acc, p) => acc + p.value, 0);
      return { value: sum / predictions.length, confidence: 0.7 };
    }

    // Weighted voting
    let weightedSum = 0;
    let totalWeight = 0;
    predictions.forEach(p => {
      const weight = weights[p.model] || 1;
      weightedSum += p.value * weight;
      totalWeight += weight;
    });

    return {
      value: weightedSum / totalWeight,
      confidence: 0.8
    };
  }

  /**
   * Blending ensemble
   */
  blendingEnsemble(predictions, weights) {
    return this.votingEnsemble(predictions, weights);
  }

  /**
   * Average ensemble
   */
  averageEnsemble(predictions) {
    const sum = predictions.reduce((acc, p) => acc + p.value, 0);
    return {
      value: sum / predictions.length,
      confidence: 0.7
    };
  }

  /**
   * Weighted average
   */
  weightedAverage(predictions, weights) {
    return this.votingEnsemble(predictions, weights);
  }

  /**
   * Get dynamic weights based on recent performance
   */
  async getDynamicWeights(ensembleConfigId, modelIds) {
    try {
      // Get recent performance for each model
      const weights = {};
      const defaultWeight = 1 / modelIds.length;

      for (const modelId of modelIds) {
        const performance = await this.databaseWriter.read({
          table: 'ensemble_performance',
          filter: {
            ensemble_config_id: ensembleConfigId,
            metric_name: 'accuracy'
          },
          orderBy: { created_at: 'desc' },
          limit: 10
        });

        if (performance && performance.length > 0) {
          const avgAccuracy = performance.reduce((sum, p) => sum + p.metric_value, 0) / performance.length;
          weights[modelId] = avgAccuracy;
        } else {
          weights[modelId] = defaultWeight;
        }
      }

      // Normalize weights
      const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
      Object.keys(weights).forEach(key => {
        weights[key] = weights[key] / total;
      });

      return weights;
    } catch (error) {
      logger.warn('Failed to get dynamic weights:', error);
      // Return equal weights
      const equalWeight = 1 / modelIds.length;
      return modelIds.reduce((acc, id) => ({ ...acc, [id]: equalWeight }), {});
    }
  }

  /**
   * Update model weights
   */
  async updateModelWeights(ensembleConfigId, modelIds, weights) {
    try {
      for (const modelId of modelIds) {
        await this.databaseWriter.write({
          table: 'model_weights',
          data: {
            ensemble_config_id: ensembleConfigId,
            model_id: modelId,
            weight: weights[modelId] || 0,
            weight_type: 'dynamic',
            last_updated: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      logger.warn('Failed to update model weights:', error);
    }
  }

  /**
   * Record performance metrics
   */
  async recordPerformance(ensembleConfigId, serviceName, metrics) {
    try {
      const periodEnd = new Date();
      const periodStart = new Date(periodEnd.getTime() - 3600000); // Last hour

      for (const [metricName, metricValue] of Object.entries(metrics)) {
        await this.databaseWriter.write({
          table: 'ensemble_performance',
          data: {
            ensemble_config_id: ensembleConfigId,
            service_name: serviceName,
            metric_name: metricName,
            metric_value: metricValue,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString()
          }
        });
      }
    } catch (error) {
      logger.warn('Failed to record performance:', error);
    }
  }
}

// Singleton instance
let instance = null;

function getEnsembleService() {
  if (!instance) {
    instance = new EnsembleService();
  }
  return instance;
}

module.exports = {
  EnsembleService,
  getEnsembleService
};
