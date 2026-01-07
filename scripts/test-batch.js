/**
 * Test Batch Predictor
 * Test batch prediction processing
 */

const { getBatchPredictor } = require('../lib/mlops/batchPredictor');
const { getPredictionCache } = require('../lib/mlops/predictionCache');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('TestBatch');

async function main() {
    try {
        log.info('🧪 Testing Batch Predictor');
        log.info('='.repeat(60));

        const batchPredictor = getBatchPredictor();
        const cache = getPredictionCache();

        // Generate test contexts
        const contexts = [];
        for (let i = 0; i < 20; i++) {
            contexts.push({
                provider: ['openai', 'anthropic', 'gemini'][i % 3],
                model: ['gpt-4', 'claude-opus', 'gemini-pro'][i % 3],
                actionType: ['narrative', 'combat', 'dialogue'][i % 3],
                scenarioId: `test-${i}`,
                rollType: 'success',
                statName: 'intelligence',
                statValue: 5 + (i % 5)
            });
        }

        log.info(`\n📊 Processing ${contexts.length} predictions...`);

        // Test without cache
        log.info('\n1️⃣  Batch without cache:');
        const start1 = Date.now();
        const result1 = await batchPredictor.predictBatch(contexts, {
            useCache: false,
            useEnsemble: false
        });
        const time1 = Date.now() - start1;
        log.info(`   Time: ${time1}ms`);
        log.info(`   Success: ${result1.stats.success}/${result1.stats.total}`);
        log.info(`   Avg Quality: ${(result1.stats.avgQuality * 100).toFixed(1)}%`);
        log.info(`   Avg Confidence: ${(result1.stats.avgConfidence * 100).toFixed(1)}%`);

        // Test with cache
        log.info('\n2️⃣  Batch with cache:');
        const start2 = Date.now();
        const result2 = await batchPredictor.predictBatch(contexts, {
            useCache: true,
            useEnsemble: false
        });
        const time2 = Date.now() - start2;
        log.info(`   Time: ${time2}ms`);
        log.info(`   Success: ${result2.stats.success}/${result2.stats.total}`);
        log.info(`   Cached: ${result2.stats.cached}`);
        log.info(`   Speedup: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);

        // Cache stats
        const cacheStats = cache.getStats();
        log.info(`\n💾 Cache Stats:`);
        log.info(`   Size: ${cacheStats.size}/${cacheStats.maxSize}`);
        log.info(`   Hits: ${cacheStats.hits}`);
        log.info(`   Misses: ${cacheStats.misses}`);
        log.info(`   Hit Rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);

        // Test with ensemble
        log.info('\n3️⃣  Batch with ensemble:');
        const start3 = Date.now();
        const result3 = await batchPredictor.predictBatch(contexts.slice(0, 5), {
            useCache: true,
            useEnsemble: true,
            strategy: 'weighted'
        });
        const time3 = Date.now() - start3;
        log.info(`   Time: ${time3}ms`);
        log.info(`   Success: ${result3.stats.success}/${result3.stats.total}`);
        log.info(`   Avg Quality: ${(result3.stats.avgQuality * 100).toFixed(1)}%`);
        log.info(`   Avg Confidence: ${(result3.stats.avgConfidence * 100).toFixed(1)}%`);

        log.info('\n' + '='.repeat(60));
        log.info('✅ Batch Test Complete!');

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

