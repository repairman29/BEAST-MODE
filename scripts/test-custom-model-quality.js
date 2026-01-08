#!/usr/bin/env node

/**
 * Test Custom Model Quality
 * 
 * Analyzes code quality for custom models by:
 * - Generating code samples with custom models
 * - Running quality analysis on generated code
 * - Comparing with provider models
 * - Tracking quality metrics over time
 * 
 * Usage:
 *   node scripts/test-custom-model-quality.js --user-id=YOUR_USER_ID [--model=custom:MODEL_ID]
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const modelArg = args.find(arg => arg.startsWith('--model='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;
const requestedModel = modelArg ? modelArg.split('=')[1] : null;

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/test-custom-model-quality.js --user-id=YOUR_USER_ID [--model=custom:MODEL_ID]');
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
    const response = await fetch(fullUrl, {
      ...options,
      headers
    });
    
    const data = await response.json().catch(() => ({}));
    
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
      data: null
    };
  }
}

/**
 * Generate code sample with a model
 */
async function generateCodeSample(modelId, prompt) {
  console.log(`\n📝 Generating code with ${modelId}...`);
  
  const startTime = Date.now();
  const response = await request('/api/codebase/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: `quality-test-${Date.now()}`,
      message: prompt,
      repo: 'test-repo',
      model: modelId,
      useLLM: true
    })
  });
  
  const latency = Date.now() - startTime;
  
  if (!response.ok) {
    console.error(`   ❌ Failed: ${response.error || response.data?.error || 'Unknown error'}`);
    return null;
  }
  
  const code = response.data.message || response.data.code || '';
  console.log(`   ✅ Generated ${code.length} chars in ${latency}ms`);
  
  return {
    code,
    latency,
    model: modelId
  };
}

/**
 * Analyze code quality
 */
async function analyzeQuality(code) {
  // Extract code blocks from response
  const codeBlockPattern = /```(?:(\w+):)?([^\n]+)\n([\s\S]*?)```/g;
  const matches = [];
  let match;
  
  while ((match = codeBlockPattern.exec(code)) !== null) {
    matches.push({
      language: match[1] || 'javascript',
      fileName: match[2].trim() || 'generated.js',
      code: match[3].trim()
    });
  }
  
  // If no code blocks, treat entire response as code
  if (matches.length === 0 && code.trim().length > 50) {
    matches.push({
      language: 'javascript',
      fileName: 'generated.js',
      code: code.trim()
    });
  }
  
  if (matches.length === 0) {
    return {
      quality: 0,
      confidence: 0,
      issues: ['No code found in response'],
      metrics: {}
    };
  }
  
  // Analyze each code block
  const analyses = [];
  for (const block of matches) {
    // Basic quality heuristics
    const lines = block.code.split('\n');
    const hasComments = block.code.includes('//') || block.code.includes('/*');
    const hasErrorHandling = block.code.includes('try') || block.code.includes('catch') || block.code.includes('error');
    const hasTypeAnnotations = block.code.includes(':') && (block.language === 'typescript' || block.language === 'ts');
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const hasLongLines = avgLineLength > 120;
    
    // Calculate quality score (0-1)
    let quality = 0.5; // Base score
    if (hasComments) quality += 0.1;
    if (hasErrorHandling) quality += 0.15;
    if (hasTypeAnnotations) quality += 0.1;
    if (!hasLongLines) quality += 0.1;
    if (lines.length > 5) quality += 0.05; // More substantial code
    
    quality = Math.min(1, quality);
    
    const issues = [];
    if (!hasComments) issues.push('Missing comments');
    if (!hasErrorHandling) issues.push('No error handling');
    if (hasLongLines) issues.push('Long lines detected');
    
    analyses.push({
      fileName: block.fileName,
      language: block.language,
      quality,
      confidence: 0.7,
      issues,
      metrics: {
        lines: lines.length,
        hasComments,
        hasErrorHandling,
        hasTypeAnnotations,
        avgLineLength: Math.round(avgLineLength)
      }
    });
  }
  
  // Aggregate results
  const avgQuality = analyses.reduce((sum, a) => sum + a.quality, 0) / analyses.length;
  const allIssues = analyses.flatMap(a => a.issues);
  
  return {
    quality: avgQuality,
    confidence: 0.7,
    issues: [...new Set(allIssues)],
    metrics: {
      codeBlocks: analyses.length,
      avgLines: Math.round(analyses.reduce((sum, a) => sum + a.metrics.lines, 0) / analyses.length)
    },
    details: analyses
  };
}

/**
 * Test scenarios
 */
const TEST_SCENARIOS = [
  {
    name: 'Simple Function',
    prompt: 'Write a TypeScript function that calculates the factorial of a number. Include proper error handling, type annotations, and JSDoc comments.',
    complexity: 'low'
  },
  {
    name: 'Medium Component',
    prompt: 'Create a React component that displays a user profile card with avatar, name, email, and a follow button. Include TypeScript types, error states, and loading states.',
    complexity: 'medium'
  },
  {
    name: 'Complex Feature',
    prompt: 'Build a complete authentication system with login, signup, password reset, and JWT token management. Include validation, error handling, security best practices, and TypeScript types.',
    complexity: 'high'
  }
];

/**
 * Main test function
 */
