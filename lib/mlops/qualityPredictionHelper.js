/**
 * Quality Prediction Helper
 * 
 * Shared utility for all bots to:
 * 1. Get quality predictions for repos
 * 2. Use predictions to make decisions
 * 3. Record outcomes as feedback
 * 
 * Usage:
 *   const helper = await getQualityPredictionHelper();
 *   const { quality, predictionId } = await helper.getQuality(repo);
 *   // ... bot uses quality to make decision ...
 *   await helper.recordOutcome(predictionId, success);
 */

const fetch = require('node-fetch');
const { createLogger } = require('../utils/logger');
const log = createLogger('QualityPredictionHelper');

const API_BASE = process.env.BEAST_MODE_API || process.env.NEXT_PUBLIC_BEAST_MODE_API || 'http://localhost:3000';

class QualityPredictionHelper {
  constructor() {
    this.apiBase = API_BASE;
  }

  /**
   * Get quality prediction for a repository
   * @param {string} repo - Repository in format 'owner/repo'
   * @param {object} options - Optional parameters
   * @returns {Promise<{quality: number, predictionId: string, confidence: number, recommendations: array}>}
   */
  async getQuality(repo, options = {}) {
    try {
      const response = await fetch(`${this.apiBase}/api/repos/quality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          platform: options.platform || 'beast-mode',
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      return {
        quality: data.quality || 0.5,
        predictionId: data.predictionId,
        confidence: data.confidence || 0.5,
        recommendations: data.recommendations || [],
        factors: data.factors || {},
        percentile: data.percentile,
        modelInfo: data.modelInfo
      };
    } catch (error) {
      log.warn(`Failed to get quality prediction for ${repo}: ${error.message}`);
      // Return fallback
      return {
        quality: 0.5,
        predictionId: null,
        confidence: 0.0,
        recommendations: [],
        factors: {},
        error: error.message
      };
    }
  }

  /**
   * Record bot outcome as feedback
   * @param {string} predictionId - Prediction ID from getQuality()
   * @param {boolean|string|number} outcome - true/'success'/1.0 = success, false/'failure'/0.0 = failure
   * @param {object} context - Additional context
   * @returns {Promise<{success: boolean}>}
   */
  async recordOutcome(predictionId, outcome, context = {}) {
    if (!predictionId) {
      log.debug('No predictionId provided - skipping feedback');
      return { success: false, error: 'No predictionId' };
    }

    try {
      // Normalize outcome
      const isSuccess = outcome === true || outcome === 'success' || outcome === 1 || outcome === 1.0;
      const actualValue = typeof outcome === 'number' ? outcome : (isSuccess ? 1.0 : 0.0);

      const response = await fetch(`${this.apiBase}/api/feedback/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId,
          outcome: isSuccess ? 'success' : 'failure',
          confidence: 1.0, // Bot knows for sure
          reasoning: context.reasoning || `Bot ${isSuccess ? 'succeeded' : 'failed'} when using this quality prediction`,
          metrics: {
            botOutcome: isSuccess ? 'success' : 'failure',
            actualValue,
            ...context.metrics
          },
          context: {
            ...context,
            source: 'quality-prediction-helper',
            recordedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      log.info(`✅ Recorded bot outcome: ${isSuccess ? 'SUCCESS' : 'FAILURE'} for ${predictionId.substring(0, 8)}...`);
      
      return { success: true, ...result };
    } catch (error) {
      log.warn(`Failed to record bot outcome: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convenience method: Get quality and use it for decision
   * @param {string} repo - Repository name
   * @param {function} decisionFn - Function that uses quality to make decision, returns {success: boolean, ...}
   * @param {object} options - Options for getQuality
   * @returns {Promise<{quality: number, predictionId: string, decision: object, feedback: object}>}
   */
  async useQualityForDecision(repo, decisionFn, options = {}) {
    // Get quality prediction
    const { quality, predictionId, confidence, recommendations } = await this.getQuality(repo, options);

    if (!predictionId) {
      log.warn(`No predictionId for ${repo} - cannot record feedback`);
    }

    // Bot makes decision using quality
    const decision = await decisionFn({ quality, confidence, recommendations });

    // Record outcome
    let feedback = null;
    if (predictionId && decision.success !== undefined) {
      feedback = await this.recordOutcome(predictionId, decision.success, {
        repo,
        decisionType: decision.type || 'unknown',
        qualityUsed: quality,
        confidence,
        ...decision.context
      });
    }

    return {
      quality,
      predictionId,
      confidence,
      recommendations,
      decision,
      feedback
    };
  }
}

// Singleton instance
let helperInstance = null;

function getQualityPredictionHelper() {
  if (!helperInstance) {
    helperInstance = new QualityPredictionHelper();
  }
  return helperInstance;
}

module.exports = {
  QualityPredictionHelper,
  getQualityPredictionHelper
};
