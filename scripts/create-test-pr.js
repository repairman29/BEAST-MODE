#!/usr/bin/env node

/**
 * Create Test PR on Repository
 * 
 * Creates a test PR to trigger the GitHub App webhook
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const { createLogger } = require('../lib/utils/logger');
const log = createLogger('CreateTestPR');

async function createTestPR(repoFullName) {
  console.log(`\n🔀 Creating Test PR on ${repoFullName}\n`);
  console.log('='.repeat(60));
  
  try {
    const { getGitHubApp } = require('../lib/integrations/githubApp');
    const githubApp = getGitHubApp();
    
    if (!githubApp || !githubApp.app) {
      console.log('❌ GitHub App not initialized');
      return;
    }
    
    const [owner, repo] = repoFullName.split('/');
    
    // Get installation for this repo
    const installationId = await githubApp.getInstallationId(owner, repo);
    const octokit = await githubApp.getInstallationOctokit(installationId);
    
    // Create a test branch
    const branchName = `beast-mode-test-${Date.now()}`;
    const defaultBranch = 'main'; // or 'master'
    
    // Get default branch SHA
    const defaultBranchRef = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`
    });
    
    const baseSha = defaultBranchRef.data.object.sha;
    
    // Create new branch
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha
    });
    
    console.log(`✅ Created branch: ${branchName}`);
    
    // Create a test file
    const testFileContent = `# BEAST MODE Test PR

This is a test PR created by BEAST MODE to verify GitHub App integration.

## What this tests:
- ✅ Webhook receives PR event
- ✅ PR comment is posted
- ✅ Status check is created
- ✅ Quality analysis runs

## Test Details:
- Created: ${new Date().toISOString()}
- Branch: ${branchName}
- Purpose: Verify GitHub App integration

This PR can be safely closed after testing.
`;
    
    // Create or update a test file
    const testFilePath = 'BEAST_MODE_TEST.md';
    
    try {
      // Try to get existing file
      const existingFile = await octokit.repos.getContent({
        owner,
        repo,
        path: testFilePath,
        ref: branchName
      });
      
      // Update existing file
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: testFilePath,
        message: 'BEAST MODE: Test PR - Update test file',
        content: Buffer.from(testFileContent).toString('base64'),
        branch: branchName,
        sha: existingFile.data.sha
      });
      
      console.log(`✅ Updated file: ${testFilePath}`);
    } catch (error) {
      if (error.status === 404) {
        // File doesn't exist, create it
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: testFilePath,
          message: 'BEAST MODE: Test PR - Create test file',
          content: Buffer.from(testFileContent).toString('base64'),
          branch: branchName
        });
        
        console.log(`✅ Created file: ${testFilePath}`);
      } else {
        throw error;
      }
    }
    
    // Create PR
    const pr = await octokit.pulls.create({
      owner,
      repo,
      title: '🧪 BEAST MODE Test PR',
      head: branchName,
      base: defaultBranch,
      body: `## BEAST MODE Integration Test

This is an automated test PR to verify GitHub App integration.

**What this tests:**
- ✅ Webhook receives PR event
- ✅ PR comment with quality analysis
- ✅ Status check creation
- ✅ Quality score calculation

**Test Details:**
- Created: ${new Date().toISOString()}
- Branch: ${branchName}
- Purpose: Verify GitHub App webhook and services

**After testing:**
- Check that PR comment was posted
- Verify status check was created
- Review quality analysis results
- Close this PR when done

---
*This PR was created automatically by BEAST MODE test script*`
    });
    
    console.log(`\n✅ PR Created: #${pr.data.number}`);
    console.log(`   URL: ${pr.data.html_url}`);
    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Check webhook logs for event processing`);
    console.log(`   2. Verify PR comment is posted`);
    console.log(`   3. Check status checks are created`);
    console.log(`   4. Review quality analysis`);
    console.log(`   5. Close PR when done\n`);
    
    return pr.data;
    
  } catch (error) {
    console.error(`\n❌ Error creating PR: ${error.message}`);
    if (error.status === 422) {
      console.log(`\n💡 This might mean:`);
      console.log(`   - Branch already exists (try again)`);
      console.log(`   - No changes to commit`);
      console.log(`   - Repository permissions issue\n`);
    }
    throw error;
  }
}

if (require.main === module) {
  const repo = process.argv[2];
  
  if (!repo) {
    console.log('Usage: node scripts/create-test-pr.js <owner/repo>');
    console.log('Example: node scripts/create-test-pr.js repairman29/BEAST-MODE');
    process.exit(1);
  }
  
  createTestPR(repo)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createTestPR };
