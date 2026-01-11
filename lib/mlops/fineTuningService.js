/**
 * Fine-Tuning Service with Database Integration
 * Uses new fine-tuning tables for jobs, versions, updates, and metrics
 * 
 * Dog Fooding: Built using BEAST MODE's codebase chat API
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
const { getDatabaseWriter } = require('./databaseWriter');
const { getModelFineTuning } = require('./modelFineTuning');

const logger = createLogger('FineTuningService');

class FineTuningService {
  constructor() {
    this.databaseWriter = null;
    this.modelFineTuning = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.databaseWriter = getDatabaseWriter();
      this.modelFineTuning = getModelFineTuning();
      await this.modelFineTuning.initialize();
      this.initialized = true;
      logger.info('✅ Fine-tuning service initialized with database integration');
      return true;
    } catch (error) {
      logger.error('Failed to initialize fine-tuning service:', error);
      return false;
    }
  }

  /**
   * Create fine-tuning job
   */
  async createJob(userId, config) {
    if (!this.initialized) await this.initialize();

    const {
      baseModelId,
      baseModelVersion,
      jobName,
      description,
      trainingData,
      hyperparameters
    } = config;

    try {
      // Hash training data
      const trainingDataHash = this.hashData(trainingData);

      const result = await this.databaseWriter.write({
        table: 'fine_tuning_jobs',
        data: {
          user_id: userId,
          base_model_id: baseModelId,
          base_model_version: baseModelVersion,
          job_name: jobName,
          description,
          training_data_count: trainingData.length,
          training_data_hash: trainingDataHash,
          hyperparameters: hyperparameters || {},
          status: 'queued',
          total_epochs: hyperparameters?.epochs || 10
        }
      });

      logger.info(`Created fine-tuning job: ${jobName} (${result.id})`);
      return { success: true, id: result.id, job: result };
    } catch (error) {
      logger.error('Failed to create fine-tuning job:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute fine-tuning job
   */
  async executeJob(jobId) {
    if (!this.initialized) await this.initialize();

    try {
      // Get job
      const job = await this.databaseWriter.read({
        table: 'fine_tuning_jobs',
        filter: { id: jobId }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // Update status to running
      await this.databaseWriter.update({
        table: 'fine_tuning_jobs',
        filter: { id: jobId },
        data: {
          status: 'running',
          started_at: new Date().toISOString()
        }
      });

      // Fine-tune model
      const fineTuneResult = await this.modelFineTuning.fineTuneModel(
        job.base_model_id,
        [], // Training data would be loaded from storage
        job.hyperparameters
      );

      if (!fineTuneResult.success) {
        await this.databaseWriter.update({
          table: 'fine_tuning_jobs',
          filter: { id: jobId },
          data: {
            status: 'failed',
            error_message: fineTuneResult.message || 'Fine-tuning failed',
            completed_at: new Date().toISOString()
          }
        });
        return { success: false, error: fineTuneResult.message };
      }

      // Create model version
      const modelVersion = await this.createModelVersion(
        job.base_model_id,
        fineTuneResult.modelPath,
        jobId
      );

      // Update job
      await this.databaseWriter.update({
        table: 'fine_tuning_jobs',
        filter: { id: jobId },
        data: {
          status: 'completed',
          fine_tuned_model_id: job.base_model_id,
          fine_tuned_model_version: modelVersion.version,
          performance_metrics: fineTuneResult.metrics || {},
          progress_percentage: 100,
          completed_at: new Date().toISOString()
        }
      });

      return {
        success: true,
        modelVersion: modelVersion.version,
        metrics: fineTuneResult.metrics
      };
    } catch (error) {
      logger.error('Failed to execute fine-tuning job:', error);
      await this.databaseWriter.update({
        table: 'fine_tuning_jobs',
        filter: { id: jobId },
        data: {
          status: 'failed',
          error_message: error.message
        }
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create model version
   */
  async createModelVersion(modelId, modelPath, fineTuningJobId = null) {
    if (!this.initialized) await this.initialize();

    try {
      // Get latest version
      const latestVersion = await this.databaseWriter.read({
        table: 'model_versions',
        filter: { model_id: modelId },
        orderBy: { created_at: 'desc' },
        limit: 1
      });

      // Increment version
      let version = 'v1.0.0';
      if (latestVersion && latestVersion.length > 0) {
        const currentVersion = latestVersion[0].version;
        const versionParts = currentVersion.replace('v', '').split('.');
        const major = parseInt(versionParts[0]) || 0;
        const minor = parseInt(versionParts[1]) || 0;
        const patch = parseInt(versionParts[2]) || 0;
        version = `v${major}.${minor + 1}.${patch}`;
      }

      // Get parent version
      const parentVersionId = latestVersion && latestVersion.length > 0 ? latestVersion[0].id : null;

      // Hash model file
      const modelHash = this.hashFile(modelPath);

      const result = await this.databaseWriter.write({
        table: 'model_versions',
        data: {
          model_id: modelId,
          version,
          parent_version_id: parentVersionId,
          fine_tuning_job_id: fineTuningJobId,
          model_path: modelPath,
          model_hash: modelHash
        }
      });

      return { success: true, id: result.id, version, ...result };
    } catch (error) {
      logger.error('Failed to create model version:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record fine-tuning metrics
   */
  async recordMetrics(jobId, epoch, metrics) {
    if (!this.initialized) await this.initialize();

    try {
      for (const [metricName, metricValue] of Object.entries(metrics)) {
        await this.databaseWriter.write({
          table: 'fine_tuning_metrics',
          data: {
            job_id: jobId,
            epoch,
            metric_name: metricName,
            metric_value: metricValue
          }
        });
      }

      // Update job progress
      const job = await this.databaseWriter.read({
        table: 'fine_tuning_jobs',
        filter: { id: jobId }
      });

      if (job && job.total_epochs) {
        const progress = (epoch / job.total_epochs) * 100;
        await this.databaseWriter.update({
          table: 'fine_tuning_jobs',
          filter: { id: jobId },
          data: {
            current_epoch: epoch,
            progress_percentage: Math.min(100, progress)
          }
        });
      }
    } catch (error) {
      logger.warn('Failed to record metrics:', error);
    }
  }

  /**
   * Create incremental update
   */
  async createIncrementalUpdate(jobId, modelVersionId, newData) {
    if (!this.initialized) await this.initialize();

    try {
      // Get previous model version
      const modelVersion = await this.databaseWriter.read({
        table: 'model_versions',
        filter: { id: modelVersionId }
      });

      if (!modelVersion) {
        throw new Error('Model version not found');
      }

      // Fine-tune incrementally
      const updateResult = await this.modelFineTuning.fineTuneModel(
        modelVersion.model_id,
        newData,
        { epochs: 1, learningRate: 0.0001 } // Lower learning rate for incremental
      );

      if (!updateResult.success) {
        throw new Error(updateResult.message);
      }

      // Create new model version
      const newModelVersion = await this.createModelVersion(
        modelVersion.model_id,
        updateResult.modelPath,
        jobId
      );

      // Create incremental update record
      const result = await this.databaseWriter.write({
        table: 'incremental_updates',
        data: {
          job_id: jobId,
          model_version_id: modelVersionId,
          update_type: 'incremental',
          new_data_count: newData.length,
          previous_model_version: modelVersion.version,
          new_model_version: newModelVersion.version,
          performance_delta: updateResult.metrics || {},
          is_applied: false
        }
      });

      return { success: true, id: result.id, newVersion: newModelVersion.version };
    } catch (error) {
      logger.error('Failed to create incremental update:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Hash data
   */
  hashData(data) {
    const crypto = require('crypto');
    const str = JSON.stringify(data);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Hash file
   */
  hashFile(filePath) {
    const crypto = require('crypto');
    const fs = require('fs');
    try {
      const fileBuffer = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      return crypto.createHash('sha256').update(filePath).digest('hex');
    }
  }
}

// Singleton instance
let instance = null;

function getFineTuningService() {
  if (!instance) {
    instance = new FineTuningService();
  }
  return instance;
}

module.exports = {
  FineTuningService,
  getFineTuningService
};
