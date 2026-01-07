#!/usr/bin/env node

/**
 * Fix Ensemble Model Training
 * Debugs and fixes the ensemble tree training algorithm
 * 
 * Month 1: Model Improvement
 */

const { QualityPredictorTrainerXGBoost } = require('../lib/models/trainQualityPredictorXGBoost');
const { getDataCollectionService } = require('../lib/mlops/dataCollection');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('FixEnsembleModel');

async function main() {
    log.info('🔧 Fixing Ensemble Model Training');
    log.info('='.repeat(60));

    try {
        const dataCollection = await getDataCollectionService();
        const stats = dataCollection.getDataStatistics();
        
        if (stats.quality.count < 100) {
            log.error('Need at least 100 samples');
            process.exit(1);
        }

        // Load training data
        const trainingData = await dataCollection.getTrainingData('quality', { minSamples: 100 });
        log.info(`Loaded ${trainingData.length} samples`);

        // Prepare data
        const trainer = new QualityPredictorTrainerXGBoost();
        const { X, y, featureNames } = trainer.prepareData(trainingData);
        
        // Split
        const splitIndex = Math.floor(X.length * 0.8);
        const X_train = X.slice(0, splitIndex);
        const y_train = y.slice(0, splitIndex);
        const X_test = X.slice(splitIndex);
        const y_test = y.slice(splitIndex);

        log.info(`Training on ${X_train.length} samples, testing on ${X_test.length}`);

        // Debug: Check data ranges
        log.info('Data ranges:');
        log.info(`  Features: ${X_train[0].length} dimensions`);
        log.info(`  Target range: ${Math.min(...y_train)} - ${Math.max(...y_train)}`);
        log.info(`  Target mean: ${(y_train.reduce((a,b) => a+b, 0) / y_train.length).toFixed(2)}`);

        // Train with better parameters
        trainer.featureNames = featureNames;
        const model = trainer.trainImprovedModel(X_train, y_train);
        trainer.model = model;
        trainer.trained = true;

        // Evaluate
        const metrics = trainer.evaluateModel(X_test, y_test);

        log.info('');
        log.info('📊 Fixed Model Performance:');
        log.info(`  R²: ${metrics.r2.toFixed(3)}`);
        log.info(`  MAE: ${metrics.mae.toFixed(2)}`);
        log.info(`  RMSE: ${metrics.rmse.toFixed(2)}`);
        log.info(`  Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);

        if (metrics.accuracy > 0.8) {
            log.info('');
            log.info('✅ Model performance acceptable!');
            
            // Save
            const path = require('path');
            const fs = require('fs').promises;
            const modelDir = path.join(process.cwd(), '.beast-mode', 'models');
            await fs.mkdir(modelDir, { recursive: true });
            const modelPath = path.join(modelDir, 'quality-predictor-v2-fixed.json');
            await trainer.saveModel(modelPath);
            
            log.info(`💾 Saved to: ${modelPath}`);
        } else {
            log.warn('⚠️  Model still needs improvement');
            log.info('💡 Consider:');
            log.info('  - More training data');
            log.info('  - Better feature engineering');
            log.info('  - Python XGBoost integration');
        }

    } catch (error) {
        log.error('❌ Fix failed:', error.message);
        log.error(error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { main };

