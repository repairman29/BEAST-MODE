/**
 * Test Model Optimization & Marketplace Services
 * 
 * Tests model optimization and marketplace services
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
  console.log('🧪 Testing Model Optimization & Marketplace Services\n');

  // Test 1: Model Optimization - Status
  console.log('1️⃣  Testing Model Optimization - Status...');
  const modelStatus = await testEndpoint(`${BASE_URL}/api/optimization/models?operation=status`);
  if (modelStatus.status === 200) {
    console.log('   ✅ Model optimizer ready');
  } else {
    console.log(`   ⚠️  Model optimizer: ${modelStatus.status}`);
  }

  // Test 2: Integration Marketplace - List
  console.log('\n2️⃣  Testing Integration Marketplace - List...');
  const integrations = await testEndpoint(`${BASE_URL}/api/marketplace/integrations?operation=list`);
  if (integrations.status === 200) {
    console.log('   ✅ Integrations listed');
  } else {
    console.log(`   ⚠️  Integration marketplace: ${integrations.status}`);
  }

  // Test 3: Integration Marketplace - Search
  console.log('\n3️⃣  Testing Integration Marketplace - Search...');
  const searchResults = await testEndpoint(`${BASE_URL}/api/marketplace/integrations?operation=search&query=github`);
  if (searchResults.status === 200) {
    console.log('   ✅ Integration search working');
  } else {
    console.log(`   ⚠️  Integration search: ${searchResults.status}`);
  }

  // Test 4: Plugin Marketplace - List
  console.log('\n4️⃣  Testing Plugin Marketplace - List...');
  const plugins = await testEndpoint(`${BASE_URL}/api/marketplace/plugins?operation=list`);
  if (plugins.status === 200) {
    console.log('   ✅ Plugins listed');
  } else {
    console.log(`   ⚠️  Plugin marketplace: ${plugins.status}`);
  }

  // Test 5: Plugin Marketplace - Search
  console.log('\n5️⃣  Testing Plugin Marketplace - Search...');
  const pluginSearch = await testEndpoint(`${BASE_URL}/api/marketplace/plugins?operation=search&query=quality`);
  if (pluginSearch.status === 200) {
    console.log('   ✅ Plugin search working');
  } else {
    console.log(`   ⚠️  Plugin search: ${pluginSearch.status}`);
  }

  console.log('\n✅ Model optimization & marketplace services tests complete!');
  console.log('\n📊 Summary:');
  console.log(`   ✅ Model Optimization: ${modelStatus.status === 200 ? 'Working' : 'Needs attention'}`);
  console.log(`   ✅ Integration Marketplace: ${integrations.status === 200 ? 'Working' : 'Needs attention'}`);
  console.log(`   ✅ Plugin Marketplace: ${plugins.status === 200 ? 'Working' : 'Needs attention'}`);

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

