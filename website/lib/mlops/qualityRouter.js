/**
 * Quality-Based Router
 * Routes requests to models based on predicted quality
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

const log = createLogger('QualityRouter');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class QualityRouter {
  constructor(options = {}) {
    this.options = {
      qualityThreshold: options.qualityThreshold || 0.8,
      models: options.models || [
        'custom:beast-mode-code-model',
        'custom:beast-mode-code-model-2',
        'openai:gpt-4'
      ],
      useQualityPrediction: options.useQualityPrediction !== false
    };
    
    this.qualityCache = new Map();
  }

  /**
   * Route request based on predicted quality
   * @param {Object} request - LLM request
   * @param {Object} context - Context
   * @returns {Promise<Object>} Routed response
   */
  async routeByQuality(request, context = {}) {
    if (!this.options.useQualityPrediction) {
      // Fallback to first model
      return this.routeToModel(request, this.options.models[0], context);
    }

    try {
      // Predict quality for each model
      const qualityPredictions = await Promise.all(
        this.options.models.map(model => this.predictQuality(request, model, context))
      );

      // Select best model
      const bestIndex = qualityPredictions.indexOf(
        Math.max(...qualityPredictions.map(p => p.predictedQuality))
      );
      const bestModel = this.options.models[bestIndex];
      const bestPrediction = qualityPredictions[bestIndex];

      log.debug(`Routing to ${bestModel} (predicted quality: ${(bestPrediction.predictedQuality * 100).toFixed(1)}%)`);

      // Route to best model
      return this.routeToModel(request, bestModel, context);
    } catch (error) {
      log.error('Quality-based routing failed:', error.message);
      // Fallback to first model
      return this.routeToModel(request, this.options.models[0], context);
    }
  }

  /**
   * Predict quality for model
   * @param {Object} request - LLM request
   * @param {string} model - Model ID
   * @param {Object} context - Context
   * @returns {Promise<Object>} Quality prediction
   */
  async predictQuality(request, model, context = {}) {
    const cacheKey = `${model}-${JSON.stringify(request).substring(0, 200)}`;
    if (this.qualityCache.has(cacheKey)) {
      return this.qualityCache.get(cacheKey);
    }

    try {
      // Use BEAST MODE's quality prediction API if available
      // For now, use heuristics
      const prediction = this.heuristicQualityPrediction(request, model, context);
      
      this.qualityCache.set(cacheKey, prediction);
      return prediction;
    } catch (error) {
      log.error(`Quality prediction failed for ${model}:`, error.message);
      return {
        model,
        predictedQuality: 0.5,
        confidence: 0.5
      };
    }
  }

  /**
   * Heuristic quality prediction
   */
  heuristicQualityPrediction(request, model, context) {
    let quality = 0.7; // Base quality

    // Custom models generally have good quality
    if (model.startsWith('custom:')) {
      quality += 0.1;
    }

    // Provider models (GPT-4, Claude) have high quality
    if (model.includes('gpt-4') || model.includes('claude-3-opus')) {
      quality += 0.15;
    }

    // Longer prompts might need better models
    const promptLength = (request.message || request.prompt || '').length;
    if (promptLength > 2000 && model.includes('gpt-4')) {
      quality += 0.1;
    }

    // Complex tasks benefit from better models
    if (context.complexity === 'high' && (model.includes('gpt-4') || model.includes('claude-3-opus'))) {
      quality += 0.1;
    }

    return {
      model,
      predictedQuality: Math.min(quality, 1.0),
      confidence: 0.7
    };
  }

  /**
   * Route to specific model
   */
  async routeToModel(request, model, context = {}) {
    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `quality-routed-${Date.now()}`,
        message: request.message || request.prompt,
        repo: request.repo || 'BEAST-MODE-PRODUCT',
        model: model,
        useLLM: true,
        ...request
      });

      return {
        success: response.data && (response.data.message || response.data.code),
        content: response.data?.message || response.data?.code || '',
        model: model,
        usage: response.data?.usage,
        error: response.data?.error
      };
    } catch (error) {
      log.error(`Routing to ${model} failed:`, error.message);
      return {
        success: false,
        content: '',
        model: model,
        error: error.message
      };
    }
  }

  /**
   * Clear quality cache
   */
  clearCache() {
    this.qualityCache.clear();
  }
}

module.exports = { QualityRouter };
