/**
 * Quality Predictor Model Training
 * Trains a real ML model to predict code quality scores
 * Replaces heuristic-based quality prediction
 * 
 * Month 1: First Real ML Model
 */

const { createLogger } = require('../utils/logger');
const { getMLflowService } = require('../mlops/mlflowService');
const { getDataCollectionService } = require('../mlops/dataCollection');
const { getDataPreprocessingPipeline } = require('../mlops/dataPreprocessing');
const { getEnhancedFeatureEngineering } = require('../features/enhancedFeatureEngineering');
const log = createLogger('TrainQualityPredictor');

class QualityPredictorTrainer {
    constructor() {
        this.model = null;
        this.featureNames = [];
        this.trained = false;
    }

    /**
     * Train quality prediction model
     */
    async train(options = {}) {
        const {
            useMLflow = true,
            testSize = 0.2,
            minSamples = 100
        } = options;

        log.info('Starting quality predictor model training...');

        // Initialize services
        const mlflow = getMLflowService();
        const dataCollection = await getDataCollectionService();

        if (useMLflow) {
            await mlflow.initialize();
            await mlflow.startRun('quality-predictor-training', {
                model_type: 'quality_predictor',
                version: '1.0'
            });
        }

        try {
            // 1. Load training data
            log.info('Loading training data...');
            const trainingData = await dataCollection.getTrainingData('quality', {
                minSamples: minSamples
            });

            if (!trainingData || trainingData.length < minSamples) {
                throw new Error(`Insufficient training data: ${trainingData?.length || 0} < ${minSamples}`);
            }

            log.info(`Loaded ${trainingData.length} training samples`);

            // 2. Preprocess data (with enhanced features)
            const preprocessing = await getDataPreprocessingPipeline(trainingData);
            const preprocessedData = preprocessing.preprocessDataset(trainingData, {
                normalize: true,
                encodeCategorical: true,
                addDerivedFeatures: true
            });

            // 3. Extract enhanced features
            const enhancedFeatures = await getEnhancedFeatureEngineering();
            const enhancedData = await Promise.all(
                preprocessedData.map(async (sample) => {
                    const enhancedFeaturesData = await enhancedFeatures.extractEnhancedFeatures(
                        sample,
                        sample.metadata?.original?.context || {}
                    );
                    return {
                        ...sample,
                        features: {
                            ...sample.features,
                            ...enhancedFeaturesData
                        }
                    };
                })
            );

            // 4. Prepare features and targets
            const { X, y, featureNames } = this.prepareData(enhancedData);
            this.featureNames = featureNames;

            if (useMLflow) {
                await mlflow.logParam('training_samples', trainingData.length);
                await mlflow.logParam('features', featureNames.length);
            }

            // 3. Split data
            const splitIndex = Math.floor(X.length * (1 - testSize));
            const X_train = X.slice(0, splitIndex);
            const y_train = y.slice(0, splitIndex);
            const X_test = X.slice(splitIndex);
            const y_test = y.slice(splitIndex);

            log.info(`Split data: ${X_train.length} train, ${X_test.length} test`);
            log.info(`Features: ${featureNames.length} (${featureNames.slice(0, 5).join(', ')}...)`);

            // 5. Train model (using simple linear regression as baseline)
            // In production, this would use scikit-learn/XGBoost via Python bridge
            log.info('Training model...');
            this.model = this.trainModel(X_train, y_train);
            this.trained = true; // Mark as trained before evaluation

            // 6. Evaluate model
            log.info('Evaluating model...');
            const metrics = this.evaluateModel(X_test, y_test);

            log.info(`Model performance: R² = ${metrics.r2.toFixed(3)}, MAE = ${metrics.mae.toFixed(2)}`);

            // 7. Log to MLflow
            if (useMLflow) {
                await mlflow.logMetrics({
                    'r2_score': metrics.r2,
                    'mae': metrics.mae,
                    'rmse': metrics.rmse,
                    'accuracy': metrics.accuracy
                });
                await mlflow.logModel(this.model, 'quality_predictor');
            }

            log.info('✅ Quality predictor model trained successfully');

            return {
                success: true,
                metrics: metrics,
                model: this.model,
                featureNames: this.featureNames
            };

        } catch (error) {
            log.error('Training failed:', error.message);
            if (useMLflow) {
                await mlflow.endRun('FAILED');
            }
            throw error;
        } finally {
            if (useMLflow) {
                await mlflow.endRun('FINISHED');
            }
        }
    }

