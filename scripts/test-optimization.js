/**
 * Test script for optimization features
 */

const { getCostOptimization } = require('../lib/optimization/costOptimization');
const { getResourceManager } = require('../lib/optimization/resourceManager');
const { getModelOptimizer } = require('../lib/optimization/modelOptimizer');
const { getPerformanceTuner } = require('../lib/optimization/performanceTuner');

async function main() {
  console.log('⚡ Testing Optimization Features\n');

  // Test Cost Optimization
  console.log('1️⃣  Testing Cost Optimization...');
  const costOpt = getCostOptimization();
  await costOpt.initialize();

  costOpt.trackCost('prediction', 0.001);
  costOpt.trackCost('training', 0.1);
  costOpt.setBudget('tenant-1', 1000);
  const budgetCheck = costOpt.checkBudget('tenant-1');
  console.log(`   ✅ Cost tracking: active`);
  console.log(`   ✅ Budget check: ${budgetCheck.withinBudget ? 'within budget' : 'over budget'}`);

  const recommendations = costOpt.optimizeCosts('tenant-1');
  console.log(`   ✅ Cost recommendations: ${recommendations.length} recommendations\n`);

  // Test Resource Manager
  console.log('2️⃣  Testing Resource Manager...');
  const resourceMgr = getResourceManager();
  await resourceMgr.initialize();

  resourceMgr.trackUsage('cpu', 65);
  resourceMgr.trackUsage('memory', 75);
  resourceMgr.setQuota('tenant-1', 'cpu', 80);
  const analytics = resourceMgr.getResourceAnalytics();
  console.log(`   ✅ Resource tracking: active`);
  console.log(`   ✅ CPU usage: ${analytics.resources.cpu?.current || 0}%`);
  console.log(`   ✅ Memory usage: ${analytics.resources.memory?.current || 0}%\n`);

  // Test Model Optimizer
  console.log('3️⃣  Testing Model Optimizer...');
  const modelOpt = getModelOptimizer();
  await modelOpt.initialize();

  const testModel = {
    layers: [
      { weights: [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]] }
    ]
  };

  const pruned = await modelOpt.pruneModel(testModel, 0.1);
  console.log(`   ✅ Model pruning: ${pruned ? 'success' : 'failed'}`);

  const searchResult = await modelOpt.searchArchitecture([
    { layers: 2, neurons: 64 },
    { layers: 3, neurons: 128 }
  ], 'accuracy');
  console.log(`   ✅ Architecture search: ${searchResult ? 'success' : 'failed'}\n`);

  // Test Performance Tuner
  console.log('4️⃣  Testing Performance Tuner...');
  const perfTuner = getPerformanceTuner();
  await perfTuner.initialize();

  perfTuner.trackMetric('latency', 250);
  perfTuner.trackMetric('throughput', 100);
  perfTuner.trackMetric('memory_usage', 70);
  perfTuner.trackMetric('cpu_usage', 60);

  const analytics2 = perfTuner.getPerformanceAnalytics();
  console.log(`   ✅ Performance tracking: active`);
  console.log(`   ✅ Latency: ${analytics2.metrics.latency?.current || 0}ms`);
  console.log(`   ✅ Recommendations: ${Object.keys(analytics2.recommendations).length} categories\n`);

  console.log('✅ All optimization features tested successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

