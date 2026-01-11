/**
 * GitHub App Integration
 * 
 * Handles GitHub App authentication, webhook processing, and API interactions
 */

const { App } = require('@octokit/app');
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

const log = createLogger('GitHubApp');

class GitHubAppClient {
  constructor() {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;

    if (!appId || !privateKey || !webhookSecret) {
      log.warn('GitHub App credentials not configured. Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_APP_WEBHOOK_SECRET');
      this.app = null;
      return;
    }

    try {
      this.app = new App({
        appId,
        privateKey: privateKey.replace(/\\n/g, '\n'), // Handle newlines in env vars
        webhooks: {
          secret: webhookSecret
        }
      });
      log.info('GitHub App client initialized');
    } catch (error) {
      log.error('Failed to initialize GitHub App:', error);
      this.app = null;
    }
  }

  /**
   * Get installation token for a specific installation
   */
  async getInstallationToken(installationId) {
    if (!this.app) {
      throw new Error('GitHub App not configured');
    }

    try {
      const octokit = await this.app.getInstallationOctokit(installationId);
      return octokit;
    } catch (error) {
      log.error(`Failed to get installation token for ${installationId}:`, error);
      throw error;
    }
  }

  /**
   * Get installation ID for a repository
   */
  async getInstallationId(owner, repo) {
    if (!this.app) {
      throw new Error('GitHub App not configured');
    }

    try {
      const { data: installation } = await this.app.octokit.apps.getRepoInstallation({
        owner,
        repo
      });
      return installation.id;
    } catch (error) {
      log.error(`Failed to get installation ID for ${owner}/${repo}:`, error);
      throw error;
    }
  }

  /**
   * Get authenticated Octokit instance for a repository
   */
  async getOctokitForRepo(owner, repo) {
    const installationId = await this.getInstallationId(owner, repo);
    return await this.getInstallationToken(installationId);
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload, signature) {
    if (!this.app) {
      return false;
    }

    try {
      return this.app.webhooks.verify(payload, signature);
    } catch (error) {
      log.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Check if GitHub App is configured
   */
  isConfigured() {
    return this.app !== null;
  }
}

// Singleton instance
let githubAppInstance = null;

function getGitHubApp() {
  if (!githubAppInstance) {
    githubAppInstance = new GitHubAppClient();
  }
  return githubAppInstance;
}

module.exports = {
  GitHubAppClient,
  getGitHubApp
};
