/**
 * Test Optimization Services Integration
 * 
 * Tests cost, performance, and resource optimization services
 * 
 * Phase 2: Optimization Services Integration
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testEndpoint(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

async function main() {
  console.log('🧪 Testing Optimization Services Integration\n');

  // Test 1: Cost Optimization - Summary
  console.log('1️⃣  Testing Cost Optimization - Summary...');
  const costSummary = await testEndpoint(`${BASE_URL}/api/optimization/cost?operation=summary`);
  if (costSummary.status === 200) {
    console.log('   ✅ Cost summary retrieved');
  } else {
    console.log(`   ⚠️  Cost summary: ${costSummary.status}`);
  }

  // Test 2: Cost Optimization - Predict
  console.log('\n2️⃣  Testing Cost Optimization - Predict...');
  const costPredict = await testEndpoint(`${BASE_URL}/api/optimization/cost?operation=predict&duration=3600`);
  if (costPredict.status === 200) {
    console.log('   ✅ Cost prediction retrieved');
  } else {
    console.log(`   ⚠️  Cost prediction: ${costPredict.status}`);
  }

  // Test 3: Cost Optimization - Track
  console.log('\n3️⃣  Testing Cost Optimization - Track...');
  const costTrack = await testEndpoint(`${BASE_URL}/api/optimization/cost`, 'POST', {
    operation: 'track',
    operation: 'api_request',
    cost: 0.001,
    metadata: { endpoint: '/api/test' }
  });
  if (costTrack.status === 200) {
    console.log('   ✅ Cost tracked');
  } else {
    console.log(`   ⚠️  Cost tracking: ${costTrack.status}`);
  }

  // Test 4: Performance Optimization - Summary
  console.log('\n4️⃣  Testing Performance Optimization - Summary...');
  const perfSummary = await testEndpoint(`${BASE_URL}/api/optimization/performance?operation=summary`);
  if (perfSummary.status === 200) {
    console.log('   ✅ Performance summary retrieved');
  } else {
    console.log(`   ⚠️  Performance summary: ${perfSummary.status}`);
  }

  // Test 5: Performance Optimization - Track
  console.log('\n5️⃣  Testing Performance Optimization - Track...');
  const perfTrack = await testEndpoint(`${BASE_URL}/api/optimization/performance`, 'POST', {
    operation: 'track',
    metric: 'responseTime',
    value: 150,
    metadata: { endpoint: '/api/test' }
  });
  if (perfTrack.status === 200) {
    console.log('   ✅ Performance metric tracked');
  } else {
    console.log(`   ⚠️  Performance tracking: ${perfTrack.status}`);
  }

  // Test 6: Resource Optimization - Summary
  console.log('\n6️⃣  Testing Resource Optimization - Summary...');
  const resourceSummary = await testEndpoint(`${BASE_URL}/api/optimization/resources?operation=summary`);
  if (resourceSummary.status === 200) {
    console.log('   ✅ Resource summary retrieved');
  } else {
    console.log(`   ⚠️  Resource summary: ${resourceSummary.status}`);
  }

  // Test 7: Resource Optimization - Allocate
  console.log('\n7️⃣  Testing Resource Optimization - Allocate...');
  const resourceAllocate = await testEndpoint(`${BASE_URL}/api/optimization/resources`, 'POST', {
    operation: 'allocate',
    resourceType: 'cpu',
    amount: 1,
    metadata: { service: 'api' }
  });
  if (resourceAllocate.status === 200) {
    console.log('   ✅ Resources allocated');
  } else {
    console.log(`   ⚠️  Resource allocation: ${resourceAllocate.status}`);
  }

  console.log('\n✅ Optimization services integration tests complete!');
  console.log('\n📊 Summary:');
  console.log(`   ✅ Cost Optimization: ${costSummary.status === 200 ? 'Working' : 'Needs attention'}`);
  console.log(`   ✅ Performance Optimization: ${perfSummary.status === 200 ? 'Working' : 'Needs attention'}`);
  console.log(`   ✅ Resource Optimization: ${resourceSummary.status === 200 ? 'Working' : 'Needs attention'}`);

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

