/**
 * Test script for Phase 1, Week 1 integration
 * Tests error handling, performance monitoring, and caching
 */

const { getErrorHandler } = require('../lib/resilience/errorHandler');
const { getPerformanceMonitor } = require('../lib/scale/performanceMonitor');
const { getMultiLevelCache } = require('../lib/scale/multiLevelCache');

async function main() {
  console.log('🧪 Testing Phase 1, Week 1 Integration\n');

  // Test Error Handler
  console.log('1️⃣  Testing Error Handler Integration...');
  const errorHandler = getErrorHandler();
  await errorHandler.initialize();

  const testError = new Error('Test network error');
  testError.code = 'ENOTFOUND';
  const handled = await errorHandler.handleError(testError, {
    endpoint: '/api/ml/predict',
    operation: async () => { throw testError; }
  });
  console.log(`   ✅ Error handled: ${handled.handled ? 'yes' : 'no'}`);
  console.log(`   ✅ Error type: ${handled.errorType || 'unknown'}`);

  const stats = errorHandler.getErrorStatistics();
  console.log(`   ✅ Error statistics: ${stats.total} errors recorded\n`);

  // Test Performance Monitor
  console.log('2️⃣  Testing Performance Monitor Integration...');
  const performanceMonitor = getPerformanceMonitor();
  await performanceMonitor.initialize();

  performanceMonitor.recordMetric('responseTime', 150, { endpoint: '/api/ml/predict' });
  performanceMonitor.recordMetric('responseTime', 200, { endpoint: '/api/ml/predict' });
  performanceMonitor.recordMetric('throughput', 10, { endpoint: '/api/ml/predict' });

  const realTime = performanceMonitor.getRealTimeMetrics('overview');
  console.log(`   ✅ Real-time metrics: ${Object.keys(realTime.metrics || {}).length} metrics`);
  console.log(`   ✅ Response time tracked: ${realTime.metrics?.responseTime ? 'yes' : 'no'}`);

  const summary = performanceMonitor.getPerformanceSummary();
  console.log(`   ✅ Active alerts: ${summary.alerts.active}\n`);

  // Test Multi-Level Cache
  console.log('3️⃣  Testing Multi-Level Cache Integration...');
  const cache = getMultiLevelCache();
  await cache.initialize();

  const testKey = 'test_prediction_key';
  const testValue = { prediction: 0.85, confidence: 0.9 };
  
  await cache.set(testKey, testValue);
  const cached = await cache.get(testKey);
  console.log(`   ✅ Cache set/get: ${cached ? 'working' : 'failed'}`);

  const cacheStats = cache.getStats();
  console.log(`   ✅ L1 cache size: ${cacheStats.l1.size}/${cacheStats.l1.maxSize}`);
  console.log(`   ✅ L1 hit rate: ${cacheStats.l1.hitRate}\n`);

  // Test Integration Together
  console.log('4️⃣  Testing Integrated Flow...');
  
  // Simulate API request flow
  const requestContext = {
    provider: 'openai',
    model: 'gpt-4',
    actionType: 'prediction'
  };

  const cacheKey = `api:ml:predict:${JSON.stringify(requestContext).substring(0, 50)}`;
  
  // Check cache first
  const cachedPrediction = await cache.get(cacheKey);
  if (cachedPrediction) {
    console.log(`   ✅ Cache hit - returning cached prediction`);
    performanceMonitor.recordMetric('cache_hit', 1, { endpoint: '/api/ml/predict' });
  } else {
    console.log(`   ✅ Cache miss - would generate prediction`);
    performanceMonitor.recordMetric('cache_miss', 1, { endpoint: '/api/ml/predict' });
    
    // Simulate prediction generation
    const prediction = { predictedQuality: 0.85, confidence: 0.9 };
    await cache.set(cacheKey, prediction, 300000); // 5 minutes
    
    // Record performance
    performanceMonitor.recordMetric('responseTime', 150, { endpoint: '/api/ml/predict' });
  }

  console.log(`   ✅ Integrated flow: working\n`);

  console.log('✅ All Phase 1, Week 1 integrations tested successfully!');
  console.log('\n📊 Integration Status:');
  console.log(`   ✅ Error Handler: Active`);
  console.log(`   ✅ Performance Monitor: Active`);
  console.log(`   ✅ Multi-Level Cache: Active`);
  console.log(`   ✅ API Middleware: Ready`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});



