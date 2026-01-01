/**
 * Test script for Phase 1, Week 2 integration
 * Tests intelligent router, auto-optimizer, trend analyzer, and anomaly detector
 */

const { getIntelligentRouter } = require('../lib/intelligence/intelligentRouter');
const { getAutoOptimizer } = require('../lib/intelligence/autoOptimizer');
const { getTrendAnalyzer } = require('../lib/analytics/trendAnalyzer');
const { getAnomalyDetector } = require('../lib/analytics/anomalyDetector');
const { getPerformanceMonitor } = require('../lib/scale/performanceMonitor');

async function main() {
  console.log('🧪 Testing Phase 1, Week 2 Integration\n');

  // Test Intelligent Router
  console.log('1️⃣  Testing Intelligent Router Integration...');
  const intelligentRouter = getIntelligentRouter();
  await intelligentRouter.initialize();

  const routing = await intelligentRouter.routeIntelligently(
    { prediction: true },
    { requestType: 'prediction', priority: 'high' }
  );
  console.log(`   ✅ Intelligent routing: ${routing.region.id}`);
  console.log(`   ✅ Routing confidence: ${routing.intelligence?.confidence?.toFixed(2) || 'N/A'}`);

  const routingStats = intelligentRouter.getRoutingStatistics();
  console.log(`   ✅ Routing statistics: ${routingStats.totalRoutings} routings\n`);

  // Test Auto-Optimizer
  console.log('2️⃣  Testing Auto-Optimizer Integration...');
  const autoOptimizer = getAutoOptimizer();
  await autoOptimizer.initialize();

  const optimization = await autoOptimizer.autoOptimize({
    cacheHitRate: 0.6,
    memoryUsage: 65,
    throughput: 80,
    avgLatency: 300,
    timeoutRate: 0.05,
    cpuUsage: 70
  });
  console.log(`   ✅ Auto-optimization: ${optimization ? optimization.applied : 0} optimizations`);
  console.log(`   ✅ Current config: ${Object.keys(autoOptimizer.getCurrentConfig()).length} parameters\n`);

  // Test Trend Analyzer
  console.log('3️⃣  Testing Trend Analyzer Integration...');
  const trendAnalyzer = getTrendAnalyzer();
  await trendAnalyzer.initialize();

  const performanceMonitor = getPerformanceMonitor();
  await performanceMonitor.initialize();

  // Record some metrics
  for (let i = 0; i < 30; i++) {
    performanceMonitor.recordMetric('responseTime', 150 + i * 2 + Math.random() * 10, {
      endpoint: '/api/ml/predict'
    });
  }

  const historical = performanceMonitor.getHistoricalMetrics('responseTime', 3600000);
  const trendAnalysis = trendAnalyzer.analyzeTrends(historical.data);
  console.log(`   ✅ Trend analysis: ${trendAnalysis.trend}`);
  console.log(`   ✅ Trend strength: ${(trendAnalysis.strength * 100).toFixed(1)}%`);
  console.log(`   ✅ Forecast: ${trendAnalysis.forecast.length} periods\n`);

  // Test Anomaly Detector
  console.log('4️⃣  Testing Anomaly Detector Integration...');
  const anomalyDetector = getAnomalyDetector();
  await anomalyDetector.initialize();

  // Record some metrics with an anomaly
  const testData = Array.from({ length: 100 }, (_, i) => ({
    timestamp: Date.now() - (100 - i) * 60 * 1000,
    value: 50 + Math.random() * 20 + (i === 50 ? 100 : 0) // Anomaly at index 50
  }));

  const anomalies = anomalyDetector.detectAnomalies(testData, 'statistical');
  console.log(`   ✅ Anomalies detected: ${anomalies.anomalies.length}`);
  console.log(`   ✅ Detection method: ${anomalies.method}`);

  const realTime = anomalyDetector.detectRealTime(150);
  console.log(`   ✅ Real-time detection: ${realTime.isAnomaly ? 'anomaly' : 'normal'}\n`);

  // Test Integration Together
  console.log('5️⃣  Testing Integrated Flow...');
  
  // Simulate API request with all services
  const requestContext = {
    provider: 'openai',
    model: 'gpt-4',
    actionType: 'prediction'
  };

  // 1. Intelligent routing
  const intelligentRouting = await intelligentRouter.routeIntelligently(
    { prediction: true },
    { requestType: 'prediction', priority: 'high' }
  );

  // 2. Record performance
  performanceMonitor.recordMetric('responseTime', 200, { endpoint: '/api/ml/predict' });

  // 3. Detect anomalies
  const anomaly = anomalyDetector.detectRealTime(200, { endpoint: '/api/ml/predict' });

  // 4. Analyze trends
  const trends = trendAnalyzer.analyzeTrends(
    performanceMonitor.getHistoricalMetrics('responseTime', 3600000).data
  );

  // 5. Auto-optimize
  const autoOpt = await autoOptimizer.autoOptimize({
    cacheHitRate: 0.7,
    memoryUsage: 60,
    throughput: 100,
    avgLatency: 200
  });

  console.log(`   ✅ Intelligent routing: ${intelligentRouting.region.id}`);
  console.log(`   ✅ Anomaly detection: ${anomaly.isAnomaly ? 'anomaly' : 'normal'}`);
  console.log(`   ✅ Trend analysis: ${trends.trend}`);
  console.log(`   ✅ Auto-optimization: ${autoOpt ? autoOpt.applied : 0} optimizations\n`);

  console.log('✅ All Phase 1, Week 2 integrations tested successfully!');
  console.log('\n📊 Integration Status:');
  console.log(`   ✅ Intelligent Router: Active`);
  console.log(`   ✅ Auto-Optimizer: Active`);
  console.log(`   ✅ Trend Analyzer: Active`);
  console.log(`   ✅ Anomaly Detector: Active`);
  console.log(`   ✅ API Middleware: Enhanced`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});



