/**
 * Model Quality Scorer
 * 
 * Scores model quality based on:
 * - Response quality
 * - Code correctness
 * - Performance metrics
 * - User feedback
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('ModelQualityScorer');

class ModelQualityScorer {
  constructor() {
    this.scores = new Map(); // modelId -> { score, count, history }
    this.feedback = new Map(); // modelId -> feedback array
  }

  /**
   * Score a model response
   * @param {string} modelId - Model identifier
   * @param {object} metrics - Quality metrics
   * @param {number} metrics.codeQuality - Code quality score (0-1)
   * @param {number} metrics.responseTime - Response time in ms
   * @param {number} metrics.tokenCount - Number of tokens used
   * @param {boolean} metrics.success - Whether request succeeded
   * @param {object} metrics.userFeedback - User feedback (optional)
   * @returns {number} - Quality score (0-100)
   */
  scoreResponse(modelId, metrics) {
    let score = 50; // Base score

    // Code quality component (0-30 points)
    if (metrics.codeQuality !== undefined) {
      score += metrics.codeQuality * 30;
    }

    // Performance component (0-20 points)
    // Faster = better (inverse relationship)
    if (metrics.responseTime !== undefined) {
      const timeScore = Math.max(0, 20 - (metrics.responseTime / 100)); // 2s = 0 points, 0s = 20 points
      score += timeScore;
    }

    // Efficiency component (0-15 points)
    // Fewer tokens = better (for same quality)
    if (metrics.tokenCount !== undefined) {
      const tokenScore = Math.max(0, 15 - (metrics.tokenCount / 1000)); // 15k tokens = 0 points, 0 tokens = 15 points
      score += tokenScore;
    }

    // Success component (0-20 points)
    if (metrics.success !== false) {
      score += 20;
    }

    // User feedback component (0-15 points)
    if (metrics.userFeedback) {
      if (metrics.userFeedback.rating !== undefined) {
        score += (metrics.userFeedback.rating / 5) * 15; // 5 stars = 15 points
      }
      if (metrics.userFeedback.helpful === true) {
        score += 5;
      } else if (metrics.userFeedback.helpful === false) {
        score -= 5;
      }
    }

    // Clamp score to 0-100
    score = Math.min(100, Math.max(0, score));

    // Update model scores
    if (!this.scores.has(modelId)) {
      this.scores.set(modelId, {
        score: 0,
        count: 0,
        history: []
      });
    }

    const modelData = this.scores.get(modelId);
    modelData.count++;
    modelData.history.push({
      score,
      timestamp: new Date().toISOString(),
      metrics
    });

    // Keep only last 1000 scores
    if (modelData.history.length > 1000) {
      modelData.history.shift();
    }

    // Update average score
    const totalScore = modelData.history.reduce((sum, h) => sum + h.score, 0);
    modelData.score = totalScore / modelData.history.length;

    log.debug(`Scored ${modelId}: ${score.toFixed(1)} (avg: ${modelData.score.toFixed(1)})`);

    return score;
  }

  /**
   * Get model quality score
   */
  getModelScore(modelId) {
    const modelData = this.scores.get(modelId);
    if (!modelData) {
      return null;
    }

    return {
      modelId,
      score: modelData.score,
      count: modelData.count,
      recentScores: modelData.history.slice(-10).map(h => h.score),
      trend: this.calculateTrend(modelData.history)
    };
  }

  /**
   * Get all model scores
   */
  getAllScores() {
    const scores = [];
    for (const [modelId, data] of this.scores.entries()) {
      scores.push({
        modelId,
        score: data.score,
        count: data.count,
        trend: this.calculateTrend(data.history)
      });
    }

    // Sort by score (descending)
    scores.sort((a, b) => b.score - a.score);

    return scores;
  }

  /**
   * Calculate trend (improving, declining, stable)
   */
  calculateTrend(history) {
    if (history.length < 10) {
      return 'insufficient-data';
    }

    const recent = history.slice(-10).map(h => h.score);
    const older = history.slice(-20, -10).map(h => h.score);

    if (older.length === 0) {
      return 'insufficient-data';
    }

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 5) {
      return 'improving';
    } else if (diff < -5) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  /**
   * Record user feedback
   */
  recordFeedback(modelId, feedback) {
    if (!this.feedback.has(modelId)) {
      this.feedback.set(modelId, []);
    }

    this.feedback.get(modelId).push({
      ...feedback,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 feedback entries
    const feedbackArray = this.feedback.get(modelId);
    if (feedbackArray.length > 100) {
      feedbackArray.shift();
    }

    log.debug(`Recorded feedback for ${modelId}`);
  }

  /**
   * Get feedback for a model
   */
  getFeedback(modelId) {
    return this.feedback.get(modelId) || [];
  }

  /**
   * Clear scores
   */
  clear() {
    this.scores.clear();
    this.feedback.clear();
    log.info('Model quality scores cleared');
  }
}

// Singleton instance
let modelQualityScorerInstance = null;

function getModelQualityScorer() {
  if (!modelQualityScorerInstance) {
    modelQualityScorerInstance = new ModelQualityScorer();
  }
  return modelQualityScorerInstance;
}

module.exports = {
  ModelQualityScorer,
  getModelQualityScorer
};