    /**
     * Prepare features and targets from training data
     */
    prepareData(data) {
        const features = [];
        const targets = [];

        for (const sample of data) {
            // Extract features
            const featureVector = this.extractFeatures(sample);
            features.push(featureVector);
            
            // Extract target (quality score)
            targets.push(sample.target || sample.qualityScore || 0);
        }

        // Get feature names
        const featureNames = Object.keys(features[0] || {});

        return {
            X: features,
            y: targets,
            featureNames: featureNames
        };
    }

    /**
     * Extract features from a sample
     * Now includes enhanced features if available
     */
    extractFeatures(sample) {
        const features = sample.features || {};
        
        // Start with basic features
        const extracted = {
            codeQuality: features.codeQuality || 0,
            testCoverage: features.testCoverage || 0,
            security: features.security || 0,
            performance: features.performance || 0,
            maintainability: features.maintainability || 0,
            complexity: features.complexity || 0,
            csat: sample.csat || 0
        };

        // Add derived features if available
        if (features.qualityScore !== undefined) extracted.qualityScore = features.qualityScore;
        if (features.healthScore !== undefined) extracted.healthScore = features.healthScore;
        if (features.qualityComplexityRatio !== undefined) extracted.qualityComplexityRatio = features.qualityComplexityRatio;
        if (features.coverageComplexityRatio !== undefined) extracted.coverageComplexityRatio = features.coverageComplexityRatio;
        if (features.securityPerformanceBalance !== undefined) extracted.securityPerformanceBalance = features.securityPerformanceBalance;
        if (features.csatQualityCorrelation !== undefined) extracted.csatQualityCorrelation = features.csatQualityCorrelation;

        // Add provider features if available
        if (features.provider_quality !== undefined) extracted.provider_quality = features.provider_quality;
        if (features.provider_speed !== undefined) extracted.provider_speed = features.provider_speed;
        if (features.provider_cost !== undefined) extracted.provider_cost = features.provider_cost;
        if (features.provider_reliability !== undefined) extracted.provider_reliability = features.provider_reliability;

        // Add historical features if available
        if (features.historical_avg_quality !== undefined) extracted.historical_avg_quality = features.historical_avg_quality;
        if (features.historical_avg_csat !== undefined) extracted.historical_avg_csat = features.historical_avg_csat;
        if (features.historical_consistency !== undefined) extracted.historical_consistency = features.historical_consistency;

        // Add temporal features if available
        if (features.time_of_day !== undefined) extracted.time_of_day = features.time_of_day;
        if (features.day_of_week !== undefined) extracted.day_of_week = features.day_of_week;
        if (features.recency !== undefined) extracted.recency = features.recency;

        // Add code embedding features (first 5 dimensions)
        for (let i = 0; i < 5; i++) {
            const key = `code_embedding_${i}`;
            if (features[key] !== undefined) {
                extracted[key] = features[key];
            }
        }

        return extracted;
    }

