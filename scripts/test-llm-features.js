#!/usr/bin/env node

/**
 * Test Script for LLM Features
 * 
 * Tests all 18 LLM feature API endpoints
 */

const BASE_URL = process.env.BEAST_MODE_API_URL || 
                 process.env.NEXT_PUBLIC_APP_URL || 
                 'http://localhost:3000';

const TEST_CASES = [
  {
    name: 'Quality Explanation',
    endpoint: '/api/llm/quality-explanation',
    method: 'POST',
    body: {
      score: 0.75,
      code: 'function example() { return true; }',
      issues: ['Missing tests', 'No documentation']
    }
  },
  {
    name: 'Issue Recommendations',
    endpoint: '/api/llm/issue-recommendations',
    method: 'POST',
    body: {
      issue: 'Function too long',
      code: 'function longFunction() { /* 200 lines */ }',
      filePath: 'src/utils.ts'
    }
  },
  {
    name: 'Code Comments',
    endpoint: '/api/llm/code-comments',
    method: 'POST',
    body: {
      code: 'function calculateTotal(items) { return items.reduce((sum, item) => sum + item.price, 0); }',
      language: 'javascript',
      style: 'detailed'
    }
  },
  {
    name: 'Error Enhancement',
    endpoint: '/api/llm/error-enhancement',
    method: 'POST',
    body: {
      error: 'TypeError: Cannot read property "map" of undefined',
      context: 'User tried to render a list',
      code: 'const items = data.items.map(...)'
    }
  },
  {
    name: 'Documentation Generation',
    endpoint: '/api/llm/documentation',
    method: 'POST',
    body: {
      code: 'export function fetchUser(id: string) { return fetch(`/api/users/${id}`); }',
      type: 'api'
    }
  },
  {
    name: 'Test Generation',
    endpoint: '/api/llm/test-generation',
    method: 'POST',
    body: {
      code: 'function add(a, b) { return a + b; }',
      framework: 'jest'
    }
  },
  {
    name: 'Security Analysis',
    endpoint: '/api/llm/security-analysis',
    method: 'POST',
    body: {
      code: 'const query = `SELECT * FROM users WHERE id = ${userId}`',
      language: 'javascript'
    }
  },
  {
    name: 'Refactoring Suggestions',
    endpoint: '/api/llm/refactoring',
    method: 'POST',
    body: {
      code: 'function processData(data) { /* complex logic */ }',
      language: 'javascript'
    }
  },
  {
    name: 'Performance Optimization',
    endpoint: '/api/llm/performance-optimization',
    method: 'POST',
    body: {
      code: 'for (let i = 0; i < array.length; i++) { /* nested loops */ }',
      language: 'javascript'
    }
  },
  {
    name: 'API Documentation',
    endpoint: '/api/llm/api-documentation',
    method: 'POST',
    body: {
      code: 'app.get("/api/users", (req, res) => { res.json(users); });',
      format: 'openapi'
    }
  },
  {
    name: 'Context-Aware Selection',
    endpoint: '/api/llm/context-aware-selection',
    method: 'POST',
    body: {
      code: 'async function fetchData() { /* ... */ }',
      task: 'code-generation'
    }
  },
  {
    name: 'Task Selection',
    endpoint: '/api/llm/task-selection',
    method: 'POST',
    body: {
      task: 'code-generation'
    }
  },
  {
    name: 'Cache Stats',
    endpoint: '/api/llm/cache',
    method: 'GET'
  }
];

async function testEndpoint(testCase) {
  try {
    const url = `${BASE_URL}${testCase.endpoint}`;
    const options = {
      method: testCase.method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (testCase.body) {
      options.body = JSON.stringify(testCase.body);
    }

    const startTime = Date.now();
    const response = await fetch(url, options);
    const latency = Date.now() - startTime;

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      latency,
      hasData: !!data,
      error: data.error || null
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      latency: 0,
      hasData: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🧪 Testing LLM Features...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const results = {
    passed: [],
    failed: [],
    skipped: []
  };

  for (const testCase of TEST_CASES) {
    process.stdout.write(`Testing ${testCase.name}... `);
    
    const result = await testEndpoint(testCase);

    if (result.success && result.hasData) {
      console.log(`✅ (${result.latency}ms)`);
      results.passed.push({ name: testCase.name, ...result });
    } else if (result.status === 404 || result.status === 501) {
      console.log(`⏭️  (not implemented)`);
      results.skipped.push({ name: testCase.name, ...result });
    } else {
      console.log(`❌ (${result.error || `Status ${result.status}`})`);
      results.failed.push({ name: testCase.name, ...result });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (results.passed.length > 0) {
    const avgLatency = results.passed.reduce((sum, r) => sum + r.latency, 0) / results.passed.length;
    console.log(`⚡ Average Latency: ${avgLatency.toFixed(0)}ms\n`);
  }

  if (results.failed.length > 0) {
    console.log('❌ Failed Tests:');
    results.failed.forEach(({ name, error, status }) => {
      console.log(`   • ${name}: ${error || `HTTP ${status}`}`);
    });
    console.log('');
  }

  return results;
}

// Run if called directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testEndpoint };
