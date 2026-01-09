#!/usr/bin/env node
/**
 * Test PLG Components
 * 
 * Verifies all components work correctly
 */

const fetch = require('node-fetch');

const API_BASE = process.env.BEAST_MODE_API || 'http://localhost:3000';
const TEST_REPO = 'facebook/react';

async function testBadgeAPI() {
  console.log('🧪 Testing Badge API...');
  try {
    const response = await fetch(`${API_BASE}/api/badge?repo=${TEST_REPO}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('image/svg+xml')) {
      throw new Error('Expected SVG content type');
    }
    const svg = await response.text();
    if (!svg.includes('<svg')) {
      throw new Error('Response is not valid SVG');
    }
    console.log('   ✅ Badge API working - returns SVG');
    return true;
  } catch (error) {
    console.error(`   ❌ Badge API failed: ${error.message}`);
    return false;
  }
}

async function testQualityAPI() {
  console.log('🧪 Testing Quality API...');
  try {
    const response = await fetch(`${API_BASE}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: TEST_REPO, platform: 'test' })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!data.quality && data.quality !== 0) {
      throw new Error('Missing quality score');
    }
    if (!data.recommendations || !Array.isArray(data.recommendations)) {
      throw new Error('Missing recommendations array');
    }
    console.log(`   ✅ Quality API working - quality: ${(data.quality * 100).toFixed(1)}%, recommendations: ${data.recommendations.length}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Quality API failed: ${error.message}`);
    return false;
  }
}

async function testUsageAPI() {
  console.log('🧪 Testing Usage Tracking API...');
  try {
    // Test POST (track usage)
    const postResponse = await fetch(`${API_BASE}/api/plg/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        componentName: 'TestComponent',
        componentType: 'widget',
        repo: TEST_REPO,
        sessionId: 'test-session-' + Date.now()
      })
    });
    if (!postResponse.ok) {
      throw new Error(`POST HTTP ${postResponse.status}`);
    }
    const postData = await postResponse.json();
    if (!postData.success) {
      throw new Error('POST did not return success');
    }
    console.log('   ✅ Usage tracking API (POST) working');

    // Test GET (query stats)
    const getResponse = await fetch(`${API_BASE}/api/plg/usage?days=30`);
    if (!getResponse.ok) {
      throw new Error(`GET HTTP ${getResponse.status}`);
    }
    const getData = await getResponse.json();
    if (!getData.total && getData.total !== 0) {
      throw new Error('GET did not return total');
    }
    console.log(`   ✅ Usage query API (GET) working - total: ${getData.total}, components: ${getData.components.length}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Usage API failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing PLG Components\n');
  console.log('='.repeat(70));
  console.log();

  const results = {
    badge: await testBadgeAPI(),
    quality: await testQualityAPI(),
    usage: await testUsageAPI()
  };

  console.log();
  console.log('='.repeat(70));
  console.log('📊 Test Results:');
  console.log('='.repeat(70));
  console.log();
  console.log(`   Badge API:     ${results.badge ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Quality API:   ${results.quality ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Usage API:     ${results.usage ? '✅ PASS' : '❌ FAIL'}`);
  console.log();

  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    console.log('✅ All tests passed!');
    console.log();
    console.log('💡 Next steps:');
    console.log('   1. Visit /quality page to see components in action');
    console.log('   2. Visit /plg-usage to see usage stats');
    console.log('   3. Visit /plg-demo to see all components');
  } else {
    console.log('⚠️  Some tests failed. Check API server and database.');
  }
  console.log();
}

main().catch(console.error);
