/**
 * Feedback Service
 * Background service for collecting and managing feedback
 */

const { getFeedbackCollector } = require('../mlops/feedbackCollector');
const { getDatabaseWriter } = require('../mlops/databaseWriter');

class FeedbackService {
  constructor() {
    this.collector = null;
    this.dbWriter = null;
    this.isRunning = false;
    this.interval = null;
    this.collectionInterval = 5 * 60 * 1000; // 5 minutes
  }

  async initialize() {
    if (this.collector && this.dbWriter) return;

    this.collector = await getFeedbackCollector();
    this.dbWriter = await getDatabaseWriter();
  }

  /**
   * Start background feedback collection
   */
  async start() {
    if (this.isRunning) return;

    await this.initialize();
    this.isRunning = true;

    // Run immediately
    await this.collectFeedback();

    // Then run on schedule
    this.interval = setInterval(() => {
      this.collectFeedback().catch(console.error);
    }, this.collectionInterval);

    console.log('✅ Feedback service started');
  }

  /**
   * Stop background feedback collection
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    console.log('⏹️  Feedback service stopped');
  }

  /**
   * Collect feedback from service outcomes
   */
  async collectFeedback() {
    if (!this.collector) await this.initialize();

    try {
      const predictions = await this.collector.getPredictionsNeedingFeedback({
        limit: 50,
        daysOld: 1
      });

      let collected = 0;

      for (const pred of predictions) {
        const actualValue = this.inferActualValue(pred);
        
        if (actualValue !== null) {
          const result = await this.collector.recordOutcome(
            pred.id,
            actualValue,
            {
              ...pred.context,
              source: 'auto-collect',
              inferred: true,
              collectedAt: new Date().toISOString()
            }
          );

          if (result) {
            collected++;
          }
        }
      }

      if (collected > 0) {
        console.log(`✅ Auto-collected ${collected} feedback entries`);
      }

      return { collected, total: predictions.length };
    } catch (error) {
      console.error('[Feedback Service] Error collecting feedback:', error);
      return { collected: 0, total: 0, error: error.message };
    }
  }

