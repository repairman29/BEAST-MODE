#!/usr/bin/env node

/**
 * ML Model Iteration Pipeline
 * Automatically retrains models when new data is available
 */

const { getDataIntegrationService } = require('../lib/mlops/dataIntegration');
const { QualityPredictorTrainerXGBoost } = require('../lib/models/trainQualityPredictorXGBoost');
const { createLogger } = require('../lib/utils/logger');
const fs = require('fs').promises;
const path = require('path');

const log = createLogger('IterationPipeline');

async function runIteration() {
    log.info('🔄 Running ML Model Iteration Pipeline...');

    try {
        // 1. Collect new data
        const dataIntegration = await getDataIntegrationService();
        const collectionResult = await dataIntegration.collectAll({
            limit: 1000,
            days: 7 // Last 7 days
        });

        if (collectionResult.total < 100) {
            log.info('Not enough new data for retraining');
            return;
        }

        log.info(`Collected ${collectionResult.total} new samples`);

        // 2. Train new model
        const trainer = new QualityPredictorTrainerXGBoost();
        const result = await trainer.train({
            useMLflow: true,
            testSize: 0.2,
            minSamples: 100
        });

        // 3. Compare with current model
        const currentModelPath = path.join(process.cwd(), '.beast-mode', 'models', 'quality-predictor-v1.json');
        let shouldPromote = false;

        if (result.metrics.accuracy > 0.85) {
            shouldPromote = true;
            log.info('✅ New model meets quality threshold, ready for promotion');
        }

        // 4. Save new model version
        const version = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const newModelPath = path.join(process.cwd(), '.beast-mode', 'models', `quality-predictor-v${version}.json`);
        await trainer.saveModel(newModelPath);

        log.info(`💾 New model saved: ${newModelPath}`);
        log.info(`📊 Performance: Accuracy ${(result.metrics.accuracy * 100).toFixed(1)}%`);

        if (shouldPromote) {
            log.info('💡 To promote: Update model path in mlModelIntegration.js');
        }

    } catch (error) {
        log.error('Iteration failed:', error.message);
    }
}

if (require.main === module) {
    runIteration().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runIteration };
