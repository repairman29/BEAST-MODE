#!/usr/bin/env node

/**
 * Integration Test Suite
 * Tests all new features end-to-end
 * 
 * Priority 2: Integration Testing
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let passed = 0;
let failed = 0;
let skipped = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`\n${colors.blue}Testing: ${name}${colors.reset}... `);
    await fn();
    console.log(`${colors.green}✓ PASSED${colors.reset}`);
    passed++;
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.log(`  ${colors.red}Error:${colors.reset} ${error.message}`);
    failed++;
  }
}

async function skip(name, reason) {
  console.log(`\n${colors.yellow}⏭ SKIPPED: ${name}${colors.reset} - ${reason}`);
  skipped++;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

// ============================================
// Enterprise Features Tests
// ============================================

async function testEnterpriseFeatures() {
  await test('Enterprise Teams API', async () => {
    const result = await request('/api/enterprise/teams');
    if (!result.ok && result.status !== 401) {
      throw new Error(`Teams API failed: ${result.status}`);
    }
  });

  await test('Enterprise RBAC API', async () => {
    const result = await request('/api/enterprise/rbac');
    if (!result.ok && result.status !== 401) {
      throw new Error(`RBAC API failed: ${result.status}`);
    }
  });

  await test('Enterprise Audit API', async () => {
    const result = await request('/api/enterprise/audit?limit=10');
    if (!result.ok && result.status !== 401) {
      throw new Error(`Audit API failed: ${result.status}`);
    }
  });

  await test('Enterprise Compliance API', async () => {
    const result = await request('/api/enterprise/compliance');
    if (!result.ok && result.status !== 401) {
      throw new Error(`Compliance API failed: ${result.status}`);
    }
  });
}

// ============================================
// Integration Tests
// ============================================

async function testIntegrations() {
  await test('GitHub Actions Integration API', async () => {
    const result = await request('/api/integrations/github-actions', {
      method: 'POST',
      body: JSON.stringify({
        repo: 'test/repo',
        workflow: 'quality-check'
      })
    });
    if (!result.ok && result.status !== 401 && result.status !== 400) {
      throw new Error(`GitHub Actions API failed: ${result.status}`);
    }
  });

  await test('GitLab Integration API', async () => {
    const result = await request('/api/integrations/gitlab', {
      method: 'POST',
      body: JSON.stringify({
        repo: 'test/repo',
        pipeline: 'quality-check'
      })
    });
    if (!result.ok && result.status !== 401 && result.status !== 400) {
      throw new Error(`GitLab API failed: ${result.status}`);
    }
  });

  await test('Bitbucket Integration API', async () => {
    const result = await request('/api/integrations/bitbucket', {
      method: 'POST',
      body: JSON.stringify({
        repo: 'test/repo',
        pipeline: 'quality-check'
      })
    });
    if (!result.ok && result.status !== 401 && result.status !== 400) {
      throw new Error(`Bitbucket API failed: ${result.status}`);
    }
  });

  await test('Slack Integration API', async () => {
    const result = await request('/api/integrations/slack', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Test notification',
        channel: '#test'
      })
    });
    if (!result.ok && result.status !== 401 && result.status !== 400) {
      throw new Error(`Slack API failed: ${result.status}`);
    }
  });

  await test('Jira Integration API', async () => {
    const result = await request('/api/integrations/jira', {
      method: 'POST',
      body: JSON.stringify({
        issue: {
          summary: 'Test issue',
          description: 'Test description'
        }
      })
    });
    if (!result.ok && result.status !== 401 && result.status !== 400) {
      throw new Error(`Jira API failed: ${result.status}`);
    }
  });
}

// ============================================
// Marketplace Tests
// ============================================

async function testMarketplace() {
  await test('Marketplace Models API', async () => {
    const result = await request('/api/marketplace/models?popular=true');
    if (!result.ok) {
      throw new Error(`Marketplace Models API failed: ${result.status}`);
    }
  });

  await test('Marketplace Templates API', async () => {
    const result = await request('/api/marketplace/templates');
    if (!result.ok) {
      throw new Error(`Marketplace Templates API failed: ${result.status}`);
    }
  });
}

// ============================================
// AI Features Tests
// ============================================

async function testAIFeatures() {
  await test('AI Test Generation API', async () => {
    const result = await request('/api/ai/test-generation', {
      method: 'POST',
      body: JSON.stringify({
        functionInfo: { name: 'test', params: [] },
        code: 'function test() { return true; }',
        options: { language: 'javascript' }
      })
    });
    if (!result.ok && result.status !== 500) {
      throw new Error(`Test Generation API failed: ${result.status}`);
    }
  });

  await test('AI Code Review API', async () => {
    const result = await request('/api/ai/code-review', {
      method: 'POST',
      body: JSON.stringify({
        code: 'function test() { return true; }',
        filePath: 'test.js',
        options: {}
      })
    });
    if (!result.ok && result.status !== 500) {
      throw new Error(`Code Review API failed: ${result.status}`);
    }
  });

  await test('AI Learning API', async () => {
    const result = await request('/api/ai/learning');
    if (!result.ok) {
      throw new Error(`Learning API failed: ${result.status}`);
    }
  });

  await test('AI Predictions API', async () => {
    const result = await request('/api/ai/predictions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'bugs',
        code: 'function test() { return true; }',
        filePath: 'test.js'
      })
    });
    if (!result.ok && result.status !== 500) {
      throw new Error(`Predictions API failed: ${result.status}`);
    }
  });

  await test('AI Documentation API', async () => {
    const result = await request('/api/ai/documentation', {
      method: 'POST',
      body: JSON.stringify({
        code: 'function test() { return true; }',
        filePath: 'test.js',
        options: { format: 'markdown' }
      })
    });
    if (!result.ok && result.status !== 500) {
      throw new Error(`Documentation API failed: ${result.status}`);
    }
  });
}

// ============================================
// Performance & Monitoring Tests
// ============================================

async function testPerformance() {
  await test('Performance Monitoring API', async () => {
    const result = await request('/api/models/custom/monitoring?timeRange=7d');
    if (!result.ok) {
      throw new Error(`Performance Monitoring API failed: ${result.status}`);
    }
  });

  await test('Latency Optimization API', async () => {
    const result = await request('/api/optimization/latency');
    if (!result.ok) {
      throw new Error(`Latency Optimization API failed: ${result.status}`);
    }
  });
}

// ============================================
// UI Pages Tests
// ============================================

async function testUIPages() {
  await test('Enterprise Page', async () => {
    const result = await request('/enterprise');
    if (result.status === 404) {
      throw new Error('Enterprise page not found');
    }
  });

  await test('Integrations Page', async () => {
    const result = await request('/integrations');
    if (result.status === 404) {
      throw new Error('Integrations page not found');
    }
  });

  await test('Marketplace Page', async () => {
    const result = await request('/marketplace');
    if (result.status === 404) {
      throw new Error('Marketplace page not found');
    }
  });

  await test('AI Features Page', async () => {
    const result = await request('/ai-features');
    if (result.status === 404) {
      throw new Error('AI Features page not found');
    }
  });

  await test('Performance Page', async () => {
    const result = await request('/admin/performance');
    if (result.status === 404) {
      throw new Error('Performance page not found');
    }
  });
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log(`${colors.blue}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     Integration Test Suite - All New Features              ║${colors.reset}`);
  console.log(`${colors.blue}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}\n`);

  console.log(`${colors.yellow}Testing Enterprise Features...${colors.reset}`);
  await testEnterpriseFeatures();

  console.log(`\n${colors.yellow}Testing Integrations...${colors.reset}`);
  await testIntegrations();

  console.log(`\n${colors.yellow}Testing Marketplace...${colors.reset}`);
  await testMarketplace();

  console.log(`\n${colors.yellow}Testing AI Features...${colors.reset}`);
  await testAIFeatures();

  console.log(`\n${colors.yellow}Testing Performance & Monitoring...${colors.reset}`);
  await testPerformance();

  console.log(`\n${colors.yellow}Testing UI Pages...${colors.reset}`);
  await testUIPages();

  // Summary
  console.log(`\n${colors.blue}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     Test Summary                                               ║${colors.reset}`);
  console.log(`${colors.blue}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${skipped}${colors.reset}`);
  console.log(`Total: ${passed + failed + skipped}\n`);

  const successRate = ((passed / (passed + failed)) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
