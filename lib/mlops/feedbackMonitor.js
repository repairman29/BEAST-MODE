/**
 * Feedback Monitor Service
 * Monitors feedback collection rates and alerts when rates are low
 * 
 * Phase 2: Improve Feedback Collection
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('FeedbackMonitor');

class FeedbackMonitor {
  constructor() {
    this.supabase = null;
    this.initialized = false;
    this.monitoringInterval = null;
    this.alertThreshold = 0.05; // 5% feedback rate threshold
    this.checkInterval = 60 * 60 * 1000; // Check every hour
  }

  /**
   * Initialize Supabase connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const path = require('path');
      const fs = require('fs');
      
      // Load .env.local from website directory
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
      log.info('✅ Feedback monitor initialized');
    } catch (error) {
      log.error('Failed to initialize feedback monitor:', error.message);
      this.supabase = null;
      this.initialized = true;
    }
  }

  /**
   * Get feedback collection statistics
   */
  async getFeedbackStats(options = {}) {
    if (!this.initialized) await this.initialize();
    if (!this.supabase) {
      return { error: 'Supabase not configured' };
    }

    try {
      const { days = 7, serviceName = null } = options;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Get total predictions
      let predictionsQuery = this.supabase
        .from('ml_predictions')
        .select('id, service_name, created_at', { count: 'exact' })
        .gte('created_at', cutoffDate.toISOString());

      if (serviceName) {
        predictionsQuery = predictionsQuery.eq('service_name', serviceName);
      }

      const { data: predictions, count: totalPredictions, error: predictionsError } = 
        await predictionsQuery;

      if (predictionsError) {
        log.error('Error fetching predictions:', predictionsError);
        return { error: predictionsError.message };
      }

      // Get predictions with feedback
      let feedbackQuery = this.supabase
        .from('ml_predictions')
        .select('id, service_name, created_at', { count: 'exact' })
        .gte('created_at', cutoffDate.toISOString())
        .not('actual_value', 'is', null);

      if (serviceName) {
        feedbackQuery = feedbackQuery.eq('service_name', serviceName);
      }

      const { count: predictionsWithFeedback, error: feedbackError } = 
        await feedbackQuery;

      if (feedbackError) {
        log.error('Error fetching feedback:', feedbackError);
        return { error: feedbackError.message };
      }

      const feedbackRate = totalPredictions > 0 
        ? (predictionsWithFeedback || 0) / totalPredictions 
        : 0;

      // Get breakdown by service
      const serviceBreakdown = {};
      if (predictions) {
        const serviceGroups = {};
        predictions.forEach(pred => {
          const service = pred.service_name || 'unknown';
          if (!serviceGroups[service]) {
            serviceGroups[service] = { total: 0, withFeedback: 0 };
          }
          serviceGroups[service].total++;
        });

        // Get feedback counts by service
        const { data: feedbackData } = await this.supabase
          .from('ml_predictions')
          .select('service_name')
          .gte('created_at', cutoffDate.toISOString())
          .not('actual_value', 'is', null);

        if (feedbackData) {
          feedbackData.forEach(pred => {
            const service = pred.service_name || 'unknown';
            if (serviceGroups[service]) {
              serviceGroups[service].withFeedback++;
            }
          });
        }

        Object.keys(serviceGroups).forEach(service => {
          const group = serviceGroups[service];
          serviceBreakdown[service] = {
            total: group.total,
            withFeedback: group.withFeedback,
            feedbackRate: group.total > 0 ? group.withFeedback / group.total : 0
          };
        });
      }

      return {
        totalPredictions: totalPredictions || 0,
        predictionsWithFeedback: predictionsWithFeedback || 0,
        feedbackRate: feedbackRate,
        alertThreshold: this.alertThreshold,
        needsAttention: feedbackRate < this.alertThreshold,
        serviceBreakdown: serviceBreakdown,
        days: days
      };
    } catch (error) {
      log.error('Error getting feedback stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Get predictions needing feedback
   */
  async getPredictionsNeedingFeedback(options = {}) {
    if (!this.initialized) await this.initialize();
    if (!this.supabase) {
      return { error: 'Supabase not configured', predictions: [] };
    }

    try {
      const { limit = 100, days = 7, serviceName = null } = options;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let query = this.supabase
        .from('ml_predictions')
        .select('*')
        .gte('created_at', cutoffDate.toISOString())
        .is('actual_value', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (serviceName) {
        query = query.eq('service_name', serviceName);
      }

      const { data: predictions, error } = await query;

      if (error) {
        log.error('Error fetching predictions needing feedback:', error);
        return { error: error.message, predictions: [] };
      }

      return {
        predictions: predictions || [],
        count: predictions?.length || 0
      };
    } catch (error) {
      log.error('Error getting predictions needing feedback:', error);
      return { error: error.message, predictions: [] };
    }
  }

  /**
   * Check feedback health and return status
   */
  async checkHealth() {
    const stats = await this.getFeedbackStats({ days: 7 });
    
    if (stats.error) {
      return {
        status: 'error',
        message: stats.error,
        healthy: false
      };
    }

    const { feedbackRate, needsAttention, serviceBreakdown } = stats;
    
    let status = 'healthy';
    let message = `Feedback rate: ${(feedbackRate * 100).toFixed(2)}%`;
    
    if (needsAttention) {
      status = 'needs-attention';
      message = `⚠️  Low feedback rate: ${(feedbackRate * 100).toFixed(2)}% (target: ${(this.alertThreshold * 100)}%)`;
    }

    // Check individual services
    const serviceIssues = [];
    Object.keys(serviceBreakdown).forEach(service => {
      const breakdown = serviceBreakdown[service];
      if (breakdown.feedbackRate < this.alertThreshold && breakdown.total > 10) {
        serviceIssues.push({
          service,
          feedbackRate: breakdown.feedbackRate,
          total: breakdown.total
        });
      }
    });

    if (serviceIssues.length > 0) {
      status = 'needs-attention';
      message += ` | ${serviceIssues.length} service(s) need attention`;
    }

    return {
      status,
      message,
      healthy: !needsAttention && serviceIssues.length === 0,
      stats,
      serviceIssues
    };
  }

  /**
   * Start monitoring feedback collection
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      log.warn('Monitoring already started');
      return;
    }

    log.info('Starting feedback monitoring...');
    
    // Initial check
    this.checkHealth().then(health => {
      if (!health.healthy) {
        log.warn(`[Feedback Monitor] ${health.message}`);
      } else {
        log.info(`[Feedback Monitor] ${health.message}`);
      }
    });

    // Periodic checks
    this.monitoringInterval = setInterval(async () => {
      const health = await this.checkHealth();
      if (!health.healthy) {
        log.warn(`[Feedback Monitor] ${health.message}`);
      }
    }, this.checkInterval);

    log.info(`Feedback monitoring started (checking every ${this.checkInterval / 1000 / 60} minutes)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      log.info('Feedback monitoring stopped');
    }
  }
}

// Singleton instance
let feedbackMonitor = null;

async function getFeedbackMonitor() {
  if (!feedbackMonitor) {
    feedbackMonitor = new FeedbackMonitor();
    await feedbackMonitor.initialize();
  }
  return feedbackMonitor;
}

module.exports = {
  FeedbackMonitor,
  getFeedbackMonitor
};
