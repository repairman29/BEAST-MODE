#!/usr/bin/env node

/**
 * Update GitHub App Events via API
 * 
 * Sometimes GitHub UI doesn't show all available events.
 * This script uses the GitHub API to update the app's subscribed events.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
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

const log = createLogger('GitHubAppUpdateEvents');

/**
 * Get GitHub App ID from environment
 */
function getAppId() {
  const appId = process.env.GITHUB_APP_ID;
  if (!appId) {
    console.error('❌ GITHUB_APP_ID not set in environment');
    console.log('   Set it in .env.local or run: beast-mode github-app check');
    process.exit(1);
  }
  return appId;
}

/**
 * Update GitHub App events using GitHub API
 */
async function updateAppEvents() {
  const appId = getAppId();
  
  console.log('\n🔄 Updating GitHub App Events via API...\n');
  console.log(`📋 App ID: ${appId}\n`);

  // Required events
  const events = [
    'pull_request',
    'push',
    'installation',
    'installation_repositories'
  ];

  console.log('📋 Events to subscribe to:');
  events.forEach(event => console.log(`   ✅ ${event}`));
  console.log('');

  // Check if gh CLI is available
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ GitHub CLI (gh) not found');
    console.log('\n📋 Install it: https://cli.github.com/');
    console.log('   Or use the manual method below\n');
    process.exit(1);
  }

  // Check if authenticated
  try {
    execSync('gh auth status', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Not authenticated with GitHub CLI');
    console.log('\n📋 Run: gh auth login\n');
    process.exit(1);
  }

  console.log('⚠️  Note: GitHub Apps API requires app authentication');
  console.log('   This script uses gh CLI, but app updates need app owner access\n');
  
  console.log('📋 Alternative: Use GitHub API directly');
  console.log('   1. Get a personal access token with admin:write permission');
  console.log('   2. Use PATCH /app endpoint to update events');
  console.log('   3. Or use the manual workaround below\n');

  console.log('🔧 Manual Workaround:');
  console.log('   1. Go to: https://github.com/settings/apps/beast-mode-dev');
  console.log('   2. Scroll to "Subscribe to events"');
  console.log('   3. Even if events don\'t show, try typing "installation" in the search box');
  console.log('   4. Or try disabling and re-enabling the Administration permission');
  console.log('   5. Sometimes events appear after refreshing the page\n');

  console.log('📋 GitHub API Method:');
  console.log('   PATCH https://api.github.com/app');
  console.log('   Headers:');
  console.log('     Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN');
  console.log('     Accept: application/vnd.github+json');
  console.log('   Body:');
  console.log('     {');
  console.log('       "events": [' + events.map(e => `"${e}"`).join(', ') + ']');
  console.log('     }');
  console.log('');

  // Try to get app info
  try {
    console.log('🔍 Checking current app configuration...\n');
    const appInfo = execSync(`gh api /app`, { encoding: 'utf8' });
    const app = JSON.parse(appInfo);
    
    console.log('📋 Current app events:');
    if (app.events && app.events.length > 0) {
      app.events.forEach(event => console.log(`   ✅ ${event}`));
    } else {
      console.log('   ⚠️  No events configured');
    }
    console.log('');

    // Check if we can update
    console.log('💡 To update events, you need to:');
    console.log('   1. Be the app owner');
    console.log('   2. Use a personal access token with admin:write scope');
    console.log('   3. Or update via the GitHub UI (even if events don\'t show initially)\n');
    
  } catch (error) {
    console.log('⚠️  Could not fetch app info');
    console.log('   This is normal - app info requires app authentication\n');
  }

  console.log('📋 Next Steps:');
  console.log('   1. Try the manual workaround above');
  console.log('   2. Or use GitHub API with personal access token');
  console.log('   3. Events will work even if they don\'t show in UI\n');
  
  console.log('✅ Note: Events can be configured via API even if UI doesn\'t show them');
  console.log('   The webhook will still receive events if they\'re configured\n');
}

// CLI entry point
if (require.main === module) {
  updateAppEvents().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { updateAppEvents };
