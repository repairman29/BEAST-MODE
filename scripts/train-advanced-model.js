/**
 * Train Advanced Quality Predictor Model
 * With hyperparameter tuning, feature selection, and cross-validation
 */

const path = require('path');
const fs = require('fs').promises;
const { QualityPredictorTrainerAdvanced } = require('../lib/models/trainQualityPredictorAdvanced');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('TrainAdvancedModel');

async function main() {
    try {
        log.info('🚀 Starting Advanced Model Training');
        log.info('='.repeat(60));

        // Ensure models directory exists
        const modelsDir = path.join(__dirname, '..', '.beast-mode', 'models');
        await fs.mkdir(modelsDir, { recursive: true });

        // Initialize trainer
        const trainer = new QualityPredictorTrainerAdvanced();

        // Train model
        const result = await trainer.train({
            useMLflow: true,
            testSize: 0.2,
            minSamples: 100,
            cvFolds: 5,
            enableFeatureSelection: true,
            enableHyperparameterTuning: true
        });

        if (!result.success) {
            throw new Error('Training failed');
        }

        // Save model
        const modelPath = path.join(modelsDir, 'quality-predictor-v3-advanced.json');
        await trainer.saveModel(modelPath);

        log.info('='.repeat(60));
        log.info('✅ Advanced Model Training Complete!');
        log.info(`📁 Model saved to: ${modelPath}`);
        log.info(`📊 Final Metrics:`);
        log.info(`   R² Score: ${result.metrics.r2.toFixed(3)}`);
        log.info(`   MAE: ${result.metrics.mae.toFixed(2)}`);
        log.info(`   RMSE: ${result.metrics.rmse.toFixed(2)}`);
        log.info(`   Accuracy: ${(result.metrics.accuracy * 100).toFixed(1)}%`);
        log.info(`📈 Selected Features: ${result.featureNames.length}`);
        log.info(`🔧 Best Hyperparameters:`, result.hyperparameters);
        log.info(`📊 CV Scores: ${result.cvScores.map(s => s.toFixed(3)).join(', ')}`);
        log.info('='.repeat(60));
        log.info('💡 Next steps:');
        log.info('   1. Update mlModelIntegration.js to use v3-advanced model');
        log.info('   2. Test model in production with A/B testing');
        log.info('   3. Monitor performance with ml:dashboard');

    } catch (error) {
        log.error('❌ Training failed:', error.message);
        log.error(error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };

