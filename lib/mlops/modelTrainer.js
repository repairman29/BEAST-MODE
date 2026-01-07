/**
 * Model Trainer
 * Trains ML models using collected training data
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('ModelTrainer');
const { getTrainingPipeline } = require('./trainingPipeline');
const { getMLflowService } = require('./mlflowService');

class ModelTrainer {
  constructor() {
    this.pipeline = null;
    this.mlflow = null;
    this.initialized = false;
  }

  /**
   * Initialize trainer
   */
  async initialize() {
    if (this.initialized) return;

    try {
      this.pipeline = await getTrainingPipeline();
      this.mlflow = await getMLflowService();
      this.initialized = true;
      log.info('✅ Model trainer initialized');
    } catch (error) {
      log.error('Failed to initialize model trainer:', error.message);
      throw error;
    }
  }

  /**
   * Train Code Quality Predictor
   */
  async trainCodeQualityModel(options = {}) {
    await this.initialize();

    const {
      minExamples = 100,
      testSplit = 0.2,
      validationSplit = 0.1
    } = options;

    log.info('🎯 Training Code Quality Predictor...');

    // 1. Get training data
    const dataset = await this.pipeline.buildTrainingDataset({
      productionLimit: 10000,
      githubLimit: 10000,
      minQuality: 0.0, // Include all for now
      validate: true
    });

    if (dataset.dataset.length < minExamples) {
      throw new Error(`Not enough training examples: ${dataset.dataset.length} < ${minExamples}`);
    }

    // 2. Filter for code quality examples
    const codeQualityExamples = dataset.dataset.filter(ex => 
      ex.predictionType === 'code-quality' || 
      ex.serviceName === 'code-roach' ||
      ex.source === 'github'
    );

    if (codeQualityExamples.length < minExamples) {
      throw new Error(`Not enough code quality examples: ${codeQualityExamples.length} < ${minExamples}`);
    }

    // 3. Start MLflow run
    const run = await this.mlflow.startRun('code-quality-train', {
      model_type: 'code-quality',
      dataset_size: codeQualityExamples.length
    });

    try {
      // 4. Prepare features and labels
      const { features, labels } = this.prepareTrainingData(codeQualityExamples);

      // 5. Split data
      const { trainX, trainY, testX, testY, valX, valY } = this.splitData(
        features,
        labels,
        testSplit,
        validationSplit
      );

      // 6. Train model (using simple approach for now - can upgrade to XGBoost later)
      const model = this.trainSimpleModel(trainX, trainY, valX, valY);

      // 7. Evaluate
      const metrics = this.evaluateModel(model, testX, testY);

      // 8. Log to MLflow
      await this.mlflow.logMetric(run.info.run_id, 'accuracy', metrics.accuracy);
      await this.mlflow.logMetric(run.info.run_id, 'mae', metrics.mae);
      await this.mlflow.logMetric(run.info.run_id, 'rmse', metrics.rmse);
      await this.mlflow.logParam(run.info.run_id, 'model_type', 'linear-regression');
      await this.mlflow.logParam(run.info.run_id, 'train_size', trainX.length);
      await this.mlflow.logParam(run.info.run_id, 'test_size', testX.length);

      // 9. End run
      await this.mlflow.endRun(run.info.run_id, 'FINISHED');

      log.info(`✅ Model trained! Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);

      return {
        model,
        metrics,
        runId: run.info.run_id
      };
    } catch (error) {
      await this.mlflow.endRun(run.info.run_id, 'FAILED');
      throw error;
    }
  }

  /**
   * Prepare training data
   */
  prepareTrainingData(examples) {
    const features = [];
    const labels = [];

    for (const example of examples) {
      if (example.actualValue === null || example.actualValue === undefined) {
        continue; // Skip examples without labels
      }

      // Extract features
      const featureVector = this.extractFeatures(example);
      features.push(featureVector);
      labels.push(example.actualValue);
    }

    return { features, labels };
  }

  /**
   * Extract features from example
   */
  extractFeatures(example) {
    const feat = example.features || {};
    
    return [
      feat.codeComplexity || 0,
      feat.testCoverage || 0,
      feat.codeQuality || 0,
      feat.security || 0,
      feat.performance || 0,
      feat.maintainability || 0,
      feat.queryLength || 0,
      feat.codeLength || 0,
      feat.confidence || 0,
      feat.previousAccuracy || 0,
      feat.previousSuccess || 0
    ];
  }

  /**
   * Split data into train/test/val
   */
  splitData(features, labels, testSplit, valSplit) {
    const total = features.length;
    const testSize = Math.floor(total * testSplit);
    const valSize = Math.floor(total * valSplit);
    const trainSize = total - testSize - valSize;

    const trainX = features.slice(0, trainSize);
    const trainY = labels.slice(0, trainSize);
    const valX = features.slice(trainSize, trainSize + valSize);
    const valY = labels.slice(trainSize, trainSize + valSize);
    const testX = features.slice(trainSize + valSize);
    const testY = labels.slice(trainSize + valSize);

    return { trainX, trainY, testX, testY, valX, valY };
  }

  /**
   * Train simple linear regression model
   * TODO: Upgrade to XGBoost/Random Forest when we have more data
   */
  trainSimpleModel(trainX, trainY, valX, valY) {
    // Simple linear regression using gradient descent
    const numFeatures = trainX[0].length;
    const weights = new Array(numFeatures).fill(0);
    const bias = 0;
    const learningRate = 0.01;
    const epochs = 100;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;

      for (let i = 0; i < trainX.length; i++) {
        // Predict
        let prediction = bias;
        for (let j = 0; j < numFeatures; j++) {
          prediction += weights[j] * trainX[i][j];
        }
        prediction = Math.max(0, Math.min(1, prediction)); // Clamp to [0, 1]

        // Error
        const error = trainY[i] - prediction;
        totalError += Math.abs(error);

        // Update weights
        for (let j = 0; j < numFeatures; j++) {
          weights[j] += learningRate * error * trainX[i][j];
        }
        bias += learningRate * error;
      }

      // Validation error
      if (epoch % 10 === 0) {
        let valError = 0;
        for (let i = 0; i < valX.length; i++) {
          let pred = bias;
          for (let j = 0; j < numFeatures; j++) {
            pred += weights[j] * valX[i][j];
          }
          valError += Math.abs(valY[i] - Math.max(0, Math.min(1, pred)));
        }
        log.debug(`Epoch ${epoch}: Train MAE: ${(totalError / trainX.length).toFixed(4)}, Val MAE: ${(valError / valX.length).toFixed(4)}`);
      }
    }

    return { weights, bias, numFeatures };
  }

  /**
   * Evaluate model
   */
  evaluateModel(model, testX, testY) {
    const { weights, bias } = model;
    let totalError = 0;
    let squaredError = 0;
    let correct = 0;

    for (let i = 0; i < testX.length; i++) {
      let prediction = bias;
      for (let j = 0; j < weights.length; j++) {
        prediction += weights[j] * testX[i][j];
      }
      prediction = Math.max(0, Math.min(1, prediction));

      const error = Math.abs(testY[i] - prediction);
      totalError += error;
      squaredError += error * error;

      // Count as correct if within 0.1
      if (error < 0.1) {
        correct++;
      }
    }

    return {
      accuracy: correct / testX.length,
      mae: totalError / testX.length,
      rmse: Math.sqrt(squaredError / testX.length)
    };
  }

  /**
   * Predict using trained model
   */
  predict(model, features) {
    const { weights, bias } = model;
    let prediction = bias;
    
    for (let i = 0; i < Math.min(weights.length, features.length); i++) {
      prediction += weights[i] * features[i];
    }
    
    return Math.max(0, Math.min(1, prediction));
  }
}

// Singleton instance
let instance = null;

async function getModelTrainer() {
  if (!instance) {
    instance = new ModelTrainer();
    await instance.initialize();
  }
  return instance;
}

module.exports = {
  ModelTrainer,
  getModelTrainer
};

