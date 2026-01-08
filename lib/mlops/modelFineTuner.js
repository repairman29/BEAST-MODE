/**
 * Model Fine-Tuner
 * Fine-tunes models on BEAST MODE's codebase for better results
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { createLogger } = require('../utils/logger');

const log = createLogger('ModelFineTuner');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class ModelFineTuner {
  constructor() {
    this.trainingDataCache = new Map();
  }

  /**
   * Collect training data from codebase
   * @param {string} repoPath - Repository path
   * @param {Object} options - Options
   * @returns {Promise<Array>} Training examples
   */
  async collectTrainingData(repoPath, options = {}) {
    try {
      // Use BEAST MODE's self-improvement to generate training examples
      const response = await axios.post(`${BEAST_MODE_API}/api/self-improvement/scan`, {
        repoPath: repoPath,
        maxFiles: options.maxFiles || 100,
        filePatterns: options.filePatterns || ['**/*.js', '**/*.ts']
      });

      if (response.data && response.data.opportunities) {
        // Convert opportunities to training examples
        const examples = await this.convertToTrainingExamples(
          response.data.opportunities,
          repoPath
        );

        log.info(`Collected ${examples.length} training examples`);
        return examples;
      }

      return [];
    } catch (error) {
      log.error('Failed to collect training data:', error.message);
      return [];
    }
  }

  /**
   * Convert opportunities to training examples
   */
  async convertToTrainingExamples(opportunities, repoPath) {
    const examples = [];

    for (const opportunity of opportunities.slice(0, 50)) { // Limit for performance
      try {
        // Read file content
        const filePath = path.join(repoPath, opportunity.filePath);
        const code = await fs.readFile(filePath, 'utf8');

        // Generate improvement using BEAST MODE
        const improvementResponse = await axios.post(`${BEAST_MODE_API}/api/self-improvement/improve`, {
          opportunity: opportunity,
          model: 'custom:beast-mode-code-model',
          dryRun: true
        });

        if (improvementResponse.data && improvementResponse.data.applyResult) {
          examples.push({
            input: code,
            output: improvementResponse.data.applyResult.improvedCode || code,
            task: opportunity.type,
            context: {
              filePath: opportunity.filePath,
              description: opportunity.description
            }
          });
        }
      } catch (error) {
        log.warn(`Failed to convert opportunity to example: ${error.message}`);
      }
    }

    return examples;
  }

  /**
   * Prepare training data for fine-tuning
   * @param {Array} examples - Training examples
   * @param {string} format - Format (openai, anthropic, etc.)
   * @returns {Promise<string>} Formatted training data
   */
  async prepareTrainingData(examples, format = 'openai') {
    try {
      // Use BEAST MODE to format training data
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `fine-tune-prep-${Date.now()}`,
        message: `Format these training examples for ${format} fine-tuning:

Examples:
${JSON.stringify(examples.slice(0, 10), null, 2)}

Format as ${format === 'openai' ? 'OpenAI fine-tuning format (JSONL)' : 'Anthropic format'}.

Return ONLY the formatted data, no explanations.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        return response.data.message.trim();
      }
    } catch (error) {
      log.error('Failed to prepare training data:', error.message);
    }

    // Fallback: basic formatting
    return this.formatTrainingDataBasic(examples, format);
  }

  /**
   * Basic training data formatting
   */
  formatTrainingDataBasic(examples, format) {
    if (format === 'openai') {
      // OpenAI JSONL format
      return examples.map(ex => JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a code improvement assistant.' },
          { role: 'user', content: `Improve this code:\n\n${ex.input}` },
          { role: 'assistant', content: ex.output }
        ]
      })).join('\n');
    } else {
      // Basic format
      return JSON.stringify(examples, null, 2);
    }
  }

  /**
   * Fine-tune model (requires external fine-tuning service)
   * @param {string} baseModel - Base model ID
   * @param {Array} trainingData - Training data
   * @param {Object} options - Fine-tuning options
   * @returns {Promise<Object>} Fine-tuning result
   */
  async fineTuneModel(baseModel, trainingData, options = {}) {
    // This would integrate with a fine-tuning service
    // For now, return a placeholder
    log.info(`Fine-tuning ${baseModel} with ${trainingData.length} examples`);
    
    return {
      success: false,
      message: 'Fine-tuning requires external service integration',
      baseModel,
      trainingExamples: trainingData.length,
      note: 'Implement fine-tuning service integration to enable this feature'
    };
  }

  /**
   * Register fine-tuned model
   * @param {Object} fineTunedModel - Fine-tuned model info
   * @returns {Promise<boolean>} Success
   */
  async registerFineTunedModel(fineTunedModel) {
    try {
      // Use BEAST MODE API to register model
      const response = await axios.post(`${BEAST_MODE_API}/api/models/custom`, {
        model_name: fineTunedModel.name || 'Fine-tuned Model',
        model_id: fineTunedModel.id || `fine-tuned-${Date.now()}`,
        endpoint_url: fineTunedModel.endpointUrl,
        provider: fineTunedModel.provider || 'openai-compatible',
        description: fineTunedModel.description || 'Fine-tuned on BEAST MODE codebase',
        ...fineTunedModel
      });

      if (response.data && response.data.success) {
        log.info(`Registered fine-tuned model: ${fineTunedModel.id}`);
        return true;
      }
    } catch (error) {
      log.error('Failed to register fine-tuned model:', error.message);
    }

    return false;
  }

  /**
   * Clear training data cache
   */
  clearCache() {
    this.trainingDataCache.clear();
  }
}

module.exports = { ModelFineTuner };
