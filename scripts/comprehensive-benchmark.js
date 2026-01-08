#!/usr/bin/env node

/**
 * Comprehensive Benchmark Suite
 * 
 * Full testing of quality, speed, and delivery metrics
 * Tests multiple scenarios and generates detailed reports
 * 
 * Usage:
 *   node scripts/comprehensive-benchmark.js --user-id=YOUR_USER_ID
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/comprehensive-benchmark.js --user-id=YOUR_USER_ID');
  process.exit(1);
}

/**
 * Make HTTP request with timing
 */
async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `github_oauth_user_id=${userId}`,
    ...options.headers
  };
  
  const startTime = Date.now();
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers
    });
    const latency = Date.now() - startTime;
    
    const data = await response.json().catch(() => ({}));
    
    return {
      ok: response.ok,
      status: response.status,
      data,
      latency,
      totalTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      latency: Date.now() - startTime,
      totalTime: Date.now() - startTime
    };
  }
}

/**
 * Test scenarios
 */
const testScenarios = [
  {
    name: 'Simple Component',
    prompt: 'Create a simple React button component with TypeScript',
    complexity: 'low'
  },
  {
    name: 'Medium Component',
    prompt: 'Create a React user profile card component with TypeScript. Include avatar, name, email, bio, and proper error handling.',
    complexity: 'medium'
  },
  {
    name: 'Complex Feature',
    prompt: 'Create a complete authentication system with login, signup, password reset, and session management. Include TypeScript types, error handling, validation, and security best practices.',
    complexity: 'high'
  }
];

/**
 * Run comprehensive benchmark
 */