  /**
   * Infer actual value from prediction context
   * Enhanced with multiple inference strategies
   */
  inferActualValue(prediction) {
    const service = prediction.service_name;
    const context = prediction.context || {};
    const metadata = prediction.metadata || {};

    // Strategy 1: Check if actual value is already in metadata
    if (metadata.actualValue !== undefined && metadata.actualValue !== null) {
      return typeof metadata.actualValue === 'number' ? metadata.actualValue : parseFloat(metadata.actualValue);
    }

    // Strategy 2: Check validation scores
    if (metadata.validation) {
      if (metadata.validation.score !== undefined) {
        // Normalize to 0-1 if needed
        const score = metadata.validation.score;
        return score > 1 ? score / 100 : score;
      }
      if (metadata.validation.passed === true) {
        return 1.0;
      }
      if (metadata.validation.passed === false) {
        return 0.0;
      }
    }

    // Strategy 3: Service-specific inference
    // Code Roach: Check fix success
    if (service === 'code-roach') {
      // Check context first
      if (context.fixSuccess !== undefined) {
        return context.fixSuccess ? 1.0 : 0.0;
      }
      if (context.fixApplied && !context.fixReverted) {
        return 1.0;
      }
      // Check metadata
      if (metadata.fixSuccess !== undefined) {
        return metadata.fixSuccess ? 1.0 : 0.0;
      }
      if (metadata.fixApplied && !metadata.fixReverted) {
        return 1.0;
      }
      // Check if fix was accepted (no rollback)
      if (metadata.rollbackId === null || metadata.rollbackId === undefined) {
        if (context.fixApplied || metadata.fixApplied) {
          return 0.8; // High confidence if applied and not rolled back
        }
      }
    }

    // AI GM: Check quality rating
    if (service === 'ai-gm') {
      // Check context
      if (context.qualityRating !== undefined) {
        return typeof context.qualityRating === 'number' ? context.qualityRating : parseFloat(context.qualityRating);
      }
      if (context.userRating !== undefined) {
        const rating = typeof context.userRating === 'number' ? context.userRating : parseFloat(context.userRating);
        return rating > 1 ? rating / 5.0 : rating; // Convert 1-5 to 0-1 if needed
      }
      // Check metadata
      if (metadata.qualityRating !== undefined) {
        return typeof metadata.qualityRating === 'number' ? metadata.qualityRating : parseFloat(metadata.qualityRating);
      }
      if (metadata.characterScore !== undefined) {
        const score = typeof metadata.characterScore === 'number' ? metadata.characterScore : parseFloat(metadata.characterScore);
        return score > 1 ? score / 100 : score; // Normalize to 0-1
      }
      // Use validation score if available
      if (metadata.validation && metadata.validation.characterScore !== undefined) {
        const score = typeof metadata.validation.characterScore === 'number' 
          ? metadata.validation.characterScore 
          : parseFloat(metadata.validation.characterScore);
        return score > 1 ? score / 100 : score;
      }
    }

    // Oracle: Check usefulness
    if (service === 'oracle') {
      // Check context
      if (context.usefulnessRating !== undefined) {
        const rating = typeof context.usefulnessRating === 'number' ? context.usefulnessRating : parseFloat(context.usefulnessRating);
        return rating > 1 ? rating / 5.0 : rating;
      }
      // Check metadata
      if (metadata.usefulnessRating !== undefined) {
        const rating = typeof metadata.usefulnessRating === 'number' ? metadata.usefulnessRating : parseFloat(metadata.usefulnessRating);
        return rating > 1 ? rating / 5.0 : rating;
      }
      // Infer from result count
      const resultCount = context.resultCount || metadata.resultCount || 0;
      if (resultCount > 0) {
        // More results = higher usefulness (capped at 0.8)
        return Math.min(0.8, 0.5 + (resultCount * 0.1));
      }
    }

    // First Mate: Check dice roll success
    if (service === 'first-mate') {
      // Check context
      if (context.success !== undefined) {
        return context.success ? 1.0 : 0.0;
      }
      if (context.outcome) {
        const outcome = context.outcome.toLowerCase();
        if (outcome === 'success' || outcome === 'critical-success') {
          return 1.0;
        }
        if (outcome === 'failure' || outcome === 'critical-failure') {
          return 0.0;
        }
        if (outcome === 'partial-success') {
          return 0.5;
        }
      }
      // Check metadata
      if (metadata.success !== undefined) {
        return metadata.success ? 1.0 : 0.0;
      }
      if (metadata.outcome) {
        const outcome = metadata.outcome.toLowerCase();
        if (outcome === 'success' || outcome === 'critical-success') {
          return 1.0;
        }
        if (outcome === 'failure' || outcome === 'critical-failure') {
          return 0.0;
        }
        if (outcome === 'partial-success') {
          return 0.5;
        }
      }
      // Infer from roll vs stat
      if (context.roll !== undefined && context.statValue !== undefined) {
        const roll = typeof context.roll === 'number' ? context.roll : parseFloat(context.roll);
        const statValue = typeof context.statValue === 'number' ? context.statValue : parseFloat(context.statValue);
        const finalTotal = context.finalTotal || roll;
        return finalTotal <= statValue ? 1.0 : 0.0;
      }
    }

    // Daisy Chain: Check task completion
    if (service === 'daisy-chain') {
      if (context.taskCompleted !== undefined) {
        return context.taskCompleted ? 1.0 : 0.0;
      }
      if (metadata.taskCompleted !== undefined) {
        return metadata.taskCompleted ? 1.0 : 0.0;
      }
      if (context.status === 'completed' || metadata.status === 'completed') {
        return 1.0;
      }
      if (context.status === 'failed' || metadata.status === 'failed') {
        return 0.0;
      }
    }

    // Strategy 4: Check if prediction was close to actual (for validation)
    // If predicted value is very close to a validation score, use it
    if (metadata.validation && metadata.validation.score !== undefined) {
      const validationScore = typeof metadata.validation.score === 'number' 
        ? metadata.validation.score 
        : parseFloat(metadata.validation.score);
      const normalizedScore = validationScore > 1 ? validationScore / 100 : validationScore;
      const predictedValue = prediction.predicted_value || 0;
      
      // If prediction is within 10% of validation, use validation
      if (Math.abs(normalizedScore - predictedValue) < 0.1) {
        return normalizedScore;
      }
    }

    return null;
  }

  /**
   * Get feedback statistics
   */
  async getStats() {
    if (!this.collector) await this.initialize();
    return await this.collector.getFeedbackStats();
  }

  /**
   * Get high-value prompts
   */
  async getPrompts(limit = 10, serviceName = null) {
    if (!this.collector) await this.initialize();
    
    const predictions = await this.collector.getPredictionsNeedingFeedback({
      serviceName,
      limit,
      daysOld: 7
    });

    // Filter for high-value
    const highValue = predictions.filter(pred => {
      if (pred.confidence && pred.confidence > 0.8) return true;
      const age = Date.now() - new Date(pred.created_at).getTime();
      if (age < 24 * 60 * 60 * 1000) return true;
      const importantServices = ['code-roach', 'ai-gm', 'oracle'];
      if (importantServices.includes(pred.service_name)) return true;
      return false;
    });

    return highValue.slice(0, limit);
  }
}

// Singleton instance
let feedbackServiceInstance = null;

function getFeedbackService() {
  if (!feedbackServiceInstance) {
    feedbackServiceInstance = new FeedbackService();
  }
  return feedbackServiceInstance;
}

module.exports = {
  FeedbackService,
  getFeedbackService
};

