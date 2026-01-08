#!/usr/bin/env node

/**
 * Benchmark Custom Models
 * 
 * Tests quality, speed, and delivery metrics for custom models
 * Compares with provider models
 * 
 * Usage:
 *   node scripts/benchmark-custom-models.js --user-id=YOUR_USER_ID
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
  console.error('   Usage: node scripts/benchmark-custom-models.js --user-id=YOUR_USER_ID');
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
    throw new Error(`Request failed: ${error.message}`);
  }
}

/**
 * Test code generation speed
 */
async function testSpeed(model, testPrompt) {
  console.log(`\n⚡ Testing speed: ${model}`);
  
  const startTime = Date.now();
  const result = await request('/api/codebase/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: `benchmark-${Date.now()}`,
      message: testPrompt,
      repo: 'test-repo',
      model: model,
      useLLM: true
    })
  });
  
  const totalTime = Date.now() - startTime;
  
  if (result.ok && result.data.message) {
    const responseLength = result.data.message.length;
    const tokensPerSecond = responseLength / (totalTime / 1000);
    
    return {
      success: true,
      latency: result.latency,
      totalTime,
      responseLength,
      tokensPerSecond,
      model: result.data.model || model
    };
  } else {
    return {
      success: false,
      error: result.data.error || 'Unknown error',
      latency: result.latency,
      totalTime
    };
  }
}

/**
 * Test code quality
 */
async function testQuality(model, generatedCode) {
  console.log(`\n📊 Testing quality: ${model}`);
  
  // Save code to temp file
  const tempDir = path.join(__dirname, '../test-output/benchmark');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFile = path.join(tempDir, `test-${Date.now()}.ts`);
  fs.writeFileSync(tempFile, generatedCode);
  
  // Analyze quality
  const result = await request('/api/repos/quality', {
    method: 'POST',
    body: JSON.stringify({
      repo: 'test-repo',
      files: [{
        path: tempFile,
        content: generatedCode
      }]
    })
  });
  
  // Clean up
  try {
    fs.unlinkSync(tempFile);
  } catch (e) {
    // Ignore
  }
  
  if (result.ok && result.data.quality) {
    return {
      success: true,
      quality: result.data.quality,
      confidence: result.data.confidence || 0.5,
      features: result.data.features || {}
    };
  } else {
    return {
      success: false,
      error: result.data.error || 'Quality analysis failed'
    };
  }
}

/**
 * Run benchmark suite
 */
async function runBenchmark() {
  console.log('🏁 BEAST MODE Custom Models Benchmark');
  console.log('='.repeat(60));
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`👤 User ID: ${userId}`);
  console.log('');
  
  const testPrompt = 'Create a simple React component with TypeScript that displays a user profile card with avatar, name, email, and bio. Include proper error handling and accessibility features.';
  
  const models = [
    'custom:demo-code-model-1767889155418', // Custom model
    'openai:gpt-3.5-turbo', // Provider model for comparison
  ];
  
  const results = {
    speed: {},
    quality: {},
    delivery: {}
  };
  
  // Test speed
  console.log('⚡ Speed Testing');
  console.log('='.repeat(60));
  
  for (const model of models) {
    const speedResult = await testSpeed(model, testPrompt);
    results.speed[model] = speedResult;
    
    if (speedResult.success) {
      console.log(`✅ ${model}:`);
      console.log(`   Latency: ${speedResult.latency}ms`);
      console.log(`   Total Time: ${speedResult.totalTime}ms`);
      console.log(`   Response Length: ${speedResult.responseLength} chars`);
      console.log(`   Throughput: ${speedResult.tokensPerSecond.toFixed(2)} chars/sec`);
    } else {
      console.log(`❌ ${model}: ${speedResult.error}`);
    }
  }
  
  // Test quality (if code was generated)
  console.log('\n📊 Quality Testing');
  console.log('='.repeat(60));
  
  for (const model of models) {
    if (results.speed[model]?.success) {
      // Re-generate for quality test
      const codeResult = await request('/api/codebase/chat', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: `quality-test-${Date.now()}`,
          message: testPrompt,
          repo: 'test-repo',
          model: model,
          useLLM: true
        })
      });
      
      if (codeResult.ok && codeResult.data.message) {
        const qualityResult = await testQuality(model, codeResult.data.message);
        results.quality[model] = qualityResult;
        
        if (qualityResult.success) {
          console.log(`✅ ${model}:`);
          console.log(`   Quality Score: ${qualityResult.quality.toFixed(3)}`);
          console.log(`   Confidence: ${qualityResult.confidence.toFixed(3)}`);
        } else {
          console.log(`❌ ${model}: ${qualityResult.error}`);
        }
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Benchmark Summary');
  console.log('='.repeat(60));
  
  // Speed comparison
  console.log('\n⚡ Speed Comparison:');
  Object.entries(results.speed).forEach(([model, result]) => {
    if (result.success) {
      const icon = model.startsWith('custom:') ? '🟢' : '🔵';
      console.log(`   ${icon} ${model}:`);
      console.log(`      Total Time: ${result.totalTime}ms`);
      console.log(`      Throughput: ${result.tokensPerSecond.toFixed(2)} chars/sec`);
    }
  });
  
  // Quality comparison
  console.log('\n📊 Quality Comparison:');
  Object.entries(results.quality).forEach(([model, result]) => {
    if (result.success) {
      const icon = model.startsWith('custom:') ? '🟢' : '🔵';
      console.log(`   ${icon} ${model}:`);
      console.log(`      Quality: ${result.quality.toFixed(3)}`);
      console.log(`      Confidence: ${result.confidence.toFixed(3)}`);
    }
  });
  
  // Calculate improvements
  const customSpeed = results.speed['custom:demo-code-model-1767889155418'];
  const providerSpeed = results.speed['openai:gpt-3.5-turbo'];
  
  if (customSpeed?.success && providerSpeed?.success) {
    const speedImprovement = ((providerSpeed.totalTime - customSpeed.totalTime) / providerSpeed.totalTime * 100).toFixed(1);
    console.log(`\n💡 Speed Improvement: ${speedImprovement}% faster with custom model`);
  }
  
  const customQuality = results.quality['custom:demo-code-model-1767889155418'];
  const providerQuality = results.quality['openai:gpt-3.5-turbo'];
  
  if (customQuality?.success && providerQuality?.success) {
    const qualityDiff = (customQuality.quality - providerQuality.quality).toFixed(3);
    console.log(`💡 Quality Difference: ${qualityDiff > 0 ? '+' : ''}${qualityDiff} (custom vs provider)`);
  }
  
  // Save results
  const resultsFile = path.join(__dirname, '../test-output/benchmark-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);
  
  console.log('\n✅ Benchmark complete!');
}

runBenchmark().catch(error => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});
