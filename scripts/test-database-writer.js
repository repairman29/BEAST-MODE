/**
 * Test Database Writer
 * Tests database writing functionality
 * 
 * Month 4: Database Integration Testing
 */

const { getDatabaseWriter } = require('../lib/mlops/databaseWriter');
const { createLogger } = require('../lib/utils/logger');
const log = createLogger('TestDatabaseWriter');

async function testDatabaseWriter() {
    log.info('🧪 Testing Database Writer...');
    log.info('='.repeat(60));

    try {
        const dbWriter = getDatabaseWriter();
        await dbWriter.initialize();

        if (!dbWriter.supabase) {
            log.warn('⚠️  Supabase not configured - database writes will be queued only');
            log.info('   To enable database writes, configure Supabase in smuggler-ai-gm/.env');
            return;
        }

        log.info('✅ Database writer initialized');

        // Test 1: Write a prediction
        log.info('\n📝 Test 1: Writing prediction...');
        const prediction = await dbWriter.writePrediction({
            serviceName: 'test',
            predictionType: 'quality',
            predictedValue: 0.85,
            actualValue: 0.90,
            confidence: 0.8,
            context: { test: true, timestamp: new Date().toISOString() },
            modelVersion: 'v3-advanced',
            source: 'ml_model'
        });
        log.info(`   ✅ Prediction queued: ${prediction.service_name}`);

        // Test 2: Write feedback
        log.info('\n📝 Test 2: Writing feedback...');
        const feedback = await dbWriter.writeFeedback({
            serviceName: 'test',
            feedbackType: 'system',
            feedbackScore: 0.9,
            feedbackText: 'Test feedback',
            metadata: { test: true }
        });
        log.info(`   ✅ Feedback queued: ${feedback.service_name}`);

        // Test 3: Write performance metric
        log.info('\n📝 Test 3: Writing performance metric...');
        const metric = await dbWriter.writePerformanceMetric({
            serviceName: 'test',
            metricName: 'accuracy',
            metricValue: 0.87,
            metricUnit: 'percentage',
            periodStart: new Date().toISOString(),
            periodEnd: new Date().toISOString(),
            metadata: { test: true }
        });
        log.info(`   ✅ Metric queued: ${metric.service_name}`);

        // Flush queue
        log.info('\n🔄 Flushing queue to database...');
        await dbWriter.flushQueue();
        log.info('   ✅ Queue flushed');

        // Test 4: Verify data in database
        log.info('\n📊 Test 4: Verifying data in database...');
        const { data: predictions, error: predError } = await dbWriter.supabase
            .from('ml_predictions')
            .select('*')
            .eq('service_name', 'test')
            .order('created_at', { ascending: false })
            .limit(5);

        if (predError) {
            if (predError.code === 'PGRST205') {
                log.warn('   ⚠️  Table ml_predictions not found - run migration');
            } else {
                log.error(`   ❌ Error: ${predError.message}`);
            }
        } else {
            log.info(`   ✅ Found ${predictions.length} test predictions`);
            if (predictions.length > 0) {
                log.info(`   📊 Latest: ${predictions[0].predicted_value} (${predictions[0].source})`);
            }
        }

        log.info('\n' + '='.repeat(60));
        log.info('✅ Database writer test complete!');
        log.info('='.repeat(60));

    } catch (error) {
        log.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    testDatabaseWriter();
}

module.exports = { testDatabaseWriter };

