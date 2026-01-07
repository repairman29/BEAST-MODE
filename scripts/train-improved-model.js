#!/usr/bin/env node

/**
 * Train Improved Quality Predictor Model (XGBoost/Ensemble)
 * 
 * Usage: node scripts/train-improved-model.js
 * 
 * Month 1: Model Improvement
 */

const { QualityPredictorTrainerXGBoost } = require('../lib/models/trainQualityPredictorXGBoost');
const { getDataCollectionService } = require('../lib/mlops/dataCollection');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('TrainImprovedModel');

async function main() {
    log.info('🚀 Starting Improved Quality Predictor Model Training');
    log.info('='.repeat(60));

    try {
        // Initialize data collection
        const dataCollection = await getDataCollectionService();
        const stats = dataCollection.getDataStatistics();
        
        log.info('📊 Training Data Statistics:');
        log.info(`  Quality samples: ${stats.quality.count}`);

        // Check if we have enough data
        if (stats.quality.count < 100) {
            log.warn('⚠️  Insufficient training data. Need at least 100 quality samples.');
            log.info('💡 Run: npm run collect:data');
            process.exit(1);
        }

        // Train improved model
        const trainer = new QualityPredictorTrainerXGBoost();
        const result = await trainer.train({
            useMLflow: true,
            testSize: 0.2,
            minSamples: 100,
            usePython: false // Set to true if Python/XGBoost available
        });

        log.info('');
        log.info('✅ Training Complete!');
        log.info('='.repeat(60));
        log.info('📈 Model Performance:');
        log.info(`  R² Score: ${result.metrics.r2.toFixed(3)}`);
        log.info(`  MAE: ${result.metrics.mae.toFixed(2)}`);
        log.info(`  RMSE: ${result.metrics.rmse.toFixed(2)}`);
        log.info(`  Accuracy: ${(result.metrics.accuracy * 100).toFixed(1)}%`);
        log.info('');

        // Save model
        const path = require('path');
        const fs = require('fs').promises;
        const modelDir = path.join(process.cwd(), '.beast-mode', 'models');
        await fs.mkdir(modelDir, { recursive: true });
        const modelPath = path.join(modelDir, 'quality-predictor-v2-xgboost.json');
        await trainer.saveModel(modelPath);
        
        log.info(`💾 Model saved to: ${modelPath}`);
        log.info('');
        log.info('🎉 Next steps:');
        log.info('  1. Compare with v1 model performance');
        log.info('  2. Deploy improved model: Update model path in mlModelIntegration.js');
        log.info('  3. Monitor performance in production');
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

