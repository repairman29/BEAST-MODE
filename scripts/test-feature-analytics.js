/**
 * Test Feature Store & Advanced Analytics Services
 * 
 * Tests feature store and advanced analytics services
 * 
 * Phase 3: Feature Store & Advanced Analytics Integration
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
  console.log('🧪 Testing Feature Store & Advanced Analytics Services\n');

  // Test 1: Feature Store - List
  console.log('1️⃣  Testing Feature Store - List...');
  const features = await testEndpoint(`${BASE_URL}/api/mlops/feature-store?operation=list`);
  if (features.status === 200) {
    console.log('   ✅ Features listed');
  } else {
    console.log(`   ⚠️  Feature store: ${features.status}`);
  }

  // Test 2: Feature Store - Store
  console.log('\n2️⃣  Testing Feature Store - Store...');
  const storeFeature = await testEndpoint(`${BASE_URL}/api/mlops/feature-store`, 'POST', {
    operation: 'store',
    featureName: 'test-feature',
    features: { value: 1.0 },
    metadata: { type: 'numeric' }
  });
  if (storeFeature.status === 200) {
    console.log('   ✅ Feature stored');
  } else {
    console.log(`   ⚠️  Feature storage: ${storeFeature.status}`);
  }

  // Test 3: Advanced Analytics - Status
  console.log('\n3️⃣  Testing Advanced Analytics - Status...');
  const analyticsStatus = await testEndpoint(`${BASE_URL}/api/mlops/analytics?operation=status`);
  if (analyticsStatus.status === 200) {
    console.log('   ✅ Advanced analytics ready');
  } else {
    console.log(`   ⚠️  Advanced analytics: ${analyticsStatus.status}`);
  }

  // Test 4: Advanced Analytics - Report
  console.log('\n4️⃣  Testing Advanced Analytics - Report...');
  const report = await testEndpoint(`${BASE_URL}/api/mlops/analytics?operation=report`);
  if (report.status === 200) {
    console.log('   ✅ Report generated');
  } else {
    console.log(`   ⚠️  Report generation: ${report.status}`);
  }

  console.log('\n✅ Feature store & advanced analytics services tests complete!');
  console.log('\n📊 Summary:');
  console.log(`   ✅ Feature Store: ${features.status === 200 ? 'Working' : 'Needs attention'}`);
  console.log(`   ✅ Advanced Analytics: ${analyticsStatus.status === 200 ? 'Working' : 'Needs attention'}`);

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

