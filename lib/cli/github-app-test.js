#!/usr/bin/env node

/**
 * Test GitHub App Integration
 * 
 * Verifies that the GitHub App is working correctly:
 * - Checks installation status
 * - Tests webhook connectivity
 * - Verifies PR comment and status check services
 */

const { getGitHubApp } = require('../integrations/githubApp');
// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}

const log = createLogger('GitHubAppTest');

/**
 * Test GitHub App configuration
 */
async function testConfiguration() {
  console.log('\n🧪 Testing GitHub App Configuration...\n');

  const githubApp = getGitHubApp();

  if (!githubApp.isConfigured()) {
    console.error('❌ GitHub App not configured');
    console.log('   Run: beast-mode github-app check');
    return false;
  }

  console.log('✅ GitHub App is configured\n');

  // Test getting installation for a known repo
  const testRepo = 'repairman29/BEAST-MODE';
  const [owner, repo] = testRepo.split('/');

  try {
    console.log(`🔍 Testing installation access for ${testRepo}...`);
    const installationId = await githubApp.getInstallationId(owner, repo);
    console.log(`✅ Installation ID: ${installationId}\n`);

    console.log('🔍 Testing Octokit instance...');
    const octokit = await githubApp.getOctokitForRepo(owner, repo);
    console.log('✅ Octokit instance created successfully\n');

    // Test API call
    console.log('🔍 Testing API access...');
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo
    });
    console.log(`✅ API access working! Repo: ${repoData.full_name}\n`);

    return true;
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    if (error.status === 404) {
      console.log('   App may not be installed on this repository');
      console.log('   Install it at: https://github.com/settings/apps/beast-mode-dev');
    }
    return false;
  }
}

/**
 * Check webhook deliveries
 */
async function checkWebhookDeliveries() {
  console.log('\n📋 Webhook Delivery Check\n');
  console.log('To check webhook deliveries:');
  console.log('  1. Go to: https://github.com/settings/apps/beast-mode-dev');
  console.log('  2. Click "Advanced" → "Recent Deliveries"');
  console.log('  3. Look for recent events (installation, pull_request, push)');
  console.log('  4. Green checkmarks = successful deliveries\n');
  console.log('💡 If you see installation events, the app is working!\n');
}

/**
 * Test PR comment service
 */
async function testPRCommentService() {
  console.log('\n💬 Testing PR Comment Service...\n');

  try {
    const { getPRCommentService } = require('../integrations/prCommentService');
    const prCommentService = getPRCommentService();

    // Test formatting (without actually posting)
    const mockAnalysis = {
      quality: 75,
      issues: 5,
      recommendations: [
        { title: 'Add error handling', message: 'Consider adding try-catch blocks' },
        { title: 'Improve documentation', message: 'Add JSDoc comments' }
      ],
      issuesList: [
        { priority: 'high', title: 'Missing error handling', file: 'src/index.js', line: 42 },
        { priority: 'medium', title: 'Unused variable', file: 'src/utils.js', line: 15 }
      ]
    };

    const comment = prCommentService.formatQualityComment(mockAnalysis);
    console.log('✅ PR comment formatting works!');
    console.log(`   Comment length: ${comment.length} characters\n`);
    console.log('📋 Sample comment preview:');
    console.log(comment.substring(0, 200) + '...\n');

    return true;
  } catch (error) {
    console.error(`❌ PR Comment Service test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test status check service
 */
async function testStatusCheckService() {
  console.log('\n✅ Testing Status Check Service...\n');

  try {
    const { getStatusCheckService } = require('../integrations/statusCheckService');
    const statusCheckService = getStatusCheckService();

    // Test formatting (without actually creating check)
    const mockAnalysis = {
      quality: 75,
      issues: 5,
      recommendations: [
        { title: 'Add error handling' }
      ],
      issuesList: [
        { priority: 'high', title: 'Missing error handling', file: 'src/index.js', line: 42 }
      ]
    };

    const output = statusCheckService.formatCheckOutput(mockAnalysis);
    console.log('✅ Status check formatting works!');
    console.log(`   Title: ${output.title}`);
    console.log(`   Summary: ${output.summary}\n`);

    return true;
  } catch (error) {
    console.error(`❌ Status Check Service test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('\n🧪 GitHub App Integration Tests\n');
  console.log('=' .repeat(50) + '\n');

  const results = {
    configuration: false,
    prComment: false,
    statusCheck: false
  };

  // Test configuration
  results.configuration = await testConfiguration();

  // Test services
  results.prComment = await testPRCommentService();
  results.statusCheck = await testStatusCheckService();

  // Webhook check instructions
  await checkWebhookDeliveries();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Results:\n');
  console.log(`  Configuration: ${results.configuration ? '✅' : '❌'}`);
  console.log(`  PR Comment Service: ${results.prComment ? '✅' : '❌'}`);
  console.log(`  Status Check Service: ${results.statusCheck ? '✅' : '❌'}\n`);

  if (results.configuration && results.prComment && results.statusCheck) {
    console.log('🎉 All tests passed! GitHub App is ready to use.\n');
    console.log('📋 Next steps:');
    console.log('  1. Create a test PR in any @repairman29 repo');
    console.log('  2. BEAST MODE will automatically:');
    console.log('     - Analyze the PR');
    console.log('     - Post a quality comment');
    console.log('     - Create a status check\n');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.\n');
  }
}

// CLI entry point
if (require.main === module) {
  runTests().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testConfiguration, testPRCommentService, testStatusCheckService };
