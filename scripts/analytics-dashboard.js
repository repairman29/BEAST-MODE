/**
 * Performance Analytics Dashboard
 * Display comprehensive analytics and insights
 */

const { getPerformanceAnalytics } = require('../lib/mlops/performanceAnalytics');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('AnalyticsDashboard');

async function main() {
    try {
        const analytics = getPerformanceAnalytics();
        const report = await analytics.getReport('7d');

        console.log('\n📊 Performance Analytics Dashboard');
        console.log('='.repeat(60));

        // Summary
        console.log('\n📈 Summary:');
        console.log(`   Health: ${report.summary.health === 'healthy' ? '✅' : report.summary.health === 'warning' ? '⚠️' : '🚨'} ${report.summary.health.toUpperCase()}`);
        console.log(`   Accuracy: ${(report.summary.accuracy * 100).toFixed(1)}%`);
        console.log(`   Avg Error: ${report.summary.avgError.toFixed(2)}`);
        console.log(`   Avg Latency: ${report.summary.avgLatency.toFixed(0)}ms`);
        console.log(`   Error Rate: ${(report.summary.errorRate * 100).toFixed(1)}%`);
        console.log(`   Sample Size: ${report.summary.sampleSize}`);

        // Trends
        console.log('\n📊 Trends:');
        console.log(`   Accuracy: ${report.trends.accuracy === 'improving' ? '📈' : report.trends.accuracy === 'declining' ? '📉' : '➡️'} ${report.trends.accuracy}`);
        console.log(`   Error: ${report.trends.error === 'improving' ? '📈' : report.trends.error === 'declining' ? '📉' : '➡️'} ${report.trends.error}`);
        console.log(`   Latency: ${report.trends.latency === 'improving' ? '📈' : report.trends.latency === 'declining' ? '📉' : '➡️'} ${report.trends.latency}`);
        console.log(`   Error Rate: ${report.trends.errorRate === 'improving' ? '📈' : report.trends.errorRate === 'declining' ? '📉' : '➡️'} ${report.trends.errorRate}`);

        // Breakdown
        console.log('\n🔍 Performance Breakdown:');
        console.log(`   Accuracy: ${(report.breakdown.accuracy.current * 100).toFixed(1)}% (target: ${(report.breakdown.accuracy.target * 100).toFixed(0)}%) ${report.breakdown.accuracy.status === 'good' ? '✅' : '⚠️'}`);
        console.log(`   Error: ${report.breakdown.error.current.toFixed(2)} (target: ${report.breakdown.error.target}) ${report.breakdown.error.status === 'good' ? '✅' : '⚠️'}`);
        console.log(`   Latency: ${report.breakdown.latency.current.toFixed(0)}ms (target: ${report.breakdown.latency.target}ms) ${report.breakdown.latency.status === 'good' ? '✅' : '⚠️'}`);
        console.log(`   Error Rate: ${(report.breakdown.errorRate.current * 100).toFixed(1)}% (target: ${(report.breakdown.errorRate.target * 100).toFixed(0)}%) ${report.breakdown.errorRate.status === 'good' ? '✅' : '⚠️'}`);

        // Model Comparison
        if (report.modelComparison && report.modelComparison.availableModels > 0) {
            console.log('\n🤖 Model Comparison:');
            console.log(`   Available Models: ${report.modelComparison.availableModels}`);
            report.modelComparison.models.forEach((m, i) => {
                console.log(`   ${i + 1}. ${m.version}: weight ${m.weight.toFixed(2)}`);
            });
        }

        // Deployment
        console.log('\n🚀 Deployment:');
        console.log(`   Current Model: ${report.deployment.currentModel}`);
        console.log(`   Total Deployments: ${report.deployment.totalDeployments}`);
        console.log(`   Active A/B Tests: ${report.deployment.activeABTests}`);

        // Recommendations
        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach((rec, i) => {
                const icon = rec.priority === 'critical' ? '🚨' : rec.priority === 'high' ? '⚠️' : 'ℹ️';
                console.log(`   ${icon} ${rec.message} (${rec.action})`);
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
        console.log('='.repeat(60));

    } catch (error) {
        log.error('❌ Failed to generate analytics:', error.message);
        log.error(error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };

