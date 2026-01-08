/**
 * GitHub Actions Integration
 * 
 * Deep integration with GitHub Actions for CI/CD workflows
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('GitHubActions');

class GitHubActionsIntegration {
  constructor() {
    this.workflows = new Map(); // workflowId -> workflow config
    this.runs = new Map(); // runId -> run data
  }

  /**
   * Create GitHub Actions workflow
   */
  createWorkflow(repo, workflowConfig) {
    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const workflow = {
      id: workflowId,
      repo,
      name: workflowConfig.name || 'BEAST MODE Quality Check',
      on: workflowConfig.on || {
        push: { branches: ['main', 'master'] },
        pull_request: { branches: ['main', 'master'] }
      },
      jobs: workflowConfig.jobs || this.getDefaultJobs(),
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    this.workflows.set(workflowId, workflow);
    log.info(`Workflow created: ${workflowId} for ${repo}`);
    return workflow;
  }

  /**
   * Get default workflow jobs
   */
  getDefaultJobs() {
    return {
      'beast-mode-quality': {
        'runs-on': 'ubuntu-latest',
        steps: [
          {
            name: 'Checkout',
            uses: 'actions/checkout@v3'
          },
          {
            name: 'Run BEAST MODE Quality Check',
            uses: 'beast-mode/quality-action@v1',
            with: {
              'api-key': '${{ secrets.BEAST_MODE_API_KEY }}',
              'repo': '${{ github.repository }}'
            }
          },
          {
            name: 'Upload Quality Report',
            uses: 'actions/upload-artifact@v3',
            with: {
              name: 'quality-report',
              path: 'beast-mode-report.json'
            }
          }
        ]
      }
    };
  }

  /**
   * Generate workflow YAML
   */
  generateWorkflowYAML(workflow) {
    const yaml = `name: ${workflow.name}

on:
${this.formatYAMLObject(workflow.on, 2)}

jobs:
${this.formatYAMLObject(workflow.jobs, 2)}
`;

    return yaml;
  }

  /**
   * Format object as YAML
   */
  formatYAMLObject(obj, indent = 0) {
    const spaces = ' '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.formatYAMLObject(value, indent + 2);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n`;
            yaml += this.formatYAMLObject(item, indent + 4);
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  /**
   * Track workflow run
   */
  trackRun(workflowId, runData) {
    const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const run = {
      id: runId,
      workflowId,
      status: runData.status || 'running',
      conclusion: runData.conclusion || null,
      startedAt: new Date().toISOString(),
      completedAt: runData.completedAt || null,
      quality: runData.quality || null,
      issues: runData.issues || [],
      ...runData
    };

    this.runs.set(runId, run);
    log.info(`Workflow run tracked: ${runId} (${run.status})`);
    return run;
  }

  /**
   * Get workflow runs
   */
  getRuns(workflowId, filters = {}) {
    let runs = Array.from(this.runs.values())
      .filter(run => run.workflowId === workflowId);

    if (filters.status) {
      runs = runs.filter(run => run.status === filters.status);
    }

    if (filters.startDate) {
      runs = runs.filter(run => new Date(run.startedAt) >= new Date(filters.startDate));
    }

    runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    if (filters.limit) {
      runs = runs.slice(0, filters.limit);
    }

    return runs;
  }
}

// Singleton instance
let githubActionsInstance = null;

function getGitHubActionsIntegration() {
  if (!githubActionsInstance) {
    githubActionsInstance = new GitHubActionsIntegration();
  }
  return githubActionsInstance;
}

module.exports = {
  GitHubActionsIntegration,
  getGitHubActionsIntegration
};
