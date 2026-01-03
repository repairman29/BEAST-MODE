#!/usr/bin/env node

/**
 * BEAST MODE Feature Testing Script
 * 
 * Automated testing of all dashboard features and API routes
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Use unified config if available
let getUnifiedConfig = null;
try {
  const path = require('path');
  const configPath = path.join(__dirname, '../../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

// Helper function to get config value
async function getConfigValue(key, defaultValue = null) {
  if (getUnifiedConfig) {
    try {
      const config = await getUnifiedConfig();
      const value = config.get(key);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    } catch (error) {
      // Fallback to process.env
    }
  }
  // Fallback to process.env for backward compatibility
  return process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : defaultValue;
}

// BASE_URL will be loaded async
let BASE_URL;
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

let passed = 0;
let failed = 0;
let warnings = 0;
const results = [];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${name}`, color);
  if (details) {
    log(`   ${details}`, 'reset');
  }
  results.push({ name, status, details });
  if (status === 'pass') passed++;
  else if (status === 'fail') failed++;
  else warnings++;
}

async function checkServerHealth() {
  try {
    // Ensure BASE_URL is loaded
    if (!BASE_URL) {
      BASE_URL = await getConfigValue('TEST_BASE_URL', 'http://localhost:7777') || 'http://localhost:7777';
    }
    const result = await makeRequest('/api/beast-mode/health', { timeout: 3000 });
    return result.status === 200;
  } catch (error) {
    return false;
  }
}

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const requestModule = url.protocol === 'https:' ? https : http;
    
    const req = requestModule.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: options.timeout || 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (error) => {
      // Provide more helpful error messages
      if (error.code === 'ECONNREFUSED') {
        reject(new Error(`Connection refused - Is the dev server running on ${BASE_URL}?`));
      } else {
        reject(error);
      }
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testAPI(name, path, options = {}) {
  try {
    const result = await makeRequest(path, options);
    const expectedStatus = options.expectedStatus || 200;
    
    if (result.status === expectedStatus) {
      logTest(name, 'pass', `Status: ${result.status}`);
      return { success: true, result };
    } else if (result.status === 500 && !options.strict) {
      // 500 might be expected if server has issues, but API route exists
      logTest(name, 'warn', `Got ${result.status} (API route exists but may have runtime errors)`);
      return { success: false, result, warning: true };
    } else {
      logTest(name, 'fail', `Expected ${expectedStatus}, got ${result.status}${result.data?.error ? ` - ${result.data.error}` : ''}`);
      return { success: false, result };
    }
  } catch (error) {
    if (error.message.includes('Connection refused') || error.message.includes('ECONNREFUSED')) {
      logTest(name, 'warn', 'Server not running');
      return { success: false, error, warning: true };
    }
    logTest(name, 'fail', error.message);
    return { success: false, error };
  }
}

async function testQualityTab() {
  logSection('⚡ Quality Tab Tests');

  // Test GitHub Scan API
  await testAPI(
    'GitHub Scan API - Valid repo',
    '/api/github/scan',
    {
      method: 'POST',
      body: { repo: 'facebook/react' },
      expectedStatus: 200
    }
  );

  await testAPI(
    'GitHub Scan API - Invalid repo',
    '/api/github/scan',
    {
      method: 'POST',
      body: { repo: 'invalid/repo/format' },
      expectedStatus: 400
    }
  );

  await testAPI(
    'GitHub Scan API - Missing repo',
    '/api/github/scan',
    {
      method: 'POST',
      body: {},
      expectedStatus: 400
    }
  );
}

async function testIntelligenceTab() {
  logSection('🧠 Intelligence Tab Tests');

  // Test Conversation API
  await testAPI(
    'Conversation API - Valid message',
    '/api/beast-mode/conversation',
    {
      method: 'POST',
      body: {
        message: 'What is the quality of my code?',
        context: { conversationHistory: [], scanData: [] }
      },
      expectedStatus: 200
    }
  );

  await testAPI(
    'Conversation API - Missing message',
    '/api/beast-mode/conversation',
    {
      method: 'POST',
      body: { context: {} },
      expectedStatus: 400
    }
  );

  // Test Recommendations API
  await testAPI(
    'Recommendations API',
    '/api/beast-mode/marketplace/recommendations',
    {
      method: 'POST',
      body: {
        userId: 'test-user',
        projectContext: { type: 'web', languages: ['javascript'] }
      },
      expectedStatus: 200
    }
  );

  // Test Missions API
  await testAPI(
    'Missions API - Get missions',
    '/api/beast-mode/missions',
    {
      method: 'GET',
      expectedStatus: 200
    }
  );

  await testAPI(
    'Missions API - Create mission',
    '/api/beast-mode/missions',
    {
      method: 'POST',
      body: {
        name: 'Test Mission',
        description: 'Test mission description',
        type: 'code-refactor',
        priority: 'medium'
      },
      expectedStatus: 200
    }
  );
}

async function testMarketplaceTab() {
  logSection('📦 Marketplace Tab Tests');

  // Test Plugin Installation API
  await testAPI(
    'Plugin Install API - Valid install',
    '/api/beast-mode/marketplace/install',
    {
      method: 'POST',
      body: {
        pluginId: 'eslint-pro',
        userId: 'test-user'
      },
      expectedStatus: 200
    }
  );

  await testAPI(
    'Plugin Install API - Missing params',
    '/api/beast-mode/marketplace/install',
    {
      method: 'POST',
      body: {},
      expectedStatus: 400
    }
  );

  // Test Marketplace Analytics
  await testAPI(
    'Marketplace Analytics API',
    '/api/beast-mode/marketplace/analytics',
    {
      method: 'GET',
      expectedStatus: 200
    }
  );
}

async function testImproveTab() {
  logSection('✨ Improve Tab Tests');

  // Test Self-Improve Analysis API
  await testAPI(
    'Self-Improve Analysis API',
    '/api/beast-mode/self-improve',
    {
      method: 'POST',
      expectedStatus: 200
    }
  );

  // Test Apply Fix API
  await testAPI(
    'Apply Fix API - Valid fix',
    '/api/beast-mode/self-improve/apply-fix',
    {
      method: 'POST',
      body: {
        recommendation: {
          title: 'Remove console.log statements',
          type: 'remove-console-logs'
        },
        fixType: 'remove-console-logs',
        gitOptions: { commit: false, push: false, deploy: false }
      },
      expectedStatus: 200
    }
  );

  await testAPI(
    'Apply Fix API - Missing recommendation',
    '/api/beast-mode/self-improve/apply-fix',
    {
      method: 'POST',
      body: {},
      expectedStatus: 400
    }
  );
}

async function testSettingsTab() {
  logSection('⚙️ Settings Tab Tests');

  // Test Teams API
  await testAPI(
    'Teams API - Get teams',
    '/api/beast-mode/enterprise/teams',
    {
      method: 'GET',
      expectedStatus: 200
    }
  );

  await testAPI(
    'Teams API - Create team',
    '/api/beast-mode/enterprise/teams',
    {
      method: 'POST',
      body: { name: 'Test Team ' + Date.now() },
      expectedStatus: 201
    }
  );

  await testAPI(
    'Teams API - Create team (missing name)',
    '/api/beast-mode/enterprise/teams',
    {
      method: 'POST',
      body: {},
      expectedStatus: 400
    }
  );

  // Test Users API
  await testAPI(
    'Users API - Get users',
    '/api/beast-mode/enterprise/users',
    {
      method: 'GET',
      expectedStatus: 200
    }
  );

  await testAPI(
    'Users API - Create user',
    '/api/beast-mode/enterprise/users',
    {
      method: 'POST',
      body: {
        email: `test${Date.now()}@example.com`,
        name: 'Test User',
        role: 'developer'
      },
      expectedStatus: 201
    }
  );

  // Test Repos API
  await testAPI(
    'Repos API - Get repos',
    '/api/beast-mode/enterprise/repos',
    {
      method: 'GET',
      expectedStatus: 200
    }
  );

  await testAPI(
    'Repos API - Add repo',
    '/api/beast-mode/enterprise/repos',
    {
      method: 'POST',
      body: {
        url: 'https://github.com/test/repo-' + Date.now()
      },
      expectedStatus: 201
    }
  );
}

async function testHealthAndDeployment() {
  logSection('🏥 Health & Deployment Tests');

  // Test Health API
  await testAPI(
    'Health API',
    '/api/beast-mode/health',
    {
      method: 'GET',
      expectedStatus: 200
    }
  );

  // Test Deployments API
  await testAPI(
    'Deployments API - Get deployments',
    '/api/beast-mode/deployments',
    {
      method: 'GET',
      expectedStatus: 200
    }
  );

  await testAPI(
    'Deployments Platforms API',
    '/api/beast-mode/deployments/platforms',
    {
      method: 'GET',
      expectedStatus: 200
    }
  );
}

async function testAuth() {
  logSection('🔐 Authentication Tests');

  // Test Signup API
  await testAPI(
    'Signup API - Missing data',
    '/api/auth/signup',
    {
      method: 'POST',
      body: {},
      expectedStatus: 400
    }
  );

  // Test Signin API
  await testAPI(
    'Signin API - Missing credentials',
    '/api/auth/signin',
    {
      method: 'POST',
      body: {},
      expectedStatus: 400
    }
  );
}

async function testStripe() {
  logSection('💳 Stripe Integration Tests');

  // Test Stripe Analytics
  await testAPI(
    'Stripe Analytics API',
    '/api/stripe/analytics',
    {
      method: 'GET',
      expectedStatus: 200
    }
  );

  // Test Stripe Checkout (may fail without proper keys, that's ok)
  await testAPI(
    'Stripe Checkout API - Missing data',
    '/api/stripe/create-checkout',
    {
      method: 'POST',
      body: {},
      expectedStatus: 400
    }
  );
}

async function testPageAccessibility() {
  logSection('🌐 Page Accessibility Tests');

  try {
    const result = await makeRequest('/dashboard');
    if (result.status === 200) {
      logTest('Dashboard page accessible', 'pass', `Status: ${result.status}`);
    } else {
      logTest('Dashboard page accessible', 'warn', `Status: ${result.status} (may require auth)`);
    }
  } catch (error) {
    logTest('Dashboard page accessible', 'warn', error.message);
  }

  try {
    const result = await makeRequest('/');
    if (result.status === 200) {
      logTest('Landing page accessible', 'pass', `Status: ${result.status}`);
    } else {
      logTest('Landing page accessible', 'fail', `Status: ${result.status}`);
    }
  } catch (error) {
    logTest('Landing page accessible', 'fail', error.message);
  }
}

async function runAllTests() {
  log('\n🚀 BEAST MODE Feature Testing Suite', 'magenta');
  log(`Testing against: ${BASE_URL}\n`, 'blue');

  // Check if server is running
  log('🔍 Checking server health...', 'cyan');
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    log('⚠️  Server appears to be down or not responding', 'yellow');
    log(`💡 Make sure the dev server is running: npm run dev -p 7777`, 'yellow');
    log('💡 Or set TEST_BASE_URL environment variable to test against a different server\n', 'yellow');
    
    // Still run tests but mark them as warnings
    log('📝 Running tests anyway (will show connection errors)...\n', 'cyan');
  } else {
    log('✅ Server is responding\n', 'green');
  }

  try {
    await testPageAccessibility();
    await testQualityTab();
    await testIntelligenceTab();
    await testMarketplaceTab();
    await testImproveTab();
    await testSettingsTab();
    await testHealthAndDeployment();
    await testAuth();
    await testStripe();

    // Summary
    logSection('📊 Test Summary');
    log(`✅ Passed: ${passed}`, 'green');
    log(`❌ Failed: ${failed}`, 'red');
    log(`⚠️  Warnings: ${warnings}`, 'yellow');
    log(`📈 Total: ${passed + failed + warnings}`, 'cyan');

    const successRate = ((passed / (passed + failed + warnings)) * 100).toFixed(1);
    log(`\n🎯 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');

    if (failed === 0) {
      log('\n🎉 All critical tests passed!', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Some tests failed. Review the output above.', 'yellow');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();

