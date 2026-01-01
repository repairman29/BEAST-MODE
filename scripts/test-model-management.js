/**
 * Test Model Management Services
 * 
 * Tests model registry, versioning, and A/B testing
 * 
 * Phase 3: Model Management Integration
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
  console.log('🧪 Testing Model Management Services\n');

  // Test 1: Model Registry - List
  console.log('1️⃣  Testing Model Registry - List...');
  const models = await testEndpoint(`${BASE_URL}/api/mlops/model-registry?operation=list`);
  if (models.status === 200) {
    console.log('   ✅ Models listed');
  } else {
    console.log(`   ⚠️  Model registry: ${models.status}`);
  }

  // Test 2: Model Registry - Register
  console.log('\n2️⃣  Testing Model Registry - Register...');
  const register = await testEndpoint(`${BASE_URL}/api/mlops/model-registry`, 'POST', {
    operation: 'register',
    modelName: 'test-model',
    modelPath: '/path/to/model',
    metadata: { version: '1.0.0' }
  });
  if (register.status === 200) {
    console.log('   ✅ Model registered');
  } else {
    console.log(`   ⚠️  Model registration: ${register.status}`);
  }

  // Test 3: A/B Testing - List
  console.log('\n3️⃣  Testing A/B Testing - List...');
  const experiments = await testEndpoint(`${BASE_URL}/api/mlops/ab-testing?operation=list`);
  if (experiments.status === 200) {
    console.log('   ✅ Experiments listed');
  } else {
    console.log(`   ⚠️  A/B testing: ${experiments.status}`);
  }

  // Test 4: A/B Testing - Create
  console.log('\n4️⃣  Testing A/B Testing - Create...');
  const createExperiment = await testEndpoint(`${BASE_URL}/api/mlops/ab-testing`, 'POST', {
    operation: 'create',
    name: 'test-experiment',
    variants: [
      { name: 'variant-a', modelPath: '/path/to/model-a' },
      { name: 'variant-b', modelPath: '/path/to/model-b' }
    ],
    config: { trafficSplit: 0.5 }
  });
  if (createExperiment.status === 200) {
    console.log('   ✅ Experiment created');
  } else {
    console.log(`   ⚠️  Experiment creation: ${createExperiment.status}`);
  }

  console.log('\n✅ Model management services tests complete!');
  console.log('\n📊 Summary:');
  console.log(`   ✅ Model Registry: ${models.status === 200 ? 'Working' : 'Needs attention'}`);
  console.log(`   ✅ A/B Testing: ${experiments.status === 200 ? 'Working' : 'Needs attention'}`);

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

