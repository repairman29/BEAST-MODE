/**
 * Ensemble Generator
 * Uses multiple models and combines results for higher quality
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

const log = createLogger('EnsembleGenerator');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class EnsembleGenerator {
  constructor(options = {}) {
    this.options = {
      models: options.models || [
        'custom:beast-mode-code-model',
        'custom:beast-mode-code-model-2',
        'custom:beast-mode-code-model-3'
      ],
      strategy: options.strategy || 'consensus', // consensus, voting, best
      minAgreement: options.minAgreement || 0.6, // 60% agreement required
      enabled: options.enabled !== false
    };
  }

  /**
   * Generate using ensemble
   * @param {Object} request - LLM request
   * @param {Object} options - Options
   * @returns {Promise<Object>} Combined result
   */
  async generateEnsemble(request, options = {}) {
    if (!this.options.enabled || this.options.models.length < 2) {
      // Fallback to single model
      return this.generateSingle(request, options);
    }

    const models = options.models || this.options.models;
    const strategy = options.strategy || this.options.strategy;

    log.info(`Generating with ensemble of ${models.length} models using ${strategy} strategy`);

    try {
      // Generate with all models in parallel
      const responses = await Promise.all(
        models.map(model => this.generateWithModel(request, model, options))
      );

      // Combine results based on strategy
      return this.combineResults(responses, strategy, options);
    } catch (error) {
      log.error('Ensemble generation failed:', error.message);
      // Fallback to first model
      return this.generateSingle(request, { ...options, model: models[0] });
    }
  }

  /**
   * Generate with single model
   */
  async generateWithModel(request, model, options = {}) {
    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `ensemble-${model}-${Date.now()}`,
        message: request.message || request.prompt,
        repo: request.repo || 'BEAST-MODE-PRODUCT',
        model: model,
        useLLM: true,
        ...request
      });

      return {
        model,
        success: response.data && response.data.message,
        content: response.data?.message || response.data?.code || '',
        usage: response.data?.usage,
        error: response.data?.error
      };
    } catch (error) {
      log.error(`Model ${model} failed:`, error.message);
      return {
        model,
        success: false,
        content: '',
        error: error.message
      };
    }
  }

  /**
   * Generate with single model (fallback)
   */
  async generateSingle(request, options = {}) {
    const model = options.model || this.options.models[0];
    return this.generateWithModel(request, model, options);
  }

  /**
   * Combine results from multiple models
   */
  combineResults(responses, strategy, options = {}) {
    const successful = responses.filter(r => r.success);
    
    if (successful.length === 0) {
      throw new Error('All models failed');
    }

    if (successful.length === 1) {
      return {
        content: successful[0].content,
        model: successful[0].model,
        strategy: 'single',
        confidence: 0.5
      };
    }

    switch (strategy) {
      case 'consensus':
        return this.combineConsensus(successful, options);
      case 'voting':
        return this.combineVoting(successful, options);
      case 'best':
        return this.combineBest(successful, options);
      default:
        return this.combineConsensus(successful, options);
    }
  }

  /**
   * Combine using consensus (find common elements)
   */
  combineConsensus(responses, options) {
    const contents = responses.map(r => r.content);
    
    // Find longest common substring
    const common = this.findCommonElements(contents);
    
    // If high agreement, use consensus
    const agreement = this.calculateAgreement(contents);
    const minAgreement = options.minAgreement || this.options.minAgreement;
    
    if (agreement >= minAgreement) {
      return {
        content: common || contents[0],
        models: responses.map(r => r.model),
        strategy: 'consensus',
        confidence: agreement,
        agreement
      };
    }

    // Low agreement - use best result
    return this.combineBest(responses, options);
  }

  /**
   * Combine using voting (majority wins)
   */
  combineVoting(responses, options) {
    const contents = responses.map(r => r.content);
    
    // Group by similarity
    const groups = this.groupSimilar(contents);
    
    // Find largest group
    const largestGroup = groups.reduce((a, b) => a.length > b.length ? a : b);
    
    return {
      content: largestGroup[0],
      models: responses.map(r => r.model),
      strategy: 'voting',
      confidence: largestGroup.length / contents.length,
      votes: largestGroup.length
    };
  }

  /**
   * Combine using best (highest quality)
   */
  combineBest(responses, options) {
    // For now, use first successful response
    // In future, could use quality scoring
    const best = responses[0];
    
    return {
      content: best.content,
      model: best.model,
      models: responses.map(r => r.model),
      strategy: 'best',
      confidence: 0.8
    };
  }

  /**
   * Find common elements in responses
   */
  findCommonElements(contents) {
    if (contents.length === 0) return null;
    if (contents.length === 1) return contents[0];

    // Simple approach: find longest common substring
    let common = contents[0];
    for (let i = 1; i < contents.length; i++) {
      common = this.longestCommonSubstring(common, contents[i]);
      if (!common) break;
    }

    return common;
  }

  /**
   * Calculate agreement between responses
   */
  calculateAgreement(contents) {
    if (contents.length < 2) return 1.0;

    // Simple similarity check
    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < contents.length; i++) {
      for (let j = i + 1; j < contents.length; j++) {
        const similarity = this.calculateSimilarity(contents[i], contents[j]);
        totalSimilarity += similarity;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Calculate similarity between two strings
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  /**
   * Longest common substring
   */
  longestCommonSubstring(str1, str2) {
    let longest = '';
    for (let i = 0; i < str1.length; i++) {
      for (let j = i + 1; j <= str1.length; j++) {
        const substr = str1.substring(i, j);
        if (str2.includes(substr) && substr.length > longest.length) {
          longest = substr;
        }
      }
    }
    return longest;
  }

  /**
   * Group similar responses
   */
  groupSimilar(contents) {
    const groups = [];
    const used = new Set();

    for (let i = 0; i < contents.length; i++) {
      if (used.has(i)) continue;

      const group = [contents[i]];
      used.add(i);

      for (let j = i + 1; j < contents.length; j++) {
        if (used.has(j)) continue;

        const similarity = this.calculateSimilarity(contents[i], contents[j]);
        if (similarity > 0.7) { // 70% similarity threshold
          group.push(contents[j]);
          used.add(j);
        }
      }

      groups.push(group);
    }

    return groups;
  }
}

module.exports = { EnsembleGenerator };
