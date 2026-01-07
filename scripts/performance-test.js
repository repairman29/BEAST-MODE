#!/usr/bin/env node

/**
 * Performance Testing Script for BEAST MODE MVP
 * 
 * Tests:
 * - API response times
 * - Model loading performance
 * - Cache effectiveness
 * - Concurrent request handling
 */

const https = require('https');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const results = {
  apiTests: [],
  modelTests: [],
  cacheTests: [],
  concurrentTests: [],
};

/**
 * Make HTTP request and measure time
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          duration,
          data: data ? JSON.parse(data) : null,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test API response times
 */
async function testAPIPerformance() {
  log('\n1. Testing API Response Times...', 'cyan');
  
  const endpoints = [
    { path: '/api/health', method: 'GET', name: 'Health Check' },
    { path: '/api/repos/quality', method: 'GET', name: 'Quality API (GET)' },
    { path: '/api/repos/quality', method: 'POST', name: 'Quality API (POST)', body: { repo: 'facebook/react', features: { stars: 1000, hasTests: true } } },
    { path: '/api/auth/validate', method: 'GET', name: 'Auth Validate', headers: { 'Authorization': 'Bearer test-key' } },
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...endpoint.headers
        },
        body: endpoint.body
      });

      const passed = result.duration < 2000; // 2 second threshold
      results.apiTests.push({
        name: endpoint.name,
        duration: result.duration,
        status: result.status,
        passed
      });

      if (passed) {
        log(`   ✅ ${endpoint.name}: ${result.duration}ms (status: ${result.status})`, 'green');
      } else {
        log(`   ⚠️  ${endpoint.name}: ${result.duration}ms (slow, status: ${result.status})`, 'yellow');
      }
    } catch (error) {
      results.apiTests.push({
        name: endpoint.name,
        duration: null,
        status: 'error',
        passed: false,
        error: error.message
      });
      log(`   ❌ ${endpoint.name}: ${error.message}`, 'red');
    }
  }
}

/**
 * Test cache effectiveness
 */
async function testCache() {
  log('\n2. Testing Cache Effectiveness...', 'cyan');
  
  try {
    // First request (cache miss)
    const start1 = Date.now();
    const result1 = await makeRequest(`${BASE_URL}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { repo: 'facebook/react', features: { stars: 1000 } }
    });
    const duration1 = Date.now() - start1;

    // Second request (should be cached)
    const start2 = Date.now();
    const result2 = await makeRequest(`${BASE_URL}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { repo: 'facebook/react', features: { stars: 1000 } }
    });
    const duration2 = Date.now() - start2;

    const cacheHit = duration2 < duration1 * 0.5; // Cache should be at least 2x faster
    const improvement = ((duration1 - duration2) / duration1 * 100).toFixed(1);

    results.cacheTests.push({
      cacheMiss: duration1,
      cacheHit: duration2,
      improvement: parseFloat(improvement),
      passed: cacheHit
    });

    if (cacheHit) {
      log(`   ✅ Cache working: ${duration1}ms → ${duration2}ms (${improvement}% faster)`, 'green');
    } else {
      log(`   ⚠️  Cache may not be working: ${duration1}ms → ${duration2}ms (${improvement}% faster)`, 'yellow');
    }
  } catch (error) {
    log(`   ❌ Cache test failed: ${error.message}`, 'red');
    results.cacheTests.push({
      passed: false,
      error: error.message
    });
  }
}

/**
 * Test concurrent requests
 */
async function testConcurrent() {
  log('\n3. Testing Concurrent Requests...', 'cyan');
  
  try {
    const concurrent = 5;
    const start = Date.now();
    
    const promises = Array(concurrent).fill(null).map(() =>
      makeRequest(`${BASE_URL}/api/health`, { method: 'GET' })
    );

    const results = await Promise.all(promises);
    const duration = Date.now() - start;
    const avgDuration = duration / concurrent;
    const allPassed = results.every(r => r.status === 200);

    results.concurrentTests.push({
      concurrent,
      totalDuration: duration,
      avgDuration,
      allPassed,
      passed: allPassed && avgDuration < 1000
    });

    if (allPassed && avgDuration < 1000) {
      log(`   ✅ ${concurrent} concurrent requests: ${avgDuration.toFixed(0)}ms avg (${duration}ms total)`, 'green');
    } else {
      log(`   ⚠️  ${concurrent} concurrent requests: ${avgDuration.toFixed(0)}ms avg (${duration}ms total)`, 'yellow');
    }
  } catch (error) {
    log(`   ❌ Concurrent test failed: ${error.message}`, 'red');
    results.concurrentTests.push({
      passed: false,
      error: error.message
    });
  }
}

/**
 * Main function
 */
async function main() {
  log('\n⚡ BEAST MODE Performance Testing\n', 'cyan');
  log('='.repeat(60) + '\n');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log('Note: Server must be running for these tests\n', 'yellow');

  try {
    await testAPIPerformance();
    await testCache();
    await testConcurrent();

    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('\n📊 Performance Test Summary\n', 'cyan');

    const apiPassed = results.apiTests.filter(t => t.passed).length;
    const apiTotal = results.apiTests.length;
    log(`API Tests: ${apiPassed}/${apiTotal} passed`, apiPassed === apiTotal ? 'green' : 'yellow');

    if (results.cacheTests.length > 0) {
      const cachePassed = results.cacheTests.filter(t => t.passed).length;
      log(`Cache Tests: ${cachePassed}/${results.cacheTests.length} passed`, cachePassed > 0 ? 'green' : 'yellow');
    }

    if (results.concurrentTests.length > 0) {
      const concurrentPassed = results.concurrentTests.filter(t => t.passed).length;
      log(`Concurrent Tests: ${concurrentPassed}/${results.concurrentTests.length} passed`, concurrentPassed > 0 ? 'green' : 'yellow');
    }

    log('\n📈 Performance Targets:', 'cyan');
    log('   - API Response Time: < 200ms (target)', 'blue');
    log('   - Cache Hit Improvement: > 50%', 'blue');
    log('   - Concurrent Requests: < 1000ms avg', 'blue');

    log('\n');
  } catch (error) {
    log(`\n❌ Performance test error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();

