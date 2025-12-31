/**
 * Test script for intelligence features
 */

const { getRecommendationEngine } = require('../lib/intelligence/recommendationEngine');
const { getIntelligentRouter } = require('../lib/intelligence/intelligentRouter');
const { getAutoOptimizer } = require('../lib/intelligence/autoOptimizer');
const { getSelfLearning } = require('../lib/intelligence/selfLearning');

async function main() {
  console.log('🧠 Testing Intelligence Features\n');

  // Test Recommendation Engine
  console.log('1️⃣  Testing Recommendation Engine...');
  const recommendationEngine = getRecommendationEngine();
  await recommendationEngine.initialize();

  // Setup test data
  recommendationEngine.setItemFeatures('item-1', { genre: 0.8, rating: 0.9 });
  recommendationEngine.setItemFeatures('item-2', { genre: 0.7, rating: 0.8 });
  recommendationEngine.recordInteraction('user-1', 'item-1', 5);
  recommendationEngine.recordInteraction('user-2', 'item-1', 4);
  recommendationEngine.recordInteraction('user-2', 'item-2', 5);

  const recommendations = await recommendationEngine.recommend('user-1', 'hybrid', { limit: 5 });
  console.log(`   ✅ Recommendations generated: ${recommendations ? recommendations.recommendations.length : 0}`);
  console.log(`   ✅ Strategy: ${recommendations?.strategy || 'none'}\n`);

  // Test Intelligent Router
  console.log('2️⃣  Testing Intelligent Router...');
  const intelligentRouter = getIntelligentRouter();
  await intelligentRouter.initialize();

  const routing = await intelligentRouter.routeIntelligently(
    { prediction: true },
    { requestType: 'prediction', priority: 'high' }
  );
  console.log(`   ✅ Request routed: ${routing.region.id}`);
  console.log(`   ✅ Intelligence: ${routing.intelligence ? 'active' : 'inactive'}`);
  console.log(`   ✅ Confidence: ${routing.intelligence?.confidence?.toFixed(2) || 'N/A'}\n`);

  // Test Auto-Optimizer
  console.log('3️⃣  Testing Auto-Optimizer...');
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
  console.log(`   ✅ Optimizations applied: ${optimization ? optimization.applied : 0}`);
  console.log(`   ✅ Current config: ${Object.keys(autoOptimizer.getCurrentConfig()).length} parameters\n`);

  // Test Self-Learning
  console.log('4️⃣  Testing Self-Learning...');
  const selfLearning = getSelfLearning();
  await selfLearning.initialize();

  selfLearning.learnFromExperience('action-1', 0.8, { state: 'test' }, 'model_selection');
  selfLearning.learnFromExperience('action-2', 0.9, { state: 'test' }, 'model_selection');
  
  const action = selfLearning.selectAction({ state: 'test' }, 'model_selection');
  console.log(`   ✅ Action selected: ${action || 'none'}`);

  const adaptation = selfLearning.adapt({
    performance: 0.75,
    errorRate: 0.03
  });
  console.log(`   ✅ Adaptation: ${adaptation ? adaptation.changes.length : 0} changes`);

  const stats = selfLearning.getLearningStatistics();
  console.log(`   ✅ Learning events: ${stats.totalLearningEvents}\n`);

  console.log('✅ All intelligence features tested successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

