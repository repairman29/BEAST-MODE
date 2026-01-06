#!/usr/bin/env node

/**
 * Add All GitHub Repositories to BEAST MODE (via GitHub CLI)
 * 
 * Uses GitHub CLI to fetch all repositories and add them to BEAST MODE
 */

const { execSync } = require('child_process');
const axios = require('axios');

const BASE_URL = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';

// Check if GitHub CLI is available
function hasGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Fetch all repos using GitHub CLI
function fetchReposViaCLI() {
  try {
    console.log('📡 Fetching all repositories via GitHub CLI...\n');
    const output = execSync('gh repo list --limit 1000 --json name,url,isPrivate,owner', { 
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    return JSON.parse(output);
  } catch (error) {
    console.error('❌ Error fetching repos:', error.message);
    return null;
  }
}

// Add repository to BEAST MODE
async function addRepoToBeastMode(repo, baseUrl) {
  try {
    const team = repo.isPrivate ? 'Private' : 'Public';
    const response = await axios.post(`${baseUrl}/api/beast-mode/enterprise/repos`, {
      url: repo.url,
      team: team,
    }, {
      validateStatus: () => true,
      timeout: 5000,
    });

    if (response.status === 201) {
      return { success: true, status: 'added' };
    } else if (response.status === 409) {
      return { success: true, status: 'exists' };
    } else {
      return { success: false, status: response.status, error: response.data };
    }
  } catch (error) {
    return { success: false, status: 'error', error: error.message };
  }
}

// Main function
async function main() {
  console.log('🚀 Adding All GitHub Repositories to BEAST MODE\n');
  console.log(`🌐 API URL: ${BASE_URL}\n`);

  // Check for GitHub CLI
  if (!hasGitHubCLI()) {
    console.error('❌ GitHub CLI (gh) not found!');
    console.log('\n💡 Install GitHub CLI:');
    console.log('   brew install gh');
    console.log('   gh auth login\n');
    process.exit(1);
  }

  // Check authentication
  try {
    execSync('gh auth status', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ GitHub CLI not authenticated!');
    console.log('\n💡 Run: gh auth login\n');
    process.exit(1);
  }

  // Fetch all repos
  const repos = fetchReposViaCLI();

  if (!repos || repos.length === 0) {
    console.log('⚠️  No repositories found');
    process.exit(0);
  }

  console.log(`📦 Found ${repos.length} repositories\n`);
  console.log('📥 Adding to BEAST MODE...\n');

  let addedCount = 0;
  let existsCount = 0;
  let errorCount = 0;

  // Add repos in batches
  const batchSize = 10;
  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);
    
    const promises = batch.map(async (repo) => {
      const result = await addRepoToBeastMode(repo, BASE_URL);
      return { repo, result };
    });

    const results = await Promise.all(promises);

    for (const { repo, result } of results) {
      const repoName = (repo.owner.login + '/' + repo.name).padEnd(40);
      if (result.success && result.status === 'added') {
        console.log(`  ✅ ${repoName} - Added`);
        addedCount++;
      } else if (result.success && result.status === 'exists') {
        console.log(`  ⚠️  ${repoName} - Already exists`);
        existsCount++;
      } else {
        console.log(`  ❌ ${repoName} - Failed (${result.status})`);
        errorCount++;
      }
    }

    // Progress update
    if ((i + batchSize) % 50 === 0 || i + batchSize >= repos.length) {
      console.log(`\n   Progress: ${Math.min(i + batchSize, repos.length)}/${repos.length}\n`);
    }

    // Small delay between batches
    if (i + batchSize < repos.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Added: ${addedCount}`);
  console.log(`  ⚠️  Already exists: ${existsCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📦 Total: ${repos.length}`);

  if (addedCount + existsCount === repos.length) {
    console.log('\n✅ All repositories are now connected to BEAST MODE!');
  } else {
    console.log('\n⚠️  Some repositories could not be added. Check errors above.');
  }
}

main().catch(console.error);

