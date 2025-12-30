#!/usr/bin/env node

/**
 * Train Quality Predictor Model
 * 
 * Usage: node scripts/train-quality-model.js
 * 
 * Month 1: First Real ML Model Training
 */

const { QualityPredictorTrainer } = require('../lib/models/trainQualityPredictor');
const { getDataCollectionService } = require('../lib/mlops/dataCollection');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('TrainQualityModel');

async function main() {
    log.info('🚀 Starting Quality Predictor Model Training');
    log.info('='.repeat(60));

    try {
        // Initialize data collection
        const dataCollection = await getDataCollectionService();
        const stats = dataCollection.getDataStatistics();
        
        log.info('📊 Training Data Statistics:');
        log.info(`  Quality samples: ${stats.quality.count}`);
        log.info(`  Fix samples: ${stats.fixes.count}`);
        log.info(`  Model performance samples: ${stats.modelPerformance.count}`);
        log.info(`  CSAT samples: ${stats.csat.count}`);

        // Check if we have enough data
        if (stats.quality.count < 100) {
            log.warn('⚠️  Insufficient training data. Need at least 100 quality samples.');
            log.info('💡 Generating synthetic training data for demonstration...');
            
            // Generate synthetic data for demonstration
            await generateSyntheticData(dataCollection, 200);
            
            log.info('✅ Generated 200 synthetic training samples');
        }

        // Train model
        const trainer = new QualityPredictorTrainer();
        const result = await trainer.train({
            useMLflow: true,
            testSize: 0.2,
            minSamples: 100
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
        const modelPath = path.join(modelDir, 'quality-predictor-v1.json');
        await trainer.saveModel(modelPath);
        
        log.info(`💾 Model saved to: ${modelPath}`);
        log.info('');
        log.info('🎉 Next steps:');
        log.info('  1. Review model performance in MLflow UI (http://localhost:5000)');
        log.info('  2. Integrate model with aiGMQualityPredictionService');
        log.info('  3. Deploy to production');
        log.info('');

    } catch (error) {
        log.error('❌ Training failed:', error.message);
        log.error(error.stack);
        process.exit(1);
    }
}

/**
 * Generate synthetic training data for demonstration
 */
async function generateSyntheticData(dataCollection, count) {
    log.info(`Generating ${count} synthetic quality samples...`);

    for (let i = 0; i < count; i++) {
        // Generate realistic synthetic data
        const codeQuality = 60 + Math.random() * 40;
        const testCoverage = 50 + Math.random() * 50;
        const security = 70 + Math.random() * 30;
        const performance = 60 + Math.random() * 40;
        const maintainability = 55 + Math.random() * 45;
        const complexity = 20 + Math.random() * 80;
        
        // Calculate target quality score (with some noise)
        const baseScore = (
            codeQuality * 0.25 +
            testCoverage * 0.20 +
            security * 0.20 +
            performance * 0.15 +
            maintainability * 0.15 +
            (100 - complexity) * 0.05
        );
        const noise = (Math.random() - 0.5) * 10;
        const qualityScore = Math.max(0, Math.min(100, baseScore + noise));
        const csatScore = 0.5 + (qualityScore / 100) * 0.5 + (Math.random() - 0.5) * 0.2;

        await dataCollection.collectQualityData({
            codeMetrics: {
                codeQuality,
                testCoverage,
                security,
                performance,
                maintainability,
                complexity
            },
            qualityScore,
            csatScore: Math.max(0, Math.min(1, csatScore)),
            timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            context: {
                repository: 'synthetic',
                team: 'demo'
            }
        });
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { main };

