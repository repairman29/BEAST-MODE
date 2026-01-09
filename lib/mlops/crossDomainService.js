/**
 * Cross-Domain Learning Service with Database Integration
 * Uses new cross-domain tables for mappings, transfer runs, and predictions
 * 
 * Dog Fooding: Built using BEAST MODE's codebase chat API
 */

const { createLogger } = require('../utils/logger');
const { getDatabaseWriter } = require('./databaseWriter');

const logger = createLogger('CrossDomainService');

class CrossDomainService {
  constructor() {
    this.databaseWriter = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.databaseWriter = getDatabaseWriter();
      this.initialized = true;
      logger.info('✅ Cross-domain service initialized with database integration');
      return true;
    } catch (error) {
      logger.error('Failed to initialize cross-domain service:', error);
      return false;
    }
  }

  /**
   * Create or update domain mapping
   */
  async createDomainMapping(sourceDomain, targetDomain, config) {
    if (!this.initialized) await this.initialize();

    const {
      domainType,
      similarityScore,
      transferFeasibility,
      sharedFeatures,
      domainSpecificFeatures,
      transferStrategy
    } = config;

    try {
      // Check if mapping exists
      const existing = await this.databaseWriter.read({
        table: 'domain_mappings',
        filter: {
          source_domain: sourceDomain,
          target_domain: targetDomain
        }
      });

      if (existing && existing.length > 0) {
        // Update existing
        const result = await this.databaseWriter.update({
          table: 'domain_mappings',
          filter: { id: existing[0].id },
          data: {
            similarity_score: similarityScore,
            transfer_feasibility: transferFeasibility,
            shared_features: sharedFeatures || [],
            domain_specific_features: domainSpecificFeatures || [],
            transfer_strategy: transferStrategy,
            updated_at: new Date().toISOString()
          }
        });
        return { success: true, id: existing[0].id, mapping: result };
      }

      // Create new
      const result = await this.databaseWriter.write({
        table: 'domain_mappings',
        data: {
          source_domain: sourceDomain,
          target_domain: targetDomain,
          domain_type: domainType || 'general',
          similarity_score: similarityScore,
          transfer_feasibility: transferFeasibility,
          shared_features: sharedFeatures || [],
          domain_specific_features: domainSpecificFeatures || [],
          transfer_strategy: transferStrategy
        }
      });

      logger.info(`Created domain mapping: ${sourceDomain} -> ${targetDomain}`);
      return { success: true, id: result.id, mapping: result };
    } catch (error) {
      logger.error('Failed to create domain mapping:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create transfer learning run
   */
  async createTransferRun(userId, config) {
    if (!this.initialized) await this.initialize();

    const {
      sourceDomain,
      targetDomain,
      sourceModelId,
      sourceModelVersion,
      runName,
      description,
      transferStrategy,
      trainingData,
      validationData,
      hyperparameters
    } = config;

    try {
      const result = await this.databaseWriter.write({
        table: 'transfer_learning_runs',
        data: {
          user_id: userId,
          source_domain: sourceDomain,
          target_domain: targetDomain,
          source_model_id: sourceModelId,
          source_model_version: sourceModelVersion,
          run_name: runName,
          description,
          transfer_strategy: transferStrategy || 'fine-tuning',
          training_data_count: trainingData.length,
          validation_data_count: validationData?.length || 0,
          learning_rate: hyperparameters?.learningRate || 0.001,
          status: 'queued'
        }
      });

      logger.info(`Created transfer run: ${runName} (${result.id})`);
      return { success: true, id: result.id, run: result };
    } catch (error) {
      logger.error('Failed to create transfer run:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute transfer learning
   */
  async executeTransfer(transferRunId) {
    if (!this.initialized) await this.initialize();

    try {
      // Get transfer run
      const run = await this.databaseWriter.read({
        table: 'transfer_learning_runs',
        filter: { id: transferRunId }
      });

      if (!run) {
        throw new Error('Transfer run not found');
      }

      // Update status
      await this.databaseWriter.update({
        table: 'transfer_learning_runs',
        filter: { id: transferRunId },
        data: {
          status: 'running'
        }
      });

      // Perform transfer learning (placeholder - would use actual model service)
      const transferResult = await this.performTransfer(run);

      if (!transferResult.success) {
        await this.databaseWriter.update({
          table: 'transfer_learning_runs',
          filter: { id: transferRunId },
          data: {
            status: 'failed'
          }
        });
        return { success: false, error: transferResult.error };
      }

      // Update run
      await this.databaseWriter.update({
        table: 'transfer_learning_runs',
        filter: { id: transferRunId },
        data: {
          status: 'completed',
          target_model_id: transferResult.targetModelId,
          target_model_version: transferResult.targetModelVersion,
          performance_metrics: transferResult.metrics || {},
          completed_at: new Date().toISOString()
        }
      });

      return { success: true, result: transferResult };
    } catch (error) {
      logger.error('Failed to execute transfer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform transfer learning (placeholder)
   */
  async performTransfer(run) {
    // TODO: Integrate with actual model fine-tuning service
    return {
      success: true,
      targetModelId: run.source_model_id,
      targetModelVersion: 'v1.0.0',
      metrics: {
        accuracy: 0.85,
        f1: 0.82
      }
    };
  }

  /**
   * Record domain adaptation metrics
   */
  async recordAdaptationMetrics(transferRunId, phase, metrics) {
    if (!this.initialized) await this.initialize();

    try {
      for (const [metricName, metricValue] of Object.entries(metrics)) {
        await this.databaseWriter.write({
          table: 'domain_adaptation_metrics',
          data: {
            transfer_run_id: transferRunId,
            metric_name: metricName,
            metric_value: metricValue,
            evaluation_phase: phase
          }
        });
      }
      return { success: true };
    } catch (error) {
      logger.warn('Failed to record adaptation metrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Make cross-domain prediction
   */
  async predict(transferRunId, inputContext, sourceDomain, targetDomain) {
    if (!this.initialized) await this.initialize();

    try {
      // Get transfer run
      const run = await this.databaseWriter.read({
        table: 'transfer_learning_runs',
        filter: { id: transferRunId }
      });

      if (!run) {
        throw new Error('Transfer run not found');
      }

      // Get predictions (placeholder - would use actual models)
      const sourcePrediction = await this.getSourceDomainPrediction(sourceDomain, inputContext);
      const targetPrediction = await this.getTargetDomainPrediction(run.target_model_id, inputContext);

      // Store prediction
      const result = await this.databaseWriter.write({
        table: 'cross_domain_predictions',
        data: {
          transfer_run_id: transferRunId,
          source_domain: sourceDomain,
          target_domain: targetDomain,
          input_context: inputContext,
          source_domain_prediction: sourcePrediction,
          target_domain_prediction: targetPrediction,
          adaptation_confidence: 0.8
        }
      });

      return {
        success: true,
        sourcePrediction,
        targetPrediction,
        predictionId: result.id
      };
    } catch (error) {
      logger.error('Failed to make cross-domain prediction:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get source domain prediction (placeholder)
   */
  async getSourceDomainPrediction(domain, context) {
    // TODO: Integrate with actual model service
    return Math.random() * 0.3 + 0.5;
  }

  /**
   * Get target domain prediction (placeholder)
   */
  async getTargetDomainPrediction(modelId, context) {
    // TODO: Integrate with actual model service
    return Math.random() * 0.3 + 0.6;
  }
}

// Singleton instance
let instance = null;

function getCrossDomainService() {
  if (!instance) {
    instance = new CrossDomainService();
  }
  return instance;
}

module.exports = {
  CrossDomainService,
  getCrossDomainService
};
