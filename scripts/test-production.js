#!/usr/bin/env node

/**
 * Production Testing Script
 * 
 * Automated tests for production deployment
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://beast-mode.dev';

const tests = {
  passed: 0,
  failed: 0,
  errors: []
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testPage(url, name) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      console.log(`   ✅ ${name}: OK (${response.status})`);
      tests.passed++;
      return true;
    } else {
      console.log(`   ❌ ${name}: Failed (${response.status})`);
      tests.failed++;
      tests.errors.push(`${name}: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${name}: Error - ${error.message}`);
    tests.failed++;
    tests.errors.push(`${name}: ${error.message}`);
    return false;
  }
}

async function testAPI(endpoint, name, method = 'GET', body = null) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    const url = `${PRODUCTION_URL}${endpoint}`;
    const response = await makeRequest(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : null
    });
    
    if (response.status < 500) {
      console.log(`   ✅ ${name}: OK (${response.status})`);
      tests.passed++;
      return true;
    } else {
      console.log(`   ❌ ${name}: Failed (${response.status})`);
      tests.failed++;
      tests.errors.push(`${name}: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${name}: Error - ${error.message}`);
    tests.failed++;
    tests.errors.push(`${name}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 Production Testing');
  console.log('='.repeat(60));
  console.log(`\nTesting: ${PRODUCTION_URL}\n`);
  
  // Phase 1: Basic Pages
  console.log('\n📄 Phase 1: Page Load Tests\n');
  await testPage(`${PRODUCTION_URL}/`, 'Homepage');
  await testPage(`${PRODUCTION_URL}/pricing`, 'Pricing Page');
  await testPage(`${PRODUCTION_URL}/docs`, 'Documentation');
  await testPage(`${PRODUCTION_URL}/about`, 'About Page');
  
  // Phase 2: API Endpoints
  console.log('\n🔌 Phase 2: API Endpoint Tests\n');
  await testAPI('/api/health', 'Health Check');
  await testAPI('/api/user/subscription', 'Subscription API');
  
  // Phase 3: Protected Routes (should redirect or show auth)
  console.log('\n🔐 Phase 3: Protected Route Tests\n');
  const dashboardResponse = await makeRequest(`${PRODUCTION_URL}/dashboard`);
  if (dashboardResponse.status === 200 || dashboardResponse.status === 307 || dashboardResponse.status === 302) {
    console.log(`   ✅ Dashboard: Responds (${dashboardResponse.status})`);
    tests.passed++;
  } else {
    console.log(`   ⚠️  Dashboard: Unexpected status (${dashboardResponse.status})`);
    tests.failed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results:\n');
  console.log(`   ✅ Passed: ${tests.passed}`);
  console.log(`   ❌ Failed: ${tests.failed}`);
  console.log(`   📊 Total: ${tests.passed + tests.failed}`);
  console.log(`   📈 Success Rate: ${((tests.passed / (tests.passed + tests.failed)) * 100).toFixed(1)}%`);
  
  if (tests.errors.length > 0) {
    console.log('\n⚠️  Errors:\n');
    tests.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (tests.failed === 0) {
    console.log('\n✅ All tests passed!\n');
    return 0;
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.\n');
    return 1;
  }
}

if (require.main === module) {
  runTests()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
