/**
 * Feedback Collector Service
 * Collects feedback and updates predictions with actual values
 * 
 * This connects predictions to outcomes for training data
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('FeedbackCollector');

class FeedbackCollector {
  constructor() {
    this.supabase = null;
    this.initialized = false;
  }

  /**
   * Initialize Supabase connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load .env.local from website directory
      const path = require('path');
      const fs = require('fs');
      
      try {
        const envPath = path.join(__dirname, '../../website/.env.local');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          envContent.split('\n').forEach(line => {
            const match = line.match(/^([^#=]+)=(.*)$/);
            if (match) {
              const key = match[1].trim();
              const value = match[2].trim().replace(/^["']|["']$/g, '');
              if (!process.env[key]) {
                process.env[key] = value;
              }
            }
          });
        }
      } catch (error) {
        // Ignore
      }

      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || 
                         process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.SUPABASE_ANON_KEY ||
                         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        log.warn('⚠️  Supabase credentials not found');
        this.supabase = null;
        this.initialized = true;
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.initialized = true;
      log.info('✅ Feedback collector initialized');
    } catch (error) {
      log.error('Failed to initialize feedback collector:', error.message);
      this.supabase = null;
      this.initialized = true;
    }
  }

  /**
   * Record outcome for a prediction with retry logic
   * Updates ml_predictions table with actual value
   */
  async recordOutcome(predictionId, actualValue, context = {}, retryCount = 0) {
    if (!this.initialized) await this.initialize();
    if (!this.supabase) {
      log.warn('⚠️  Supabase not configured - cannot record outcome');
      return null;
    }

    if (!predictionId) {
      log.warn('⚠️  No predictionId provided - cannot record outcome');
      return null;
    }

    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s

    try {
      log.info(`[Feedback Collector] Recording outcome: predictionId=${predictionId.substring(0, 8)}..., actualValue=${actualValue}${retryCount > 0 ? ` (retry ${retryCount}/${maxRetries})` : ''}`);
      
      // Get the prediction first
      const { data: prediction, error: fetchError } = await this.supabase
        .from('ml_predictions')
        .select('*')
        .eq('id', predictionId)
        .single();

      if (fetchError || !prediction) {
        if (retryCount < maxRetries && (fetchError?.code === 'PGRST116' || fetchError?.code === 'PGRST301')) {
          // Retry on transient errors
          log.warn(`⚠️  Prediction fetch failed (retry ${retryCount + 1}/${maxRetries}): ${fetchError?.message || 'not found'}`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.recordOutcome(predictionId, actualValue, context, retryCount + 1);
        }
        log.warn(`⚠️  Prediction not found: ${predictionId.substring(0, 8)}... (error: ${fetchError?.message || 'not found'})`);
        return null;
      }

      // Calculate error
      const error = Math.abs(prediction.predicted_value - actualValue);

      // Update prediction with actual value
      const { data: updated, error: updateError } = await this.supabase
        .from('ml_predictions')
        .update({
          actual_value: actualValue,
          error: error,
          context: {
            ...prediction.context,
            ...context,
            feedback_collected_at: new Date().toISOString(),
            retry_count: retryCount
          }
        })
        .eq('id', predictionId)
        .select()
        .single();

      if (updateError) {
        if (retryCount < maxRetries && (updateError.code === 'PGRST301' || updateError.code === '23505')) {
          // Retry on transient errors (connection issues, constraint violations)
          log.warn(`⚠️  Update failed (retry ${retryCount + 1}/${maxRetries}): ${updateError.message}`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.recordOutcome(predictionId, actualValue, context, retryCount + 1);
        }
        log.error(`Failed to update prediction: ${updateError.message}`);
        return null;
      }

      log.info(`✅ Recorded outcome for prediction ${predictionId}: ${actualValue} (error: ${error.toFixed(3)})`);

      // Record learning from feedback
      try {
        const { recordLearningFromFeedback } = require('./learningIntegration');
        await recordLearningFromFeedback(
          predictionId,
          actualValue,
          prediction.predicted_value,
          {
            serviceName: prediction.service_name,
            predictionType: prediction.prediction_type,
            modelVersion: prediction.model_version,
            ...context
          }
        );
      } catch (error) {
        // Non-critical - learning integration is optional
        log.debug('[Feedback Collector] Learning integration failed:', error.message);
      }
      return updated;
    } catch (error) {
      if (retryCount < maxRetries && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT')) {
        // Retry on network errors
        log.warn(`⚠️  Network error (retry ${retryCount + 1}/${maxRetries}): ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.recordOutcome(predictionId, actualValue, context, retryCount + 1);
      }
      log.error('Failed to record outcome:', error.message);
      return null;
    }
  }

  /**
   * Collect feedback from user/system
   */
  async collectFeedback(feedbackData) {
    if (!this.initialized) await this.initialize();
    if (!this.supabase) {
      log.warn('⚠️  Supabase not configured - cannot collect feedback');
      return null;
    }

    const {
      predictionId,
      serviceName,
      feedbackType = 'user',
      feedbackScore,
      feedbackText,
      userId,
      metadata = {}
    } = feedbackData;

    try {
      // Write to ml_feedback table
      const { data: feedback, error: feedbackError } = await this.supabase
        .from('ml_feedback')
        .insert({
          prediction_id: predictionId || null,
          service_name: serviceName,
          feedback_type: feedbackType,
          feedback_score: feedbackScore,
          feedback_text: feedbackText,
          user_id: userId || null,
          metadata: metadata
        })
        .select()
        .single();

      if (feedbackError) {
        log.error(`Failed to write feedback: ${feedbackError.message}`);
        return null;
      }

      // If feedback includes actual value, update prediction
      if (feedbackScore !== null && feedbackScore !== undefined && predictionId) {
        await this.recordOutcome(predictionId, feedbackScore, {
          feedback_id: feedback.id,
          feedback_type: feedbackType,
          feedback_text: feedbackText
        });
      }

      log.info(`✅ Collected feedback for ${serviceName}: ${feedbackScore}`);
      return feedback;
    } catch (error) {
      log.error('Failed to collect feedback:', error.message);
      return null;
    }
  }

  /**
   * Get feedback collection statistics
   */
  async getFeedbackStats(serviceName = null, days = 7) {
    if (!this.initialized) await this.initialize();
    if (!this.supabase) {
      log.warn('⚠️  Supabase not configured - cannot get feedback stats');
      return null;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Get total predictions
      let predictionsQuery = this.supabase
        .from('ml_predictions')
        .select('id, service_name, actual_value', { count: 'exact' })
        .gte('created_at', cutoffDate.toISOString());

      if (serviceName) {
        predictionsQuery = predictionsQuery.eq('service_name', serviceName);
      }

      const { data: predictions, count: totalPredictions, error: predictionsError } = await predictionsQuery;

      if (predictionsError) {
        log.error(`Failed to get predictions: ${predictionsError.message}`);
        return null;
      }

      // Count predictions with feedback
      const withFeedback = predictions?.filter(p => p.actual_value !== null && p.actual_value !== undefined) || [];
      const feedbackRate = totalPredictions > 0 ? (withFeedback.length / totalPredictions) * 100 : 0;

      // Get feedback by service
      const feedbackByService = {};
      predictions?.forEach(p => {
        if (p.actual_value !== null && p.actual_value !== undefined) {
          feedbackByService[p.service_name] = (feedbackByService[p.service_name] || 0) + 1;
        }
      });

      return {
        totalPredictions,
        predictionsWithFeedback: withFeedback.length,
        feedbackRate: feedbackRate.toFixed(2),
        feedbackByService,
        days,
        serviceName: serviceName || 'all'
      };
    } catch (error) {
      log.error('Failed to get feedback stats:', error.message);
      return null;
    }
  }

  /**
   * Monitor feedback collection and alert if rate is low
   */
  async monitorFeedbackCollection(alertThreshold = 1.0) {
    if (!this.initialized) await this.initialize();
    if (!this.supabase) {
      log.warn('⚠️  Supabase not configured - cannot monitor feedback');
      return null;
    }

    try {
      const stats = await this.getFeedbackStats(null, 7);
      if (!stats) {
        return null;
      }

      const feedbackRate = parseFloat(stats.feedbackRate);
      
      if (feedbackRate < alertThreshold) {
        log.warn(`⚠️  LOW FEEDBACK RATE: ${feedbackRate}% (threshold: ${alertThreshold}%)`);
        log.warn(`   Total predictions: ${stats.totalPredictions}`);
        log.warn(`   With feedback: ${stats.predictionsWithFeedback}`);
        log.warn(`   Feedback by service:`, stats.feedbackByService);
        return {
          alert: true,
          feedbackRate,
          threshold: alertThreshold,
          ...stats
        };
      }

      log.info(`✅ Feedback rate healthy: ${feedbackRate}% (${stats.predictionsWithFeedback}/${stats.totalPredictions} predictions)`);
      return {
        alert: false,
        feedbackRate,
        ...stats
      };
    } catch (error) {
      log.error('Failed to monitor feedback collection:', error.message);
      return null;
    }
  }

  /**
   * Get predictions without actual values
   * These are candidates for feedback collection
   */
  async getPredictionsNeedingFeedback(options = {}) {
    if (!this.initialized) await this.initialize();
    if (!this.supabase) {
      return [];
    }

    const {
      serviceName = null,
      limit = 100,
      daysOld = 7
    } = options;

    try {
      let query = this.supabase
        .from('ml_predictions')
        .select('*')
        .is('actual_value', null)
        .gte('created_at', new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (serviceName) {
        query = query.eq('service_name', serviceName);
      }

      const { data: predictions, error } = await query;

      if (error) {
        log.error(`Failed to fetch predictions: ${error.message}`);
        return [];
      }

      return predictions || [];
    } catch (error) {
      log.error('Failed to get predictions needing feedback:', error.message);
      return [];
    }
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats() {
    if (!this.initialized) await this.initialize();
    if (!this.supabase) {
      return null;
    }

    try {
      // Total predictions
      const { count: totalPredictions } = await this.supabase
        .from('ml_predictions')
        .select('*', { count: 'exact', head: true });

      // Predictions with actuals
      const { count: withActuals } = await this.supabase
        .from('ml_predictions')
        .select('*', { count: 'exact', head: true })
        .not('actual_value', 'is', null);

      // Total feedback
      const { count: totalFeedback } = await this.supabase
        .from('ml_feedback')
        .select('*', { count: 'exact', head: true });

      // Auto-collected feedback (from context)
      const { data: autoCollectedData } = await this.supabase
        .from('ml_predictions')
        .select('context')
        .not('actual_value', 'is', null)
        .not('context', 'is', null);

      let autoCollected = 0;
      if (autoCollectedData) {
        autoCollected = autoCollectedData.filter(pred => 
          pred.context && (pred.context.autoCollected === true || pred.context.source === 'auto_action' || pred.context.source === 'auto_outcome')
        ).length;
      }

      const manualCollected = (withActuals || 0) - autoCollected;

      return {
        totalPredictions: totalPredictions || 0,
        withActuals: withActuals || 0,
        withoutActuals: (totalPredictions || 0) - (withActuals || 0),
        totalFeedback: totalFeedback || 0,
        autoCollected: autoCollected,
        manualCollected: manualCollected,
        feedbackRate: totalPredictions > 0 
          ? ((withActuals || 0) / totalPredictions)
          : 0
      };
    } catch (error) {
      log.error('Failed to get feedback stats:', error.message);
      return null;
    }
  }
}

// Singleton instance
let instance = null;

async function getFeedbackCollector() {
  if (!instance) {
    instance = new FeedbackCollector();
    await instance.initialize();
  }
  return instance;
}

module.exports = {
  FeedbackCollector,
  getFeedbackCollector
};

