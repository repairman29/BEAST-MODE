/**
 * Task Model Selector
 * Selects specialized models for specific tasks
 */

const axios = require('axios');
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

const log = createLogger('TaskModelSelector');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class TaskModelSelector {
  constructor() {
    this.taskModels = new Map([
      ['code-generation', 'custom:beast-mode-code-model'],
      ['documentation', 'custom:beast-mode-docs-model'],
      ['testing', 'custom:beast-mode-test-model'],
      ['refactoring', 'custom:beast-mode-refactor-model'],
      ['security', 'custom:beast-mode-security-model'],
      ['performance', 'custom:beast-mode-perf-model'],
      ['comments', 'custom:beast-mode-code-model'],
      ['explanation', 'custom:beast-mode-code-model']
    ]);

    this.defaultModel = 'custom:beast-mode-code-model';
  }

  /**
   * Select model for task
   * @param {string} task - Task type
   * @param {Object} context - Additional context
   * @returns {string} Model ID
   */
  selectModelForTask(task, context = {}) {
    const normalizedTask = task.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    if (this.taskModels.has(normalizedTask)) {
      const model = this.taskModels.get(normalizedTask);
      log.debug(`Selected task-specific model: ${model} for task: ${task}`);
      return model;
    }

    // Try partial match
    for (const [taskKey, model] of this.taskModels.entries()) {
      if (normalizedTask.includes(taskKey) || taskKey.includes(normalizedTask)) {
        log.debug(`Selected task model via partial match: ${model} for task: ${task}`);
        return model;
      }
    }

    log.debug(`Using default model: ${this.defaultModel} for task: ${task}`);
    return this.defaultModel;
  }

  /**
   * Register specialized model for task
   * @param {string} task - Task type
   * @param {string} modelId - Model ID
   * @param {Object} options - Registration options
   * @returns {Promise<boolean>} Success
   */
  async registerTaskModel(task, modelId, options = {}) {
    try {
      // Use BEAST MODE API to register model
      if (options.useAPI !== false) {
        const response = await axios.post(`${BEAST_MODE_API}/api/models/custom`, {
          model_name: `BEAST MODE ${task} Model`,
          model_id: modelId.replace('custom:', ''),
          endpoint_url: options.endpointUrl,
          provider: options.provider || 'openai-compatible',
          description: `Specialized model for ${task} tasks`,
          ...options
        });

        if (response.data && response.data.success) {
          this.taskModels.set(task.toLowerCase(), modelId);
          log.info(`Registered task model: ${task} → ${modelId}`);
          return true;
        }
      } else {
        // Just register locally
        this.taskModels.set(task.toLowerCase(), modelId);
        log.info(`Registered task model locally: ${task} → ${modelId}`);
        return true;
      }
    } catch (error) {
      log.error(`Failed to register task model: ${error.message}`);
      // Still register locally as fallback
      this.taskModels.set(task.toLowerCase(), modelId);
      return false;
    }
  }

  /**
   * Get available task models
   * @returns {Object} Task models map
   */
  getAvailableTaskModels() {
    return Object.fromEntries(this.taskModels);
  }

  /**
   * Check if specialized model exists for task
   * @param {string} task - Task type
   * @returns {boolean}
   */
  hasSpecializedModel(task) {
    const normalizedTask = task.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return this.taskModels.has(normalizedTask);
  }

  /**
   * Get model recommendation for task
   * @param {string} task - Task type
   * @param {Object} context - Context
   * @returns {Object} Recommendation
   */
  getRecommendation(task, context = {}) {
    const model = this.selectModelForTask(task, context);
    const isSpecialized = this.hasSpecializedModel(task);

    return {
      model,
      task,
      isSpecialized,
      recommendation: isSpecialized 
        ? `Using specialized model for ${task} tasks`
        : `Using default model (consider registering specialized model for ${task})`
    };
  }
}

// Singleton instance
let instance = null;

function getTaskModelSelector() {
  if (!instance) {
    instance = new TaskModelSelector();
  }
  return instance;
}

module.exports = { TaskModelSelector, getTaskModelSelector };
