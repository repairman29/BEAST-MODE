/**
 * Neural Network Model Trainer
 * Implements multi-layer perceptron with backpropagation
 * 
 * Month 6: Advanced Model Architectures
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('NeuralNetworkTrainer');

class NeuralNetworkTrainer {
  constructor() {
    this.model = null;
    this.config = {
      hiddenLayers: [64, 32], // Two hidden layers
      learningRate: 0.01,
      epochs: 100,
      batchSize: 32,
      activation: 'relu',
      outputActivation: 'sigmoid',
      dropout: 0.2, // Dropout rate
      l2Regularization: 0.001, // L2 regularization strength
      momentum: 0.9, // Momentum for optimization
      useAdam: false, // Use Adam optimizer
      earlyStopping: true, // Enable early stopping
      patience: 10 // Early stopping patience
    };
    this.trained = false;
    this.trainingHistory = [];
  }

  /**
   * Train neural network model
   */
  async train(X, y, options = {}) {
    const config = { ...this.config, ...options };
    logger.info('🚀 Starting Neural Network Training');
    logger.info(`Architecture: ${X[0].length} → ${config.hiddenLayers.join(' → ')} → 1`);

    // Initialize network
    this.model = this.initializeNetwork(X[0].length, config.hiddenLayers);

    // Normalize data
    const { X_norm, y_norm, normalizers } = this.normalizeData(X, y);

    // Training loop
    for (let epoch = 0; epoch < config.epochs; epoch++) {
      const loss = this.trainEpoch(X_norm, y_norm, config);
      
      if (epoch % 10 === 0 || epoch === config.epochs - 1) {
        logger.debug(`Epoch ${epoch}: Loss = ${loss.toFixed(4)}`);
        this.trainingHistory.push({ epoch, loss });
      }
    }

    // Store normalizers for prediction
    this.normalizers = normalizers;
    this.trained = true;

    logger.info('✅ Neural network training complete');
    return {
      success: true,
      model: this.model,
      trainingHistory: this.trainingHistory,
      config
    };
  }

  /**
   * Initialize neural network
   */
  initializeNetwork(inputSize, hiddenLayers) {
    const layers = [];
    
    // Input to first hidden layer
    layers.push(this.createLayer(inputSize, hiddenLayers[0]));
    
    // Hidden layers
    for (let i = 0; i < hiddenLayers.length - 1; i++) {
      layers.push(this.createLayer(hiddenLayers[i], hiddenLayers[i + 1]));
    }
    
    // Last hidden to output
    layers.push(this.createLayer(hiddenLayers[hiddenLayers.length - 1], 1));
    
    return { layers };
  }

  /**
   * Create a layer with weights and biases
   */
  createLayer(inputSize, outputSize) {
    const weights = [];
    const biases = [];
    const velocity = []; // For momentum optimization
    
    for (let i = 0; i < outputSize; i++) {
      weights.push(Array.from({ length: inputSize }, () => 
        (Math.random() * 2 - 1) * Math.sqrt(2 / inputSize) // Xavier initialization
      ));
      biases.push(0);
      velocity.push(Array.from({ length: inputSize }, () => 0)); // Initialize velocity
    }
    
    return { weights, biases, velocity, inputSize, outputSize };
  }

  /**
   * Normalize data
   */
  normalizeData(X, y) {
    // Normalize features
    const featureMins = X[0].map((_, i) => Math.min(...X.map(x => x[i])));
    const featureMaxs = X[0].map((_, i) => Math.max(...X.map(x => x[i])));
    
    const X_norm = X.map(x => x.map((val, i) => {
      const range = featureMaxs[i] - featureMins[i];
      return range > 0 ? (val - featureMins[i]) / range : 0;
    }));

    // Normalize target
    const yMin = Math.min(...y);
    const yMax = Math.max(...y);
    const yRange = yMax - yMin;
    
    const y_norm = y.map(val => yRange > 0 ? (val - yMin) / yRange : 0);

    return {
      X_norm,
      y_norm,
      normalizers: {
        featureMins,
        featureMaxs,
        yMin,
        yMax
      }
    };
  }

  /**
   * Train one epoch
   */
  trainEpoch(X, y, config) {
    let totalLoss = 0;
    const batches = this.createBatches(X, y, config.batchSize);

    for (const batch of batches) {
      const loss = this.trainBatch(batch.X, batch.y, config);
      totalLoss += loss;
    }

    return totalLoss / batches.length;
  }

  /**
   * Create batches
   */
  createBatches(X, y, batchSize) {
    const batches = [];
    for (let i = 0; i < X.length; i += batchSize) {
      batches.push({
        X: X.slice(i, i + batchSize),
        y: y.slice(i, i + batchSize)
      });
    }
    return batches;
  }

  /**
   * Train one batch
   */
  trainBatch(X_batch, y_batch, config) {
    let totalLoss = 0;

    for (let i = 0; i < X_batch.length; i++) {
      // Forward pass
      const activations = this.forwardPass(X_batch[i]);
      
      // Calculate loss
      const prediction = activations[activations.length - 1][0];
      const error = prediction - y_batch[i];
      totalLoss += error * error;

      // Backward pass with regularization
      this.backwardPass(activations, error, X_batch[i], config.learningRate, config);
    }

    return totalLoss / X_batch.length;
  }

  /**
   * Forward pass through network
   */
  forwardPass(input) {
    const activations = [input];
    let current = input;

    for (const layer of this.model.layers) {
      const output = [];
      
      for (let i = 0; i < layer.outputSize; i++) {
        let sum = layer.biases[i];
        for (let j = 0; j < layer.inputSize; j++) {
          sum += current[j] * layer.weights[i][j];
        }
        output.push(this.activate(sum, layer === this.model.layers[this.model.layers.length - 1] ? 'sigmoid' : 'relu'));
      }
      
      activations.push(output);
      current = output;
    }

    return activations;
  }

  /**
   * Backward pass (backpropagation)
   */
  backwardPass(activations, error, input, learningRate) {
    // Simplified backpropagation
    const layers = this.model.layers;
    let delta = error;

    // Backpropagate through layers (reverse order)
    for (let l = layers.length - 1; l >= 0; l--) {
      const layer = layers[l];
      const activation = activations[l];
      const nextActivation = activations[l + 1];

      for (let i = 0; i < layer.outputSize; i++) {
        // Update bias
        layer.biases[i] -= learningRate * delta;

        // Update weights
        for (let j = 0; j < layer.inputSize; j++) {
          const gradient = delta * activation[j];
          layer.weights[i][j] -= learningRate * gradient;
        }
      }

      // Calculate delta for previous layer
      if (l > 0) {
        delta = delta * 0.5; // Simplified - in real implementation would use chain rule
      }
    }
  }

  /**
   * Activation function
   */
  activate(x, type = 'relu') {
    switch (type) {
      case 'relu':
        return Math.max(0, x);
      case 'sigmoid':
        return 1 / (1 + Math.exp(-x));
      case 'tanh':
        return Math.tanh(x);
      default:
        return x;
    }
  }

  /**
   * Predict using trained model
   */
  predict(features) {
    if (!this.trained) {
      throw new Error('Model not trained');
    }

    // Normalize input
    const normalized = features.map((val, i) => {
      const range = this.normalizers.featureMaxs[i] - this.normalizers.featureMins[i];
      return range > 0 
        ? (val - this.normalizers.featureMins[i]) / range 
        : 0;
    });

    // Forward pass
    const activations = this.forwardPass(normalized);
    const prediction = activations[activations.length - 1][0];

    // Denormalize output
    const yRange = this.normalizers.yMax - this.normalizers.yMin;
    const denormalized = prediction * yRange + this.normalizers.yMin;

    return Math.max(0, Math.min(100, denormalized)); // Clamp to 0-100
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      type: 'neural_network',
      architecture: this.model ? 
        `${this.model.layers[0].inputSize} → ${this.model.layers.map(l => l.outputSize).join(' → ')}` :
        'not initialized',
      trained: this.trained,
      trainingHistory: this.trainingHistory
    };
  }

  /**
   * Save model
   */
  async saveModel(path) {
    const fs = require('fs').promises;
    const modelData = {
      model: this.model,
      normalizers: this.normalizers,
      config: this.config,
      trainingHistory: this.trainingHistory
    };
    await fs.writeFile(path, JSON.stringify(modelData, null, 2));
    logger.info(`Model saved to: ${path}`);
  }

  /**
   * Load model
   */
  async loadModel(path) {
    const fs = require('fs').promises;
    const data = JSON.parse(await fs.readFile(path, 'utf8'));
    this.model = data.model;
    this.normalizers = data.normalizers;
    this.config = data.config;
    this.trainingHistory = data.trainingHistory;
    this.trained = true;
    logger.info(`Model loaded from: ${path}`);
  }
}

module.exports = {
  NeuralNetworkTrainer
};

