#!/usr/bin/env node

/**
 * Add All GitHub Repositories to BEAST MODE
 * 
 * Fetches all repositories from GitHub and adds them to BEAST MODE
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs-extra');

// Use unified config if available
let getUnifiedConfig = null;
try {
  const configPath = path.join(__dirname, '../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

// Helper function to get config value
async function getConfigValue(key, defaultValue = null) {
  if (getUnifiedConfig) {
    try {
      const config = await getUnifiedConfig();
      const value = config.get(key);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    } catch (error) {
      // Fallback to process.env
    }
  }
  return process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : defaultValue;
}

// Simple decryption (matching the encryption in the API)
async function decryptToken(encryptedToken) {
  const crypto = require('crypto');
  const keyHex = await getConfigValue('GITHUB_TOKEN_ENCRYPTION_KEY', '20abb6f3b973e2fdeea6e2c417ce93824e7b64962f9fee4bfd6339264c8e792c');
  const key = Buffer.from(keyHex, 'hex');
  const parts = encryptedToken.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

// Get GitHub token from Supabase
async function getGitHubToken() {
  try {
    const supabaseUrl = await getConfigValue('NEXT_PUBLIC_SUPABASE_URL', null);
    const supabaseServiceKey = await getConfigValue('SUPABASE_SERVICE_ROLE_KEY', null);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️  Supabase not configured - trying environment variable');
      return process.env.GITHUB_TOKEN || null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get token from user_github_tokens table
    const { data: tokens, error } = await supabase
      .from('user_github_tokens')
      .select('encrypted_token')
      .limit(1);

    if (!error && tokens && tokens.length > 0) {
      const decrypted = await decryptToken(tokens[0].encrypted_token);
      return decrypted;
    }

    // Fallback to environment variable
    return process.env.GITHUB_TOKEN || null;
  } catch (error) {
    console.log('⚠️  Error getting token from Supabase:', error.message);
    return process.env.GITHUB_TOKEN || null;
  }
}

// Fetch all repositories from GitHub
async function fetchAllGitHubRepos(githubToken) {
  const repos = [];
  let page = 1;
  const perPage = 100;

  console.log('📡 Fetching repositories from GitHub...\n');

  while (true) {
    try {
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        params: {
          per_page: perPage,
          page: page,
          sort: 'updated',
          direction: 'desc',
        },
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        console.error(`❌ GitHub API error: ${response.status}`);
        if (response.data && response.data.message) {
          console.error(`   ${response.data.message}`);
        }
        break;
      }

      const pageRepos = response.data;
      if (pageRepos.length === 0) {
        break;
      }

      repos.push(...pageRepos);
      console.log(`   Fetched page ${page}: ${pageRepos.length} repos (total: ${repos.length})`);

      if (pageRepos.length < perPage) {
        break; // Last page
      }

      page++;
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error.message);
      break;
    }
  }

  return repos;
}

// Add repository to BEAST MODE
async function addRepoToBeastMode(repo, baseUrl) {
  try {
    const response = await axios.post(`${baseUrl}/api/beast-mode/enterprise/repos`, {
      url: repo.html_url,
      team: repo.private ? 'Private' : 'Public',
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
  const BASE_URL = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';

  console.log('🚀 Adding All GitHub Repositories to BEAST MODE\n');
  console.log(`🌐 API URL: ${BASE_URL}\n`);

  // Get GitHub token
  console.log('🔑 Getting GitHub token...');
  const githubToken = await getGitHubToken();

  if (!githubToken) {
    console.error('❌ No GitHub token found!');
    console.log('\n💡 Options:');
    console.log('   1. Set GITHUB_TOKEN environment variable');
    console.log('   2. Connect GitHub via: beast-mode repos connect');
    console.log('   3. Add token to Supabase user_github_tokens table\n');
    process.exit(1);
  }

  console.log('✅ GitHub token found\n');

  // Fetch all repos
  const githubRepos = await fetchAllGitHubRepos(githubToken);

  if (githubRepos.length === 0) {
    console.log('⚠️  No repositories found');
    process.exit(0);
  }

  console.log(`\n📦 Found ${githubRepos.length} repositories\n`);
  console.log('📥 Adding to BEAST MODE...\n');

  let addedCount = 0;
  let existsCount = 0;
  let errorCount = 0;

  // Add repos in batches to avoid overwhelming the server
  const batchSize = 5;
  for (let i = 0; i < githubRepos.length; i += batchSize) {
    const batch = githubRepos.slice(i, i + batchSize);
    
    const promises = batch.map(async (repo) => {
      const result = await addRepoToBeastMode(repo, BASE_URL);
      return { repo, result };
    });

    const results = await Promise.all(promises);

    for (const { repo, result } of results) {
      const repoName = repo.name.padEnd(30);
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

    // Small delay between batches
    if (i + batchSize < githubRepos.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Added: ${addedCount}`);
  console.log(`  ⚠️  Already exists: ${existsCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📦 Total: ${githubRepos.length}`);

  if (addedCount + existsCount === githubRepos.length) {
    console.log('\n✅ All repositories are now connected to BEAST MODE!');
  } else {
    console.log('\n⚠️  Some repositories could not be added. Check errors above.');
  }
}

main().catch(console.error);

