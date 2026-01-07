/**
 * Model Monitoring Status
 * Display current model health and performance metrics
 */

const { getModelMonitoring } = require('../lib/mlops/modelMonitoring');
const { getProductionDeployment } = require('../lib/mlops/productionDeployment');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('MonitorStatus');

async function main() {
    try {
        const monitoring = getModelMonitoring();
        const deployment = getProductionDeployment();

        const dashboard = monitoring.getDashboardData();
        const health = monitoring.getHealthStatus();
        const deploymentStatus = await deployment.getDeploymentStatus();

        console.log('\n📊 Model Monitoring Status');
        console.log('='.repeat(60));

        // Health Status
        console.log(`\n🏥 Health: ${health.status === 'healthy' ? '✅' : health.status === 'warning' ? '⚠️' : '🚨'} ${health.status.toUpperCase()}`);
        if (health.issues.length > 0) {
            health.issues.forEach(issue => {
                console.log(`   • ${issue}`);
            });
        }

        // Current Metrics
        console.log(`\n📈 Performance Metrics (last 100 predictions):`);
        console.log(`   Accuracy: ${(dashboard.metrics.accuracy * 100).toFixed(1)}%`);
        console.log(`   Avg Error: ${dashboard.metrics.avgError.toFixed(2)}`);
        console.log(`   Avg Latency: ${dashboard.metrics.avgLatency.toFixed(0)}ms`);
        console.log(`   Error Rate: ${(dashboard.metrics.errorRate * 100).toFixed(1)}%`);
        console.log(`   Sample Size: ${dashboard.metrics.sampleSize}`);

        // Baseline Comparison
        if (dashboard.baseline.sampleSize > 0) {
            console.log(`\n📊 Baseline Comparison:`);
            console.log(`   Baseline Accuracy: ${(dashboard.baseline.accuracy * 100).toFixed(1)}%`);
            console.log(`   Current Accuracy: ${(dashboard.metrics.accuracy * 100).toFixed(1)}%`);
            const accuracyDiff = (dashboard.metrics.accuracy - dashboard.baseline.accuracy) * 100;
            console.log(`   Change: ${accuracyDiff >= 0 ? '+' : ''}${accuracyDiff.toFixed(1)}%`);
        }

        // Model Drift
        console.log(`\n🔄 Model Drift:`);
        console.log(`   Detected: ${dashboard.drift.detected ? '⚠️  Yes' : '✅ No'}`);
        if (dashboard.drift.detected) {
            console.log(`   Magnitude: ${(dashboard.drift.magnitude * 100).toFixed(1)}%`);
        }

        // Deployment Status
        console.log(`\n🚀 Deployment:`);
        if (deploymentStatus.currentModel) {
            console.log(`   Current Model: ${deploymentStatus.currentModel.version}`);
            console.log(`   Traffic: ${deploymentStatus.currentModel.trafficPercentage}%`);
            console.log(`   Deployed: ${new Date(deploymentStatus.currentModel.deployedAt).toLocaleString()}`);
        } else {
            console.log(`   No model deployed`);
        }
        console.log(`   Total Deployments: ${deploymentStatus.totalDeployments}`);
        console.log(`   Active A/B Tests: ${deploymentStatus.activeABTests}`);

        // Recent Alerts
        if (dashboard.alerts.length > 0) {
            console.log(`\n🚨 Recent Alerts (last 10):`);
            dashboard.alerts.forEach(alert => {
                const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
                console.log(`   ${icon} ${alert.type} (${alert.severity}) - ${new Date(alert.timestamp).toLocaleString()}`);
            });
        }

        // Thresholds
        console.log(`\n⚙️  Thresholds:`);
        console.log(`   Accuracy: min ${(dashboard.thresholds.accuracy.min * 100).toFixed(0)}%, alert ${(dashboard.thresholds.accuracy.alert * 100).toFixed(0)}%`);
        console.log(`   Latency: max ${dashboard.thresholds.latency.max}ms, alert ${dashboard.thresholds.latency.alert}ms`);
        console.log(`   Error Rate: max ${(dashboard.thresholds.errorRate.max * 100).toFixed(0)}%, alert ${(dashboard.thresholds.errorRate.alert * 100).toFixed(0)}%`);

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        log.error('❌ Failed to get monitoring status:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };

