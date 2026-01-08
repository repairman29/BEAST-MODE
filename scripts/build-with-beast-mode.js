#!/usr/bin/env node

/**
 * Build with BEAST MODE
 * 
 * Uses BEAST MODE's own API to generate code
 * True dogfooding - building with our own tools!
 * 
 * Usage:
 *   node scripts/build-with-beast-mode.js --feature="Feature description" [--output=path]
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const featureArg = args.find(arg => arg.startsWith('--feature='));
const outputArg = args.find(arg => arg.startsWith('--output='));
const userId = process.env.TEST_USER_ID || '35379b45-d966-45d7-8644-1233338c542d';

const featureRequest = featureArg ? featureArg.split('=')[1] : null;
const outputPath = outputArg ? outputArg.split('=')[1] : null;

if (!featureRequest) {
  console.error('❌ Feature description required');
  console.error('   Usage: node scripts/build-with-beast-mode.js --feature="Create a React component..." [--output=./output]');
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
 * Generate feature using BEAST MODE API
 */
async function generateWithBeastMode() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🐕 BUILDING WITH BEAST MODE API                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n📍 Using: ${BASE_URL}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`🎯 Feature: ${featureRequest}`);
  
  console.log(`\n📝 Generating feature with BEAST MODE...`);
  
  const startTime = Date.now();
  const response = await request('/api/repos/quality/generate-feature', {
    method: 'POST',
    body: JSON.stringify({
      repo: 'BEAST-MODE-PRODUCT',
      featureRequest,
      useLLM: true
      // Will auto-select best model (custom or provider)
    })
  });
  
  const latency = Date.now() - startTime;
  
  if (!response.ok) {
    console.error(`\n❌ Failed: ${response.error || response.data?.error || 'Unknown error'}`);
    if (response.data?.details) {
      console.error(`   Details: ${response.data.details}`);
    }
    process.exit(1);
  }
  
  const result = response.data;
  
  console.log(`\n✅ Generated in ${latency}ms!`);
  console.log(`   Files: ${result.generatedFiles?.length || 0}`);
  
  if (result.generatedFiles && result.generatedFiles.length > 0) {
    console.log(`\n📁 Generated Files:`);
    
    const outputDir = outputPath || path.join(__dirname, '../test-output/beast-mode-generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    for (const file of result.generatedFiles) {
      const fileName = file.fileName || `generated-${Date.now()}.tsx`;
      const filePath = path.join(outputDir, fileName);
      
      if (file.fullCode) {
        fs.writeFileSync(filePath, file.fullCode);
        console.log(`   ✅ ${fileName} (${file.fullCode.length} chars)`);
      } else if (file.code) {
        fs.writeFileSync(filePath, file.code);
        console.log(`   ✅ ${fileName} (${file.code.length} chars)`);
      }
    }
    
    console.log(`\n💾 Saved to: ${outputDir}`);
    
    // Display first file preview
    const firstFile = result.generatedFiles[0];
    if (firstFile.fullCode || firstFile.code) {
      const code = firstFile.fullCode || firstFile.code;
      console.log(`\n📄 Preview of ${firstFile.fileName || 'first file'}:`);
      console.log('─'.repeat(60));
      console.log(code.substring(0, 500));
      if (code.length > 500) {
        console.log(`\n... (${code.length - 500} more characters)`);
      }
      console.log('─'.repeat(60));
    }
  }
  
  if (result.model) {
    console.log(`\n🤖 Model used: ${result.model}`);
  }
  
  if (result.usage) {
    console.log(`\n📊 Usage:`);
    console.log(`   Tokens: ${result.usage.total_tokens || 'N/A'}`);
    console.log(`   Cost: ~$${((result.usage.total_tokens || 0) / 1000 * 0.001).toFixed(4)}`);
  }
  
  console.log(`\n✅ Feature generation complete!`);
  return result;
}

// Run
generateWithBeastMode().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
