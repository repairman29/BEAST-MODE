/**
 * ML Database Health Check
 * Monitors ML database integration health
 * 
 * Run: npm run ml:health-check
 */

const { getDatabaseWriter } = require('../lib/mlops/databaseWriter');
const { createLogger } = require('../lib/utils/logger');
const log = createLogger('MLDBHealthCheck');

async function healthCheck() {
    log.info('🏥 ML Database Health Check');
    log.info('='.repeat(60));

    const results = {
        connection: false,
        tables: [],
        recentActivity: null,
        errorRate: null,
        queueStatus: null,
        issues: []
    };

    try {
        // 1. Check Database Connection
        log.info('\n📡 Checking database connection...');
        const dbWriter = getDatabaseWriter();
        await dbWriter.initialize();

        if (dbWriter.supabase) {
            results.connection = true;
            log.info('   ✅ Database connected');
        } else {
            results.connection = false;
            results.issues.push('Database not connected - check Supabase credentials');
            log.warn('   ⚠️  Database not connected');
        }

        // 2. Check Tables
        if (results.connection) {
            log.info('\n📊 Checking tables...');
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

            for (const table of tables) {
                try {
                    const { data, error } = await dbWriter.supabase
                        .from(table)
                        .select('id')
                        .limit(1);

                    if (error) {
                        if (error.code === 'PGRST205') {
                            results.issues.push(`Table ${table} not found`);
                            log.warn(`   ⚠️  ${table}: Not found`);
                        } else {
                            results.issues.push(`Table ${table} error: ${error.message}`);
                            log.warn(`   ⚠️  ${table}: ${error.message}`);
                        }
                    } else {
                        results.tables.push(table);
                        log.info(`   ✅ ${table}: Exists`);
                    }
                } catch (error) {
                    results.issues.push(`Table ${table} check failed: ${error.message}`);
                    log.warn(`   ⚠️  ${table}: Check failed`);
                }
            }
        }

        // 3. Check Recent Activity
        if (results.connection && results.tables.includes('ml_predictions')) {
            log.info('\n📈 Checking recent activity...');
            try {
                const { data, error } = await dbWriter.supabase
                    .from('ml_predictions')
                    .select('service_name, created_at')
                    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (!error && data) {
                    const byService = {};
                    for (const pred of data) {
                        byService[pred.service_name] = (byService[pred.service_name] || 0) + 1;
                    }

                    results.recentActivity = {
                        total: data.length,
                        byService: byService,
                        lastPrediction: data[0]?.created_at || null
                    };

                    log.info(`   ✅ ${data.length} predictions in last 24 hours`);
                    for (const [service, count] of Object.entries(byService)) {
                        log.info(`      - ${service}: ${count}`);
                    }

                    if (data.length === 0) {
                        results.issues.push('No predictions in last 24 hours - services may not be active');
                    }
                }
            } catch (err) {
                results.issues.push(`Activity check failed: ${err.message}`);
                log.warn(`   ⚠️  Activity check failed: ${err.message}`);
            }
        }

        // 4. Check Error Rate
        if (results.connection && results.tables.includes('ml_predictions')) {
            log.info('\n📉 Checking error rates...');
            try {
                const { data, error } = await dbWriter.supabase
                    .from('ml_predictions')
                    .select('error, service_name')
                    .not('actual_value', 'is', null)
                    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

                if (!error && data && data.length > 0) {
                    const errors = data.map(d => d.error || 0);
                    const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;

                    results.errorRate = {
                        average: avgError,
                        count: data.length,
                        highError: errors.filter(e => e > 0.3).length
                    };

                    log.info(`   ✅ Average error: ${(avgError * 100).toFixed(2)}%`);
                    log.info(`   ✅ Predictions with actual: ${data.length}`);
                    log.info(`   ⚠️  High error (>30%): ${results.errorRate.highError}`);

                    if (avgError > 0.3) {
                        results.issues.push(`High error rate: ${(avgError * 100).toFixed(2)}% - consider retraining model`);
                    }
                } else {
                    log.info('   ℹ️  No predictions with actual values in last 7 days');
                }
            } catch (err) {
                results.issues.push(`Error rate check failed: ${err.message}`);
                log.warn(`   ⚠️  Error rate check failed: ${err.message}`);
            }
        }

        // 5. Check Queue Status
        log.info('\n📦 Checking queue status...');
        results.queueStatus = {
            size: dbWriter.writeQueue.length,
            batchSize: dbWriter.batchSize,
            flushInterval: dbWriter.flushInterval
        };

        log.info(`   ✅ Queue size: ${dbWriter.writeQueue.length}/${dbWriter.batchSize}`);
        log.info(`   ✅ Flush interval: ${dbWriter.flushInterval}ms`);

        if (dbWriter.writeQueue.length > dbWriter.batchSize * 2) {
            results.issues.push(`Queue size (${dbWriter.writeQueue.length}) exceeds 2x batch size - writes may be slow`);
        }

    } catch (error) {
        log.error('❌ Health check failed:', error.message);
        results.issues.push(`Health check error: ${error.message}`);
    }

    // Summary
    log.info('\n' + '='.repeat(60));
    log.info('📋 Health Check Summary');
    log.info('='.repeat(60));

    log.info(`\n✅ Connection: ${results.connection ? 'OK' : 'FAILED'}`);
    log.info(`✅ Tables: ${results.tables.length}/8`);
    log.info(`✅ Recent Activity: ${results.recentActivity ? `${results.recentActivity.total} predictions` : 'N/A'}`);
    log.info(`✅ Error Rate: ${results.errorRate ? `${(results.errorRate.average * 100).toFixed(2)}%` : 'N/A'}`);
    log.info(`✅ Queue: ${results.queueStatus.size} items`);

    if (results.issues.length > 0) {
        log.warn(`\n⚠️  Issues Found (${results.issues.length}):`);
        for (const issue of results.issues) {
            log.warn(`   - ${issue}`);
        }
    } else {
        log.info('\n✅ No issues found - system healthy!');
    }

    log.info('\n' + '='.repeat(60));

    return results;
}

if (require.main === module) {
    healthCheck().catch(error => {
        log.error('Health check failed:', error);
        process.exit(1);
    });
}

module.exports = { healthCheck };

