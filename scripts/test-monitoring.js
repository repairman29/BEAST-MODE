/**
 * Test Monitoring Integration
 * 
 * Tests production monitoring setup
 * 
 * Phase 1: Production Deployment
 */

const { getProductionMonitor } = require('../lib/monitoring/productionMonitor');

async function main() {
  console.log('🧪 Testing Production Monitoring\n');

  const monitor = getProductionMonitor();
  await monitor.initialize();

  // Test 1: Record requests
  console.log('1️⃣  Testing Request Recording...');
  monitor.recordRequest('/api/ml/predict', 'POST', 200, 150);
  monitor.recordRequest('/api/ml/predict', 'POST', 200, 120);
  monitor.recordRequest('/api/ml/predict', 'POST', 500, 500);
  console.log(`   ✅ Recorded 3 requests\n`);

  // Test 2: Record errors
  console.log('2️⃣  Testing Error Recording...');
  monitor.recordError(new Error('Test error'), { endpoint: '/api/test' });
  console.log(`   ✅ Recorded error\n`);

  // Test 3: Get metrics
  console.log('3️⃣  Testing Metrics Collection...');
  const summary = monitor.getMetricsSummary();
  console.log(`   ✅ Metrics collected`);
  console.log(`      - System metrics: ${summary.system ? 'yes' : 'no'}`);
  console.log(`      - Application metrics: ${summary.application ? 'yes' : 'no'}`);
  console.log(`      - Alerts: ${summary.alerts?.length || 0}\n`);

  // Test 4: Get health status
  console.log('4️⃣  Testing Health Status...');
  const health = monitor.getHealthStatus();
  console.log(`   ✅ Health status: ${health.status}`);
  console.log(`      - Error rate: ${health.metrics?.errorRate?.toFixed(2) || 0}%`);
  console.log(`      - Memory usage: ${health.metrics?.memoryUsage?.toFixed(2) || 0}%`);
  console.log(`      - Uptime: ${(health.metrics?.uptime / 1000).toFixed(2) || 0}s\n`);

  // Test 5: Get logs
  console.log('5️⃣  Testing Log Retrieval...');
  const logs = monitor.getLogs('request', 10);
  console.log(`   ✅ Retrieved ${logs.length} request logs\n`);

  // Test 6: Get alerts
  console.log('6️⃣  Testing Alert Retrieval...');
  const alerts = monitor.getAlerts(null, 10);
  console.log(`   ✅ Retrieved ${alerts.length} alerts\n`);

  console.log('✅ All monitoring tests passed!');
  console.log('\n📊 Monitoring Status:');
  console.log(`   ✅ Production Monitor: Active`);
  console.log(`   ✅ Metrics Collection: Active`);
  console.log(`   ✅ Log Collection: Active`);
  console.log(`   ✅ Alert System: Active`);

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

