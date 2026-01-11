/**
 * Model Quality Scorer
 * 
 * Tracks and scores model quality over time
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
const log = createLogger('ModelQualityScorer');

class ModelQualityScorer {
  constructor() {
    this.scores = new Map(); // modelId -> Array<{quality, timestamp, metadata}>
  }

  /**
   * Record a quality score for a model
   */
  recordQuality(modelId, quality, confidence = 0.8, metadata = {}) {
    if (!this.scores.has(modelId)) {
      this.scores.set(modelId, []);
    }

    const score = {
      quality: Math.max(0, Math.min(1, quality)), // Clamp to 0-1
      confidence: Math.max(0, Math.min(1, confidence)),
      timestamp: Date.now(),
      metadata
    };

    this.scores.get(modelId).push(score);

    // Keep only last 1000 scores per model
    const modelScores = this.scores.get(modelId);
    if (modelScores.length > 1000) {
      modelScores.shift();
    }

    log.debug(`Recorded quality score for ${modelId}: ${quality} (confidence: ${confidence})`);
  }

  /**
   * Get quality scores for a model or all models
   */
  getQualityScores(timeRange = '7d', modelId = null) {
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    const results = [];

    const modelsToCheck = modelId ? [modelId] : Array.from(this.scores.keys());

    for (const id of modelsToCheck) {
      const scores = this.scores.get(id) || [];
      const recentScores = scores.filter(s => s.timestamp >= cutoff);

      if (recentScores.length === 0) {
        continue;
      }

      const avgQuality = recentScores.reduce((sum, s) => sum + s.quality, 0) / recentScores.length;
      const avgConfidence = recentScores.reduce((sum, s) => sum + s.confidence, 0) / recentScores.length;

      results.push({
        modelId: id,
        averageQuality: avgQuality,
        averageConfidence: avgConfidence,
        totalScores: recentScores.length,
        trend: this.calculateTrend(recentScores),
        lastUpdated: new Date(Math.max(...recentScores.map(s => s.timestamp))).toISOString()
      });
    }

    return results;
  }

  /**
   * Calculate quality trend
   */
  calculateTrend(scores) {
    if (scores.length < 2) {
      return 'stable';
    }

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + s.quality, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.quality, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    const threshold = 0.05; // 5% change threshold

    if (diff > threshold) {
      return 'improving';
    } else if (diff < -threshold) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  /**
   * Clear scores
   */
  clear() {
    this.scores.clear();
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
