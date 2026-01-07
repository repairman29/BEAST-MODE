#!/usr/bin/env node

/**
 * Train Enhanced Quality Predictor Model
 * Uses enhanced features, preprocessing, and code embeddings
 * 
 * Month 1: Week 2 - Enhanced Model Training
 */

const { QualityPredictorTrainer } = require('../lib/models/trainQualityPredictor');
const { getDataCollectionService } = require('../lib/mlops/dataCollection');
const { getDataPreprocessingPipeline } = require('../lib/mlops/dataPreprocessing');
const { getEnhancedFeatureEngineering } = require('../lib/features/enhancedFeatureEngineering');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('TrainEnhancedModel');

async function main() {
    log.info('🚀 Starting Enhanced Quality Predictor Model Training');
    log.info('='.repeat(60));

    try {
        // Initialize services
        const dataCollection = await getDataCollectionService();
        const preprocessing = await getDataPreprocessingPipeline();
        const enhancedFeatures = await getEnhancedFeatureEngineering();

        const stats = dataCollection.getDataStatistics();
        
        log.info('📊 Training Data Statistics:');
        log.info(`  Quality samples: ${stats.quality.count}`);

        if (stats.quality.count < 100) {
            log.warn('⚠️  Insufficient training data. Need at least 100 quality samples.');
            log.info('💡 Run: npm run collect:data');
            process.exit(1);
        }

        // Load and preprocess data
        log.info('Loading and preprocessing training data...');
        const trainingData = await dataCollection.getTrainingData('quality', {
            minSamples: 100
        });

        // Preprocess with enhanced features
        const preprocessedData = preprocessing.preprocessDataset(trainingData, {
            normalize: true,
            encodeCategorical: true,
            addDerivedFeatures: true,
            handleMissing: true
        });

        log.info(`✅ Preprocessed ${preprocessedData.length} samples`);

        // Show feature importance
        const featureImportance = preprocessing.calculateFeatureImportance(preprocessedData);
        log.info('📊 Top Features by Importance:');
        Object.entries(featureImportance)
            .slice(0, 10)
            .forEach(([feature, importance]) => {
                log.info(`  ${feature}: ${importance.toFixed(3)}`);
            });

        // Train model with enhanced features
        log.info('');
        log.info('Training model with enhanced features...');
        const trainer = new QualityPredictorTrainer();
        
        // Override prepareData to use preprocessed data
        const originalPrepareData = trainer.prepareData.bind(trainer);
        trainer.prepareData = (data) => {
            // Data is already preprocessed, just extract features and targets
            const features = [];
            const targets = [];

            for (const sample of data) {
                const featureVector = trainer.extractFeatures(sample);
                features.push(featureVector);
                targets.push(sample.target || sample.qualityScore || 0);
            }

            const featureNames = Object.keys(features[0] || {});

            return {
                X: features,
                y: targets,
                featureNames: featureNames
            };
        };

        const result = await trainer.train({
            useMLflow: true,
            testSize: 0.2,
            minSamples: 100
        });

        log.info('');
        log.info('✅ Training Complete!');
        log.info('='.repeat(60));
        log.info('📈 Enhanced Model Performance:');
        log.info(`  R² Score: ${result.metrics.r2.toFixed(3)}`);
        log.info(`  MAE: ${result.metrics.mae.toFixed(2)}`);
        log.info(`  RMSE: ${result.metrics.rmse.toFixed(2)}`);
        log.info(`  Accuracy: ${(result.metrics.accuracy * 100).toFixed(1)}%`);
        log.info(`  Features: ${result.featureNames.length}`);
        log.info('');

        // Save model
        const path = require('path');
        const fs = require('fs').promises;
        const modelDir = path.join(process.cwd(), '.beast-mode', 'models');
        await fs.mkdir(modelDir, { recursive: true });
        const modelPath = path.join(modelDir, 'quality-predictor-v1-enhanced.json');
        await trainer.saveModel(modelPath);
        
        log.info(`💾 Enhanced model saved to: ${modelPath}`);
        log.info('');
        log.info('🎉 Enhanced model ready!');
        log.info('   Update model path in mlModelIntegration.js to use enhanced version');
        log.info('');

    } catch (error) {
        log.error('❌ Training failed:', error.message);
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

