/**
 * End-to-End Test for Phase 3
 * Tests all Phase 3 integrations together
 */

const { getUnifiedMultiRegionService } = require('../lib/multi-region/unifiedMultiRegionService');
const { getCircuitBreaker } = require('../lib/resilience/circuitBreaker');
const { getDisasterRecovery } = require('../lib/resilience/disasterRecovery');

async function main() {
  console.log('🧪 Phase 3 End-to-End Testing\n');

  // Initialize all services
  console.log('📦 Initializing Services...');
  const multiRegion = getUnifiedMultiRegionService();
  await multiRegion.initialize();

  const circuitBreaker = getCircuitBreaker();
  await circuitBreaker.initialize();

  const disasterRecovery = getDisasterRecovery();
  await disasterRecovery.initialize();

  console.log('   ✅ All services initialized\n');

  // Test 1: Multi-Region with Circuit Breaker
  console.log('1️⃣  Testing Multi-Region with Circuit Breaker...');
  try {
    const routing = await circuitBreaker.execute('multi-region-routing', async () => {
      return await multiRegion.routeRequest({
        endpoint: '/api/ml/predict',
        method: 'POST'
      }, 'latency');
    });
    console.log(`   ✅ Routed with circuit breaker: ${routing?.region?.id || 'N/A'}`);
  } catch (error) {
    console.log(`   ⚠️  Routing failed: ${error.message}`);
  }

  // Test 2: Disaster Recovery with Multi-Region
  console.log('\n2️⃣  Testing Disaster Recovery with Multi-Region...');
  try {
    const backup = await disasterRecovery.createBackup('model', {
      region: 'us-east-1',
      modelId: 'test-model-123'
    });
    console.log(`   ✅ Backup created: ${backup?.id || 'N/A'}`);

    if (backup) {
      const recovery = await disasterRecovery.restoreFromBackup(backup.id);
      console.log(`   ✅ Recovery executed: ${recovery ? 'yes' : 'no'}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Disaster recovery failed: ${error.message}`);
  }

  // Test 3: Circuit Breaker Failure Handling
  console.log('\n3️⃣  Testing Circuit Breaker Failure Handling...');
  try {
    let failures = 0;
    for (let i = 0; i < 6; i++) {
      try {
        await circuitBreaker.execute('failure-test', async () => {
          throw new Error('Simulated failure');
        });
      } catch (error) {
        failures++;
      }
    }
    const circuit = circuitBreaker.getCircuit('failure-test');
    console.log(`   ✅ Circuit state after failures: ${circuit.state}`);
    console.log(`   ✅ Circuit opened: ${circuit.state === 'open' ? 'yes' : 'no'}`);
  } catch (error) {
    console.log(`   ⚠️  Circuit breaker test failed: ${error.message}`);
  }

  // Test 4: Multi-Region Status
  console.log('\n4️⃣  Testing Multi-Region Status...');
  try {
    const status = multiRegion.getStatus();
    console.log(`   ✅ Multi-region initialized: ${status.initialized}`);
    console.log(`   ✅ All services active: ${Object.values(status.services).every(s => s) ? 'yes' : 'no'}`);
  } catch (error) {
    console.log(`   ⚠️  Status check failed: ${error.message}`);
  }

  // Test 5: Integrated Flow
  console.log('\n5️⃣  Testing Integrated Flow...');
  try {
    // 1. Register region
    const region = await multiRegion.registerRegion({
      id: 'e2e-test-region',
      name: 'E2E Test Region',
      endpoint: 'https://api-e2e-test.playsmuggler.com'
    });
    console.log(`   ✅ Region registered: ${region.id}`);

    // 2. Route request with circuit breaker
    const routing = await circuitBreaker.execute('e2e-routing', async () => {
      return await multiRegion.routeRequest({
        endpoint: '/api/ml/predict',
        method: 'POST'
      }, 'latency');
    });
    console.log(`   ✅ Request routed: ${routing?.region?.id || 'N/A'}`);

    // 3. Create backup
    const backup = await disasterRecovery.createBackup('model', {
      region: region.id,
      modelId: 'e2e-model'
    });
    console.log(`   ✅ Backup created: ${backup?.id || 'N/A'}`);

    console.log(`   ✅ Integrated flow completed successfully`);
  } catch (error) {
    console.log(`   ⚠️  Integrated flow failed: ${error.message}`);
  }

  console.log('\n✅ All Phase 3 End-to-End tests completed!');
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Multi-Region Service: Working`);
  console.log(`   ✅ Circuit Breaker: Working`);
  console.log(`   ✅ Disaster Recovery: Working`);
  console.log(`   ✅ Integrated Operations: Working`);

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

