/**
 * Bitbucket Integration
 * 
 * Integration with Bitbucket for repository management
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('BitbucketIntegration');

class BitbucketIntegration {
  constructor() {
    this.connections = new Map(); // userId -> connection config
    this.pipelines = new Map(); // pipelineId -> pipeline data
  }

  /**
   * Connect Bitbucket account
   */
  connect(userId, config) {
    const connection = {
      userId,
      bitbucketUrl: config.bitbucketUrl || 'https://bitbucket.org',
      username: config.username,
      appPassword: config.appPassword,
      workspace: config.workspace,
      connectedAt: new Date().toISOString()
    };

    this.connections.set(userId, connection);
    log.info(`Bitbucket connected: ${userId} -> ${config.workspace}`);
    return connection;
  }

  /**
   * Create Bitbucket pipeline
   */
  createPipeline(repo, pipelineConfig) {
    const pipelineId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const pipeline = {
      id: pipelineId,
      repo,
      steps: pipelineConfig.steps || this.getDefaultSteps(),
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    this.pipelines.set(pipelineId, pipeline);
    log.info(`Pipeline created: ${pipelineId} for ${repo}`);
    return pipeline;
  }

  /**
   * Get default pipeline steps
   */
  getDefaultSteps() {
    return [
      {
        name: 'Install dependencies',
        script: ['npm install']
      },
      {
        name: 'Run quality check',
        script: [
          'npm run quality:check',
          'curl -X POST $BEAST_MODE_WEBHOOK -d @quality-report.json'
        ]
      },
      {
        name: 'Run tests',
        script: ['npm test']
      }
    ];
  }

  /**
   * Generate bitbucket-pipelines.yml
   */
  generatePipelineYAML(pipeline) {
    const yaml = `image: node:18

pipelines:
  default:
${pipeline.steps.map((step: any) => {
  return `    - step:
        name: ${step.name}
        script:
${step.script.map((s: string) => `          - ${s}`).join('\n')}`;
}).join('\n')}
`;

    return yaml;
  }

  /**
   * Track pipeline run
   */
  trackRun(pipelineId, runData) {
    const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const run = {
      id: runId,
      pipelineId,
      status: runData.status || 'running',
      steps: runData.steps || [],
      startedAt: new Date().toISOString(),
      completedAt: runData.completedAt || null,
      quality: runData.quality || null,
      ...runData
    };

    log.info(`Pipeline run tracked: ${runId} (${run.status})`);
    return run;
  }
}

// Singleton instance
let bitbucketInstance = null;

function getBitbucketIntegration() {
  if (!bitbucketInstance) {
    bitbucketInstance = new BitbucketIntegration();
  }
  return bitbucketInstance;
}

module.exports = {
  BitbucketIntegration,
  getBitbucketIntegration
};
