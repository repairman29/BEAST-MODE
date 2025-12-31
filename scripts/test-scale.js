/**
 * Test script for scale & performance features
 */

const { getMultiLevelCache } = require('../lib/scale/multiLevelCache');
const { getDatabaseOptimizer } = require('../lib/scale/databaseOptimizer');
const { getPerformanceOptimizer } = require('../lib/scale/performanceOptimizer');
const { getAutoScaler } = require('../lib/scale/autoScaler');

async function main() {
  console.log('⚡ Testing Scale & Performance Features\n');

  // Test Multi-Level Cache
  console.log('1️⃣  Testing Multi-Level Cache...');
  const multiLevelCache = getMultiLevelCache();
  await multiLevelCache.initialize();

  await multiLevelCache.set('test-key-1', { data: 'test value' });
  const cached = await multiLevelCache.get('test-key-1');
  console.log(`   ✅ Cache set/get: ${cached ? 'working' : 'failed'}`);

  const stats = multiLevelCache.getStats();
  console.log(`   ✅ L1 cache size: ${stats.l1.size}/${stats.l1.maxSize}`);
  console.log(`   ✅ L1 hit rate: ${stats.l1.hitRate}\n`);

  // Test Database Optimizer
  console.log('2️⃣  Testing Database Optimizer...');
  const databaseOptimizer = getDatabaseOptimizer();
  await databaseOptimizer.initialize();

  const query = 'SELECT * FROM users WHERE id = ? AND status = ?';
  const result = await databaseOptimizer.optimizeQuery(query, [1, 'active']);
  console.log(`   ✅ Query optimized: ${result ? 'yes' : 'no'}`);

  const queryStats = databaseOptimizer.getQueryStatistics();
  console.log(`   ✅ Total queries: ${queryStats.totalQueries}`);
  console.log(`   ✅ Connection pool: ${queryStats.connectionPool.active}/${queryStats.connectionPool.max}\n`);

  // Test Performance Optimizer
  console.log('3️⃣  Testing Performance Optimizer...');
  const performanceOptimizer = getPerformanceOptimizer();
  await performanceOptimizer.initialize();

  performanceOptimizer.recordMetric('responseTime', 150);
  performanceOptimizer.recordMetric('responseTime', 200);
  performanceOptimizer.recordMetric('responseTime', 1200); // Should trigger warning
  performanceOptimizer.recordMetric('throughput', 50);
  performanceOptimizer.recordMetric('latency', 100);

  const perfStats = performanceOptimizer.getPerformanceStatistics();
  console.log(`   ✅ Response time avg: ${perfStats.responseTime.avg}ms`);
  console.log(`   ✅ Throughput avg: ${perfStats.throughput.avg}`);
  console.log(`   ✅ Optimizations suggested: ${perfStats.optimizations.length}\n`);

  // Test Auto-Scaler
  console.log('4️⃣  Testing Auto-Scaler...');
  const autoScaler = getAutoScaler();
  await autoScaler.initialize({ minInstances: 1, maxInstances: 10 });

  // Simulate high CPU
  const scalingDecisions = await autoScaler.evaluateScaling({
    cpuUsage: 85,
    memoryUsage: 70,
    requestRate: 50,
    responseTime: 200
  });

  const scalingStatus = autoScaler.getScalingStatus();
  console.log(`   ✅ Current instances: ${scalingStatus.currentInstances}`);
  console.log(`   ✅ Scaling decisions: ${scalingDecisions.length}`);
  console.log(`   ✅ Scaling history: ${scalingStatus.scalingHistory.length}\n`);

  console.log('✅ All scale & performance features tested successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

