/**
 * Advanced Quality Predictor Model Training
 * XGBoost with hyperparameter tuning, feature selection, and cross-validation
 * 
 * Month 1: Week 3 - Advanced Model Training
 */

const { createLogger } = require('../utils/logger');
const { getMLflowService } = require('../mlops/mlflowService');
const { getDataCollectionService } = require('../mlops/dataCollection');
const log = createLogger('TrainQualityPredictorAdvanced');

class QualityPredictorTrainerAdvanced {
    constructor() {
        this.model = null;
        this.featureNames = [];
        this.selectedFeatures = [];
        this.bestHyperparams = null;
        this.trained = false;
        this.cvScores = [];
    }

    /**
     * Train with hyperparameter tuning and cross-validation
     */
    async train(options = {}) {
        const {
            useMLflow = true,
            testSize = 0.2,
            minSamples = 100,
            cvFolds = 5,
            enableFeatureSelection = true,
            enableHyperparameterTuning = true
        } = options;

        log.info('🚀 Starting Advanced Quality Predictor Training');
        log.info('='.repeat(60));

        const mlflow = getMLflowService();
        const dataCollection = await getDataCollectionService();

        if (useMLflow) {
            await mlflow.initialize();
            await mlflow.startRun('quality-predictor-advanced', {
                model_type: 'quality_predictor_advanced',
                version: '3.0',
                algorithm: 'xgboost_advanced',
                cv_folds: cvFolds
            });
        }

        try {
            // 1. Load training data
            log.info('📊 Loading training data...');
            const trainingData = await dataCollection.getTrainingData('quality', {
                minSamples: minSamples
            });

            if (!trainingData || trainingData.length < minSamples) {
                throw new Error(`Insufficient training data: ${trainingData?.length || 0} < ${minSamples}`);
            }

            log.info(`✅ Loaded ${trainingData.length} training samples`);

            // 2. Prepare features and targets
            const { X, y, featureNames } = this.prepareData(trainingData);
            this.featureNames = featureNames;

            log.info(`📈 Features: ${featureNames.length} total`);

            if (useMLflow) {
                await mlflow.logParam('training_samples', trainingData.length);
                await mlflow.logParam('total_features', featureNames.length);
                await mlflow.logParam('cv_folds', cvFolds);
            }

            // 3. Feature selection
            let selectedFeatureIndices = Array.from({ length: featureNames.length }, (_, i) => i);
            if (enableFeatureSelection) {
                log.info('🎯 Performing feature selection...');
                selectedFeatureIndices = this.selectFeatures(X, y, featureNames);
                this.selectedFeatures = selectedFeatureIndices.map(i => featureNames[i]);
                log.info(`✅ Selected ${selectedFeatureIndices.length} features (from ${featureNames.length})`);

                // Filter X to selected features
                X.forEach((x, idx) => {
                    X[idx] = selectedFeatureIndices.map(i => x[i]);
                });
            } else {
                this.selectedFeatures = featureNames;
            }

            // 4. Split data
            const splitIndex = Math.floor(X.length * (1 - testSize));
            const X_train = X.slice(0, splitIndex);
            const y_train = y.slice(0, splitIndex);
            const X_test = X.slice(splitIndex);
            const y_test = y.slice(splitIndex);

            log.info(`📊 Split: ${X_train.length} train, ${X_test.length} test`);

            // 5. Hyperparameter tuning with cross-validation
            let bestParams = {
                nTrees: 20,
                maxDepth: 4,
                learningRate: 0.1,
                subsample: 0.8,
                minSamplesSplit: 10
            };

            if (enableHyperparameterTuning) {
                log.info('🔍 Tuning hyperparameters with cross-validation...');
                bestParams = await this.tuneHyperparameters(X_train, y_train, cvFolds);
                this.bestHyperparams = bestParams;
                log.info(`✅ Best params: ${JSON.stringify(bestParams)}`);

                if (useMLflow) {
                    await mlflow.logParams(bestParams);
                }
            }

            // 6. Train final model with best hyperparameters
            log.info('🏋️ Training final model...');
            this.model = this.trainXGBoostModel(X_train, y_train, bestParams);
            this.trained = true;

            // 7. Evaluate on test set
            log.info('📊 Evaluating model...');
            const metrics = this.evaluateModel(X_test, y_test);

            log.info('='.repeat(60));
            log.info('📈 Model Performance:');
            log.info(`  R² Score: ${metrics.r2.toFixed(3)}`);
            log.info(`  MAE: ${metrics.mae.toFixed(2)}`);
            log.info(`  RMSE: ${metrics.rmse.toFixed(2)}`);
            log.info(`  Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
            log.info('='.repeat(60));

            // 8. Log to MLflow
            if (useMLflow) {
                await mlflow.logMetrics({
                    'r2_score': metrics.r2,
                    'mae': metrics.mae,
                    'rmse': metrics.rmse,
                    'accuracy': metrics.accuracy,
                    'cv_mean_score': this.cvScores.length > 0 
                        ? this.cvScores.reduce((a, b) => a + b, 0) / this.cvScores.length 
                        : 0
                });
                await mlflow.logModel(this.model, 'quality_predictor_advanced');
            }

            log.info('✅ Advanced model training complete!');

            return {
                success: true,
                metrics: metrics,
                model: this.model,
                featureNames: this.selectedFeatures,
                hyperparameters: bestParams,
                cvScores: this.cvScores
            };

        } catch (error) {
            log.error('❌ Training failed:', error.message);
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
     * Feature selection using correlation and importance
     */
    selectFeatures(X, y, featureNames, topK = null) {
        const nFeatures = X[0].length;
        const topKCount = topK || Math.min(20, Math.floor(nFeatures * 0.7));

        const importances = [];
        const yMean = y.reduce((a, b) => a + b, 0) / y.length;

        for (let i = 0; i < nFeatures; i++) {
            const featureValues = X.map(x => x[i]);
            const featureMean = featureValues.reduce((a, b) => a + b, 0) / featureValues.length;

            let numerator = 0;
            let denomX = 0;
            let denomY = 0;

            for (let j = 0; j < featureValues.length; j++) {
                const xDiff = featureValues[j] - featureMean;
                const yDiff = y[j] - yMean;
                numerator += xDiff * yDiff;
                denomX += xDiff * xDiff;
                denomY += yDiff * yDiff;
            }

            const correlation = Math.abs(numerator / Math.sqrt(denomX * denomY));
            importances.push({
                index: i,
                name: featureNames[i],
                importance: correlation || 0
            });
        }

        importances.sort((a, b) => b.importance - a.importance);
        const selected = importances.slice(0, topKCount).map(item => item.index);

        log.info(`Top ${topKCount} features selected:`);
        importances.slice(0, Math.min(10, topKCount)).forEach((item, idx) => {
            log.info(`  ${idx + 1}. ${item.name}: ${item.importance.toFixed(3)}`);
        });

        return selected;
    }

    /**
     * Hyperparameter tuning with cross-validation
     */
    async tuneHyperparameters(X, y, cvFolds = 5) {
        const paramGrid = {
            nTrees: [10, 20, 30],
            maxDepth: [3, 4, 5],
            learningRate: [0.05, 0.1, 0.15],
            subsample: [0.7, 0.8, 0.9]
        };

        let bestScore = -Infinity;
        let bestParams = null;
        const totalCombinations = Object.values(paramGrid).reduce((a, b) => a * b.length, 1);
        let current = 0;

        log.info(`Testing ${totalCombinations} hyperparameter combinations...`);

        for (const nTrees of paramGrid.nTrees) {
            for (const maxDepth of paramGrid.maxDepth) {
                for (const learningRate of paramGrid.learningRate) {
                    for (const subsample of paramGrid.subsample) {
                        current++;
                        const params = { nTrees, maxDepth, learningRate, subsample, minSamplesSplit: 10 };
                        const cvScore = this.crossValidate(X, y, cvFolds, params);
                        
                        if (cvScore > bestScore) {
                            bestScore = cvScore;
                            bestParams = params;
                        }

                        if (current % 10 === 0) {
                            log.info(`  Progress: ${current}/${totalCombinations} (best R²: ${bestScore.toFixed(3)})`);
                        }
                    }
                }
            }
        }

        log.info(`✅ Best CV score: ${bestScore.toFixed(3)}`);
        return bestParams;
    }

    /**
     * K-fold cross-validation
     */
    crossValidate(X, y, k, params) {
        const foldSize = Math.floor(X.length / k);
        const scores = [];

        for (let fold = 0; fold < k; fold++) {
            const start = fold * foldSize;
            const end = fold === k - 1 ? X.length : (fold + 1) * foldSize;

            const X_val = X.slice(start, end);
            const y_val = y.slice(start, end);
            const X_train = [...X.slice(0, start), ...X.slice(end)];
            const y_train = [...y.slice(0, start), ...y.slice(end)];

            const model = this.trainXGBoostModel(X_train, y_train, params);
            const predictions = X_val.map(x => this.predictWithModel(x, model));
            const r2 = this.calculateR2(predictions, y_val);
            scores.push(r2);
        }

        const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        this.cvScores.push(meanScore);
        return meanScore;
    }

    /**
     * Train XGBoost-like model (gradient boosting ensemble)
     */
    trainXGBoostModel(X_train, y_train, params) {
        const { nTrees, maxDepth, learningRate, subsample, minSamplesSplit } = params;
        const trees = [];
        const initialPrediction = y_train.reduce((a, b) => a + b, 0) / y_train.length;
        let predictions = new Array(X_train.length).fill(initialPrediction);

        for (let treeIdx = 0; treeIdx < nTrees; treeIdx++) {
            // Calculate residuals (negative gradients for regression)
            const residuals = y_train.map((y, i) => y - predictions[i]);
            
            // Sample subset of data (bootstrap)
            const sampleSize = Math.floor(X_train.length * subsample);
            const sampleIndices = [];
            for (let i = 0; i < sampleSize; i++) {
                sampleIndices.push(Math.floor(Math.random() * X_train.length));
            }

            // Train tree on residuals
            const tree = this.trainTree(
                sampleIndices.map(i => X_train[i]),
                sampleIndices.map(i => residuals[i]),
                maxDepth,
                minSamplesSplit
            );

            trees.push(tree);

            // Update predictions with learning rate
            for (let i = 0; i < X_train.length; i++) {
                const treePrediction = this.predictWithTree(X_train[i], tree);
                predictions[i] += learningRate * treePrediction;
            }
        }

        return {
            type: 'xgboost_advanced',
            trees: trees,
            nTrees: nTrees,
            learningRate: learningRate,
            initialPrediction: initialPrediction, // Store initial prediction
            featureNames: this.selectedFeatures,
            trainedAt: new Date().toISOString()
        };
    }

    /**
     * Train a decision tree (recursive)
     */
    trainTree(X, y, maxDepth, minSamplesSplit, currentDepth = 0) {
        if (currentDepth >= maxDepth || X.length < minSamplesSplit) {
            const mean = y.reduce((a, b) => a + b, 0) / y.length;
            return { type: 'leaf', value: mean };
        }

        const bestSplit = this.findBestSplit(X, y);
        if (!bestSplit) {
            const mean = y.reduce((a, b) => a + b, 0) / y.length;
            return { type: 'leaf', value: mean };
        }

        const leftX = [];
        const leftY = [];
        const rightX = [];
        const rightY = [];

        for (let i = 0; i < X.length; i++) {
            if (X[i][bestSplit.feature] <= bestSplit.threshold) {
                leftX.push(X[i]);
                leftY.push(y[i]);
            } else {
                rightX.push(X[i]);
                rightY.push(y[i]);
            }
        }

        if (leftX.length === 0 || rightX.length === 0) {
            const mean = y.reduce((a, b) => a + b, 0) / y.length;
            return { type: 'leaf', value: mean };
        }

        return {
            type: 'node',
            feature: bestSplit.feature,
            threshold: bestSplit.threshold,
            left: this.trainTree(leftX, leftY, maxDepth, minSamplesSplit, currentDepth + 1),
            right: this.trainTree(rightX, rightY, maxDepth, minSamplesSplit, currentDepth + 1)
        };
    }

    /**
     * Find best split for a node
     */
    findBestSplit(X, y) {
        const nFeatures = X[0].length;
        let bestFeature = 0;
        let bestThreshold = 0;
        let bestScore = -Infinity;

        for (let feature = 0; feature < nFeatures; feature++) {
            const values = X.map(x => x[feature]).sort((a, b) => a - b);
            const uniqueValues = [...new Set(values)];

            for (let i = 0; i < uniqueValues.length - 1; i++) {
                const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;

                const leftY = [];
                const rightY = [];
                for (let j = 0; j < X.length; j++) {
                    if (X[j][feature] <= threshold) {
                        leftY.push(y[j]);
                    } else {
                        rightY.push(y[j]);
                    }
                }

                if (leftY.length === 0 || rightY.length === 0) continue;

                const leftMean = leftY.reduce((a, b) => a + b, 0) / leftY.length;
                const rightMean = rightY.reduce((a, b) => a + b, 0) / rightY.length;
                const parentMean = y.reduce((a, b) => a + b, 0) / y.length;

                const parentVar = y.reduce((sum, val) => sum + Math.pow(val - parentMean, 2), 0);
                const leftVar = leftY.reduce((sum, val) => sum + Math.pow(val - leftMean, 2), 0);
                const rightVar = rightY.reduce((sum, val) => sum + Math.pow(val - rightMean, 2), 0);

                const score = parentVar - (leftVar + rightVar);

                if (score > bestScore) {
                    bestScore = score;
                    bestFeature = feature;
                    bestThreshold = threshold;
                }
            }
        }

        return bestScore > 0 ? { feature: bestFeature, threshold: bestThreshold } : null;
    }

    /**
     * Predict with a single tree
     */
    predictWithTree(x, tree) {
        if (tree.type === 'leaf') {
            return tree.value;
        }

        if (x[tree.feature] <= tree.threshold) {
            return this.predictWithTree(x, tree.left);
        } else {
            return this.predictWithTree(x, tree.right);
        }
    }

    /**
     * Predict with model
     */
    predictWithModel(x, model) {
        let prediction = 0;
        for (const tree of model.trees) {
            prediction += this.predictWithTree(x, tree);
        }
        return prediction / model.trees.length;
    }

    /**
     * Predict (public API)
     */
    predict(features) {
        if (!this.model || !this.trained) {
            throw new Error('Model not trained');
        }

        let featureArray;
        if (Array.isArray(features)) {
            featureArray = features;
        } else if (typeof features === 'object') {
            featureArray = this.selectedFeatures.map(name => {
                const value = features[name];
                return value !== undefined && value !== null ? (typeof value === 'number' ? value : parseFloat(value) || 0) : 0;
            });
        } else {
            throw new Error('Invalid features format');
        }

        // Start with initial prediction (mean of training data)
        let prediction = this.model.initialPrediction || 75;
        
        // Add contributions from each tree with learning rate
        for (const tree of this.model.trees) {
            const treePred = this.predictWithTree(featureArray, tree);
            prediction += this.model.learningRate * treePred;
        }

        return Math.max(0, Math.min(100, prediction));
    }

    /**
     * Prepare data
     */
    prepareData(data) {
        const features = [];
        const targets = [];

        for (const sample of data) {
            const featureVector = this.extractFeatures(sample);
            features.push(featureVector);
            targets.push(sample.target || sample.qualityScore || 0);
        }

        const featureNames = Object.keys(features[0] || {});

        return {
            X: features.map(f => Object.values(f)),
            y: targets,
            featureNames: featureNames
        };
    }

    /**
     * Extract features
     */
    extractFeatures(sample) {
        const features = sample.features || {};
        
        return {
            codeQuality: features.codeQuality || 0,
            testCoverage: features.testCoverage || 0,
            security: features.security || 0,
            performance: features.performance || 0,
            maintainability: features.maintainability || 0,
            complexity: features.complexity || 0,
            csat: sample.csat || 0,
            qualityScore: features.qualityScore || 0,
            healthScore: features.healthScore || 0,
            qualityComplexityRatio: features.qualityComplexityRatio || 0,
            coverageComplexityRatio: features.coverageComplexityRatio || 0,
            securityPerformanceBalance: features.securityPerformanceBalance || 0,
            csatQualityCorrelation: features.csatQualityCorrelation || 0
        };
    }

    /**
     * Evaluate model
     */
    evaluateModel(X_test, y_test) {
        const predictions = X_test.map(x => this.predict(x));
        const mae = this.calculateMAE(predictions, y_test);
        const rmse = this.calculateRMSE(predictions, y_test);
        const r2 = this.calculateR2(predictions, y_test);
        const accuracy = this.calculateAccuracy(predictions, y_test);

        return {
            mae, rmse, r2, accuracy,
            predictions, actuals: y_test
        };
    }

    calculateMAE(predictions, actuals) {
        return predictions.reduce((sum, p, i) => sum + Math.abs(p - actuals[i]), 0) / predictions.length;
    }

    calculateRMSE(predictions, actuals) {
        return Math.sqrt(
            predictions.reduce((sum, p, i) => sum + Math.pow(p - actuals[i], 2), 0) / predictions.length
        );
    }

    calculateR2(predictions, actuals) {
        const yMean = actuals.reduce((a, b) => a + b, 0) / actuals.length;
        const ssRes = predictions.reduce((sum, p, i) => sum + Math.pow(actuals[i] - p, 2), 0);
        const ssTot = actuals.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
        return 1 - (ssRes / ssTot);
    }

    calculateAccuracy(predictions, actuals) {
        return predictions.reduce((correct, p, i) => 
            correct + (Math.abs(p - actuals[i]) <= 5 ? 1 : 0), 0) / predictions.length;
    }

    /**
     * Save model
     */
    async saveModel(filePath) {
        const fs = require('fs').promises;
        const modelData = {
            model: this.model,
            featureNames: this.selectedFeatures,
            hyperparameters: this.bestHyperparams,
            trained: this.trained,
            version: '3.0',
            algorithm: 'xgboost_advanced',
            cvScores: this.cvScores
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
        this.selectedFeatures = modelData.featureNames;
        this.bestHyperparams = modelData.hyperparameters;
        this.trained = modelData.trained;
        this.cvScores = modelData.cvScores || [];
        log.info(`Model loaded from ${filePath}`);
    }
}

module.exports = {
    QualityPredictorTrainerAdvanced
};

