/**
 * Test Advanced Model Integration
 * Quick test to verify model loading and prediction
 */

const { getMLModelIntegration } = require('../lib/mlops/mlModelIntegration');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('TestAdvancedModel');

async function main() {
    try {
        log.info('🧪 Testing Advanced Model Integration');
        log.info('='.repeat(60));

        // Initialize integration
        const mlIntegration = await getMLModelIntegration();

        // Check if model is available
        const modelInfo = mlIntegration.getModelInfo();
        log.info(`Model Available: ${modelInfo.available ? '✅ Yes' : '❌ No'}`);
        if (modelInfo.available) {
            log.info(`Model Version: ${modelInfo.version}`);
            log.info(`Model Path: ${modelInfo.modelPath}`);
        }

        // Test prediction
        log.info('\n📊 Testing Predictions:');
        const testContexts = [
            {
                provider: 'openai',
                model: 'gpt-4',
                actionType: 'narrative',
                scenarioId: 'test-1',
                rollType: 'success',
                statName: 'intelligence',
                statValue: 7
            },
            {
                provider: 'anthropic',
                model: 'claude-opus',
                actionType: 'combat',
                scenarioId: 'battle-1',
                rollType: 'critical-success',
                statName: 'strength',
                statValue: 8
            },
            {
                provider: 'gemini',
                model: 'gemini-pro',
                actionType: 'dialogue',
                scenarioId: 'conversation-1',
                rollType: 'success',
                statName: 'charisma',
                statValue: 5
            }
        ];

        for (const context of testContexts) {
            const prediction = mlIntegration.predictQualitySync(context);
            log.info(`\n  Context: ${context.provider}/${context.model}`);
            log.info(`  Predicted Quality: ${(prediction.predictedQuality * 100).toFixed(1)}%`);
            log.info(`  Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
            log.info(`  Source: ${prediction.source}`);
            if (prediction.modelVersion) {
                log.info(`  Model Version: ${prediction.modelVersion}`);
            }
        }

        log.info('\n' + '='.repeat(60));
        log.info('✅ Integration Test Complete!');
        log.info('='.repeat(60));

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

