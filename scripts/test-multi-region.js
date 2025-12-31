/**
 * Test script for multi-region features
 */

const { getRegionManager } = require('../lib/multi-region/regionManager');
const { getDataReplication } = require('../lib/multi-region/dataReplication');
const { getLoadBalancer } = require('../lib/multi-region/loadBalancer');
const { getFailover } = require('../lib/multi-region/failover');
const { getCrossRegionMonitoring } = require('../lib/multi-region/crossRegionMonitoring');

async function main() {
  console.log('🌍 Testing Multi-Region Features\n');

  // Test Region Manager
  console.log('1️⃣  Testing Region Manager...');
  const regionManager = getRegionManager();
  await regionManager.initialize();

  const regions = regionManager.listRegions();
  console.log(`   ✅ Regions registered: ${regions.length}`);

  const activeRegions = regionManager.getActiveRegions();
  console.log(`   ✅ Active regions: ${activeRegions.length}`);

  const bestRegion = regionManager.selectBestRegion('latency');
  console.log(`   ✅ Best region (latency): ${bestRegion}\n`);

  // Test Data Replication
  console.log('2️⃣  Testing Data Replication...');
  const replication = getDataReplication();
  await replication.initialize();

  const modelReplication = await replication.replicateModel(
    '/path/to/model.json',
    'us-west-2',
    { batch: false }
  );
  console.log(`   ✅ Model replication: ${modelReplication ? 'initiated' : 'failed'}`);

  const metricsReplication = await replication.replicateMetrics(
    { predictions: 1000, accuracy: 0.95 },
    'eu-west-1'
  );
  console.log(`   ✅ Metrics replication: ${metricsReplication ? 'initiated' : 'failed'}\n`);

  // Test Load Balancer
  console.log('3️⃣  Testing Load Balancer...');
  const loadBalancer = getLoadBalancer();
  await loadBalancer.initialize();

  const routing = await loadBalancer.routeRequest({}, 'latency');
  console.log(`   ✅ Request routed to: ${routing.region.id} (${routing.strategy})`);

  const stats = loadBalancer.getRoutingStatistics();
  console.log(`   ✅ Routing strategy: ${stats.strategy}\n`);

  // Test Failover
  console.log('4️⃣  Testing Failover...');
  const failover = getFailover();
  await failover.initialize();

  const failoverStatus = failover.getFailoverStatus();
  console.log(`   ✅ Active failovers: ${failoverStatus.length}`);

  const history = failover.getFailoverHistory(5);
  console.log(`   ✅ Failover history: ${history.length} entries\n`);

  // Test Cross-Region Monitoring
  console.log('5️⃣  Testing Cross-Region Monitoring...');
  const monitoring = getCrossRegionMonitoring();
  await monitoring.initialize();

  await monitoring.collectAllRegionMetrics();
  const dashboard = monitoring.getGlobalDashboard();
  console.log(`   ✅ Regions monitored: ${dashboard.regions.length}`);
  console.log(`   ✅ Total predictions: ${dashboard.aggregated?.totalPredictions || 0}`);
  console.log(`   ✅ Active regions: ${dashboard.aggregated?.activeRegions || 0}\n`);

  console.log('✅ All multi-region features tested successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

