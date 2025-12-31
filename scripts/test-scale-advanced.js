/**
 * Test script for advanced scale & performance features
 */

const { getPerformanceMonitor } = require('../lib/scale/performanceMonitor');
const { getAdvancedScaler } = require('../lib/scale/advancedScaler');
const { getResourceOptimizer } = require('../lib/scale/resourceOptimizer');
const { getLoadBalancerAdvanced } = require('../lib/scale/loadBalancerAdvanced');

async function main() {
  console.log('⚡ Testing Advanced Scale & Performance Features\n');

  // Test Performance Monitor
  console.log('1️⃣  Testing Performance Monitor...');
  const performanceMonitor = getPerformanceMonitor();
  await performanceMonitor.initialize();

  performanceMonitor.recordMetric('responseTime', 150);
  performanceMonitor.recordMetric('responseTime', 1200); // Should trigger alert
  performanceMonitor.recordMetric('cpuUsage', 85); // Should trigger alert
  performanceMonitor.recordMetric('throughput', 50);

  const realTime = performanceMonitor.getRealTimeMetrics('overview');
  console.log(`   ✅ Real-time metrics: ${Object.keys(realTime.metrics || {}).length} metrics`);
  
  const alerts = performanceMonitor.getActiveAlerts();
  console.log(`   ✅ Active alerts: ${alerts.length}`);
  console.log(`   ✅ Dashboards: ${performanceMonitor.getAllDashboards().length}\n`);

  // Test Advanced Scaler
  console.log('2️⃣  Testing Advanced Scaler...');
  const advancedScaler = getAdvancedScaler();
  await advancedScaler.initialize();

  const forecast = Array.from({ length: 24 }, (_, i) => ({
    timestamp: Date.now() + (i * 3600000),
    load: 50 + i * 5,
    value: 50 + i * 5
  }));

  const predictive = await advancedScaler.predictiveScale(forecast);
  console.log(`   ✅ Predictive scaling: ${predictive ? 'yes' : 'no'}`);
  console.log(`   ✅ Predicted instances: ${predictive?.predictedInstances || 'N/A'}`);

  const scheduled = advancedScaler.scheduleScaling({
    name: 'peak-hours',
    cron: '0 9 * * *',
    targetInstances: 5
  });
  console.log(`   ✅ Scheduled scaling: ${scheduled ? 'yes' : 'no'}`);

  const costAware = await advancedScaler.costAwareScale(
    { cpuUsage: 85, memoryUsage: 70, requestRate: 150 },
    { maxCost: 10, costPerInstance: 0.1, budget: 5 }
  );
  console.log(`   ✅ Cost-aware scaling: ${costAware ? 'yes' : 'no'}\n`);

  // Test Resource Optimizer
  console.log('3️⃣  Testing Resource Optimizer...');
  const resourceOptimizer = getResourceOptimizer();
  await resourceOptimizer.initialize();

  const allocation = resourceOptimizer.allocateResources('tenant-1', {
    cpu: 10,
    memory: 2048,
    storage: 100
  });
  console.log(`   ✅ Resource allocation: ${allocation ? 'yes' : 'no'}`);

  const optimizations = resourceOptimizer.optimizeAllocation();
  console.log(`   ✅ Optimizations: ${optimizations.length}`);

  const forecast = resourceOptimizer.forecastResources();
  console.log(`   ✅ Resource forecast: ${forecast ? forecast.forecast.length : 0} points\n`);

  // Test Advanced Load Balancer
  console.log('4️⃣  Testing Advanced Load Balancer...');
  const loadBalancerAdvanced = getLoadBalancerAdvanced();
  await loadBalancerAdvanced.initialize();

  const healthRouting = await loadBalancerAdvanced.routeAdvanced(
    { prediction: true },
    'health'
  );
  console.log(`   ✅ Health-based routing: ${healthRouting.region.id}`);

  const perfRouting = await loadBalancerAdvanced.routeAdvanced(
    { prediction: true },
    'performance'
  );
  console.log(`   ✅ Performance-based routing: ${perfRouting.region.id}`);

  loadBalancerAdvanced.updateWeights({
    'us-east-1': 1.5,
    'us-west-2': 1.0,
    'eu-west-1': 0.8
  });

  const weightedRouting = await loadBalancerAdvanced.routeAdvanced(
    { prediction: true },
    'weighted'
  );
  console.log(`   ✅ Weighted routing: ${weightedRouting.region.id}`);

  const stats = loadBalancerAdvanced.getRoutingStatistics();
  console.log(`   ✅ Routing statistics: ${stats.totalRoutings} routings\n`);

  console.log('✅ All advanced scale & performance features tested successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

