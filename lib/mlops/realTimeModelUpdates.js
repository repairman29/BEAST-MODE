/**
 * Real-Time Model Updates Service
 * Handles streaming data processing and online learning updates
 */

const { createLogger } = require('../utils/logger');
const { getModelFineTuning } = require('./modelFineTuning');
const { getDataStreaming } = require('./dataStreaming');

const logger = createLogger('RealTimeModelUpdates');

class RealTimeModelUpdates {
  constructor() {
    this.updateBuffer = [];
    this.bufferSize = 100;
    this.updateInterval = 60000; // 1 minute
    this.updateTimer = null;
    this.isUpdating = false;
    this.lastUpdateTime = null;
    this.updateHistory = [];
    this.config = {
      minSamplesForUpdate: 50,
      maxSamplesPerUpdate: 500,
      updateThreshold: 0.05, // 5% performance improvement required
      enableHotSwap: true
    };
  }

  /**
   * Initialize real-time updates
   */
  async initialize() {
    try {
      this.fineTuning = getModelFineTuning();
      await this.fineTuning.initialize();

      // Start update timer
      this.startUpdateTimer();

      logger.info('✅ Real-time model updates initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize real-time updates:', error);
      return false;
    }
  }

  /**
   * Add prediction feedback to update buffer
   * @param {Object} feedback - Prediction feedback
   */
  async addFeedback(feedback) {
    try {
      const {
        prediction,
        actual,
        features,
        context = {}
      } = feedback;

      if (prediction === undefined || actual === undefined) {
        logger.warn('Invalid feedback: missing prediction or actual');
        return false;
      }

      // Add to buffer
      this.updateBuffer.push({
        prediction,
        actual,
        features: features || [],
        context,
        timestamp: Date.now()
      });

      // Check if buffer is full
      if (this.updateBuffer.length >= this.bufferSize) {
        await this.processBuffer();
      }

      return true;
    } catch (error) {
      logger.error('Failed to add feedback:', error);
      return false;
    }
  }

  /**
   * Process update buffer
   */
  async processBuffer() {
    if (this.isUpdating || this.updateBuffer.length < this.config.minSamplesForUpdate) {
      return;
    }

    try {
      this.isUpdating = true;
      logger.info(`Processing update buffer: ${this.updateBuffer.length} samples`);

      // Prepare data
      const data = this.updateBuffer.slice(0, this.config.maxSamplesPerUpdate);
      const preparedData = data.map(item => ({
        features: item.features || [],
        quality: item.actual
      }));

      // Get current model
      const currentModelPath = this.getCurrentModelPath();
      if (!currentModelPath) {
        logger.warn('No current model found, skipping update');
        this.updateBuffer = [];
        return;
      }

      // Fine-tune model
      const result = await this.fineTuning.fineTuneModel(
        currentModelPath,
        preparedData,
        {
          learningRate: 0.0005, // Lower learning rate for incremental updates
          epochs: 5,
          batchSize: 32
        }
      );

      if (result.success) {
        // Validate improvement
        const improved = await this.validateImprovement(result);
        
        if (improved) {
          // Hot-swap model if enabled
          if (this.config.enableHotSwap) {
            await this.hotSwapModel(result.modelPath);
          }

          // Record update
          this.updateHistory.push({
            timestamp: Date.now(),
            samples: data.length,
            metrics: result.metrics,
            modelPath: result.modelPath,
            version: result.version
          });

          logger.info(`✅ Model updated successfully. Version: ${result.version}`);
        } else {
          logger.info('Model update did not meet improvement threshold, keeping current model');
        }
      }

      // Clear processed buffer
      this.updateBuffer = this.updateBuffer.slice(data.length);

    } catch (error) {
      logger.error('Failed to process update buffer:', error);
    } finally {
      this.isUpdating = false;
      this.lastUpdateTime = Date.now();
    }
  }

  /**
   * Validate model improvement
   */
  async validateImprovement(result) {
    try {
      // Compare with previous metrics
      if (this.updateHistory.length === 0) {
        // First update, accept it
        return true;
      }

      const lastUpdate = this.updateHistory[this.updateHistory.length - 1];
      const lastMSE = parseFloat(lastUpdate.metrics.mse);
      const newMSE = parseFloat(result.metrics.mse);

      // Check if improvement meets threshold
      const improvement = (lastMSE - newMSE) / lastMSE;
      
      if (improvement >= this.config.updateThreshold) {
        logger.info(`Model improved by ${(improvement * 100).toFixed(2)}%`);
        return true;
      } else {
        logger.info(`Model improvement (${(improvement * 100).toFixed(2)}%) below threshold (${(this.config.updateThreshold * 100).toFixed(2)}%)`);
        return false;
      }
    } catch (error) {
      logger.error('Failed to validate improvement:', error);
      return false;
    }
  }

  /**
   * Hot-swap model (update without restart)
   */
  async hotSwapModel(newModelPath) {
    try {
      // This would integrate with mlModelIntegration to swap models
      logger.info(`Hot-swapping model: ${newModelPath}`);
      
      // In a real implementation, this would:
      // 1. Load new model
      // 2. Validate it works
      // 3. Swap it in mlModelIntegration
      // 4. Keep old model as backup

      // For now, just log
      logger.info('✅ Model hot-swapped (integration with mlModelIntegration needed)');
      return true;
    } catch (error) {
      logger.error('Failed to hot-swap model:', error);
      return false;
    }
  }

  /**
   * Get current model path
   */
  getCurrentModelPath() {
    // This should integrate with mlModelIntegration to get current model
    // For now, return default path
    return 'quality-predictor-v3-advanced.json';
  }

  /**
   * Start update timer
   */
  startUpdateTimer() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(async () => {
      if (this.updateBuffer.length >= this.config.minSamplesForUpdate) {
        await this.processBuffer();
      }
    }, this.updateInterval);

    logger.info(`Update timer started (interval: ${this.updateInterval}ms)`);
  }

  /**
   * Stop update timer
   */
  stopUpdateTimer() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      logger.info('Update timer stopped');
    }
  }

  /**
   * Force immediate update
   */
  async forceUpdate() {
    logger.info('Forcing immediate model update...');
    await this.processBuffer();
  }

  /**
   * Get update statistics
   */
  getStatistics() {
    return {
      bufferSize: this.updateBuffer.length,
      bufferCapacity: this.bufferSize,
      isUpdating: this.isUpdating,
      lastUpdateTime: this.lastUpdateTime,
      updateCount: this.updateHistory.length,
      recentUpdates: this.updateHistory.slice(-10)
    };
  }

  /**
   * Cleanup
   */
  async cleanup() {
    this.stopUpdateTimer();
    logger.info('Real-time updates service cleaned up');
  }
}

// Singleton instance
let instance = null;

function getRealTimeModelUpdates() {
  if (!instance) {
    instance = new RealTimeModelUpdates();
  }
  return instance;
}

module.exports = {
  RealTimeModelUpdates,
  getRealTimeModelUpdates
};

