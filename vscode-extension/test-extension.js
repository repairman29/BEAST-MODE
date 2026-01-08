#!/usr/bin/env node
/**
 * Test script for BEAST MODE VS Code Extension
 * Tests all API endpoints that the extension uses
 */

const axios = require('axios');

// Try localhost first, then production
const API_URL = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';
const PRODUCTION_URL = 'https://beast-mode.dev';
const TEST_REPO = 'user/test-workspace';

console.log('🧪 Testing BEAST MODE VS Code Extension API Endpoints\n');
console.log(`Primary API URL: ${API_URL}`);
console.log(`Fallback API URL: ${PRODUCTION_URL}\n`);

const tests = [
  {
    name: 'Quality Analysis',
    endpoint: '/api/repos/quality',
    method: 'POST',
    data: {
      repo: TEST_REPO,
      features: {
        stars: 10,
        forks: 5,
        hasTests: true,
        hasCI: true,
        hasReadme: true,
        fileCount: 50,
        codeFileCount: 30,
      },
    },
  },
  {
    name: 'Code Suggestions',
    endpoint: '/api/codebase/suggestions',
    method: 'POST',
    data: {
      repo: TEST_REPO,
      filePath: 'src/test.ts',
      content: 'function test() {\n  return ',
      cursorLine: 2,
      cursorColumn: 10,
      useLLM: false,
    },
  },
  {
    name: 'Codebase Chat',
    endpoint: '/api/codebase/chat',
    method: 'POST',
    data: {
      sessionId: `test-${Date.now()}`,
      message: 'What does this codebase do?',
      repo: TEST_REPO,
      useLLM: false,
    },
  },
  {
    name: 'Generate Tests',
    endpoint: '/api/codebase/tests/generate',
    method: 'POST',
    data: {
      filePath: 'src/test.ts',
      fileContent: 'export function add(a: number, b: number) { return a + b; }',
      testFramework: 'auto',
      coverageTarget: 0.8,
      useLLM: false,
    },
  },
  {
    name: 'Refactor Analysis',
    endpoint: '/api/codebase/refactor',
    method: 'POST',
    data: {
      action: 'analyze',
      filePath: 'src/test.ts',
      fileContent: 'function old() { return 1; }',
    },
  },
  {
    name: 'Index Codebase (Local)',
    endpoint: '/api/codebase/index',
    method: 'POST',
    data: {
      repo: TEST_REPO, // Local workspace format
    },
  },
];

async function runTest(test, useProduction = false) {
  const testUrl = useProduction ? PRODUCTION_URL : API_URL;
  
  try {
    console.log(`\n📋 Testing: ${test.name}`);
    console.log(`   ${test.method} ${test.endpoint}`);
    console.log(`   URL: ${testUrl}`);
    
    const startTime = Date.now();
    const response = await axios({
      method: test.method,
      url: `${testUrl}${test.endpoint}`,
      data: test.data,
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status
    });
    
    const duration = Date.now() - startTime;
    
    if (response.status >= 200 && response.status < 300) {
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      if (response.data.success !== undefined) {
        console.log(`   Response: success=${response.data.success}`);
      }
      if (response.data.quality !== undefined) {
        console.log(`   Quality: ${(response.data.quality * 100).toFixed(1)}%`);
      }
      if (response.data.suggestions) {
        console.log(`   Suggestions: ${response.data.suggestions.length}`);
      }
      if (response.data.indexing) {
        console.log(`   Files indexed: ${response.data.indexing.filesIndexed}`);
      }
      if (response.data.message) {
        console.log(`   Message: ${response.data.message}`);
      }
      return { success: true, duration, status: response.status, url: testUrl };
    } else {
      console.log(`   ⚠️  Status: ${response.status}`);
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      
      // If 405 and not production, try production
      if (response.status === 405 && !useProduction) {
        console.log(`   ⚠️  Trying production URL...`);
        return await runTest(test, true);
      }
      
      return { success: false, duration, status: response.status, error: response.data.error, url: testUrl };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ FAILED (${duration}ms)`);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log(`   Error: Cannot connect to ${testUrl}`);
      if (!useProduction) {
        console.log(`   ⚠️  Trying production URL...`);
        return await runTest(test, true);
      } else {
        console.log(`   Make sure the API server is running`);
      }
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`   Error: Request timed out`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return { success: false, duration, error: error.message, url: testUrl };
  }
}

async function runAllTests() {
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push({ test: test.name, ...result });
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log(`\n✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Average duration: ${avgDuration.toFixed(0)}ms\n`);
  
  if (failed > 0) {
    console.log('Failed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.test}: ${r.error || `Status ${r.status}`}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
