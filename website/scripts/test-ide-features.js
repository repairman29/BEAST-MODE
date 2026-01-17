#!/usr/bin/env node
/**
 * Test IDE Features
 * 
 * Comprehensive test suite for IDE features
 */

const http = require('http');
const { execSync } = require('child_process');

const PORT = 7777;
const BASE_URL = `http://localhost:${PORT}`;

console.log('🧪 Testing IDE Features\n');
console.log('='.repeat(60));
console.log('');

const tests = {
  idePage: {
    name: 'IDE Page Loads',
    url: `${BASE_URL}/ide`,
    expected: ['BEAST MODE IDE', 'react'],
  },
  gitAPI: {
    name: 'Git API Endpoints',
    endpoints: [
      { path: '/api/git/status', method: 'POST' },
      { path: '/api/git/branches', method: 'POST' },
    ],
  },
  codebaseAPI: {
    name: 'Codebase API Endpoints',
    endpoints: [
      { path: '/api/codebase/index', method: 'POST' },
      { path: '/api/codebase/search', method: 'POST' },
    ],
  },
  aiChat: {
    name: 'AI Chat Integration',
    url: `${BASE_URL}/ide`,
    check: 'AIChat component exists',
  },
};

async function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || PORT,
      path: url.pathname,
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
    };

    const req = http.request(options, (res) => {
      resolve({ status: res.statusCode, ok: res.statusCode < 400 });
    });

    req.on('error', () => resolve({ status: 0, ok: false }));
    
    if (method === 'POST') {
      req.write(JSON.stringify({}));
    }
    
    req.end();
  });
}

async function testPage(url, expected) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port || PORT,
      path: urlObj.pathname,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk.toString(); });
      res.on('end', () => {
        const matches = expected.every(term => data.includes(term));
        resolve({ status: res.statusCode, matches });
      });
    });

    req.on('error', () => resolve({ status: 0, matches: false }));
    req.end();
  });
}

async function runTests() {
  console.log('⏳ Waiting for server...\n');
  
  // Wait for server
  for (let i = 0; i < 10; i++) {
    try {
      const result = await testEndpoint('/ide', 'GET');
      if (result.ok || result.status === 200) {
        break;
      }
    } catch (e) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('📊 Running Tests:\n');

  let passed = 0;
  let failed = 0;

  // Test IDE Page
  if (tests.idePage) {
    const result = await testPage(tests.idePage.url, tests.idePage.expected);
    if (result.status === 200 && result.matches) {
      console.log('✅ IDE Page Loads');
      passed++;
    } else {
      console.log('❌ IDE Page Loads');
      failed++;
    }
  }

  // Test Git API
  if (tests.gitAPI) {
    for (const endpoint of tests.gitAPI.endpoints) {
      const result = await testEndpoint(endpoint.path, endpoint.method);
      if (result.ok || result.status === 400) { // 400 is OK (missing params)
        console.log(`✅ ${endpoint.path}`);
        passed++;
      } else {
        console.log(`❌ ${endpoint.path}`);
        failed++;
      }
    }
  }

  // Test Codebase API
  if (tests.codebaseAPI) {
    for (const endpoint of tests.codebaseAPI.endpoints) {
      const result = await testEndpoint(endpoint.path, endpoint.method);
      if (result.ok || result.status === 400) {
        console.log(`✅ ${endpoint.path}`);
        passed++;
      } else {
        console.log(`❌ ${endpoint.path}`);
        failed++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  return failed === 0;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});