    /**
     * Train model (simplified - in production would use scikit-learn/XGBoost)
     */
    trainModel(X_train, y_train) {
        // Simple linear regression implementation
        // In production, this would call Python scikit-learn/XGBoost
        
        const n = X_train.length;
        const m = X_train[0].length;

        // Calculate means
        const xMeans = new Array(m).fill(0);
        const yMean = y_train.reduce((sum, y) => sum + y, 0) / n;

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                xMeans[j] += X_train[i][j];
            }
        }
        for (let j = 0; j < m; j++) {
            xMeans[j] /= n;
        }

        // Calculate coefficients (simplified gradient descent)
        const coefficients = new Array(m).fill(0);
        const learningRate = 0.01;
        const iterations = 1000;

        for (let iter = 0; iter < iterations; iter++) {
            for (let j = 0; j < m; j++) {
                let gradient = 0;
                for (let i = 0; i < n; i++) {
                    let prediction = 0;
                    for (let k = 0; k < m; k++) {
                        prediction += coefficients[k] * X_train[i][k];
                    }
                    gradient += (prediction - y_train[i]) * X_train[i][j];
                }
                coefficients[j] -= learningRate * (gradient / n);
            }
        }

        // Calculate intercept
        let intercept = yMean;
        for (let j = 0; j < m; j++) {
            intercept -= coefficients[j] * xMeans[j];
        }

        return {
            type: 'linear_regression',
            coefficients: coefficients,
            intercept: intercept,
            featureNames: this.featureNames,
            trainedAt: new Date().toISOString()
        };
    }

    /**
     * Evaluate model
     */
    evaluateModel(X_test, y_test) {
        const predictions = X_test.map(x => this.predict(x));
        
        // Calculate metrics
        const mae = this.calculateMAE(predictions, y_test);
        const rmse = this.calculateRMSE(predictions, y_test);
        const r2 = this.calculateR2(predictions, y_test);
        
        // Calculate accuracy (for classification-like metric)
        const accuracy = this.calculateAccuracy(predictions, y_test);

        return {
            mae: mae,
            rmse: rmse,
            r2: r2,
            accuracy: accuracy,
            predictions: predictions,
            actuals: y_test
        };
    }

    /**
     * Predict quality score
     */
    predict(features) {
        if (!this.model || !this.trained) {
            throw new Error('Model not trained');
        }

        // Convert features to array if needed
        const featureArray = Array.isArray(features) ? features : 
            this.featureNames.map(name => features[name] || 0);

        // Calculate prediction
        let prediction = this.model.intercept;
        for (let i = 0; i < featureArray.length && i < this.model.coefficients.length; i++) {
            prediction += this.model.coefficients[i] * featureArray[i];
        }

        // Clamp to 0-100 range
        return Math.max(0, Math.min(100, prediction));
    }

    /**
     * Calculate Mean Absolute Error
     */
    calculateMAE(predictions, actuals) {
        let sum = 0;
        for (let i = 0; i < predictions.length; i++) {
            sum += Math.abs(predictions[i] - actuals[i]);
        }
        return sum / predictions.length;
    }

    /**
     * Calculate Root Mean Squared Error
     */
    calculateRMSE(predictions, actuals) {
        let sum = 0;
        for (let i = 0; i < predictions.length; i++) {
            sum += Math.pow(predictions[i] - actuals[i], 2);
        }
        return Math.sqrt(sum / predictions.length);
    }

    /**
     * Calculate R² score
     */
    calculateR2(predictions, actuals) {
        const yMean = actuals.reduce((sum, y) => sum + y, 0) / actuals.length;
        let ssRes = 0;
        let ssTot = 0;
        
        for (let i = 0; i < predictions.length; i++) {
            ssRes += Math.pow(actuals[i] - predictions[i], 2);
            ssTot += Math.pow(actuals[i] - yMean, 2);
        }
        
        return 1 - (ssRes / ssTot);
    }

    /**
     * Calculate accuracy (within 5 points)
     */
    calculateAccuracy(predictions, actuals) {
        let correct = 0;
        for (let i = 0; i < predictions.length; i++) {
            if (Math.abs(predictions[i] - actuals[i]) <= 5) {
                correct++;
            }
        }
        return correct / predictions.length;
    }

    /**
     * Save model
     */
    async saveModel(filePath) {
        const fs = require('fs').promises;
        const modelData = {
            model: this.model,
            featureNames: this.featureNames,
            trained: this.trained,
            version: '1.0'
        };
        await fs.writeFile(filePath, JSON.stringify(modelData, null, 2));
        log.info(`Model saved to ${filePath}`);
    }

    /**
     * Load model
     */
    async loadModel(filePath) {
        const fs = require('fs').promises;
        const modelData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        this.model = modelData.model;
        this.featureNames = modelData.featureNames;
        this.trained = modelData.trained;
        log.info(`Model loaded from ${filePath}`);
    }
}

module.exports = {
    QualityPredictorTrainer
};

