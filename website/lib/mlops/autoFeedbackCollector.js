/**
 * Auto Feedback Collector Service
 * Automatically collects feedback from user actions and outcomes
 * 
 * Phase 3: Automated Feedback Collection
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
const log = createLogger('AutoFeedbackCollector');

class AutoFeedbackCollector {
  constructor() {
    this.enabled = true;
    this.actionTracking = new Map(); // Track user actions with predictionIds
    this.outcomeTracking = new Map(); // Track outcomes for predictions
    this.collectionRules = {
      // Auto-collect feedback for these action types
      autoCollectActions: [
        'fix_applied',
        'fix_reverted',
        'narrative_rated',
        'search_used',
        'dice_rolled',
        'quality_rated'
      ],
      // Infer feedback from these outcomes
      inferFromOutcomes: [
        'fix_success',
        'fix_failure',
        'dice_success',
        'dice_failure',
        'search_relevant',
        'search_irrelevant'
      ]
    };
  }

  /**
   * Track a user action that might have associated feedback
   */
  trackAction(actionType, predictionId, metadata = {}) {
    if (!this.enabled) return;

    const action = {
      actionType,
      predictionId,
      timestamp: Date.now(),
      metadata
    };

    this.actionTracking.set(predictionId, action);
    log.debug(`[Auto Feedback] Tracked action: ${actionType} for prediction ${predictionId.substring(0, 8)}...`);

    // Auto-collect if this is an auto-collect action
    if (this.collectionRules.autoCollectActions.includes(actionType)) {
      this.autoCollectFromAction(action);
    }
  }

  /**
   * Track an outcome for a prediction
   */
  trackOutcome(predictionId, outcome, metadata = {}) {
    if (!this.enabled) return;

    const outcomeData = {
      predictionId,
      outcome,
      timestamp: Date.now(),
      metadata
    };

    this.outcomeTracking.set(predictionId, outcomeData);
    log.debug(`[Auto Feedback] Tracked outcome: ${outcome} for prediction ${predictionId.substring(0, 8)}...`);

    // Auto-collect if we can infer feedback from outcome
    if (this.canInferFeedback(outcome)) {
      this.autoCollectFromOutcome(outcomeData);
    }
  }

  /**
   * Check if we can infer feedback from an outcome
   */
  canInferFeedback(outcome) {
    if (typeof outcome === 'boolean') {
      return true; // Success/failure can be inferred
    }
    if (typeof outcome === 'number' && outcome >= 0 && outcome <= 1) {
      return true; // Rating can be used directly
    }
    if (this.collectionRules.inferFromOutcomes.includes(outcome)) {
      return true; // Known outcome type
    }
    return false;
  }

  /**
   * Auto-collect feedback from a user action
   */
  async autoCollectFromAction(action) {
    try {
      const { actionType, predictionId, metadata } = action;

      // Infer feedback value from action
      let feedbackValue = null;
      let feedbackType = 'auto_action';

      switch (actionType) {
        case 'fix_applied':
          feedbackValue = 0.9; // High value - fix was applied
          break;
        case 'fix_reverted':
          feedbackValue = 0.2; // Low value - fix was reverted
          break;
        case 'narrative_rated':
          feedbackValue = metadata.rating || 0.5;
          break;
        case 'search_used':
          feedbackValue = 0.8; // High value - search result was used
          break;
        case 'dice_rolled':
          // Will be collected from outcome
          return;
        case 'quality_rated':
          feedbackValue = metadata.rating || 0.5;
          break;
        default:
          return; // Unknown action type
      }

      if (feedbackValue !== null) {
        await this.recordFeedback(predictionId, feedbackValue, {
          type: feedbackType,
          actionType,
          source: 'auto_action',
          metadata
        });
      }
    } catch (error) {
      log.error('[Auto Feedback] Error collecting from action:', error);
    }
  }

  /**
   * Auto-collect feedback from an outcome
   */
  async autoCollectFromOutcome(outcomeData) {
    try {
      const { predictionId, outcome, metadata } = outcomeData;

      // Convert outcome to feedback value
      let feedbackValue = null;
      let feedbackType = 'auto_outcome';

      if (typeof outcome === 'boolean') {
        feedbackValue = outcome ? 0.9 : 0.2; // Success = 0.9, Failure = 0.2
      } else if (typeof outcome === 'number') {
        feedbackValue = outcome; // Use directly if 0-1 scale
      } else if (typeof outcome === 'string') {
        // Map string outcomes to values
        const outcomeMap = {
          'fix_success': 0.9,
          'fix_failure': 0.2,
          'dice_success': 0.8,
          'dice_failure': 0.3,
          'search_relevant': 0.85,
          'search_irrelevant': 0.25
        };
        feedbackValue = outcomeMap[outcome] || 0.5;
      }

      if (feedbackValue !== null) {
        await this.recordFeedback(predictionId, feedbackValue, {
          type: feedbackType,
          outcome,
          source: 'auto_outcome',
          metadata
        });
      }
    } catch (error) {
      log.error('[Auto Feedback] Error collecting from outcome:', error);
    }
  }

  /**
   * Record feedback to the feedback collector
   */
  async recordFeedback(predictionId, feedbackValue, context = {}) {
    try {
      // Get feedback collector
      const path = require('path');
      const possiblePaths = [
        path.join(__dirname, './feedbackCollector'),
        path.join(process.cwd(), '../lib/mlops/feedbackCollector'),
        path.join(process.cwd(), 'lib/mlops/feedbackCollector')
      ];

      let feedbackCollector = null;
      for (const fbPath of possiblePaths) {
        try {
          delete require.cache[require.resolve(fbPath)];
          const { getFeedbackCollector } = require(fbPath);
          feedbackCollector = await getFeedbackCollector();
          if (feedbackCollector && feedbackCollector.initialized) {
            break;
          }
        } catch (error) {
          // Try next path
        }
      }

      if (feedbackCollector) {
        // Record outcome
        await feedbackCollector.recordOutcome(predictionId, feedbackValue, {
          ...context,
          autoCollected: true,
          timestamp: Date.now()
        });

        log.info(`[Auto Feedback] Recorded feedback: predictionId=${predictionId.substring(0, 8)}..., value=${feedbackValue.toFixed(2)}, type=${context.type}`);
      } else {
        log.warn('[Auto Feedback] Feedback collector not available');
      }
    } catch (error) {
      log.error('[Auto Feedback] Error recording feedback:', error);
    }
  }

  /**
   * Get statistics on auto-collected feedback
   */
  getStats() {
    return {
      actionsTracked: this.actionTracking.size,
      outcomesTracked: this.outcomeTracking.size,
      enabled: this.enabled
    };
  }

  /**
   * Enable auto-collection
   */
  enable() {
    this.enabled = true;
    log.info('Auto feedback collection enabled');
  }

  /**
   * Disable auto-collection
   */
  disable() {
    this.enabled = false;
    log.info('Auto feedback collection disabled');
  }

  /**
   * Clear tracking data (for testing or cleanup)
   */
  clear() {
    this.actionTracking.clear();
    this.outcomeTracking.clear();
    log.info('Auto feedback tracking cleared');
  }
}

// Singleton instance
let autoFeedbackCollector = null;

function getAutoFeedbackCollector() {
  if (!autoFeedbackCollector) {
    autoFeedbackCollector = new AutoFeedbackCollector();
  }
  return autoFeedbackCollector;
}

module.exports = {
  AutoFeedbackCollector,
  getAutoFeedbackCollector
};

