/**
 * BEAST MODE GitHub Actions Integration
 * 
 * Provides utilities for integrating BEAST MODE with GitHub Actions CI/CD
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
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

class GitHubActionsIntegration {
  constructor(options = {}) {
    this.options = {
      minScore: options.minScore || 80,
      failOnLowScore: options.failOnLowScore !== false,
      commentOnPR: options.commentOnPR !== false,
      ...options
    };
  }

  /**
   * Run quality check in GitHub Actions environment
   */
  async runQualityCheck() {
    try {
      // Check if we're in GitHub Actions
      const githubActions = getConfigValue('GITHUB_ACTIONS');
      if (!githubActions) {
        throw new Error('Not running in GitHub Actions environment');
      }

      const { calculateScore } = require('../quality');
      const qualityEngine = new (require('../quality').QualityEngine)();
      
      // Get changed files in PR
      const changedFiles = await this.getChangedFiles();
      
      // Run quality analysis
      const results = await qualityEngine.calculateScore({
        files: changedFiles,
        includeRecommendations: true,
        format: 'json'
      });

      // Post results
      const eventName = getConfigValue('GITHUB_EVENT_NAME');
      if (this.options.commentOnPR && eventName === 'pull_request') {
        await this.postPRComment(results);
      }

      // Set GitHub Actions outputs
      this.setOutputs(results);

      // Fail if score is too low
      if (this.options.failOnLowScore && results.score < this.options.minScore) {
        process.exit(1);
      }

      return results;
    } catch (error) {
      console.error('GitHub Actions integration error:', error);
      throw error;
    }
  }

  /**
   * Get changed files in PR or push
   */
  async getChangedFiles() {
    try {
      const eventName = getConfigValue('GITHUB_EVENT_NAME');
      const eventPath = getConfigValue('GITHUB_EVENT_PATH');

      if (!eventPath) {
        return [];
      }

      const eventData = JSON.parse(await fs.readFile(eventPath, 'utf8'));
      
      if (eventName === 'pull_request') {
        const files = eventData.pull_request?.files || [];
        return files.map(f => f.filename);
      } else if (eventName === 'push') {
        // Get changed files from git diff
        const base = eventData.before || 'HEAD~1';
        const head = eventData.after || 'HEAD';
        const output = execSync(`git diff --name-only ${base} ${head}`, {
          encoding: 'utf8'
        });
        return output.trim().split('\n').filter(Boolean);
      }

      return [];
    } catch (error) {
      console.error('Error getting changed files:', error);
      return [];
    }
  }

  /**
   * Post comment to PR
   */
  async postPRComment(results) {
    try {
      const eventPath = getConfigValue('GITHUB_EVENT_PATH');
      if (!eventPath) {
        return;
      }

      const eventData = JSON.parse(await fs.readFile(eventPath, 'utf8'));
      const prNumber = eventData.pull_request?.number;
      const repo = getConfigValue('GITHUB_REPOSITORY');

      if (!prNumber || !repo) {
        return;
      }

      const [owner, repoName] = repo.split('/');
      
      const comment = this.formatPRComment(results);
      
      // Use GitHub CLI or API to post comment
      // This would typically use @actions/github-script in workflow
      console.log('PR Comment:', comment);
      console.log(`Would post to PR #${prNumber} in ${owner}/${repoName}`);
      
    } catch (error) {
      console.error('Error posting PR comment:', error);
    }
  }

  /**
   * Format PR comment
   */
  formatPRComment(results) {
    const { score, issues = [], recommendations = [] } = results;
    const passed = score >= this.options.minScore;
    const status = passed ? '✅ PASSED' : '⚠️ NEEDS ATTENTION';
    const emoji = passed ? '🎉' : '🔍';

    let comment = `## ${emoji} BEAST MODE Quality Check ${status}\n\n`;
    comment += `**Quality Score:** ${score}/100\n`;
    comment += `**Issues Found:** ${issues.length}\n\n`;

    if (issues.length > 0) {
      comment += `### Issues\n\n`;
      issues.slice(0, 10).forEach((issue, idx) => {
        comment += `${idx + 1}. **${issue.type}**: ${issue.message}\n`;
        if (issue.file) {
          comment += `   - \`${issue.file}\`\n`;
        }
      });
      if (issues.length > 10) {
        comment += `\n*...and ${issues.length - 10} more issues*\n`;
      }
    }

    if (recommendations.length > 0) {
      comment += `\n### Recommendations\n\n`;
      recommendations.slice(0, 5).forEach((rec, idx) => {
        comment += `${idx + 1}. ${rec}\n`;
      });
    }

    comment += `\n---\n*Powered by [BEAST MODE](https://beast-mode.dev)*`;

    return comment;
  }

  /**
   * Set GitHub Actions outputs
   */
  setOutputs(results) {
    const outputFile = getConfigValue('GITHUB_OUTPUT');
    if (!outputFile) {
      return;
    }

    const outputs = [
      `score=${results.score}`,
      `issues=${results.issues?.length || 0}`,
      `passed=${results.score >= this.options.minScore}`,
      `recommendations=${results.recommendations?.length || 0}`
    ].join('\n');

    fs.appendFile(outputFile, outputs, 'utf8').catch(err => {
      console.error('Error setting outputs:', err);
    });
  }

  /**
   * Generate workflow file
   */
  static generateWorkflow(options = {}) {
    const minScore = options.minScore || 80;
    const workflowName = options.name || 'beast-mode-quality-check';
    
    return `name: ${workflowName}

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx @beast-mode/core quality --min-score ${minScore}
        continue-on-error: false
`;
  }
}

module.exports = GitHubActionsIntegration;

