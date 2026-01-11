/**
 * BEAST MODE - Daisy Chain Integration
 * 
 * Uses BEAST MODE's code generation to help Daisy Chain create better workflows
 */

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
const log = createLogger('BeastModeDaisyChainIntegration');

class BeastModeDaisyChainIntegration {
  constructor() {
    this.featureGenerator = null;
    this.initialized = false;
  }

  /**
   * Initialize dependencies
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Lazy load to avoid circular dependencies
      this.featureGenerator = require('../mlops/featureGenerator');

      this.initialized = true;
      log.info('✅ BEAST MODE - Daisy Chain integration initialized');
    } catch (error) {
      log.error('Failed to initialize integration:', error);
      throw error;
    }
  }

  /**
   * Generate workflow code using BEAST MODE's feature generation
   */
  async generateWorkflowCode(workflowDescription, context = {}) {
    await this.initialize();

    const {
      repo = 'daisy-chain',
      model = 'custom:beast-mode-code-model',
      userId = 'daisy-chain',
      useLLM = true,
      qualityThreshold = 0.8
    } = context;

    log.info(`⚙️  Generating workflow code: ${workflowDescription.substring(0, 50)}...`);

    try {
      // Use BEAST MODE's feature generator to create workflow code
      const workflow = await this.featureGenerator.generateFeature(
        repo,
        workflowDescription,
        null, // files - will be auto-discovered
        {
          model,
          customModelId: model.replace('custom:', ''),
          userId,
          useLLM,
          qualityThreshold
        }
      );

      // Validate workflow
      const validation = await this.validateWorkflow(workflow);

      return {
        success: true,
        workflow: workflow.code || workflow,
        validation,
        source: 'beast-mode-enhanced'
      };
    } catch (error) {
      log.error('Failed to generate workflow code:', error);
      return {
        success: false,
        error: error.message,
        source: 'beast-mode-enhanced'
      };
    }
  }

  /**
   * Validate workflow code
   */
  async validateWorkflow(workflow) {
    // Basic validation
    const validations = [];

    // Check if workflow has code
    const workflowCode = workflow.code || workflow;
    if (workflowCode && typeof workflowCode === 'string' && workflowCode.length > 10) {
      validations.push({ check: 'has-code', passed: true });
    } else {
      validations.push({ check: 'has-code', passed: false, reason: 'Workflow code too short' });
    }

    // Check for workflow structure (basic checks)
    if (workflowCode.includes('function') || workflowCode.includes('const') || workflowCode.includes('class')) {
      validations.push({ check: 'has-structure', passed: true });
    } else {
      validations.push({ check: 'has-structure', passed: false, reason: 'Missing workflow structure' });
    }

    const allPassed = validations.every(v => v.passed);

    return {
      valid: allPassed,
      validations,
      reason: allPassed ? 'Workflow validated' : 'Some validations failed'
    };
  }
}

// Singleton instance
let instance = null;

function getBeastModeDaisyChainIntegration() {
  if (!instance) {
    instance = new BeastModeDaisyChainIntegration();
  }
  return instance;
}

module.exports = {
  BeastModeDaisyChainIntegration,
  getBeastModeDaisyChainIntegration
};
