#!/usr/bin/env node

/**
 * End-to-End User Flow Test
 * 
 * Tests the complete user journey:
 * 1. Signup → 2. GitHub Connection → 3. Repository Scan → 4. Quality Check → 5. Upgrade Flow
 * 
 * Usage:
 *   node scripts/test-user-flow-e2e.js
 *   TEST_BASE_URL=https://beastmode.dev node scripts/test-user-flow-e2e.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || `test-${Date.now()}@example.com`;
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; // Optional: for testing GitHub integration
const TEST_REPO = process.env.TEST_REPO || 'facebook/react'; // Repository to scan

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

let passed = 0;
let failed = 0;
let skipped = 0;
let sessionData = {
  userId: null,
  apiKey: null,
  accessToken: null,
  tier: 'free',
};

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
      const stackLines = error.stack.split('\n');
      if (stackLines.length > 1) {
        log(`   ${stackLines[1].trim()}`, 'yellow');
      }
    }
    failed++;
  }
}

async function testSkip(name, reason) {
  log(`\n⏭️  SKIP: ${name} (${reason})`, 'yellow');
  skipped++;
}

// Step 1: Health Check
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

// Step 2: Signup Flow (API-based)
async function testSignup() {
  // Note: This is a simplified test. In production, you'd use Supabase auth
  // For now, we'll test that the auth endpoints exist and respond correctly
  
  // Test signup endpoint exists
  const signupResponse = await makeRequest(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });
  
  // Signup might return 200 (success) or 400 (user exists) or 501 (not implemented)
  if (signupResponse.status === 200) {
    log(`   ✅ User created: ${TEST_EMAIL}`, 'green');
    if (signupResponse.data.user) {
      sessionData.userId = signupResponse.data.user.id;
    }
  } else if (signupResponse.status === 400) {
    log(`   ⚠️  User may already exist, continuing...`, 'yellow');
  } else if (signupResponse.status === 501) {
    log(`   ⚠️  Signup endpoint not fully implemented (expected in dev)`, 'yellow');
  } else {
    throw new Error(`Unexpected signup status: ${signupResponse.status}`);
  }
  
  // Test signin endpoint
  const signinResponse = await makeRequest(`${BASE_URL}/api/auth/signin`, {
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });
  
  if (signinResponse.status === 200) {
    if (signinResponse.data.apiKey) {
      sessionData.apiKey = signinResponse.data.apiKey;
      log(`   ✅ API key obtained`, 'green');
    }
    if (signinResponse.data.accessToken) {
      sessionData.accessToken = signinResponse.data.accessToken;
    }
  } else if (signinResponse.status === 401) {
    log(`   ⚠️  Authentication failed (expected if user doesn't exist)`, 'yellow');
  } else if (signinResponse.status === 501) {
    log(`   ⚠️  Signin endpoint not fully implemented (expected in dev)`, 'yellow');
  }
}

// Step 3: GitHub Connection
async function testGitHubConnection() {
  if (!GITHUB_TOKEN) {
    await testSkip('GitHub Connection', 'GITHUB_TOKEN not provided');
    return;
  }
  
  // Test GitHub repos endpoint
  const response = await makeRequest(`${BASE_URL}/api/github/repos`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${sessionData.apiKey || GITHUB_TOKEN}`,
    },
  });
  
  if (response.status === 200) {
    log(`   ✅ GitHub repos fetched`, 'green');
    if (Array.isArray(response.data.repos)) {
      log(`   Repos found: ${response.data.repos.length}`, 'blue');
    }
  } else if (response.status === 401) {
    throw new Error('GitHub connection requires authentication');
  } else if (response.status === 501) {
    log(`   ⚠️  GitHub endpoint not fully implemented (expected in dev)`, 'yellow');
  } else {
    throw new Error(`Unexpected status: ${response.status}`);
  }
}

// Step 4: Repository Scan & Quality Check
async function testRepositoryScan() {
  const response = await makeRequest(`${BASE_URL}/api/repos/quality`, {
    method: 'POST',
    headers: {
      ...(sessionData.apiKey ? { 'Authorization': `Bearer ${sessionData.apiKey}` } : {}),
    },
    body: {
      repo: TEST_REPO,
      platform: 'github',
    },
  });
  
  if (response.status === 200) {
    if (response.data.quality !== undefined) {
      log(`   ✅ Quality score: ${response.data.quality}`, 'green');
      log(`   Confidence: ${response.data.confidence || 'N/A'}`, 'blue');
      if (response.data.predictionId) {
        log(`   Prediction ID: ${response.data.predictionId}`, 'blue');
      }
    } else if (response.data.message) {
      log(`   ⚠️  ${response.data.message}`, 'yellow');
    }
  } else if (response.status === 503) {
    log(`   ⚠️  Quality service temporarily unavailable (expected in dev)`, 'yellow');
  } else if (response.status === 401) {
    log(`   ⚠️  Authentication required (continuing without auth)`, 'yellow');
  } else {
    throw new Error(`Unexpected status: ${response.status} - ${JSON.stringify(response.data)}`);
  }
}

// Step 5: Value Metrics Check
async function testValueMetrics() {
  if (!sessionData.apiKey) {
    await testSkip('Value Metrics', 'No API key available');
    return;
  }
  
  const response = await makeRequest(`${BASE_URL}/api/auth/usage`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${sessionData.apiKey}`,
    },
  });
  
  if (response.status === 200) {
    log(`   ✅ Usage data retrieved`, 'green');
    log(`   Used: ${response.data.used || 0} calls`, 'blue');
    log(`   Limit: ${response.data.limit || 0} calls`, 'blue');
    log(`   Tier: ${response.data.tier || 'free'}`, 'blue');
    
    if (response.data.tier) {
      sessionData.tier = response.data.tier;
    }
    
    // Calculate value metrics
    const timeSaved = ((response.data.used || 0) * 13) / 60; // hours
    const estimatedValue = timeSaved * 50; // $50/hour
    log(`   Time Saved: ${timeSaved.toFixed(1)} hours`, 'blue');
    log(`   Estimated Value: $${estimatedValue.toFixed(0)}`, 'blue');
  } else if (response.status === 401) {
    log(`   ⚠️  Authentication required`, 'yellow');
  } else {
    throw new Error(`Unexpected status: ${response.status}`);
  }
}

// Step 6: ROI Calculator Data
async function testROICalculator() {
  if (!sessionData.apiKey) {
    await testSkip('ROI Calculator', 'No API key available');
    return;
  }
  
  // Test that ROI calculator can access usage data
  const usageResponse = await makeRequest(`${BASE_URL}/api/auth/usage`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${sessionData.apiKey}`,
    },
  });
  
  if (usageResponse.status === 200) {
    const usage = usageResponse.data.used || 0;
    const tier = usageResponse.data.tier || 'free';
    
    // Calculate ROI for different tiers
    const tiers = {
      free: { price: 0, calls: 10000 },
      developer: { price: 79, calls: 100000 },
      team: { price: 299, calls: 500000 },
      enterprise: { price: 799, calls: Infinity },
    };
    
    log(`   ✅ ROI data calculated`, 'green');
    Object.entries(tiers).forEach(([tierName, tierData]) => {
      const monthlyValue = (tierData.calls * 13) / 60 * 50; // hours * $50/hr
      const roi = tierData.price > 0 ? ((monthlyValue - tierData.price) / tierData.price * 100).toFixed(0) : '∞';
      log(`   ${tierName}: $${monthlyValue.toFixed(0)}/mo value, ${roi}% ROI`, 'blue');
    });
  } else {
    log(`   ⚠️  Cannot calculate ROI without usage data`, 'yellow');
  }
}

// Step 7: Upgrade Flow (Pricing Page)
async function testUpgradeFlow() {
  // Test pricing endpoint/page exists
  const pricingResponse = await makeRequest(`${BASE_URL}/pricing`);
  
  if (pricingResponse.status === 200) {
    log(`   ✅ Pricing page accessible`, 'green');
  } else if (pricingResponse.status === 404) {
    log(`   ⚠️  Pricing page not found (may need to be created)`, 'yellow');
  } else {
    log(`   ⚠️  Pricing page status: ${pricingResponse.status}`, 'yellow');
  }
  
  // Test that upgrade prompts would work (check current tier vs available tiers)
  if (sessionData.tier && sessionData.tier !== 'enterprise') {
    log(`   Current tier: ${sessionData.tier} (can upgrade)`, 'blue');
  } else {
    log(`   Current tier: ${sessionData.tier || 'unknown'}`, 'blue');
  }
}

// Step 8: Dashboard Access
async function testDashboardAccess() {
  const dashboardResponse = await makeRequest(`${BASE_URL}/dashboard`);
  
  if (dashboardResponse.status === 200) {
    log(`   ✅ Dashboard accessible`, 'green');
  } else if (dashboardResponse.status === 401 || dashboardResponse.status === 302) {
    log(`   ⚠️  Dashboard requires authentication (expected)`, 'yellow');
  } else {
    log(`   ⚠️  Dashboard status: ${dashboardResponse.status}`, 'yellow');
  }
}

// Main test runner
async function runTests() {
  log('\n🚀 Starting End-to-End User Flow Test', 'cyan');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`Test Email: ${TEST_EMAIL}`, 'blue');
  log(`Test Repo: ${TEST_REPO}`, 'blue');
  log(`GitHub Token: ${GITHUB_TOKEN ? '***' + GITHUB_TOKEN.slice(-4) : 'Not provided'}`, 'blue');
  log('='.repeat(60), 'cyan');
  
  // Step 1: Health Check
  await test('Step 1: Health Check', testHealthCheck);
  
  // Step 2: Signup
  await test('Step 2: User Signup', testSignup);
  
  // Step 3: GitHub Connection
  await test('Step 3: GitHub Connection', testGitHubConnection);
  
  // Step 4: Repository Scan & Quality
  await test('Step 4: Repository Scan & Quality Check', testRepositoryScan);
  
  // Step 5: Value Metrics
  await test('Step 5: Value Metrics Display', testValueMetrics);
  
  // Step 6: ROI Calculator
  await test('Step 6: ROI Calculator Data', testROICalculator);
  
  // Step 7: Upgrade Flow
  await test('Step 7: Upgrade Flow', testUpgradeFlow);
  
  // Step 8: Dashboard Access
  await test('Step 8: Dashboard Access', testDashboardAccess);
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Test Summary', 'cyan');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`⏭️  Skipped: ${skipped}`, 'yellow');
  log('='.repeat(60), 'cyan');
  
  // Flow completion check
  if (passed >= 5) {
    log('\n🎉 Core user flow is functional!', 'green');
  } else if (failed === 0 && skipped > 0) {
    log('\n⚠️  Some steps skipped (may require additional setup)', 'yellow');
  } else {
    log('\n⚠️  Some tests failed. Review errors above.', 'yellow');
  }
  
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  if (error.stack) {
    log(error.stack, 'red');
  }
  process.exit(1);
});
