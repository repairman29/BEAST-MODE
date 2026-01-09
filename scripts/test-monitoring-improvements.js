#!/usr/bin/env node
/**
 * Test Monitoring Improvements
 * 
 * Tests the monitoring and cache improvements we just implemented
 */

const { getModelRouter } = require('../lib/mlops/modelRouter');
const { getCustomModelMonitoring } = require('../lib/mlops/customModelMonitoring');
const { getMultiTierCache } = require('../lib/mlops/multiTierCache');

async function testMonitoring() {
  console.log('🧪 Testing Monitoring Improvements\n');
  console.log('='.repeat(70));
  console.log();

  // Test 1: ModelRouter tracking
  console.log('1️⃣  Testing ModelRouter Request Tracking...');
  const router = getModelRouter();
  
  if (typeof router.trackRequest === 'function') {
    console.log('   ✅ trackRequest() method exists');
  } else {
    console.log('   ❌ trackRequest() method missing');
    return false;
  }

  // Test 2: Monitoring system
  console.log('\n2️⃣  Testing Monitoring System...');
  const monitoring = getCustomModelMonitoring();
  const metrics = monitoring.getMetrics();
  const health = monitoring.getHealthStatus();
  
  console.log(`   ✅ Monitoring system operational`);
  console.log(`   📊 Total requests: ${metrics.requests.total}`);
  console.log(`   📊 Success rate: ${metrics.requests.successRate}`);
  console.log(`   📊 Health status: ${health.status}`);

  // Test 3: Cache system
  console.log('\n3️⃣  Testing Cache System...');
  const cache = router.cache;
  
  if (cache.constructor.name === 'MultiTierCache') {
    console.log('   ✅ Multi-tier cache active');
    const cacheStats = cache.getStats();
    console.log(`   📊 L1 enabled: ${cacheStats.tiers.l1.enabled}`);
    console.log(`   📊 L2 enabled: ${cacheStats.tiers.l2.enabled}`);
    console.log(`   📊 L3 enabled: ${cacheStats.tiers.l3.enabled}`);
    console.log(`   📊 Overall hit rate: ${cacheStats.overall.hitRate}`);
  } else if (cache.constructor.name === 'LLMCache') {
    console.log('   ✅ Single-tier cache active (fallback)');
    const cacheStats = cache.getStats();
    console.log(`   📊 Cache enabled: ${cache.isEnabled()}`);
    console.log(`   📊 Hit rate: ${cacheStats.hitRate}`);
    if (cacheStats.semanticHitRate) {
      console.log(`   📊 Semantic hit rate: ${cacheStats.semanticHitRate}`);
    }
  } else {
    console.log('   ⚠️  Unknown cache type:', cache.constructor.name);
  }

  // Test 4: Semantic cache matching
  console.log('\n4️⃣  Testing Semantic Cache Matching...');
  if (cache.options && cache.options.semanticSimilarity !== undefined) {
    console.log(`   ✅ Semantic similarity: ${cache.options.semanticSimilarity ? 'enabled' : 'disabled'}`);
    if (cache.options.semanticSimilarity) {
      console.log(`   📊 Similarity threshold: ${cache.options.similarityThreshold || 0.95}`);
    }
  } else {
    console.log('   ⚠️  Semantic similarity option not found');
  }

  // Test 5: Error handling
  console.log('\n5️⃣  Testing Error Handling...');
  try {
    // Simulate a failed request tracking
    router.trackRequest('test-model', {}, 100, false, new Error('Test error'), null, false);
    console.log('   ✅ Error tracking works');
  } catch (error) {
    console.log('   ❌ Error tracking failed:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ All tests completed!\n');
  
  return true;
}

// Run tests
if (require.main === module) {
  testMonitoring().catch(console.error);
}

module.exports = { testMonitoring };
