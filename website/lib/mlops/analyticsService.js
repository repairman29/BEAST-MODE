/**
 * Advanced Analytics Service with Database Integration
 * Uses new analytics tables for dashboards, reports, trends, and user analytics
 * 
 * Dog Fooding: Built using BEAST MODE
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
const { getDatabaseWriter } = require('./databaseWriter');

const logger = createLogger('AnalyticsService');

class AnalyticsService {
  constructor() {
    this.databaseWriter = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.databaseWriter = getDatabaseWriter();
      this.initialized = true;
      logger.info('✅ Analytics service initialized with database integration');
      return true;
    } catch (error) {
      logger.error('Failed to initialize analytics service:', error);
      return false;
    }
  }

  /**
   * Create analytics dashboard
   */
  async createDashboard(userId, config) {
    if (!this.initialized) await this.initialize();

    const { name, description, dashboardConfig, teamId, isShared, isPublic } = config;

    try {
      const result = await this.databaseWriter.write({
        table: 'analytics_dashboards',
        data: {
          user_id: userId,
          team_id: teamId,
          name,
          description,
          dashboard_config: dashboardConfig,
          is_shared: isShared || false,
          is_public: isPublic || false
        }
      });

      logger.info(`Created dashboard: ${name} (${result.id})`);
      return { success: true, id: result.id, dashboard: result };
    } catch (error) {
      logger.error('Failed to create dashboard:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport(dashboardId, userId, config) {
    if (!this.initialized) await this.initialize();

    const { reportName, reportType, reportData, filePath, fileSizeBytes } = config;

    try {
      const result = await this.databaseWriter.write({
        table: 'analytics_reports',
        data: {
          dashboard_id: dashboardId,
          user_id: userId,
          report_name: reportName,
          report_type: reportType || 'json',
          report_data: reportData,
          file_path: filePath,
          file_size_bytes: fileSizeBytes
        }
      });

      logger.info(`Generated report: ${reportName} (${result.id})`);
      return { success: true, id: result.id, report: result };
    } catch (error) {
      logger.error('Failed to generate report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record usage trend
   */
  async recordTrend(config) {
    if (!this.initialized) await this.initialize();

    const { userId, teamId, metricName, metricValue, metricUnit, periodStart, periodEnd, periodType } = config;

    try {
      const result = await this.databaseWriter.write({
        table: 'usage_trends',
        data: {
          user_id: userId,
          team_id: teamId,
          metric_name: metricName,
          metric_value: metricValue,
          metric_unit: metricUnit,
          period_start: periodStart,
          period_end: periodEnd,
          period_type: periodType || 'day'
        }
      });

      return { success: true, id: result.id };
    } catch (error) {
      logger.warn('Failed to record trend:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track user analytics event
   */
  async trackEvent(userId, event) {
    if (!this.initialized) await this.initialize();

    const { eventType, eventName, eventData, sessionId, properties } = event;

    try {
      const result = await this.databaseWriter.write({
        table: 'user_analytics',
        data: {
          user_id: userId,
          event_type: eventType,
          event_name: eventName,
          event_data: eventData || {},
          session_id: sessionId,
          properties: properties || {}
        }
      });

      return { success: true, id: result.id };
    } catch (error) {
      logger.warn('Failed to track event:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let instance = null;

function getAnalyticsService() {
  if (!instance) {
    instance = new AnalyticsService();
  }
  return instance;
}

module.exports = {
  AnalyticsService,
  getAnalyticsService
};
