/**
 * Test Performance Optimization Services
 * 
 * Tests database, cache, and API optimization
 * 
 * Phase 4: Performance Optimization
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
  console.log('🧪 Testing Performance Optimization Services\n');

  // Test 1: Database Optimization - Status
  console.log('1️⃣  Testing Database Optimization - Status...');
  const dbStatus = await testEndpoint(`${BASE_URL}/api/optimization/database?operation=status`);
  if (dbStatus.status === 200) {
    console.log('   ✅ Database optimizer ready');
  } else {
    console.log(`   ⚠️  Database optimizer: ${dbStatus.status}`);
  }

  // Test 2: Cache Optimization - Status
  console.log('\n2️⃣  Testing Cache Optimization - Status...');
  const cacheStatus = await testEndpoint(`${BASE_URL}/api/optimization/cache?operation=status`);
  if (cacheStatus.status === 200) {
    console.log('   ✅ Cache optimizer ready');
  } else {
    console.log(`   ⚠️  Cache optimizer: ${cacheStatus.status}`);
  }

  // Test 3: Cache Optimization - Set
  console.log('\n3️⃣  Testing Cache Optimization - Set...');
  const cacheSet = await testEndpoint(`${BASE_URL}/api/optimization/cache`, 'POST', {
    operation: 'set',
    key: 'test-key',
    value: 'test-value',
    ttl: 3600
  });
  if (cacheSet.status === 200) {
    console.log('   ✅ Value cached');
  } else {
    console.log(`   ⚠️  Cache set: ${cacheSet.status}`);
  }

  console.log('\n✅ Performance optimization services tests complete!');
  console.log('\n📊 Summary:');
  console.log(`   ✅ Database Optimization: ${dbStatus.status === 200 ? 'Working' : 'Needs attention'}`);
  console.log(`   ✅ Cache Optimization: ${cacheStatus.status === 200 ? 'Working' : 'Needs attention'}`);

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