async function runQualityTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🧪 Custom Model Quality Testing                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n📍 Testing against: ${BASE_URL}`);
  console.log(`👤 User ID: ${userId}`);
  if (requestedModel) {
    console.log(`🤖 Model: ${requestedModel}`);
  }
  
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
  
  // Select models to test
  const modelsToTest = [];
  if (requestedModel) {
    modelsToTest.push(requestedModel);
  } else {
    // Test first custom model and first provider model
    if (customModels.length > 0) {
      modelsToTest.push(customModels[0].id);
    }
    if (providerModels.length > 0) {
      modelsToTest.push(providerModels[0].id);
    }
  }
  
  if (modelsToTest.length === 0) {
    console.error('❌ No models available for testing');
    process.exit(1);
  }
  
  console.log(`\n🧪 Testing ${modelsToTest.length} model(s) with ${TEST_SCENARIOS.length} scenarios...`);
  
  const results = [];
  
  // Test each model with each scenario
  for (const modelId of modelsToTest) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🤖 Testing Model: ${modelId}`);
    console.log('='.repeat(60));
    
    const modelResults = {
      modelId,
      scenarios: []
    };
    
    for (const scenario of TEST_SCENARIOS) {
      console.log(`\n📝 Scenario: ${scenario.name} (${scenario.complexity})`);
      
      // Generate code
      const generated = await generateCodeSample(modelId, scenario.prompt);
      
      if (!generated) {
        modelResults.scenarios.push({
          scenario: scenario.name,
          success: false,
          error: 'Code generation failed'
        });
        continue;
      }
      
      // Analyze quality
      console.log(`   🔍 Analyzing quality...`);
      const quality = await analyzeQuality(generated.code);
      
      modelResults.scenarios.push({
        scenario: scenario.name,
        complexity: scenario.complexity,
        success: true,
        quality: quality.quality,
        confidence: quality.confidence,
        issues: quality.issues,
        metrics: {
          ...quality.metrics,
          latency: generated.latency,
          codeLength: generated.code.length
        },
        details: quality.details
      });
      
      console.log(`   ✅ Quality Score: ${(quality.quality * 100).toFixed(1)}%`);
      console.log(`   ⚠️  Issues: ${quality.issues.length > 0 ? quality.issues.join(', ') : 'None'}`);
    }
    
    // Calculate average quality for this model
    const successful = modelResults.scenarios.filter(s => s.success);
    if (successful.length > 0) {
      modelResults.avgQuality = successful.reduce((sum, s) => sum + s.quality, 0) / successful.length;
      modelResults.avgLatency = successful.reduce((sum, s) => sum + s.metrics.latency, 0) / successful.length;
    }
    
    results.push(modelResults);
  }
  
  // Generate report
  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     📊 Quality Test Results                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  for (const modelResult of results) {
    console.log(`\n🤖 Model: ${modelResult.modelId}`);
    console.log(`   Average Quality: ${modelResult.avgQuality ? (modelResult.avgQuality * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`   Average Latency: ${modelResult.avgLatency ? modelResult.avgLatency.toFixed(0) + 'ms' : 'N/A'}`);
    
    for (const scenario of modelResult.scenarios) {
      if (scenario.success) {
        console.log(`\n   📝 ${scenario.scenario}:`);
        console.log(`      Quality: ${(scenario.quality * 100).toFixed(1)}%`);
        console.log(`      Latency: ${scenario.metrics.latency}ms`);
        console.log(`      Issues: ${scenario.issues.length > 0 ? scenario.issues.join(', ') : 'None'}`);
      } else {
        console.log(`\n   ❌ ${scenario.scenario}: ${scenario.error}`);
      }
    }
  }
  
  // Compare models if we tested multiple
  if (results.length > 1) {
    console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║     📈 Model Comparison                                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    
    const customModel = results.find(r => r.modelId.startsWith('custom:'));
    const providerModel = results.find(r => !r.modelId.startsWith('custom:'));
    
    if (customModel && providerModel) {
      console.log(`\n🔵 Custom Model (${customModel.modelId}):`);
      console.log(`   Quality: ${customModel.avgQuality ? (customModel.avgQuality * 100).toFixed(1) + '%' : 'N/A'}`);
      console.log(`   Latency: ${customModel.avgLatency ? customModel.avgLatency.toFixed(0) + 'ms' : 'N/A'}`);
      
      console.log(`\n🟢 Provider Model (${providerModel.modelId}):`);
      console.log(`   Quality: ${providerModel.avgQuality ? (providerModel.avgQuality * 100).toFixed(1) + '%' : 'N/A'}`);
      console.log(`   Latency: ${providerModel.avgLatency ? providerModel.avgLatency.toFixed(0) + 'ms' : 'N/A'}`);
      
      if (customModel.avgQuality && providerModel.avgQuality) {
        const qualityDiff = ((customModel.avgQuality - providerModel.avgQuality) * 100).toFixed(1);
        const latencyDiff = customModel.avgLatency && providerModel.avgLatency 
          ? (customModel.avgLatency - providerModel.avgLatency).toFixed(0)
          : 'N/A';
        
        console.log(`\n📊 Comparison:`);
        console.log(`   Quality Difference: ${qualityDiff > 0 ? '+' : ''}${qualityDiff}%`);
        console.log(`   Latency Difference: ${latencyDiff !== 'N/A' ? (latencyDiff > 0 ? '+' : '') + latencyDiff + 'ms' : 'N/A'}`);
      }
    }
  }
  
  // Save results
  const outputDir = path.join(__dirname, '../test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, `quality-test-${Date.now()}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputFile}`);
  
  console.log('\n✅ Quality testing complete!');
}

// Run tests
runQualityTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
