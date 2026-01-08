/**
 * Model Performance Tuner
 * 
 * Automatically tunes model performance by:
 * - Adjusting temperature based on quality
 * - Optimizing max_tokens based on usage
 * - Learning from successful requests
 * - Adapting to task types
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('ModelPerformanceTuner');

class ModelPerformanceTuner {
  constructor() {
    this.tuningData = new Map(); // modelId -> tuning data
    this.taskProfiles = new Map(); // taskType -> optimal settings
  }

  /**
   * Tune model parameters based on performance
   * @param {string} modelId - Model identifier
   * @param {object} metrics - Performance metrics
   * @param {number} metrics.quality - Response quality (0-1)
   * @param {number} metrics.latency - Response latency (ms)
   * @param {number} metrics.tokenUsage - Tokens used
   * @param {string} metrics.taskType - Type of task (e.g., 'code-generation', 'chat')
   * @param {object} currentSettings - Current model settings
   * @returns {object} - Recommended settings
   */
  tuneModel(modelId, metrics, currentSettings = {}) {
    if (!this.tuningData.has(modelId)) {
      this.tuningData.set(modelId, {
        history: [],
        optimalSettings: {
          temperature: 0.7,
          maxTokens: 2000,
          topP: 0.9
        }
      });
    }

    const modelData = this.tuningData.get(modelId);
    modelData.history.push({
      ...metrics,
      settings: currentSettings,
      timestamp: new Date().toISOString()
    });

    // Keep only last 1000 entries
    if (modelData.history.length > 1000) {
      modelData.history.shift();
    }

    // Analyze and recommend settings
    const recommendations = this.analyzeAndRecommend(modelId, metrics, currentSettings);

    // Update optimal settings
    modelData.optimalSettings = {
      ...modelData.optimalSettings,
      ...recommendations
    };

    log.debug(`Tuned ${modelId}:`, recommendations);

    return recommendations;
  }

  /**
   * Analyze performance and recommend settings
   */
  analyzeAndRecommend(modelId, metrics, currentSettings) {
    const modelData = this.tuningData.get(modelId);
    const recent = modelData.history.slice(-100); // Last 100 requests

    if (recent.length < 10) {
      // Not enough data, return defaults
      return {
        temperature: 0.7,
        maxTokens: 2000
      };
    }

    const recommendations: any = {};

    // Tune temperature based on quality
    const avgQuality = recent.reduce((sum, h) => sum + (h.quality || 0), 0) / recent.length;
    if (avgQuality < 0.7) {
      // Low quality - increase temperature for more creativity
      recommendations.temperature = Math.min(1.0, (currentSettings.temperature || 0.7) + 0.1);
    } else if (avgQuality > 0.9) {
      // High quality - decrease temperature for more consistency
      recommendations.temperature = Math.max(0.1, (currentSettings.temperature || 0.7) - 0.05);
    } else {
      recommendations.temperature = currentSettings.temperature || 0.7;
    }

    // Tune max_tokens based on usage
    const avgTokenUsage = recent.reduce((sum, h) => sum + (h.tokenUsage || 0), 0) / recent.length;
    const currentMaxTokens = currentSettings.maxTokens || 2000;
    
    if (avgTokenUsage > currentMaxTokens * 0.9) {
      // Using most tokens - increase limit
      recommendations.maxTokens = Math.min(4000, currentMaxTokens + 500);
    } else if (avgTokenUsage < currentMaxTokens * 0.5) {
      // Using less than half - decrease limit for efficiency
      recommendations.maxTokens = Math.max(500, currentMaxTokens - 500);
    } else {
      recommendations.maxTokens = currentMaxTokens;
    }

    // Task-specific tuning
    if (metrics.taskType) {
      const taskProfile = this.getTaskProfile(metrics.taskType);
      if (taskProfile) {
        // Blend task profile with current recommendations
        recommendations.temperature = (recommendations.temperature + taskProfile.temperature) / 2;
        recommendations.maxTokens = Math.max(recommendations.maxTokens, taskProfile.maxTokens);
      }
    }

    return recommendations;
  }

  /**
   * Get or create task profile
   */
  getTaskProfile(taskType) {
    if (!this.taskProfiles.has(taskType)) {
      // Default profiles for common task types
      const defaults: Record<string, any> = {
        'code-generation': { temperature: 0.3, maxTokens: 3000 },
        'chat': { temperature: 0.7, maxTokens: 2000 },
        'refactoring': { temperature: 0.2, maxTokens: 4000 },
        'testing': { temperature: 0.1, maxTokens: 2000 },
        'documentation': { temperature: 0.5, maxTokens: 3000 }
      };

      this.taskProfiles.set(taskType, defaults[taskType] || { temperature: 0.7, maxTokens: 2000 });
    }

    return this.taskProfiles.get(taskType);
  }

  /**
   * Get optimal settings for a model and task
   */
  getOptimalSettings(modelId, taskType = null) {
    const modelData = this.tuningData.get(modelId);
    if (!modelData) {
      // Return task profile or defaults
      return taskType ? this.getTaskProfile(taskType) : { temperature: 0.7, maxTokens: 2000 };
    }

    const optimal = { ...modelData.optimalSettings };

    // Blend with task profile if provided
    if (taskType) {
      const taskProfile = this.getTaskProfile(taskType);
      if (taskProfile) {
        optimal.temperature = (optimal.temperature + taskProfile.temperature) / 2;
        optimal.maxTokens = Math.max(optimal.maxTokens, taskProfile.maxTokens);
      }
    }

    return optimal;
  }

  /**
   * Get tuning statistics
   */
  getStats(modelId) {
    const modelData = this.tuningData.get(modelId);
    if (!modelData) {
      return null;
    }

    const recent = modelData.history.slice(-100);
    if (recent.length === 0) {
      return null;
    }

    return {
      modelId,
      totalRequests: modelData.history.length,
      recentRequests: recent.length,
      avgQuality: recent.reduce((sum, h) => sum + (h.quality || 0), 0) / recent.length,
      avgLatency: recent.reduce((sum, h) => sum + (h.latency || 0), 0) / recent.length,
      avgTokenUsage: recent.reduce((sum, h) => sum + (h.tokenUsage || 0), 0) / recent.length,
      optimalSettings: modelData.optimalSettings
    };
  }

  /**
   * Clear tuning data
   */
  clear() {
    this.tuningData.clear();
    this.taskProfiles.clear();
    log.info('Model performance tuner cleared');
  }
}

// Singleton instance
let modelPerformanceTunerInstance = null;

function getModelPerformanceTuner() {
  if (!modelPerformanceTunerInstance) {
    modelPerformanceTunerInstance = new ModelPerformanceTuner();
  }
  return modelPerformanceTunerInstance;
}

module.exports = {
  ModelPerformanceTuner,
  getModelPerformanceTuner
};
