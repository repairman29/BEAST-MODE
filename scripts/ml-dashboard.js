#!/usr/bin/env node

/**
 * ML Monitoring Dashboard
 * Real-time dashboard for ML system status
 * 
 * Usage: node scripts/ml-dashboard.js
 */

const { getMonitoringDashboard } = require('../lib/mlops/monitoringDashboard');
const { getMLModelIntegration } = require('../lib/mlops/mlModelIntegration');
const { getDataCollectionService } = require('../lib/mlops/dataCollection');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('MLDashboard');

async function main() {
    console.log('📊 BEAST MODE ML Monitoring Dashboard');
    console.log('='.repeat(60));
    console.log('');

    try {
        const dashboard = getMonitoringDashboard();
        const dashboardData = await dashboard.getDashboardData();
        const trends = dashboard.getPerformanceTrends();
        const health = dashboard.getHealthStatus();

        // Model Status
        console.log('🤖 Model Status:');
        console.log(`  Available: ${dashboardData.model.available ? '✅ Yes' : '❌ No'}`);
        if (dashboardData.model.available) {
            console.log(`  Version: ${dashboardData.model.version}`);
            console.log(`  Path: ${dashboardData.model.path}`);
        }
        console.log('');

        // Data Status
        console.log('📈 Training Data:');
        console.log(`  Quality: ${dashboardData.data.qualitySamples} samples`);
        console.log(`  Fixes: ${dashboardData.data.fixSamples} samples`);
        console.log(`  CSAT: ${dashboardData.data.csatSamples} samples`);
        console.log(`  Performance: ${dashboardData.data.modelPerformanceSamples} samples`);
        console.log('');

        // Performance Metrics
        console.log('⚡ Performance:');
        console.log(`  Accuracy: ${dashboardData.performance.accuracy}`);
        console.log(`  Avg Error: ${dashboardData.performance.avgError}`);
        console.log(`  Avg Latency: ${dashboardData.performance.avgLatency}`);
        console.log(`  Total Predictions: ${dashboardData.performance.totalPredictions}`);
        console.log(`  With Actual: ${dashboardData.performance.predictionsWithActual}`);
        console.log('');

        // Trends
        if (trends.trend !== 'insufficient_data') {
            console.log('📊 Trends:');
            console.log(`  Status: ${trends.trend}`);
            console.log(`  Change: ${trends.change}`);
            console.log(`  Recent Avg: ${trends.recentAvg}`);
            console.log(`  Previous Avg: ${trends.previousAvg}`);
            console.log('');
        }

        // Health Status
        console.log('🏥 Health:');
        console.log(`  Status: ${health.status === 'healthy' ? '✅ Healthy' : '⚠️  Warning'}`);
        if (health.issues.length > 0) {
            health.issues.forEach(issue => console.log(`  • ${issue}`));
        }
        console.log('');

        // MLflow Status
        console.log('📊 MLflow:');
        console.log(`  Connected: ${dashboardData.mlflow.connected ? '✅ Yes' : '⚠️  Local only'}`);
        if (dashboardData.mlflow.connected) {
            console.log(`  URL: ${dashboardData.mlflow.url}`);
        } else {
            console.log('  Start: npm run mlflow:start');
        }
        console.log('');

        // Errors
        if (dashboardData.errors.count > 0) {
            console.log('⚠️  Recent Errors:');
            dashboardData.errors.recent.forEach((error, i) => {
                console.log(`  ${i + 1}. ${error.error}`);
                console.log(`     Time: ${error.timestamp}`);
            });
            console.log('');
        }

        console.log('✅ Dashboard updated');
        console.log(`   Time: ${dashboardData.timestamp}`);
        console.log('');

    } catch (error) {
        console.error('❌ Dashboard error:', error.message);
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

