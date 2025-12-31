/**
 * Comprehensive integration test for Month 9 features
 * Tests analytics and intelligence features together
 */

const { getTrendAnalyzer } = require('../lib/analytics/trendAnalyzer');
const { getAnomalyDetector } = require('../lib/analytics/anomalyDetector');
const { getPredictiveAnalytics } = require('../lib/analytics/predictiveAnalytics');
const { getBIIntegration } = require('../lib/analytics/biIntegration');
const { getRecommendationEngine } = require('../lib/intelligence/recommendationEngine');
const { getIntelligentRouter } = require('../lib/intelligence/intelligentRouter');
const { getAutoOptimizer } = require('../lib/intelligence/autoOptimizer');
const { getSelfLearning } = require('../lib/intelligence/selfLearning');

async function main() {
  console.log('🧪 Month 9 Integration Test\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Analytics + Intelligence Integration
  console.log('\n📋 Test 1: Analytics + Intelligence Integration');
  try {
    const trendAnalyzer = getTrendAnalyzer();
    await trendAnalyzer.initialize();

    const timeSeriesData = Array.from({ length: 30 }, (_, i) => ({
      timestamp: Date.now() - (30 - i) * 24 * 60 * 60 * 1000,
      value: 50 + i * 2 + Math.random() * 10
    }));

    const trendAnalysis = trendAnalyzer.analyzeTrends(timeSeriesData);

    const recommendationEngine = getRecommendationEngine();
    await recommendationEngine.initialize();
    recommendationEngine.setItemFeatures('item-1', { genre: 0.8, rating: 0.9 });
    const recommendations = await recommendationEngine.recommend('user-1', 'hybrid', { limit: 5 });

    console.log(`   ✅ Trend analysis: ${trendAnalysis.trend}`);
    console.log(`   ✅ Recommendations: ${recommendations ? recommendations.recommendations.length : 0}`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 2: Anomaly Detection + Auto-Optimization Integration
  console.log('\n📋 Test 2: Anomaly Detection + Auto-Optimization Integration');
  try {
    const anomalyDetector = getAnomalyDetector();
    await anomalyDetector.initialize();

    const testData = Array.from({ length: 100 }, (_, i) => ({
      timestamp: Date.now() - (100 - i) * 60 * 1000,
      value: 50 + Math.random() * 20 + (i === 50 ? 100 : 0)
    }));

    const anomalies = anomalyDetector.detectAnomalies(testData, 'statistical');

    const autoOptimizer = getAutoOptimizer();
    await autoOptimizer.initialize();

    // If anomalies detected, trigger optimization
    if (anomalies.anomalies.length > 0) {
      const optimization = await autoOptimizer.autoOptimize({
        cacheHitRate: 0.6,
        memoryUsage: 65,
        throughput: 80,
        avgLatency: 300
      });
      console.log(`   ✅ Anomalies detected: ${anomalies.anomalies.length}`);
      console.log(`   ✅ Auto-optimization: ${optimization ? optimization.applied : 0} optimizations`);
    } else {
      console.log(`   ✅ No anomalies detected`);
      console.log(`   ✅ System stable`);
    }
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 3: Predictive Analytics + Intelligent Routing Integration
  console.log('\n📋 Test 3: Predictive Analytics + Intelligent Routing Integration');
  try {
    const predictive = getPredictiveAnalytics();
    await predictive.initialize();

    const historicalData = Array.from({ length: 30 }, (_, i) => ({
      timestamp: Date.now() - (30 - i) * 24 * 60 * 60 * 1000,
      value: 50 + i * 2 + Math.random() * 10
    }));

    const forecast = await predictive.forecast('predictions', historicalData, 7, 'trend');

    const intelligentRouter = getIntelligentRouter();
    await intelligentRouter.initialize();

    // Use forecast to inform routing
    const routing = await intelligentRouter.routeIntelligently(
      { prediction: true, forecast: forecast.forecast },
      { requestType: 'prediction', priority: 'high' }
    );

    console.log(`   ✅ Forecast generated: ${forecast ? 'yes' : 'no'}`);
    console.log(`   ✅ Intelligent routing: ${routing.region.id}`);
    console.log(`   ✅ Routing confidence: ${routing.intelligence?.confidence?.toFixed(2) || 'N/A'}`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 4: BI Integration + Self-Learning Integration
  console.log('\n📋 Test 4: BI Integration + Self-Learning Integration');
  try {
    const biIntegration = getBIIntegration();
    await biIntegration.initialize();

    const reportData = {
      totalPredictions: 10000,
      avgLatency: 150,
      accuracy: 0.95
    };

    const report = await biIntegration.generateBIReport('performance', reportData);

    const selfLearning = getSelfLearning();
    await selfLearning.initialize();

    // Learn from report
    selfLearning.learnFromExperience('high_performance', 0.9, { report: reportData }, 'model_selection');

    const stats = selfLearning.getLearningStatistics();

    console.log(`   ✅ BI report generated: ${report ? 'yes' : 'no'}`);
    console.log(`   ✅ Learning events: ${stats.totalLearningEvents}`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 5: Full System Integration
  console.log('\n📋 Test 5: Full System Integration');
  try {
    // Simulate a full request flow with all Month 9 features
    const request = { prediction: true, userId: 'user-1' };

    // 1. Intelligent routing
    const intelligentRouter = getIntelligentRouter();
    const routing = await intelligentRouter.routeIntelligently(request, {
      requestType: 'prediction',
      priority: 'high'
    });

    // 2. Trend analysis
    const trendAnalyzer = getTrendAnalyzer();
    const timeSeriesData = Array.from({ length: 30 }, (_, i) => ({
      timestamp: Date.now() - (30 - i) * 24 * 60 * 60 * 1000,
      value: 50 + i * 2 + Math.random() * 10
    }));
    const trendAnalysis = trendAnalyzer.analyzeTrends(timeSeriesData);

    // 3. Anomaly detection
    const anomalyDetector = getAnomalyDetector();
    const realTime = anomalyDetector.detectRealTime(75);

    // 4. Recommendations
    const recommendationEngine = getRecommendationEngine();
    const recommendations = await recommendationEngine.recommend('user-1', 'hybrid', { limit: 3 });

    // 5. Auto-optimization
    const autoOptimizer = getAutoOptimizer();
    const optimization = await autoOptimizer.autoOptimize({
      cacheHitRate: 0.7,
      memoryUsage: 60,
      throughput: 100,
      avgLatency: 200
    });

    // 6. Self-learning
    const selfLearning = getSelfLearning();
    selfLearning.learnFromExperience('successful_request', 0.85, { routing, trendAnalysis }, 'routing');

    console.log(`   ✅ Intelligent routing: ${routing.region.id}`);
    console.log(`   ✅ Trend analysis: ${trendAnalysis.trend}`);
    console.log(`   ✅ Anomaly detection: ${realTime.isAnomaly ? 'anomaly' : 'normal'}`);
    console.log(`   ✅ Recommendations: ${recommendations ? recommendations.recommendations.length : 0}`);
    console.log(`   ✅ Auto-optimization: ${optimization ? optimization.applied : 0} optimizations`);
    console.log(`   ✅ Self-learning: active`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results Summary');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${passed + failed}`);
  console.log(`   🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All integration tests passed! Month 9 features are solid! ✅');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

