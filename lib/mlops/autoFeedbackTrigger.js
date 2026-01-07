/**
 * Auto Feedback Trigger Service
 * Automatically triggers feedback collection when predictions are made
 * 
 * Phase 2: Improve Feedback Collection
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('AutoFeedbackTrigger');

class AutoFeedbackTrigger {
  constructor() {
    this.enabled = true;
    this.highValueThreshold = 0.8; // 80% confidence threshold
    this.importantServices = ['code-roach', 'ai-gm', 'oracle', 'first-mate'];
  }

  /**
   * Check if a prediction should trigger automatic feedback collection
   */
  shouldTriggerFeedback(prediction) {
    if (!this.enabled) return false;

    const { service_name, confidence, prediction_type, context } = prediction;

    // Always trigger for important services
    if (this.importantServices.includes(service_name)) {
      return true;
    }

    // Trigger for high-confidence predictions
    if (confidence && confidence >= this.highValueThreshold) {
      return true;
    }

    // Trigger for critical prediction types
    const criticalTypes = [
      'fix_impact',
      'quality_prediction',
      'dice_roll',
      'narrative_quality',
      'search_relevance'
    ];
    if (prediction_type && criticalTypes.includes(prediction_type)) {
      return true;
    }

    // Trigger if context indicates high value
    if (context && context.highValue) {
      return true;
    }

    return false;
  }

  /**
   * Trigger feedback collection for a prediction
   * This can be called immediately after a prediction is made
   */
  async triggerFeedback(predictionId, prediction) {
    if (!this.shouldTriggerFeedback(prediction)) {
      return { triggered: false, reason: 'Not high-value enough' };
    }

    try {
      // Store prediction for feedback prompt
      // This will be picked up by the FeedbackPrompt component
      log.info(`[Auto Feedback] Triggering feedback for prediction: ${predictionId.substring(0, 8)}... (service: ${prediction.service_name})`);
      
      // The FeedbackPrompt component will automatically load this via /api/feedback/prompts
      // No additional action needed here - the prediction is already in the database
      
      return {
        triggered: true,
        predictionId,
        service: prediction.service_name,
        reason: 'High-value prediction'
      };
    } catch (error) {
      log.error('[Auto Feedback] Error triggering feedback:', error);
      return { triggered: false, error: error.message };
    }
  }

  /**
   * Enable automatic feedback triggers
   */
  enable() {
    this.enabled = true;
    log.info('Auto feedback triggers enabled');
  }

  /**
   * Disable automatic feedback triggers
   */
  disable() {
    this.enabled = false;
    log.info('Auto feedback triggers disabled');
  }

  /**
   * Set high-value threshold
   */
  setThreshold(threshold) {
    this.highValueThreshold = threshold;
    log.info(`High-value threshold set to ${threshold}`);
  }
}

// Singleton instance
let autoFeedbackTrigger = null;

function getAutoFeedbackTrigger() {
  if (!autoFeedbackTrigger) {
    autoFeedbackTrigger = new AutoFeedbackTrigger();
  }
  return autoFeedbackTrigger;
}

module.exports = {
  AutoFeedbackTrigger,
  getAutoFeedbackTrigger
};

