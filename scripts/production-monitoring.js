/**
 * Production Monitoring CLI
 * Display real-time monitoring dashboard
 * 
 * Month 3: Week 1 - Production Monitoring
 */

const { getProductionMonitoring } = require('../lib/mlops/productionMonitoring');
const { createLogger } = require('../lib/utils/logger');
const log = createLogger('ProductionMonitoringCLI');

async function displayDashboard() {
    const monitoring = getProductionMonitoring();
    const dashboard = monitoring.getDashboard();
    const summary = monitoring.getSummary();

    console.log('\n' + '='.repeat(60));
    console.log('📊 ML System Production Monitoring');
    console.log('='.repeat(60));
    
    console.log('\n📈 Summary:');
    console.log(`  Uptime: ${summary.uptime}`);
    console.log(`  Health: ${summary.health.status.toUpperCase()} (${summary.health.score}/100)`);
    console.log(`  Predictions: ${summary.predictions.total} total`);
    console.log(`    - ML Model: ${summary.predictions.mlModel}`);
    console.log(`    - Heuristic: ${summary.predictions.heuristic}`);
    console.log(`    - Errors: ${summary.predictions.errors}`);
    console.log(`  Performance: ${summary.performance.avgLatency} avg latency`);
    console.log(`  Error Rate: ${summary.performance.errorRate}`);
    
    console.log('\n🔔 Alerts:');
    if (dashboard.alerts.total === 0) {
        console.log('  ✅ No alerts');
    } else {
        console.log(`  Total: ${dashboard.alerts.total}`);
        console.log(`  Critical: ${dashboard.alerts.critical}`);
        console.log(`  Warning: ${dashboard.alerts.warning}`);
        
        if (dashboard.alerts.recent.length > 0) {
            console.log('\n  Recent Alerts:');
            dashboard.alerts.recent.forEach(alert => {
                const icon = alert.severity === 'critical' ? '🔴' : '⚠️';
                console.log(`  ${icon} [${alert.severity.toUpperCase()}] ${alert.type}`);
                console.log(`     ${alert.timestamp}`);
            });
        }
    }
    
    console.log('\n🤖 Models:');
    console.log(`  Loaded: ${dashboard.models.loaded}`);
    if (Object.keys(dashboard.models.performance).length > 0) {
        Object.entries(dashboard.models.performance).forEach(([modelId, perf]) => {
            console.log(`  ${modelId}:`);
            console.log(`    Predictions: ${perf.predictions}`);
            console.log(`    Avg Accuracy: ${(perf.avgAccuracy * 100).toFixed(1)}%`);
        });
    }
    
    console.log('\n🔌 Services:');
    console.log(`  Total: ${dashboard.services.total}`);
    console.log(`  Available: ${dashboard.services.available}`);
    if (Object.keys(dashboard.services.integrations).length > 0) {
        Object.entries(dashboard.services.integrations).forEach(([service, status]) => {
            const icon = status.available ? '✅' : '❌';
            console.log(`  ${icon} ${service}: ${status.status}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Last updated: ${new Date().toISOString()}`);
    console.log('='.repeat(60) + '\n');
}

async function main() {
    try {
        await displayDashboard();
    } catch (error) {
        log.error('Error displaying dashboard:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { displayDashboard };

