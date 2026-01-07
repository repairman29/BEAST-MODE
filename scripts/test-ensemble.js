/**
 * Test Ensemble Predictor
 * Test multi-model ensemble predictions
 */

const { getEnsemblePredictor } = require('../lib/mlops/ensemblePredictor');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('TestEnsemble');

async function main() {
    try {
        log.info('🧪 Testing Ensemble Predictor');
        log.info('='.repeat(60));

        const ensemble = await getEnsemblePredictor();
        const info = ensemble.getInfo();

        log.info(`\n📊 Ensemble Info:`);
        log.info(`   Models: ${info.modelCount}`);
        log.info(`   Versions: ${info.models.map(m => m.version).join(', ')}`);
        log.info(`   Strategies: ${info.strategies.join(', ')}`);

        if (info.modelCount === 0) {
            log.warn('⚠️  No models available for ensemble');
            return;
        }

        // Test predictions
        const testFeatures = {
            codeQuality: 85,
            testCoverage: 80,
            security: 90,
            performance: 75,
            maintainability: 80,
            complexity: 50,
            csat: 85
        };

        log.info(`\n🔮 Testing Predictions:`);
        
        for (const strategy of info.strategies) {
            try {
                const result = await ensemble.predict(testFeatures, strategy);
                log.info(`\n  Strategy: ${strategy}`);
                log.info(`  Prediction: ${result.prediction.toFixed(1)}`);
                log.info(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
                log.info(`  Models Used: ${result.modelCount}`);
                log.info(`  Individual Predictions:`);
                result.individualPredictions.forEach((p, i) => {
                    log.info(`    ${i + 1}. ${p.version}: ${p.prediction.toFixed(1)} (weight: ${p.weight.toFixed(2)})`);
                });
            } catch (error) {
                log.error(`  Strategy ${strategy} failed:`, error.message);
            }
        }

        log.info('\n' + '='.repeat(60));
        log.info('✅ Ensemble Test Complete!');

    } catch (error) {
        log.error('❌ Test failed:', error.message);
        log.error(error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };

