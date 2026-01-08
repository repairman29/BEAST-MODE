#!/usr/bin/env node

/**
 * Compare Models
 * 
 * A/B testing and comparison tool for custom vs provider models
 * Compares quality, speed, and cost across different models
 * 
 * Usage:
 *   node scripts/compare-models.js --user-id=YOUR_USER_ID [--scenarios=5]
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const scenariosArg = args.find(arg => arg.startsWith('--scenarios='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;
const numScenarios = scenariosArg ? parseInt(scenariosArg.split('=')[1]) : 5;

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/compare-models.js --user-id=YOUR_USER_ID [--scenarios=5]');
  process.exit(1);
}

/**
 * Make HTTP request
 */
async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `github_oauth_user_id=${userId}`,
    ...options.headers
  };
  
  try {
    const startTime = Date.now();
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
      latency
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
      data: null,
      latency: 0
    };
  }
}

/**
 * Test scenarios
 */
const TEST_SCENARIOS = [
  {
    name: 'Simple Function',
    prompt: 'Write a TypeScript function that validates an email address. Include JSDoc comments and error handling.',
    complexity: 'low'
  },
  {
    name: 'React Component',
    prompt: 'Create a React component for a user profile card with TypeScript, error states, and loading states.',
    complexity: 'medium'
  },
  {
    name: 'API Endpoint',
    prompt: 'Build a REST API endpoint for user authentication with validation, error handling, and security best practices.',
    complexity: 'high'
  },
  {
    name: 'Database Query',
    prompt: 'Write a TypeScript function that queries a database with proper error handling, type safety, and connection pooling.',
    complexity: 'medium'
  },
  {
    name: 'Utility Library',
    prompt: 'Create a utility library for string manipulation with comprehensive tests, TypeScript types, and documentation.',
    complexity: 'high'
  }
];

/**
 * Test a model with a scenario
 */
async function testModel(modelId, scenario) {
  const startTime = Date.now();
  
  const response = await request('/api/codebase/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: `compare-${Date.now()}-${Math.random()}`,
      message: scenario.prompt,
      repo: 'test-repo',
      model: modelId,
      useLLM: true
    })
  });
  
  const totalTime = Date.now() - startTime;
  
  if (!response.ok || !response.data.message) {
    return {
      success: false,
      error: response.error || response.data?.error || 'Unknown error',
      latency: totalTime
    };
  }
  
  const code = response.data.message || response.data.code || '';
  
  // Basic quality analysis
  const hasComments = code.includes('//') || code.includes('/*') || code.includes('*');
  const hasErrorHandling = code.includes('try') || code.includes('catch') || code.includes('error');
  const hasTypes = code.includes(':') && (code.includes('string') || code.includes('number') || code.includes('boolean'));
  const lines = code.split('\n').length;
  
  let quality = 0.5;
  if (hasComments) quality += 0.15;
  if (hasErrorHandling) quality += 0.2;
  if (hasTypes) quality += 0.1;
  if (lines > 10) quality += 0.05;
  quality = Math.min(1, quality);
  
  return {
    success: true,
    quality,
    latency: totalTime,
    codeLength: code.length,
    lines,
    hasComments,
    hasErrorHandling,
    hasTypes
  };
}

/**
 * Compare models
 */
async function compareModels() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🔬 Model Comparison Tool                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n📍 Testing against: ${BASE_URL}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`📊 Scenarios: ${numScenarios}`);
  
  // Get available models
  console.log('\n📋 Fetching available models...');
  const modelsResponse = await request('/api/models/list');
  
  if (!modelsResponse.ok) {
    console.error('❌ Failed to fetch models');
    process.exit(1);
  }
  
  const allModels = modelsResponse.data.models || [];
  const customModels = allModels.filter(m => m.id && m.id.startsWith('custom:'));
  const providerModels = allModels.filter(m => m.id && !m.id.startsWith('custom:'));
  
  console.log(`   ✅ Found ${customModels.length} custom models, ${providerModels.length} provider models`);
  
  if (customModels.length === 0 && providerModels.length === 0) {
    console.error('❌ No models available for comparison');
    process.exit(1);
  }
  
  // Select models to compare
  const modelsToTest = [];
  if (customModels.length > 0) {
    modelsToTest.push(customModels[0].id);
  }
  if (providerModels.length > 0) {
    modelsToTest.push(providerModels[0].id);
  }
  
  if (modelsToTest.length < 2) {
    console.log('⚠️  Only one model available - will test single model');
  }
  
  // Select scenarios
  const scenarios = TEST_SCENARIOS.slice(0, numScenarios);
  
  console.log(`\n🧪 Testing ${modelsToTest.length} model(s) with ${scenarios.length} scenario(s)...\n`);
  
  const results = [];
  
  // Test each model
  for (const modelId of modelsToTest) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🤖 Testing: ${modelId}`);
    console.log('='.repeat(60));
    
    const modelResults = {
      modelId,
      type: modelId.startsWith('custom:') ? 'custom' : 'provider',
      scenarios: [],
      summary: {
        avgQuality: 0,
        avgLatency: 0,
        successRate: 0,
        totalTests: 0
      }
    };
    
    for (const scenario of scenarios) {
      console.log(`\n📝 ${scenario.name} (${scenario.complexity})...`);
      
      const testResult = await testModel(modelId, scenario);
      
      if (testResult.success) {
        modelResults.scenarios.push({
          scenario: scenario.name,
          complexity: scenario.complexity,
          ...testResult
        });
        console.log(`   ✅ Quality: ${(testResult.quality * 100).toFixed(1)}% | Latency: ${testResult.latency}ms`);
      } else {
        modelResults.scenarios.push({
          scenario: scenario.name,
          complexity: scenario.complexity,
          success: false,
          error: testResult.error
        });
        console.log(`   ❌ Failed: ${testResult.error}`);
      }
    }
    
    // Calculate summary
    const successful = modelResults.scenarios.filter(s => s.success);
    if (successful.length > 0) {
      modelResults.summary.avgQuality = successful.reduce((sum, s) => sum + s.quality, 0) / successful.length;
      modelResults.summary.avgLatency = successful.reduce((sum, s) => sum + s.latency, 0) / successful.length;
      modelResults.summary.successRate = (successful.length / modelResults.scenarios.length) * 100;
      modelResults.summary.totalTests = modelResults.scenarios.length;
    }
    
    results.push(modelResults);
  }
  
  // Generate comparison report
  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     📊 Comparison Results                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  for (const result of results) {
    console.log(`\n🤖 ${result.modelId} (${result.type}):`);
    console.log(`   Avg Quality: ${(result.summary.avgQuality * 100).toFixed(1)}%`);
    console.log(`   Avg Latency: ${result.summary.avgLatency.toFixed(0)}ms`);
    console.log(`   Success Rate: ${result.summary.successRate.toFixed(1)}%`);
  }
  
  // Compare if we have multiple models
  if (results.length >= 2) {
    console.log(`\n\n╔══════════════════════════════════════════════════════════════╗`);
    console.log('║     📈 Head-to-Head Comparison                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    
    const custom = results.find(r => r.type === 'custom');
    const provider = results.find(r => r.type === 'provider');
    
    if (custom && provider) {
      const qualityDiff = ((custom.summary.avgQuality - provider.summary.avgQuality) * 100).toFixed(1);
      const latencyDiff = (custom.summary.avgLatency - provider.summary.avgLatency).toFixed(0);
      const successDiff = (custom.summary.successRate - provider.summary.successRate).toFixed(1);
      
      console.log(`\n📊 Quality:`);
      console.log(`   Custom: ${(custom.summary.avgQuality * 100).toFixed(1)}%`);
      console.log(`   Provider: ${(provider.summary.avgQuality * 100).toFixed(1)}%`);
      console.log(`   Difference: ${qualityDiff > 0 ? '+' : ''}${qualityDiff}%`);
      
      console.log(`\n⚡ Speed:`);
      console.log(`   Custom: ${custom.summary.avgLatency.toFixed(0)}ms`);
      console.log(`   Provider: ${provider.summary.avgLatency.toFixed(0)}ms`);
      console.log(`   Difference: ${latencyDiff > 0 ? '+' : ''}${latencyDiff}ms`);
      
      console.log(`\n✅ Reliability:`);
      console.log(`   Custom: ${custom.summary.successRate.toFixed(1)}%`);
      console.log(`   Provider: ${provider.summary.successRate.toFixed(1)}%`);
      console.log(`   Difference: ${successDiff > 0 ? '+' : ''}${successDiff}%`);
      
      // Winner
      console.log(`\n🏆 Overall Winner:`);
      let customScore = 0;
      let providerScore = 0;
      
      if (custom.summary.avgQuality > provider.summary.avgQuality) customScore++;
      else providerScore++;
      
      if (custom.summary.avgLatency < provider.summary.avgLatency) customScore++;
      else providerScore++;
      
      if (custom.summary.successRate > provider.summary.successRate) customScore++;
      else providerScore++;
      
      if (customScore > providerScore) {
        console.log(`   🥇 Custom Model wins! (${customScore}-${providerScore})`);
      } else if (providerScore > customScore) {
        console.log(`   🥇 Provider Model wins! (${providerScore}-${customScore})`);
      } else {
        console.log(`   🤝 Tie! Both models perform equally well`);
      }
    }
  }
  
  // Save results
  const outputDir = path.join(__dirname, '../test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, `model-comparison-${Date.now()}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputFile}`);
  
  console.log('\n✅ Model comparison complete!');
}

// Run
compareModels().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