async function runComprehensiveBenchmark() {
  console.log('🏁 BEAST MODE Comprehensive Benchmark Suite');
  console.log('='.repeat(70));
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log('');
  
  const results = {
    timestamp: new Date().toISOString(),
    userId,
    baseUrl: BASE_URL,
    scenarios: [],
    summary: {
      totalTests: 0,
      successful: 0,
      failed: 0,
      averageLatency: 0,
      averageQuality: 0
    }
  };
  
  // Test each scenario
  for (const scenario of testScenarios) {
    console.log(`\n📋 Testing Scenario: ${scenario.name} (${scenario.complexity})`);
    console.log('─'.repeat(70));
    
    const scenarioResult = {
      name: scenario.name,
      complexity: scenario.complexity,
      prompt: scenario.prompt,
      tests: []
    };
    
    // Test with provider model (baseline)
    console.log(`\n   🔵 Testing with provider model (baseline)...`);
    const providerTest = await testScenario(scenario, 'openai:gpt-3.5-turbo');
    scenarioResult.tests.push(providerTest);
    
    if (providerTest.success) {
      console.log(`   ✅ Provider: ${providerTest.totalTime}ms, Quality: ${providerTest.quality?.toFixed(3) || 'N/A'}`);
    } else {
      console.log(`   ❌ Provider: ${providerTest.error}`);
    }
    
    // Test with custom model (if available)
    console.log(`\n   🟢 Testing with custom model...`);
    const customTest = await testScenario(scenario, 'custom:demo-code-model-1767889155418');
    scenarioResult.tests.push(customTest);
    
    if (customTest.success) {
      console.log(`   ✅ Custom: ${customTest.totalTime}ms, Quality: ${customTest.quality?.toFixed(3) || 'N/A'}`);
    } else {
      console.log(`   ⚠️  Custom: ${customTest.error || 'Not available'}`);
    }
    
    results.scenarios.push(scenarioResult);
    results.summary.totalTests += 2;
    if (providerTest.success) results.summary.successful++;
    if (customTest.success) results.summary.successful++;
    if (!providerTest.success) results.summary.failed++;
    if (!customTest.success) results.summary.failed++;
  }
  
  // Calculate summary metrics
  const successfulTests = results.scenarios.flatMap(s => s.tests.filter(t => t.success));
  if (successfulTests.length > 0) {
    results.summary.averageLatency = successfulTests.reduce((sum, t) => sum + t.totalTime, 0) / successfulTests.length;
    const qualityTests = successfulTests.filter(t => t.quality);
    if (qualityTests.length > 0) {
      results.summary.averageQuality = qualityTests.reduce((sum, t) => sum + t.quality, 0) / qualityTests.length;
    }
  }
  
  // Display summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Comprehensive Benchmark Summary');
  console.log('='.repeat(70));
  
  console.log(`\n📈 Overall Metrics:`);
  console.log(`   Total Tests: ${results.summary.totalTests}`);
  console.log(`   Successful: ${results.summary.successful} (${((results.summary.successful/results.summary.totalTests)*100).toFixed(1)}%)`);
  console.log(`   Failed: ${results.summary.failed}`);
  console.log(`   Average Latency: ${results.summary.averageLatency.toFixed(0)}ms`);
  console.log(`   Average Quality: ${results.summary.averageQuality.toFixed(3)}`);
  
  // Per-scenario breakdown
  console.log(`\n📋 Per-Scenario Results:`);
  results.scenarios.forEach((scenario, i) => {
    console.log(`\n   ${i + 1}. ${scenario.name} (${scenario.complexity}):`);
    scenario.tests.forEach(test => {
      const icon = test.modelId?.startsWith('custom:') ? '🟢' : '🔵';
      const modelName = test.modelId || 'unknown';
      if (test.success) {
        console.log(`      ${icon} ${modelName}:`);
        console.log(`         Time: ${test.totalTime}ms`);
        console.log(`         Quality: ${test.quality?.toFixed(3) || 'N/A'}`);
        console.log(`         Response Length: ${test.responseLength || 0} chars`);
      } else {
        console.log(`      ${icon} ${modelName}: ${test.error || 'Failed'}`);
      }
    });
  });
  
  // Comparison
  console.log(`\n💡 Key Insights:`);
  const providerTests = results.scenarios.flatMap(s => s.tests.filter(t => !t.modelId?.startsWith('custom:') && t.success));
  const customTests = results.scenarios.flatMap(s => s.tests.filter(t => t.modelId?.startsWith('custom:') && t.success));
  
  if (providerTests.length > 0 && customTests.length > 0) {
    const providerAvgTime = providerTests.reduce((sum, t) => sum + t.totalTime, 0) / providerTests.length;
    const customAvgTime = customTests.reduce((sum, t) => sum + t.totalTime, 0) / customTests.length;
    const speedDiff = ((providerAvgTime - customAvgTime) / providerAvgTime * 100).toFixed(1);
    
    console.log(`   ⚡ Speed: Custom models ${speedDiff > 0 ? 'faster' : 'slower'} by ${Math.abs(speedDiff)}%`);
    
    const providerAvgQuality = providerTests.filter(t => t.quality).reduce((sum, t) => sum + t.quality, 0) / providerTests.filter(t => t.quality).length;
    const customAvgQuality = customTests.filter(t => t.quality).reduce((sum, t) => sum + t.quality, 0) / customTests.filter(t => t.quality).length;
    const qualityDiff = ((customAvgQuality - providerAvgQuality) * 100).toFixed(1);
    
    console.log(`   📊 Quality: Custom models ${qualityDiff > 0 ? 'better' : 'worse'} by ${Math.abs(qualityDiff)}%`);
  } else if (providerTests.length > 0) {
    console.log(`   ⚠️  Custom models not available - using provider models only`);
    console.log(`   💡 Add real API keys to test custom models`);
  }
  
  // Save results
  const resultsFile = path.join(__dirname, '../test-output/comprehensive-benchmark-results.json');
  const reportFile = path.join(__dirname, '../test-output/benchmark-report.md');
  
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  // Generate markdown report
  const report = generateMarkdownReport(results);
  fs.writeFileSync(reportFile, report);
  
  console.log(`\n💾 Results saved:`);
  console.log(`   📄 JSON: ${resultsFile}`);
  console.log(`   📄 Report: ${reportFile}`);
  
  console.log('\n✅ Comprehensive benchmark complete!');
  
  return results;
}

/**
 * Test a single scenario
 */
