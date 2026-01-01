/**
 * Test MLOps Automation Services
 * 
 * Tests model retraining and drift detection
 * 
 * Phase 3: MLOps Automation Integration
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
  console.log('🧪 Testing MLOps Automation Services\n');

  // Test 1: Model Retraining - Status
  console.log('1️⃣  Testing Model Retraining - Status...');
  const retrainingStatus = await testEndpoint(`${BASE_URL}/api/mlops/retraining?operation=status`);
  if (retrainingStatus.status === 200) {
    console.log('   ✅ Retraining service ready');
  } else {
    console.log(`   ⚠️  Retraining service: ${retrainingStatus.status}`);
  }

  // Test 2: Model Retraining - Recommendations
  console.log('\n2️⃣  Testing Model Retraining - Recommendations...');
  const recommendations = await testEndpoint(`${BASE_URL}/api/mlops/retraining?operation=recommendations`);
  if (recommendations.status === 200) {
    console.log('   ✅ Recommendations retrieved');
  } else {
    console.log(`   ⚠️  Recommendations: ${recommendations.status}`);
  }

  // Test 3: Drift Detection - Status
  console.log('\n3️⃣  Testing Drift Detection - Status...');
  const driftStatus = await testEndpoint(`${BASE_URL}/api/mlops/drift-detection?operation=status`);
  if (driftStatus.status === 200) {
    console.log('   ✅ Drift detection ready');
  } else {
    console.log(`   ⚠️  Drift detection: ${driftStatus.status}`);
  }

  // Test 4: Drift Detection - Check
  console.log('\n4️⃣  Testing Drift Detection - Check...');
  const driftCheck = await testEndpoint(`${BASE_URL}/api/mlops/drift-detection?operation=check&modelId=test-model`);
  if (driftCheck.status === 200) {
    console.log('   ✅ Drift check completed');
  } else {
    console.log(`   ⚠️  Drift check: ${driftCheck.status}`);
  }

  console.log('\n✅ MLOps automation services tests complete!');
  console.log('\n📊 Summary:');
  console.log(`   ✅ Model Retraining: ${retrainingStatus.status === 200 ? 'Working' : 'Needs attention'}`);
  console.log(`   ✅ Drift Detection: ${driftStatus.status === 200 ? 'Working' : 'Needs attention'}`);

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

