#!/usr/bin/env node

/**
 * End-to-End Testing Script
 * 
 * Tests critical user flows for MVP readiness
 * Week 2 Day 3-4: End-to-End Testing
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.TEST_API_KEY || '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let passed = 0;
let failed = 0;
let skipped = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function test(name, fn) {
  try {
    log(`\n🧪 Testing: ${name}`, 'cyan');
    await fn();
    log(`✅ PASS: ${name}`, 'green');
    passed++;
  } catch (error) {
    log(`❌ FAIL: ${name}`, 'red');
    log(`   Error: ${error.message}`, 'red');
    if (error.stack) {
      log(`   ${error.stack.split('\n')[1]}`, 'yellow');
    }
    failed++;
  }
}

async function testSkip(name, reason) {
  log(`\n⏭️  SKIP: ${name} (${reason})`, 'yellow');
  skipped++;
}

// Test 1: Health Check
async function testHealthCheck() {
  const response = await makeRequest(`${BASE_URL}/api/health`);
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  if (!response.data.status) {
    throw new Error('Health check missing status');
  }
  log(`   Status: ${response.data.status}`, 'blue');
}

// Test 2: API Quality Endpoint (GET)
async function testQualityAPIGet() {
  const response = await makeRequest(`${BASE_URL}/api/repos/quality`);
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  if (!response.data.message) {
    throw new Error('Missing API message');
  }
  log(`   Message: ${response.data.message}`, 'blue');
}

// Test 3: API Quality Endpoint (POST) - Without API Key
async function testQualityAPIPostNoKey() {
  const response = await makeRequest(`${BASE_URL}/api/repos/quality`, {
    method: 'POST',
    body: {
      repo: 'facebook/react',
    },
  });
  // Should work without API key (free tier)
  if (response.status !== 200 && response.status !== 503) {
    throw new Error(`Expected 200 or 503, got ${response.status}`);
  }
  if (response.data.error && !response.data.error.includes('not available')) {
    throw new Error(`Unexpected error: ${response.data.error}`);
  }
  log(`   Status: ${response.status}`, 'blue');
}

// Test 4: API Quality Endpoint (POST) - With API Key
async function testQualityAPIPostWithKey() {
  if (!API_KEY) {
    throw new Error('API_KEY not provided - skipping authenticated test');
  }
  
  const response = await makeRequest(`${BASE_URL}/api/repos/quality`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: {
      repo: 'facebook/react',
      platform: 'beast-mode',
    },
  });
  
  if (response.status !== 200 && response.status !== 503) {
    throw new Error(`Expected 200 or 503, got ${response.status}`);
  }
  
  if (response.status === 200 && response.data.quality !== undefined) {
    log(`   Quality Score: ${response.data.quality}`, 'blue');
    log(`   Confidence: ${response.data.confidence}`, 'blue');
  } else {
    log(`   Model not available (expected in dev)`, 'yellow');
  }
}

// Test 5: Auth Validation Endpoint
async function testAuthValidation() {
  if (!API_KEY) {
    throw new Error('API_KEY not provided - skipping auth test');
  }
  
  const response = await makeRequest(`${BASE_URL}/api/auth/validate`, {
    method: 'POST',
    body: {
      apiKey: API_KEY,
    },
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data.valid) {
    throw new Error('API key validation failed');
  }
  
  log(`   Valid: ${response.data.valid}`, 'blue');
  log(`   Tier: ${response.data.tier || 'unknown'}`, 'blue');
}

// Test 6: Usage Tracking Endpoint
async function testUsageTracking() {
  if (!API_KEY) {
    throw new Error('API_KEY not provided - skipping usage test');
  }
  
  const response = await makeRequest(`${BASE_URL}/api/auth/usage`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });
  
  if (response.status !== 200 && response.status !== 401) {
    throw new Error(`Expected 200 or 401, got ${response.status}`);
  }
  
  if (response.status === 200) {
    log(`   Used: ${response.data.used || 0}`, 'blue');
    log(`   Limit: ${response.data.limit || 0}`, 'blue');
  }
}

// Test 7: Error Logging Endpoint
async function testErrorLogging() {
  const response = await makeRequest(`${BASE_URL}/api/beast-mode/errors`, {
    method: 'POST',
    body: {
      errors: [{
        message: 'Test error',
        name: 'TestError',
        stack: 'Test stack trace',
        context: {
          component: 'test',
          timestamp: Date.now(),
        },
      }],
    },
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Error logging failed');
  }
  
  log(`   Errors logged: ${response.data.count || 0}`, 'blue');
}

// Test 8: Analytics Endpoint
async function testAnalytics() {
  const response = await makeRequest(`${BASE_URL}/api/beast-mode/analytics`, {
    method: 'POST',
    body: {
      events: [{
        type: 'event',
        category: 'test',
        action: 'test-action',
        timestamp: Date.now(),
        sessionId: 'test-session',
      }],
    },
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  log(`   Analytics event recorded`, 'blue');
}

// Test 9: Performance Monitoring Endpoint
async function testPerformanceMonitoring() {
  const response = await makeRequest(`${BASE_URL}/api/beast-mode/monitoring/performance`, {
    method: 'POST',
    body: {
      stats: {
        'test.operation': {
          operation: 'test.operation',
          count: 1,
          totalDuration: 100,
          averageDuration: 100,
          minDuration: 100,
          maxDuration: 100,
          p50: 100,
          p95: 100,
          p99: 100,
          errorCount: 0,
          errorRate: 0,
        },
      },
      timestamp: Date.now(),
    },
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Performance monitoring failed');
  }
  
  log(`   Performance metrics recorded`, 'blue');
}

// Test 10: Sitemap
async function testSitemap() {
  const response = await makeRequest(`${BASE_URL}/sitemap.xml`);
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  if (!response.data.includes('urlset')) {
    throw new Error('Invalid sitemap format');
  }
  log(`   Sitemap accessible`, 'blue');
}

// Main test runner
async function runTests() {
  log('\n🚀 Starting End-to-End Tests', 'cyan');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`API Key: ${API_KEY ? '***' + API_KEY.slice(-4) : 'Not provided'}`, 'blue');
  
  // Core API Tests
  await test('Health Check', testHealthCheck);
  await test('Quality API (GET)', testQualityAPIGet);
  await test('Quality API (POST) - No Auth', testQualityAPIPostNoKey);
  
  if (API_KEY) {
    await test('Quality API (POST) - With Auth', testQualityAPIPostWithKey);
    await test('Auth Validation', testAuthValidation);
    await test('Usage Tracking', testUsageTracking);
  } else {
    await testSkip('Quality API (POST) - With Auth', 'No API key provided');
    await testSkip('Auth Validation', 'No API key provided');
    await testSkip('Usage Tracking', 'No API key provided');
  }
  
  // Monitoring & Analytics Tests
  await test('Error Logging', testErrorLogging);
  await test('Analytics', testAnalytics);
  await test('Performance Monitoring', testPerformanceMonitoring);
  
  // SEO Tests
  await test('Sitemap', testSitemap);
  
  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 Test Summary', 'cyan');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`⏭️  Skipped: ${skipped}`, 'yellow');
  log('='.repeat(50), 'cyan');
  
  if (failed > 0) {
    log('\n⚠️  Some tests failed. Review errors above.', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ All tests passed!', 'green');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