async function testScenario(scenario, modelId) {
  const startTime = Date.now();
  
  try {
    // Generate code
    const response = await request('/api/codebase/chat', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: `benchmark-${Date.now()}-${Math.random()}`,
        message: scenario.prompt,
        repo: 'test-repo',
        model: modelId,
        useLLM: true
      })
    });
    
    const totalTime = Date.now() - startTime;
    
    if (response.ok && response.data.message) {
      const responseLength = response.data.message.length;
      
      // Test quality if code was generated
      let quality = null;
      if (responseLength > 100) {
        try {
          const qualityResponse = await request('/api/repos/quality', {
            method: 'POST',
            body: JSON.stringify({
              repo: 'test-repo',
              files: [{
                path: 'test.tsx',
                content: response.data.message
              }]
            })
          });
          
          if (qualityResponse.ok && qualityResponse.data.quality) {
            quality = qualityResponse.data.quality;
          }
        } catch (error) {
          // Quality test failed, but code generation succeeded
        }
      }
      
      return {
        success: true,
        modelId,
        totalTime,
        latency: response.latency,
        responseLength,
        quality,
        response: response.data.message.substring(0, 200)
      };
    } else {
      return {
        success: false,
        modelId,
        totalTime,
        error: response.data.error || 'Unknown error',
        status: response.status
      };
    }
  } catch (error) {
    return {
      success: false,
      modelId,
      totalTime: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(results) {
  let report = `# BEAST MODE Benchmark Report\n\n`;
  report += `**Date:** ${new Date(results.timestamp).toLocaleString()}\n`;
  report += `**User ID:** ${results.userId}\n`;
  report += `**Base URL:** ${results.baseUrl}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${results.summary.totalTests}\n`;
  report += `- **Successful:** ${results.summary.successful} (${((results.summary.successful/results.summary.totalTests)*100).toFixed(1)}%)\n`;
  report += `- **Failed:** ${results.summary.failed}\n`;
  report += `- **Average Latency:** ${results.summary.averageLatency.toFixed(0)}ms\n`;
  report += `- **Average Quality:** ${results.summary.averageQuality.toFixed(3)}\n\n`;
  
  report += `## Test Results\n\n`;
  
  results.scenarios.forEach((scenario, i) => {
    report += `### ${i + 1}. ${scenario.name} (${scenario.complexity})\n\n`;
    report += `**Prompt:** ${scenario.prompt}\n\n`;
    
    scenario.tests.forEach(test => {
      const modelType = test.modelId?.startsWith('custom:') ? 'Custom Model' : 'Provider Model';
      report += `#### ${modelType}: ${test.modelId || 'unknown'}\n\n`;
      
      if (test.success) {
        report += `- ✅ **Status:** Success\n`;
        report += `- ⚡ **Time:** ${test.totalTime}ms\n`;
        report += `- 📊 **Quality:** ${test.quality?.toFixed(3) || 'N/A'}\n`;
        report += `- 📝 **Response Length:** ${test.responseLength || 0} chars\n\n`;
      } else {
        report += `- ❌ **Status:** Failed\n`;
        report += `- ⚠️ **Error:** ${test.error || 'Unknown error'}\n\n`;
      }
    });
  });
  
  report += `## Recommendations\n\n`;
  
  const providerTests = results.scenarios.flatMap(s => s.tests.filter(t => !t.modelId?.startsWith('custom:') && t.success));
  const customTests = results.scenarios.flatMap(s => s.tests.filter(t => t.modelId?.startsWith('custom:') && t.success));
  
  if (customTests.length === 0) {
    report += `- ⚠️ **Custom models not available** - Add real API keys to test custom models\n`;
    report += `- 💡 Run: \`node scripts/add-api-key-simple.js --user-id=${results.userId} --provider=openai --key=YOUR_KEY\`\n\n`;
  }
  
  if (results.summary.averageQuality < 0.8) {
    report += `- 📊 **Quality below target** (0.8+) - Consider model tuning or prompt optimization\n\n`;
  }
  
  if (results.summary.averageLatency > 2000) {
    report += `- ⚡ **Latency high** (>2s) - Consider caching or optimization\n\n`;
  }
  
  report += `---\n\n`;
  report += `*Generated by BEAST MODE Benchmark Suite*\n`;
  
  return report;
}

runComprehensiveBenchmark().catch(error => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});
