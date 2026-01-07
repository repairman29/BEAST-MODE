/**
 * Model Comparison Service
 * Benchmarks and compares all available models
 * 
 * Month 6: Week 2 - Model Comparison
 */

const { createLogger } = require('../utils/logger');
const { getMLModelIntegration } = require('./mlModelIntegration');
const logger = createLogger('ModelComparison');

class ModelComparison {
  constructor() {
    this.benchmarks = {};
    this.comparisonResults = null;
  }

  /**
   * Initialize model comparison
   */
  async initialize() {
    try {
      logger.info('✅ Model comparison service initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize model comparison:', error);
      return false;
    }
  }

  /**
   * Benchmark a model
   */
  async benchmarkModel(modelName, model, X_test, y_test) {
    try {
      logger.info(`Benchmarking model: ${modelName}`);

      const startTime = Date.now();
      const predictions = [];
      const errors = [];

      // Make predictions
      for (let i = 0; i < X_test.length; i++) {
        const pred = model.predict(X_test[i]);
        predictions.push(pred);
        errors.push(Math.abs(pred - y_test[i]));
      }

      const latency = Date.now() - startTime;
      const avgLatency = latency / X_test.length;

      // Calculate metrics
      const mse = this.calculateMSE(predictions, y_test);
      const mae = this.calculateMAE(predictions, y_test);
      const rmse = Math.sqrt(mse);
      const r2 = this.calculateR2(predictions, y_test);
      const accuracy = this.calculateAccuracy(predictions, y_test);

      const benchmark = {
        modelName,
        metrics: {
          mse: mse.toFixed(4),
          mae: mae.toFixed(4),
          rmse: rmse.toFixed(4),
          r2: r2.toFixed(4),
          accuracy: accuracy.toFixed(4)
        },
        performance: {
          totalLatency: latency,
          avgLatency: avgLatency.toFixed(2),
          predictionsPerSecond: (1000 / avgLatency).toFixed(2)
        },
        timestamp: Date.now()
      };

      this.benchmarks[modelName] = benchmark;
      logger.info(`✅ Benchmark complete for ${modelName}: MAE=${mae.toFixed(4)}, Accuracy=${accuracy.toFixed(4)}%`);

      return benchmark;
    } catch (error) {
      logger.error(`Benchmark failed for ${modelName}:`, error);
      return null;
    }
  }

  /**
   * Compare all available models
   */
  async compareModels(X_test, y_test) {
    try {
      logger.info('Comparing all available models...');

      const mlIntegration = await getMLModelIntegration();
      await mlIntegration.initialize();

      const comparisons = [];

      // Test current model
      if (mlIntegration.qualityPredictor && mlIntegration.qualityPredictor.trained) {
        const benchmark = await this.benchmarkModel(
          'current_model',
          mlIntegration.qualityPredictor,
          X_test,
          y_test
        );
        if (benchmark) {
          comparisons.push(benchmark);
        }
      }

      // Test neural network if available
      try {
        const { NeuralNetworkTrainer } = require('../models/neuralNetworkTrainer');
        const nnModel = new NeuralNetworkTrainer();
        // Would need to load trained model
        // const benchmark = await this.benchmarkModel('neural_network', nnModel, X_test, y_test);
      } catch (error) {
        logger.debug('Neural network not available for comparison');
      }

      // Test transformer if available
      try {
        const { TransformerTrainer } = require('../models/transformerTrainer');
        const transModel = new TransformerTrainer();
        // Would need to load trained model
        // const benchmark = await this.benchmarkModel('transformer', transModel, X_test, y_test);
      } catch (error) {
        logger.debug('Transformer not available for comparison');
      }

      // Determine best model
      const bestModel = this.selectBestModel(comparisons);

      this.comparisonResults = {
        comparisons,
        bestModel,
        timestamp: Date.now()
      };

      logger.info(`✅ Model comparison complete. Best model: ${bestModel?.modelName || 'none'}`);
      return this.comparisonResults;
    } catch (error) {
      logger.error('Model comparison failed:', error);
      return null;
    }
  }

  /**
   * Select best model based on metrics
   */
  selectBestModel(comparisons) {
    if (comparisons.length === 0) return null;

    // Score each model (lower MAE and higher accuracy = better)
    const scored = comparisons.map(comp => {
      const mae = parseFloat(comp.metrics.mae);
      const accuracy = parseFloat(comp.metrics.accuracy);
      const latency = parseFloat(comp.performance.avgLatency);

      // Composite score: lower is better
      const score = mae - (accuracy / 100) + (latency / 1000);

      return {
        ...comp,
        score
      };
    });

    // Sort by score (lower is better)
    scored.sort((a, b) => a.score - b.score);

    return scored[0];
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
   * Calculate accuracy (within 10% tolerance)
   */
  calculateAccuracy(predictions, actual) {
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
      const error = Math.abs(predictions[i] - actual[i]);
      const tolerance = actual[i] * 0.1; // 10% tolerance
      if (error <= tolerance) {
        correct++;
      }
    }
    return (correct / predictions.length) * 100;
  }

  /**
   * Get comparison results
   */
  getComparisonResults() {
    return this.comparisonResults || {
      comparisons: [],
      bestModel: null,
      message: 'No comparisons run yet'
    };
  }

  /**
   * Get benchmark for specific model
   */
  getBenchmark(modelName) {
    return this.benchmarks[modelName] || null;
  }
}

// Singleton instance
let instance = null;

function getModelComparison() {
  if (!instance) {
    instance = new ModelComparison();
  }
  return instance;
}

module.exports = {
  ModelComparison,
  getModelComparison
};

