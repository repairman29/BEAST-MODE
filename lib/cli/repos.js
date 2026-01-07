#!/usr/bin/env node

/**
 * BEAST MODE Repository Management CLI
 * 
 * Manage GitHub repository connections via CLI
 */

const chalk = require('chalk').default || require('chalk');
let ora;
try {
  ora = require('ora');
  if (typeof ora !== 'function' && ora.default) {
    ora = ora.default;
  }
} catch (error) {
  ora = () => ({ start: () => ({ stop: () => {}, succeed: () => {}, fail: () => {} }) });
}
let open;
try {
  open = require('open');
} catch (error) {
  // Fallback if open not available
  open = null;
}
const readline = require('readline');
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

// Use unified config if available
let getUnifiedConfig = null;
try {
  const configPath = path.join(__dirname, '../../shared-utils/unified-config');
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

// Get BEAST MODE API base URL
async function getBaseUrl() {
  const url = await getConfigValue('NEXT_PUBLIC_URL', null) ||
              await getConfigValue('NEXT_PUBLIC_APP_URL', null) ||
              await getConfigValue('BEAST_MODE_API_URL', null) ||
              'http://localhost:3000';
  return url.replace(/\/$/, ''); // Remove trailing slash
}

// Get user ID from config or prompt
async function getUserId() {
  const configPath = path.join(require('os').homedir(), '.beast-mode', 'config.json');
  if (fs.existsSync(configPath)) {
    const config = await fs.readJson(configPath);
    if (config.userId) {
      return config.userId;
    }
  }
  return null;
}

/**
 * Check GitHub connection status
 */
async function checkConnection() {
  const spinner = ora('Checking GitHub connection...').start();
  try {
    const baseUrl = await getBaseUrl();
    const response = await axios.get(`${baseUrl}/api/github/token`, {
      validateStatus: () => true, // Don't throw on any status
    });

    spinner.stop();

    if (response.status === 200 && response.data.connected) {
      console.log(chalk.green('✅ GitHub Connected'));
      console.log(chalk.white(`   Username: ${response.data.githubUsername || 'Unknown'}`));
      console.log(chalk.white(`   Connected at: ${response.data.connectedAt || 'Unknown'}`));
      return { connected: true, data: response.data };
    } else {
      console.log(chalk.yellow('⚠️  GitHub Not Connected'));
      console.log(chalk.white('   Run "beast-mode repos connect" to connect your GitHub account'));
      return { connected: false };
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('❌ Error checking connection:'), error.message);
    return { connected: false, error: error.message };
  }
}

/**
 * Connect GitHub account via OAuth
 */
async function connect() {
  console.log(chalk.cyan('\n🔗 Connecting GitHub Account to BEAST MODE\n'));

  try {
    const baseUrl = await getBaseUrl();
    const userId = await getUserId();

    // Generate state for OAuth
    const crypto = require('crypto');
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state temporarily (for verification)
    const configDir = path.join(require('os').homedir(), '.beast-mode');
    await fs.ensureDir(configDir);
    await fs.writeJson(path.join(configDir, 'github-oauth-state.json'), {
      state,
      timestamp: Date.now(),
    });

    // Build OAuth URL
    const clientId = await getConfigValue('GITHUB_CLIENT_ID', 'Ov23lidLvmp68FVMEqEB');
    const redirectUri = `${baseUrl}/api/github/oauth/callback`;
    const scope = 'repo read:user user:email';
    
    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;

    console.log(chalk.white('📋 OAuth Flow:'));
    console.log(chalk.white('   1. Opening browser for GitHub authorization...'));
    console.log(chalk.white('   2. Authorize BEAST MODE to access your repositories'));
    console.log(chalk.white('   3. You will be redirected back to BEAST MODE'));
    console.log(chalk.white('   4. The connection will be saved automatically\n'));

    // Open browser
    console.log(chalk.cyan('🌐 Opening browser...'));
    if (open) {
      await open(authUrl);
    } else {
      console.log(chalk.yellow('⚠️  Browser opening not available'));
      console.log(chalk.white('\n📋 Please visit this URL manually:'));
      console.log(chalk.cyan(`   ${authUrl}\n`));
    }

    console.log(chalk.green('\n✅ Browser opened!'));
    console.log(chalk.white('\n📝 Next steps:'));
    console.log(chalk.white('   1. Authorize BEAST MODE in the browser'));
    console.log(chalk.white('   2. You will be redirected to BEAST MODE dashboard'));
    console.log(chalk.white('   3. Run "beast-mode repos status" to verify connection\n'));

    // Wait a bit and check if connection succeeded
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise(resolve => {
      rl.question(chalk.yellow('Press Enter after you\'ve authorized in the browser... '), resolve);
    });
    rl.close();

    // Check connection status
    console.log(chalk.cyan('\n🔍 Verifying connection...\n'));
    const status = await checkConnection();
    
    if (status.connected) {
      console.log(chalk.green('\n✅ GitHub account connected successfully!\n'));
    } else {
      console.log(chalk.yellow('\n⚠️  Connection not detected yet.'));
      console.log(chalk.white('   This may take a few moments. Run "beast-mode repos status" to check again.\n'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error connecting GitHub:'), error.message);
    if (error.code === 'ENOENT' || error.message.includes('open')) {
      console.log(chalk.yellow('\n💡 Tip: If browser didn\'t open, visit this URL manually:'));
      console.log(chalk.white(`   ${authUrl}\n`));
    }
  }
}

/**
 * List connected repositories
 */
async function list() {
  const spinner = ora('Fetching repositories...').start();
  try {
    const baseUrl = await getBaseUrl();
    
    // First check connection
    const connectionStatus = await axios.get(`${baseUrl}/api/github/token`, {
      validateStatus: () => true,
    });

    if (!connectionStatus.data.connected) {
      spinner.stop();
      console.log(chalk.yellow('⚠️  GitHub not connected'));
      console.log(chalk.white('   Run "beast-mode repos connect" first\n'));
      return;
    }

    // Fetch repositories
    const response = await axios.get(`${baseUrl}/api/github/repos`, {
      validateStatus: () => true,
    });

    spinner.stop();

    if (response.status === 200 && response.data.connected && response.data.repos) {
      const repos = response.data.repos;
      
      if (repos.length === 0) {
        console.log(chalk.yellow('⚠️  No repositories found'));
        console.log(chalk.white('   Make sure you have repositories in your GitHub account\n'));
        return;
      }

      console.log(chalk.green(`\n✅ Found ${repos.length} repositories:\n`));
      
      repos.forEach((repo, index) => {
        const isPrivate = repo.private ? chalk.red('🔒 Private') : chalk.green('🌐 Public');
        console.log(chalk.white(`${index + 1}. ${chalk.bold(repo.fullName || repo.name)}`));
        console.log(chalk.gray(`   ${repo.description || 'No description'}`));
        console.log(chalk.gray(`   ${isPrivate} • ${repo.language || 'Unknown'} • ⭐ ${repo.stars || 0} • 🍴 ${repo.forks || 0}`));
        console.log(chalk.gray(`   ${repo.url || ''}\n`));
      });

      // Also check enterprise repos
      const enterpriseResponse = await axios.get(`${baseUrl}/api/beast-mode/enterprise/repos`, {
        validateStatus: () => true,
      });

      if (enterpriseResponse.status === 200 && enterpriseResponse.data.repos && enterpriseResponse.data.repos.length > 0) {
        console.log(chalk.cyan(`\n📦 Enterprise Repositories (${enterpriseResponse.data.repos.length}):\n`));
        enterpriseResponse.data.repos.forEach((repo, index) => {
          console.log(chalk.white(`${index + 1}. ${chalk.bold(repo.name)}`));
          console.log(chalk.gray(`   ${repo.url || ''}`));
          console.log(chalk.gray(`   Team: ${repo.team || 'No team'} • Last scan: ${repo.lastScan || 'Never'}\n`));
        });
      }

    } else {
      console.log(chalk.yellow('⚠️  Could not fetch repositories'));
      console.log(chalk.white(`   Status: ${response.status}`));
      if (response.data.error) {
        console.log(chalk.white(`   Error: ${response.data.error}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('❌ Error listing repositories:'), error.message);
    if (error.response) {
      console.log(chalk.white(`   Status: ${error.response.status}`));
      console.log(chalk.white(`   Response: ${JSON.stringify(error.response.data, null, 2)}\n`));
    }
  }
}

/**
 * Add repository manually
 */
async function add(repoUrl, options = {}) {
  if (!repoUrl) {
    console.log(chalk.yellow('⚠️  Repository URL required'));
    console.log(chalk.white('   Usage: beast-mode repos add <url> [--team <team>]\n'));
    return;
  }

  const spinner = ora(`Adding repository: ${repoUrl}...`).start();
  try {
    const baseUrl = await getBaseUrl();
    const team = options.team || '';

    const response = await axios.post(`${baseUrl}/api/beast-mode/enterprise/repos`, {
      url: repoUrl,
      team: team,
    }, {
      validateStatus: () => true,
    });

    spinner.stop();

    if (response.status === 201) {
      console.log(chalk.green(`\n✅ Repository added successfully!`));
      console.log(chalk.white(`   Name: ${response.data.repo.name}`));
      console.log(chalk.white(`   URL: ${response.data.repo.url}`));
      if (team) {
        console.log(chalk.white(`   Team: ${team}\n`));
      }
    } else if (response.status === 409) {
      console.log(chalk.yellow(`\n⚠️  Repository already exists\n`));
    } else {
      console.log(chalk.red(`\n❌ Failed to add repository`));
      console.log(chalk.white(`   Status: ${response.status}`));
      if (response.data.error) {
        console.log(chalk.white(`   Error: ${response.data.error}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('❌ Error adding repository:'), error.message);
    if (error.response) {
      console.log(chalk.white(`   Status: ${error.response.status}`));
      console.log(chalk.white(`   Response: ${JSON.stringify(error.response.data, null, 2)}\n`));
    }
  }
}

/**
 * Remove repository
 */
async function remove(repoId) {
  if (!repoId) {
    console.log(chalk.yellow('⚠️  Repository ID required'));
    console.log(chalk.white('   Usage: beast-mode repos remove <id>'));
    console.log(chalk.white('   Get ID from: beast-mode repos list\n'));
    return;
  }

  const spinner = ora(`Removing repository...`).start();
  try {
    const baseUrl = await getBaseUrl();

    const response = await axios.delete(`${baseUrl}/api/beast-mode/enterprise/repos?id=${repoId}`, {
      validateStatus: () => true,
    });

    spinner.stop();

    if (response.status === 200) {
      console.log(chalk.green(`\n✅ Repository removed successfully!\n`));
    } else {
      console.log(chalk.red(`\n❌ Failed to remove repository`));
      console.log(chalk.white(`   Status: ${response.status}`));
      if (response.data.error) {
        console.log(chalk.white(`   Error: ${response.data.error}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('❌ Error removing repository:'), error.message);
    if (error.response) {
      console.log(chalk.white(`   Status: ${error.response.status}`));
      console.log(chalk.white(`   Response: ${JSON.stringify(error.response.data, null, 2)}\n`));
    }
  }
}

/**
 * Disconnect GitHub account
 */
async function disconnect() {
  const spinner = ora('Disconnecting GitHub account...').start();
  try {
    const baseUrl = await getBaseUrl();

    const response = await axios.delete(`${baseUrl}/api/github/token`, {
      validateStatus: () => true,
    });

    spinner.stop();

    if (response.status === 200) {
      console.log(chalk.green('\n✅ GitHub account disconnected successfully!\n'));
    } else {
      console.log(chalk.yellow('\n⚠️  Could not disconnect'));
      console.log(chalk.white(`   Status: ${response.status}`));
      if (response.data.error) {
        console.log(chalk.white(`   Error: ${response.data.error}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('❌ Error disconnecting:'), error.message);
    if (error.response) {
      console.log(chalk.white(`   Status: ${error.response.status}\n`));
    }
  }
}

module.exports = {
  checkConnection,
  connect,
  list,
  add,
  remove,
  disconnect,
};

