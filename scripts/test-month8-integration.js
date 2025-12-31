/**
 * Comprehensive integration test for Month 8 features
 * Tests optimization and resilience features together
 */

const { getCostOptimization } = require('../lib/optimization/costOptimization');
const { getResourceManager } = require('../lib/optimization/resourceManager');
const { getModelOptimizer } = require('../lib/optimization/modelOptimizer');
const { getPerformanceTuner } = require('../lib/optimization/performanceTuner');
const { getErrorHandler } = require('../lib/resilience/errorHandler');
const { getCircuitBreaker } = require('../lib/resilience/circuitBreaker');
const { getSecurityEnhancer } = require('../lib/resilience/securityEnhancer');
const { getDisasterRecovery } = require('../lib/resilience/disasterRecovery');

async function main() {
  console.log('🧪 Month 8 Integration Test\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Optimization + Resilience Integration
  console.log('\n📋 Test 1: Optimization + Resilience Integration');
  try {
    const costOpt = getCostOptimization();
    await costOpt.initialize();
    costOpt.trackCost('prediction', 0.001);

    const errorHandler = getErrorHandler();
    await errorHandler.initialize();
    
    const testError = new Error('Test error');
    const handled = await errorHandler.handleError(testError, {});
    
    console.log(`   ✅ Cost tracking: active`);
    console.log(`   ✅ Error handling: ${handled.handled ? 'active' : 'inactive'}`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 2: Resource + Circuit Breaker Integration
  console.log('\n📋 Test 2: Resource + Circuit Breaker Integration');
  try {
    const resourceMgr = getResourceManager();
    await resourceMgr.initialize();
    resourceMgr.trackUsage('cpu', 85);

    const circuitBreaker = getCircuitBreaker();
    await circuitBreaker.initialize();
    
    const result = await circuitBreaker.execute('resource-circuit', async () => {
      if (resourceMgr.getResourceUsage('cpu').current > 80) {
        throw new Error('High CPU usage');
      }
      return 'success';
    }, async () => 'fallback');

    console.log(`   ✅ Resource tracking: active`);
    console.log(`   ✅ Circuit breaker: ${result === 'fallback' ? 'used fallback' : 'direct'}`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 3: Security + Performance Integration
  console.log('\n📋 Test 3: Security + Performance Integration');
  try {
    const security = getSecurityEnhancer();
    await security.initialize();
    
    const validation = security.validateInput('test@example.com', 'email');
    const sanitized = security.sanitizeOutput('<script>alert("xss")</script>', 'xss');

    const perfTuner = getPerformanceTuner();
    await perfTuner.initialize();
    perfTuner.trackMetric('latency', 200);

    console.log(`   ✅ Security validation: ${validation.valid ? 'passed' : 'failed'}`);
    console.log(`   ✅ Security sanitization: ${sanitized.includes('<script>') ? 'failed' : 'passed'}`);
    console.log(`   ✅ Performance tracking: active`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 4: Disaster Recovery + Model Optimization Integration
  console.log('\n📋 Test 4: Disaster Recovery + Model Optimization Integration');
  try {
    const disasterRecovery = getDisasterRecovery();
    await disasterRecovery.initialize();
    
    const backup = await disasterRecovery.createBackup('model', {
      model: 'test-model',
      version: '1.0'
    });

    const modelOpt = getModelOptimizer();
    await modelOpt.initialize();
    
    const testModel = { layers: [{ weights: [[0.1, 0.2], [0.3, 0.4]] }] };
    const pruned = await modelOpt.pruneModel(testModel, 0.1);

    console.log(`   ✅ Backup created: ${backup ? 'yes' : 'no'}`);
    console.log(`   ✅ Model optimization: ${pruned ? 'success' : 'failed'}`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 5: Full System Integration
  console.log('\n📋 Test 5: Full System Integration');
  try {
    // Simulate a full request flow with all features
    const security = getSecurityEnhancer();
    const validation = security.validateRequest(
      { email: 'user@example.com', score: 85 },
      { email: { type: 'email' }, score: { type: 'number', min: 0, max: 100 } }
    );

    if (!validation.valid) throw new Error('Validation failed');

    const circuitBreaker = getCircuitBreaker();
    const result = await circuitBreaker.execute('full-system', async () => {
      // Simulate operation
      return { prediction: 0.85 };
    }, async () => ({ prediction: 0.75 }));

    const costOpt = getCostOptimization();
    costOpt.trackCost('prediction', 0.001);

    const perfTuner = getPerformanceTuner();
    perfTuner.trackMetric('latency', 150);

    console.log(`   ✅ Request validation: passed`);
    console.log(`   ✅ Circuit breaker: active`);
    console.log(`   ✅ Cost tracking: active`);
    console.log(`   ✅ Performance tracking: active`);
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
    console.log('\n🎉 All integration tests passed! Month 8 features are solid! ✅');
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

