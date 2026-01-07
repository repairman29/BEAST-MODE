/**
 * CLI Session Tracker
 * 
 * Tracks CLI usage and sends to unified analytics API
 */

const axios = require('axios');
const os = require('os');
const path = require('path');

// Use unified config if available
let getUnifiedConfig = null;
try {
  const configPath = path.join(__dirname, '../../../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

// Helper function to get config value
function getConfigValue(key, defaultValue = null) {
  if (getUnifiedConfig) {
    try {
      const config = getUnifiedConfig();
      const value = config.get(key);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    } catch (error) {
      // Fallback to process.env
    }
  }
  // Fallback to process.env for backward compatibility
  return process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : defaultValue;
}

class CLISessionTracker {
  constructor() {
    this.sessionId = `cli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.startTime = Date.now();
    this.events = [];
    this.apiUrl = getConfigValue('BEAST_MODE_API_URL', 'https://beastmode.dev');
    this.userToken = null;
    this.githubUsername = null;
  }

  /**
   * Initialize session tracking
   */
  async initialize() {
    // Try to get user token from config
    try {
      const configPath = path.join(os.homedir(), '.beast-mode', 'config.json');
      const fs = require('fs-extra');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        this.userToken = config.token;
        this.githubUsername = config.githubUsername;
      }
    } catch (error) {
      // Config doesn't exist or can't be read - that's okay
    }

    // Track session start
    await this.track('session_start', {
      sessionId: this.sessionId,
      cliVersion: require('../../package.json').version,
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
    });
  }

  /**
   * Track a CLI event
   */
  async track(event, metadata = {}) {
    const eventData = {
      sessionId: this.sessionId,
      sessionType: 'cli',
      event,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
      },
      context: {
        command: process.argv[2] || 'unknown',
        cwd: process.cwd(),
      },
      githubUsername: this.githubUsername,
    };

    this.events.push(eventData);

    // Send to API (async, don't block)
    this.sendToAPI(eventData).catch(error => {
      // Silently fail - don't break CLI
      const debug = getConfigValue('DEBUG');
      if (debug) {
        console.error('Failed to track event:', error.message);
      }
    });
  }

  /**
   * Send event to unified analytics API
   */
  async sendToAPI(eventData) {
    try {
      const url = `${this.apiUrl}/api/beast-mode/sessions/track`;
      
      const response = await axios.post(url, eventData, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.userToken ? { 'Authorization': `Bearer ${this.userToken}` } : {}),
        },
        timeout: 2000, // 2 second timeout
      });

      const debug = getConfigValue('DEBUG');
      if (debug) {
        console.log('✅ Event tracked:', event);
      }
    } catch (error) {
      // Silently fail - analytics should not break CLI
      const debug = getConfigValue('DEBUG');
      if (debug) {
        console.error('Analytics error:', error.message);
      }
    }
  }

  /**
   * Track command execution
   */
  async trackCommand(command, args = {}, result = {}) {
    await this.track('command_executed', {
      command,
      args,
      success: result.success !== false,
      duration: result.duration,
      error: result.error,
    });
  }

  /**
   * Track scan operation
   */
  async trackScan(repo, result = {}) {
    await this.track('scan_executed', {
      repo,
      score: result.score,
      issues: result.issues,
      duration: result.duration,
    });
  }

  /**
   * Track fix application
   */
  async trackFix(fixType, result = {}) {
    await this.track('fix_applied', {
      fixType,
      success: result.success,
      filesModified: result.filesModified?.length || 0,
    });
  }

  /**
   * End session
   */
  async endSession() {
    const duration = Date.now() - this.startTime;
    await this.track('session_end', {
      duration,
      totalEvents: this.events.length,
      commandsExecuted: this.events.filter(e => e.event === 'command_executed').length,
    });
  }
}

// Singleton instance
let trackerInstance = null;

function getCLISessionTracker() {
  if (!trackerInstance) {
    trackerInstance = new CLISessionTracker();
  }
  return trackerInstance;
}

module.exports = {
  CLISessionTracker,
  getCLISessionTracker,
};



