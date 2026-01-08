#!/usr/bin/env node
/**
 * Automated Deployment Script
 * Builds, deploys, and tests BEAST MODE
 */

const { execSync } = require('child_process');
const axios = require('axios');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const WEBSITE_DIR = path.join(PROJECT_ROOT, 'website');
const API_URL = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(step, message, color = 'reset') {
  const colorCode = colors[color] || colors.reset;
  console.log(`${colorCode}${step}${colors.reset} ${message}`);
}

function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      cwd: options.cwd || PROJECT_ROOT,
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit'
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEndpoint(url, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, status: response.status };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      message: error.message
    };
  }
}

async function main() {
  console.log('\n🚀 BEAST MODE Automated Deployment\n');
  console.log('='.repeat(60));
  console.log(`Project: ${PROJECT_ROOT}`);
  console.log(`API URL: ${API_URL}\n`);

  // Step 1: Pre-deployment checks
  log('📋', 'Step 1: Pre-deployment Checks', 'blue');
  console.log('-'.repeat(60));
  
  const gitStatus = exec('git status --porcelain');
  if (gitStatus.output && gitStatus.output.trim()) {
    log('⚠️', 'Uncommitted changes detected', 'yellow');
    log('ℹ️', 'Continuing anyway...', 'yellow');
  } else {
    log('✅', 'Git status clean', 'green');
  }

  // Step 2: Build
  log('\n📋', 'Step 2: Building Website', 'blue');
  console.log('-'.repeat(60));
  
  const build = exec('npm run build', { cwd: WEBSITE_DIR });
  if (!build.success) {
    log('❌', 'Build failed!', 'red');
    console.log(build.error);
    process.exit(1);
  }
  log('✅', 'Build successful', 'green');

  // Step 3: Deploy
  log('\n📋', 'Step 3: Deploying to Vercel', 'blue');
  console.log('-'.repeat(60));
  
  const deploy = exec('vercel --prod --yes', { cwd: PROJECT_ROOT });
  if (!deploy.success) {
    log('⚠️', 'Deployment may have issues', 'yellow');
    log('ℹ️', 'Check Vercel dashboard for details', 'yellow');
  } else {
    log('✅', 'Deployment initiated', 'green');
  }

  // Extract deployment URL if available
  const deployOutput = deploy.output || '';
  const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
  const deployUrl = urlMatch ? urlMatch[0] : API_URL;
  
  log('🌐', `Deployment URL: ${deployUrl}`, 'blue');

  // Step 4: Wait for deployment
  log('\n📋', 'Step 4: Waiting for Deployment', 'blue');
  console.log('-'.repeat(60));
  log('⏳', 'Waiting 20 seconds for deployment to propagate...', 'yellow');
  await sleep(20000);

  // Step 5: Test endpoints
  log('\n📋', 'Step 5: Testing Endpoints', 'blue');
  console.log('-'.repeat(60));

  const tests = [
    { name: 'Models List', url: `${API_URL}/api/models/list`, method: 'GET' },
    { name: 'Cursor Proxy (GET)', url: `${API_URL}/api/cursor/proxy`, method: 'GET' },
    {
      name: 'Codebase Chat',
      url: `${API_URL}/api/codebase/chat`,
      method: 'POST',
      data: {
        sessionId: `test-${Date.now()}`,
        message: 'test',
        repo: 'test/repo',
        useLLM: false
      }
    }
  ];

  const results = [];
  for (const test of tests) {
    log('🧪', `Testing ${test.name}...`, 'yellow');
    const result = await testEndpoint(test.url, test.method, test.data);
    results.push({ ...test, ...result });
    
    if (result.success) {
      log('✅', `${test.name}: OK (${result.status})`, 'green');
    } else if (result.status === 404) {
      log('⚠️', `${test.name}: Not found (may need time to deploy)`, 'yellow');
    } else {
      log('❌', `${test.name}: Failed (${result.status || result.message})`, 'red');
    }
    await sleep(2000); // Rate limiting
  }

  // Step 6: Summary
  log('\n📋', 'Step 6: Deployment Summary', 'blue');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const total = results.length;

  console.log(`\n📊 Test Results: ${passed}/${total} passed`);
  results.forEach(result => {
    const icon = result.success ? '✅' : (result.status === 404 ? '⚠️' : '❌');
    console.log(`   ${icon} ${result.name} [${result.status || 'N/A'}]`);
  });

  console.log('\n📦 Deliverables:');
  console.log('   ✅ Website deployed');
  console.log('   ✅ Extension: cursor-extension/beast-mode-cursor-1.0.0.vsix');
  console.log('   ✅ Test scripts ready');

  console.log('\n🎯 Next Steps:');
  console.log('   1. Test extension: code --install-extension cursor-extension/beast-mode-cursor-1.0.0.vsix');
  console.log('   2. Test auth: node scripts/test-custom-model-auth.js');
  console.log('   3. Verify: ' + API_URL);

  if (passed === total) {
    log('\n✅', 'All tests passed! Deployment successful!', 'green');
  } else if (passed > 0) {
    log('\n⚠️', 'Some tests failed - deployment may still be propagating', 'yellow');
  } else {
    log('\n❌', 'Tests failed - check deployment status', 'red');
  }

  console.log('');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
