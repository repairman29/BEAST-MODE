#!/usr/bin/env node

/**
 * Collect Real Training Data
 * 
 * Collects real training data from Supabase and existing services
 * 
 * Usage: node scripts/collect-real-data.js [--limit 1000] [--days 30]
 * 
 * Month 1: Real Data Collection
 */

const { getDataIntegrationService } = require('../lib/mlops/dataIntegration');
const { getDataCollectionService } = require('../lib/mlops/dataCollection');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('CollectRealData');

async function main() {
    const args = process.argv.slice(2);
    const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 1000;
    const days = args.includes('--days') ? parseInt(args[args.indexOf('--days') + 1]) : 30;

    log.info('🔄 Collecting Real Training Data');
    log.info('='.repeat(60));

    try {
        // Initialize data integration
        const dataIntegration = await getDataIntegrationService();
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

        log.info(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        log.info(`📊 Limit: ${limit} samples per source`);
        log.info('');

        // Collect from all sources
        const results = await dataIntegration.collectAll({
            limit: limit,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        log.info('');
        log.info('📊 Collection Results:');
        log.info(`  Supabase: ${results.supabase.collected} samples`);
        log.info(`  CSAT Service: ${results.csatService.collected} samples`);
        log.info(`  Total: ${results.total} samples`);
        log.info('');

        // Show statistics
        const dataCollection = await getDataCollectionService();
        const stats = dataCollection.getDataStatistics();

        log.info('📈 Training Data Statistics:');
        log.info(`  Quality samples: ${stats.quality.count}`);
        log.info(`  Fix samples: ${stats.fixes.count} (${(stats.fixes.successRate * 100).toFixed(1)}% success rate)`);
        log.info(`  Model performance: ${stats.modelPerformance.count} (${(stats.modelPerformance.averageAccuracy * 100).toFixed(1)}% avg accuracy)`);
        log.info(`  CSAT samples: ${stats.csat.count} (${(stats.csat.averageCSAT * 100).toFixed(1)}% avg CSAT)`);
        log.info('');

        if (results.total > 0) {
            log.info('✅ Data collection complete!');
            log.info('');
            log.info('💡 Next steps:');
            log.info('  1. Review collected data');
            log.info('  2. Train model: npm run train:quality');
            log.info('  3. Set up auto-collection: npm run ml:auto-collect');
        } else {
            log.warn('⚠️  No data collected. Check:');
            log.warn('  - Supabase connection');
            log.warn('  - Database tables exist');
            log.warn('  - Date range has data');
        }

    } catch (error) {
        log.error('❌ Collection failed:', error.message);
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

