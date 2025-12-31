/**
 * ML Database Performance Analysis
 * Analyzes ML database performance metrics
 * 
 * Run: npm run ml:performance
 */

const { getDatabaseWriter } = require('../lib/mlops/databaseWriter');
const { createLogger } = require('../lib/utils/logger');
const log = createLogger('MLDBPerformance');

async function performanceAnalysis() {
    log.info('⚡ ML Database Performance Analysis');
    log.info('='.repeat(60));

    const metrics = {
        writeLatency: null,
        queueFlush: null,
        tableSizes: null,
        indexUsage: null,
        recommendations: []
    };

    try {
        const dbWriter = getDatabaseWriter();
        await dbWriter.initialize();

        if (!dbWriter.supabase) {
            log.warn('⚠️  Database not connected - cannot analyze performance');
            return;
        }

        // 1. Analyze Write Performance
        log.info('\n📊 Analyzing write performance...');
        const startTime = Date.now();
        
        // Write test prediction
        await dbWriter.writePrediction({
            serviceName: 'performance-test',
            predictionType: 'test',
            predictedValue: 0.5,
            confidence: 0.5,
            context: { test: true },
            source: 'performance-test'
        });

        await dbWriter.flushQueue();
        const writeLatency = Date.now() - startTime;

        metrics.writeLatency = writeLatency;
        log.info(`   ✅ Write latency: ${writeLatency}ms`);

        if (writeLatency > 1000) {
            metrics.recommendations.push('Write latency > 1s - consider optimizing batch size or database');
        }

        // 2. Check Table Sizes
        log.info('\n💾 Checking table sizes...');
        try {
            const { data, error } = await dbWriter.supabase.rpc('exec_sql', {
                query: `
                    SELECT 
                        tablename,
                        pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
                    FROM pg_tables
                    WHERE schemaname = 'public'
                      AND (tablename LIKE 'ml_%' OR tablename LIKE '%_ml_%')
                    ORDER BY pg_total_relation_size('public.'||tablename) DESC;
                `
            });

            // Alternative: Direct query
            const tables = [
                'ml_predictions',
                'ml_feedback',
                'ml_performance_metrics',
                'code_roach_ml_predictions',
                'oracle_ml_predictions',
                'daisy_chain_ml_predictions',
                'first_mate_ml_predictions',
                'game_app_ml_predictions'
            ];

            metrics.tableSizes = {};
            for (const table of tables) {
                try {
                    const { count } = await dbWriter.supabase
                        .from(table)
                        .select('*', { count: 'exact', head: true });

                    metrics.tableSizes[table] = count || 0;
                    log.info(`   ✅ ${table}: ${count || 0} rows`);
                } catch (err) {
                    log.warn(`   ⚠️  ${table}: Could not get count`);
                }
            }
        } catch (err) {
            log.warn(`   ⚠️  Could not check table sizes: ${err.message}`);
        }

        // 3. Queue Performance
        log.info('\n📦 Analyzing queue performance...');
        metrics.queueFlush = {
            batchSize: dbWriter.batchSize,
            flushInterval: dbWriter.flushInterval,
            currentSize: dbWriter.writeQueue.length
        };

        log.info(`   ✅ Batch size: ${dbWriter.batchSize}`);
        log.info(`   ✅ Flush interval: ${dbWriter.flushInterval}ms`);
        log.info(`   ✅ Current queue: ${dbWriter.writeQueue.length} items`);

        // 4. Generate Recommendations
        log.info('\n💡 Performance Recommendations');
        log.info('='.repeat(60));

        if (metrics.writeLatency > 500) {
            metrics.recommendations.push('Consider increasing batch size to reduce write frequency');
        }

        if (metrics.writeLatency < 50) {
            metrics.recommendations.push('Write latency is excellent - system performing well');
        }

        const totalRows = Object.values(metrics.tableSizes || {}).reduce((a, b) => a + b, 0);
        if (totalRows > 1000000) {
            metrics.recommendations.push('Large dataset - consider archiving old data (>90 days)');
        }

        if (metrics.recommendations.length === 0) {
            log.info('   ✅ No performance issues detected');
        } else {
            for (const rec of metrics.recommendations) {
                log.info(`   💡 ${rec}`);
            }
        }

    } catch (error) {
        log.error('❌ Performance analysis failed:', error.message);
    }

    log.info('\n' + '='.repeat(60));
    return metrics;
}

if (require.main === module) {
    performanceAnalysis().catch(error => {
        log.error('Performance analysis failed:', error);
        process.exit(1);
    });
}

module.exports = { performanceAnalysis };

