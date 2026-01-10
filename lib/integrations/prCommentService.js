/**
 * PR Comment Service
 * 
 * Handles posting quality comments to GitHub Pull Requests
 */

const { getGitHubApp } = require('./githubApp');
const { createLogger } = require('../utils/logger');

const log = createLogger('PRCommentService');

class PRCommentService {
  constructor() {
    this.githubApp = getGitHubApp();
  }

  /**
   * Format quality comment for PR
   */
  formatQualityComment(analysis) {
    const { quality, issues, recommendations, issuesList = [] } = analysis;
    
    // Determine emoji based on quality score
    let qualityEmoji = '⭐';
    if (quality >= 80) qualityEmoji = '🟢';
    else if (quality >= 60) qualityEmoji = '🟡';
    else if (quality >= 40) qualityEmoji = '🟠';
    else qualityEmoji = '🔴';

    // Group issues by priority
    const highPriority = issuesList.filter(i => i.priority === 'high' || i.priority === 'critical');
    const mediumPriority = issuesList.filter(i => i.priority === 'medium');
    const lowPriority = issuesList.filter(i => i.priority === 'low');

    let comment = `## ${qualityEmoji} BEAST MODE Quality Check\n\n`;
    comment += `**Quality Score:** ${quality}/100\n\n`;

    // Quality trend (if available)
    if (analysis.previousQuality) {
      const change = quality - analysis.previousQuality;
      const changeEmoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
      comment += `### ${changeEmoji} Quality Trend\n`;
      comment += `- Previous: ${analysis.previousQuality}/100\n`;
      comment += `- Current: ${quality}/100\n`;
      comment += `- Change: ${change > 0 ? '+' : ''}${change} points ${change > 0 ? '✅' : change < 0 ? '⚠️' : ''}\n\n`;
    }

    // Issues breakdown
    comment += `### 🔍 Issues Found: ${issues}\n`;
    
    if (highPriority.length > 0) {
      comment += `- 🔴 **High Priority:** ${highPriority.length}\n`;
      highPriority.slice(0, 5).forEach(issue => {
        const file = issue.file || issue.path || 'Unknown file';
        const line = issue.line || issue.start_line || '';
        comment += `  - ${issue.title || issue.message} in \`${file}${line ? ':' + line : ''}\`\n`;
      });
      if (highPriority.length > 5) {
        comment += `  - ... and ${highPriority.length - 5} more\n`;
      }
    }
    
    if (mediumPriority.length > 0) {
      comment += `- 🟡 **Medium Priority:** ${mediumPriority.length}\n`;
    }
    
    if (lowPriority.length > 0) {
      comment += `- 🟢 **Low Priority:** ${lowPriority.length}\n`;
    }

    comment += '\n';

    // Top recommendations
    if (recommendations && recommendations.length > 0) {
      comment += `### 💡 Top Recommendations:\n`;
      recommendations.slice(0, 5).forEach((rec, idx) => {
        comment += `${idx + 1}. ${rec.title || rec.message || rec.description}\n`;
      });
      comment += '\n';
    }

    // Quick actions
    const repo = analysis.repo || 'owner/repo';
    const prNumber = analysis.prNumber || '';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beast-mode.dev';
    
    comment += `### 🚀 Quick Actions:\n`;
    comment += `- [View Full Report](${baseUrl}/quality?repo=${encodeURIComponent(repo)}${prNumber ? '&pr=' + prNumber : ''})\n`;
    comment += `- [Fix Issues Automatically](${baseUrl}/dashboard?action=fix&repo=${encodeURIComponent(repo)}${prNumber ? '&pr=' + prNumber : ''})\n`;
    comment += `- [Ask Questions](${baseUrl}/dashboard?view=intelligence&repo=${encodeURIComponent(repo)})\n`;
    comment += '\n';
    comment += `---\n`;
    comment += `*Updated: ${new Date().toUTCString()} | BEAST MODE v1.0.0*\n`;

    return comment;
  }

  /**
   * Find existing BEAST MODE comment on PR
   */
  async findExistingComment(octokit, owner, repo, prNumber) {
    try {
      const { data: comments } = await octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: prNumber,
      });

      // Find comment that starts with "## BEAST MODE Quality Check"
      const beastModeComment = comments.find(comment => 
        comment.body && comment.body.includes('##') && comment.body.includes('BEAST MODE Quality Check')
      );

      return beastModeComment || null;
    } catch (error) {
      log.error(`Failed to find existing comment: ${error.message}`);
      return null;
    }
  }

  /**
   * Post or update PR comment
   */
  async postPRComment(repo, prNumber, analysis) {
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

      // Format comment
      const commentBody = this.formatQualityComment({
        ...analysis,
        repo,
        prNumber
      });

      // Check for existing comment
      const existingComment = await this.findExistingComment(octokit, owner, repoName, prNumber);

      if (existingComment) {
        // Update existing comment
        log.info(`Updating existing comment on PR #${prNumber}`);
        await octokit.rest.issues.updateComment({
          owner,
          repo: repoName,
          comment_id: existingComment.id,
          body: commentBody
        });
        return { updated: true, commentId: existingComment.id };
      } else {
        // Create new comment
        log.info(`Creating new comment on PR #${prNumber}`);
        const { data: comment } = await octokit.rest.issues.createComment({
          owner,
          repo: repoName,
          issue_number: prNumber,
          body: commentBody
        });
        return { created: true, commentId: comment.id };
      }
    } catch (error) {
      log.error(`Failed to post PR comment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete PR comment (if needed)
   */
  async deletePRComment(repo, prNumber) {
    if (!this.githubApp.isConfigured()) {
      throw new Error('GitHub App not configured');
    }

    const [owner, repoName] = repo.split('/');
    
    try {
      const octokit = await this.githubApp.getOctokitForRepo(owner, repoName);
      const existingComment = await this.findExistingComment(octokit, owner, repoName, prNumber);

      if (existingComment) {
        await octokit.rest.issues.deleteComment({
          owner,
          repo: repoName,
          comment_id: existingComment.id
        });
        return true;
      }
      return false;
    } catch (error) {
      log.error(`Failed to delete PR comment: ${error.message}`);
      throw error;
    }
  }
}

// Singleton instance
let prCommentServiceInstance = null;

function getPRCommentService() {
  if (!prCommentServiceInstance) {
    prCommentServiceInstance = new PRCommentService();
  }
  return prCommentServiceInstance;
}

module.exports = {
  PRCommentService,
  getPRCommentService
};
