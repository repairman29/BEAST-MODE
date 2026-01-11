/**
 * Status Check Service
 * 
 * Handles creating and updating GitHub status checks
 */

const { getGitHubApp } = require('./githubApp');
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

const log = createLogger('StatusCheckService');

class StatusCheckService {
  constructor() {
    this.githubApp = getGitHubApp();
    this.qualityThreshold = parseInt(process.env.GITHUB_APP_QUALITY_THRESHOLD || '60');
  }

  /**
   * Format check run output
   */
  formatCheckOutput(analysis) {
    const { quality, issues, recommendations, issuesList = [] } = analysis;
    
    const title = `Quality Score: ${quality}/100`;
    
    let summary = '';
    if (quality >= this.qualityThreshold) {
      summary = `✅ Quality check passed. ${issues} issues found.`;
    } else {
      summary = `❌ Quality check failed. ${issues} issues found. Quality below threshold (${this.qualityThreshold}).`;
    }

    // Build detailed text
    let text = `## Quality Analysis\n\n`;
    text += `**Score:** ${quality}/100\n`;
    text += `**Status:** ${quality >= this.qualityThreshold ? '✅ Passed' : '❌ Failed'} (threshold: ${this.qualityThreshold})\n\n`;
    
    if (issues > 0) {
      text += `### Issues Found\n`;
      text += `- High Priority: ${issuesList.filter(i => i.priority === 'high').length}\n`;
      text += `- Medium Priority: ${issuesList.filter(i => i.priority === 'medium').length}\n`;
      text += `- Low Priority: ${issuesList.filter(i => i.priority === 'low').length}\n\n`;
    }

    if (recommendations && recommendations.length > 0) {
      text += `### Recommendations\n`;
      recommendations.slice(0, 5).forEach((rec, idx) => {
        text += `${idx + 1}. ${rec.title || rec.message || rec.description}\n`;
      });
      text += '\n';
    }

    const repo = analysis.repo || 'owner/repo';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beast-mode.dev';
    text += `[View Full Report](${baseUrl}/quality?repo=${encodeURIComponent(repo)})\n`;

    return {
      title,
      summary,
      text
    };
  }

  /**
   * Create annotations from issues
   */
  formatAnnotations(issuesList) {
    const annotations = [];
    const highPriorityIssues = issuesList
      .filter(i => i.priority === 'high' || i.priority === 'critical')
      .slice(0, 50); // GitHub limit is 50 annotations

    for (const issue of highPriorityIssues) {
      const file = issue.file || issue.path;
      if (!file) continue;

      const startLine = issue.line || issue.start_line || 1;
      const endLine = issue.end_line || issue.start_line || startLine;

      annotations.push({
        path: file,
        start_line: startLine,
        end_line: endLine,
        annotation_level: issue.priority === 'critical' ? 'failure' : 'warning',
        message: issue.title || issue.message || issue.description || 'Quality issue found',
        title: issue.title || 'Quality Issue'
      });
    }

    return annotations;
  }

  /**
   * Create or update status check
   */
  async createOrUpdateCheck(repo, sha, analysis) {
    if (!this.githubApp.isConfigured()) {
      throw new Error('GitHub App not configured');
    }

    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      throw new Error(`Invalid repo format: ${repo}. Expected: owner/repo`);
    }

    try {
      // Get authenticated Octokit instance
      const octokit = await this.githubApp.getOctokitForRepo(owner, repoName);

      const output = this.formatCheckOutput({
        ...analysis,
        repo
      });

      const annotations = this.formatAnnotations(analysis.issuesList || []);

      const conclusion = analysis.quality >= this.qualityThreshold ? 'success' : 'failure';

      // Check if check run already exists
      const checkRunName = 'BEAST MODE Quality Check';
      
      try {
        // Try to find existing check run
        const { data: checkRuns } = await octokit.rest.checks.listForRef({
          owner,
          repo: repoName,
          ref: sha,
          check_name: checkRunName
        });

        const existingCheck = checkRuns.check_runs.find(
          run => run.name === checkRunName && run.status !== 'completed'
        );

        if (existingCheck) {
          // Update existing check run
          log.info(`Updating existing check run for ${repo}@${sha}`);
          const { data: checkRun } = await octokit.rest.checks.update({
            owner,
            repo: repoName,
            check_run_id: existingCheck.id,
            status: 'completed',
            conclusion,
            output,
            annotations: annotations.slice(0, 50) // GitHub limit
          });
          return { updated: true, checkRunId: checkRun.id };
        }
      } catch (error) {
        // If check doesn't exist, we'll create a new one
        log.info(`No existing check run found, creating new one`);
      }

      // Create new check run
      log.info(`Creating new check run for ${repo}@${sha}`);
      const { data: checkRun } = await octokit.rest.checks.create({
        owner,
        repo: repoName,
        name: checkRunName,
        head_sha: sha,
        status: 'completed',
        conclusion,
        output,
        annotations: annotations.slice(0, 50) // GitHub limit
      });

      return { created: true, checkRunId: checkRun.id };
    } catch (error) {
      log.error(`Failed to create/update status check: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create in-progress check run
   */
  async createInProgressCheck(repo, sha) {
    if (!this.githubApp.isConfigured()) {
      throw new Error('GitHub App not configured');
    }

    const [owner, repoName] = repo.split('/');
    
    try {
      const octokit = await this.githubApp.getOctokitForRepo(owner, repoName);

      const { data: checkRun } = await octokit.rest.checks.create({
        owner,
        repo: repoName,
        name: 'BEAST MODE Quality Check',
        head_sha: sha,
        status: 'in_progress',
        output: {
          title: 'Analyzing code quality...',
          summary: 'BEAST MODE is analyzing your code quality.'
        }
      });

      return checkRun.id;
    } catch (error) {
      log.error(`Failed to create in-progress check: ${error.message}`);
      throw error;
    }
  }
}

// Singleton instance
let statusCheckServiceInstance = null;

function getStatusCheckService() {
  if (!statusCheckServiceInstance) {
    statusCheckServiceInstance = new StatusCheckService();
  }
  return statusCheckServiceInstance;
}

module.exports = {
  StatusCheckService,
  getStatusCheckService
};
