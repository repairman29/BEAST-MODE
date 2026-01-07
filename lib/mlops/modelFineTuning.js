/**
 * Model Fine-Tuning Service
 * Fine-tunes existing models with new production data
 * Supports incremental learning and model versioning
 */

const fs = require('fs').promises;
const path = require('path');
const { createLogger } = require('../utils/logger');

const logger = createLogger('ModelFineTuning');

class ModelFineTuning {
  constructor() {
    this.modelsDir = path.join(__dirname, '../../models');
    this.fineTunedDir = path.join(__dirname, '../../models/fine-tuned');
    this.config = {
      learningRate: 0.001,
      batchSize: 32,
      epochs: 10,
      validationSplit: 0.2,
      minSamples: 100,
      maxSamples: 10000
    };
  }

  /**
   * Initialize fine-tuning service
   */
  async initialize() {
    try {
      // Ensure directories exist
      await fs.mkdir(this.fineTunedDir, { recursive: true });
      logger.info('✅ Model fine-tuning service initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize fine-tuning service:', error);
      return false;
    }
  }

  /**
   * Fine-tune a model with new data
   * @param {string} baseModelPath - Path to base model
   * @param {Array} newData - New training data
   * @param {Object} options - Fine-tuning options
   */
  async fineTuneModel(baseModelPath, newData, options = {}) {
    try {
      logger.info(`Fine-tuning model: ${baseModelPath}`);

      // Validate data
      if (!newData || newData.length < this.config.minSamples) {
        throw new Error(`Insufficient data: ${newData?.length || 0} samples (min: ${this.config.minSamples})`);
      }

      // Load base model
      const baseModel = await this.loadModel(baseModelPath);
      if (!baseModel) {
        throw new Error(`Failed to load base model: ${baseModelPath}`);
      }

      // Prepare data
      const { X, y } = this.prepareData(newData);
      
      // Limit data size
      const limitedData = this.limitDataSize(X, y, this.config.maxSamples);
      
      // Split for validation
      const { X_train, y_train, X_val, y_val } = this.splitData(
        limitedData.X,
        limitedData.y,
        this.config.validationSplit
      );

      // Fine-tune model
      const fineTunedModel = await this.performFineTuning(
        baseModel,
        X_train,
        y_train,
        X_val,
        y_val,
        { ...this.config, ...options }
      );

      // Evaluate fine-tuned model
      const metrics = await this.evaluateModel(fineTunedModel, X_val, y_val);

      // Save fine-tuned model
      const version = this.getNextVersion(baseModelPath);
      const savePath = await this.saveModel(fineTunedModel, baseModelPath, version);

      logger.info(`✅ Model fine-tuned successfully. Version: ${version}`);
      logger.info(`Metrics: ${JSON.stringify(metrics)}`);

      return {
        success: true,
        modelPath: savePath,
        version,
        metrics,
        baseModel: baseModelPath
      };
    } catch (error) {
      logger.error('Fine-tuning failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load a model from file
   */
  async loadModel(modelPath) {
    try {
      const fullPath = path.isAbsolute(modelPath) 
        ? modelPath 
        : path.join(this.modelsDir, modelPath);
      
      const data = await fs.readFile(fullPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Failed to load model: ${modelPath}`, error);
      return null;
    }
  }

  /**
   * Prepare data for training
   */
  prepareData(data) {
    const X = [];
    const y = [];

    for (const sample of data) {
      if (sample.features && sample.quality !== undefined) {
        X.push(sample.features);
        y.push(sample.quality);
      }
    }

    return { X, y };
  }

  /**
   * Limit data size for efficiency
   */
  limitDataSize(X, y, maxSize) {
    if (X.length <= maxSize) {
      return { X, y };
    }

    // Random sampling
    const indices = Array.from({ length: X.length }, (_, i) => i);
    const shuffled = indices.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, maxSize);

    return {
      X: selected.map(i => X[i]),
      y: selected.map(i => y[i])
    };
  }

  /**
   * Split data for training and validation
   */
  splitData(X, y, validationSplit) {
    const splitIndex = Math.floor(X.length * (1 - validationSplit));
    
    return {
      X_train: X.slice(0, splitIndex),
      y_train: y.slice(0, splitIndex),
      X_val: X.slice(splitIndex),
      y_val: y.slice(splitIndex)
    };
  }

  /**
   * Perform fine-tuning (simplified gradient descent)
   */
  async performFineTuning(baseModel, X_train, y_train, X_val, y_val, config) {
    // Create a copy of the base model
    const fineTunedModel = JSON.parse(JSON.stringify(baseModel));
    
    // Fine-tune using simplified gradient descent
    const numFeatures = X_train[0].length;
    const learningRate = config.learningRate;
    const epochs = config.epochs;
    const batchSize = config.batchSize;

    // Initialize weights if not present
    if (!fineTunedModel.weights) {
      fineTunedModel.weights = Array(numFeatures).fill(0);
      fineTunedModel.bias = 0;
    }

    // Training loop
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;
      const batches = this.createBatches(X_train, y_train, batchSize);

      for (const batch of batches) {
        const { X_batch, y_batch } = batch;
        
        // Calculate gradients
        const gradients = this.calculateGradients(
          fineTunedModel,
          X_batch,
          y_batch
        );

        // Update weights
        for (let i = 0; i < fineTunedModel.weights.length; i++) {
          fineTunedModel.weights[i] -= learningRate * gradients.weights[i];
        }
        fineTunedModel.bias -= learningRate * gradients.bias;

        // Calculate error
        const predictions = this.predictBatch(fineTunedModel, X_batch);
        totalError += this.calculateMSE(predictions, y_batch);
      }

      // Validation
      if (epoch % 2 === 0) {
        const valPredictions = this.predictBatch(fineTunedModel, X_val);
        const valError = this.calculateMSE(valPredictions, y_val);
        logger.debug(`Epoch ${epoch}: Train MSE = ${(totalError / batches.length).toFixed(4)}, Val MSE = ${valError.toFixed(4)}`);
      }
    }

    return fineTunedModel;
  }

  /**
   * Create batches from data
   */
  createBatches(X, y, batchSize) {
    const batches = [];
    for (let i = 0; i < X.length; i += batchSize) {
      batches.push({
        X_batch: X.slice(i, i + batchSize),
        y_batch: y.slice(i, i + batchSize)
      });
    }
    return batches;
  }

  /**
   * Calculate gradients for fine-tuning
   */
  calculateGradients(model, X, y) {
    const numFeatures = model.weights.length;
    const gradients = {
      weights: Array(numFeatures).fill(0),
      bias: 0
    };

    for (let i = 0; i < X.length; i++) {
      const prediction = this.predictSingle(model, X[i]);
      const error = prediction - y[i];

      for (let j = 0; j < numFeatures; j++) {
        gradients.weights[j] += error * X[i][j];
      }
      gradients.bias += error;
    }

    // Average gradients
    const n = X.length;
    for (let j = 0; j < numFeatures; j++) {
      gradients.weights[j] /= n;
    }
    gradients.bias /= n;

    return gradients;
  }

  /**
   * Predict single sample
   */
  predictSingle(model, features) {
    let prediction = model.bias || 0;
    for (let i = 0; i < features.length && i < model.weights.length; i++) {
      prediction += model.weights[i] * features[i];
    }
    return prediction;
  }

  /**
   * Predict batch
   */
  predictBatch(model, X) {
    return X.map(x => this.predictSingle(model, x));
  }

  /**
   * Calculate Mean Squared Error
   */
  calculateMSE(predictions, actual) {
    let sum = 0;
    for (let i = 0; i < predictions.length; i++) {
      const error = predictions[i] - actual[i];
      sum += error * error;
    }
    return sum / predictions.length;
  }

  /**
   * Evaluate model
   */
  async evaluateModel(model, X, y) {
    const predictions = this.predictBatch(model, X);
    const mse = this.calculateMSE(predictions, y);
    const mae = this.calculateMAE(predictions, y);
    const r2 = this.calculateR2(predictions, y);

    return {
      mse: mse.toFixed(4),
      mae: mae.toFixed(4),
      r2: r2.toFixed(4)
    };
  }

  /**
   * Calculate Mean Absolute Error
   */
  calculateMAE(predictions, actual) {
    let sum = 0;
    for (let i = 0; i < predictions.length; i++) {
      sum += Math.abs(predictions[i] - actual[i]);
    }
    return sum / predictions.length;
  }

  /**
   * Calculate R-squared
   */
  calculateR2(predictions, actual) {
    const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < predictions.length; i++) {
      ssRes += Math.pow(actual[i] - predictions[i], 2);
      ssTot += Math.pow(actual[i] - mean, 2);
    }

    return 1 - (ssRes / ssTot);
  }

  /**
   * Get next version number
   */
  getNextVersion(baseModelPath) {
    const baseName = path.basename(baseModelPath, '.json');
    const timestamp = Date.now();
    return `${baseName}-fine-tuned-v${timestamp}`;
  }

  /**
   * Save fine-tuned model
   */
  async saveModel(model, baseModelPath, version) {
    const filename = `${version}.json`;
    const savePath = path.join(this.fineTunedDir, filename);
    
    await fs.writeFile(savePath, JSON.stringify(model, null, 2));
    logger.info(`Saved fine-tuned model: ${savePath}`);
    
    return savePath;
  }

  /**
   * Get fine-tuning history
   */
  async getFineTuningHistory(baseModelPath) {
    try {
      const files = await fs.readdir(this.fineTunedDir);
      const baseName = path.basename(baseModelPath, '.json');
      const related = files.filter(f => f.includes(baseName));

      return related.map(f => ({
        filename: f,
        path: path.join(this.fineTunedDir, f),
        created: fs.stat(path.join(this.fineTunedDir, f)).then(s => s.mtime)
      }));
    } catch (error) {
      logger.error('Failed to get fine-tuning history:', error);
      return [];
    }
  }
}

// Singleton instance
let instance = null;

function getModelFineTuning() {
  if (!instance) {
    instance = new ModelFineTuning();
  }
  return instance;
}

module.exports = {
  ModelFineTuning,
  getModelFineTuning
};

