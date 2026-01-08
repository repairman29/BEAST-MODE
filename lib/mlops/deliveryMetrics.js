/**
 * Delivery Metrics
 * 
 * Tracks time-to-code, feature completion, bug rates, and productivity metrics
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('DeliveryMetrics');

class DeliveryMetrics {
  constructor() {
    this.metrics = {
      features: [],
      bugs: [],
      timings: []
    };
  }

  /**
   * Record a feature generation
   */
  recordFeature(featureId, featureName, generationTime, filesGenerated, quality) {
    const feature = {
      id: featureId,
      name: featureName,
      generationTime,
      filesGenerated,
      quality,
      timestamp: new Date().toISOString()
    };

    this.metrics.features.push(feature);
    
    // Keep only last 1000 features
    if (this.metrics.features.length > 1000) {
      this.metrics.features.shift();
    }

    log.debug(`Recorded feature: ${featureName} (${generationTime}ms)`);
    return feature;
  }

  /**
   * Record a bug
   */
  recordBug(featureId, bugType, description, severity = 'medium') {
    const bug = {
      id: `bug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      featureId,
      bugType,
      description,
      severity,
      timestamp: new Date().toISOString()
    };

    this.metrics.bugs.push(bug);
    
    // Keep only last 1000 bugs
    if (this.metrics.bugs.length > 1000) {
      this.metrics.bugs.shift();
    }

    log.debug(`Recorded bug: ${bugType} for feature ${featureId}`);
    return bug;
  }

  /**
   * Get bug metrics
   */
  async getBugMetrics(userId, timeRange = '7d') {
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Filter bugs by time range
    const recentBugs = this.metrics.bugs.filter(
      bug => new Date(bug.timestamp) >= cutoffDate
    );

    // Filter features by time range
    const recentFeatures = this.metrics.features.filter(
      feature => new Date(feature.timestamp) >= cutoffDate
    );

    // Calculate bugs by feature
    const bugsByFeature = new Map();
    for (const bug of recentBugs) {
      const existing = bugsByFeature.get(bug.featureId) || { bugs: 0, feature: bug.featureId };
      existing.bugs++;
      bugsByFeature.set(bug.featureId, existing);
    }

    // Calculate bugs by category
    const bugsByCategory = {
      syntax: 0,
      logic: 0,
      performance: 0,
      security: 0,
      other: 0
    };

    for (const bug of recentBugs) {
      const category = bug.bugType?.toLowerCase() || 'other';
      if (category.includes('syntax') || category.includes('parse')) {
        bugsByCategory.syntax++;
      } else if (category.includes('logic') || category.includes('algorithm')) {
        bugsByCategory.logic++;
      } else if (category.includes('performance') || category.includes('speed')) {
        bugsByCategory.performance++;
      } else if (category.includes('security') || category.includes('vulnerability')) {
        bugsByCategory.security++;
      } else {
        bugsByCategory.other++;
      }
    }

    // Calculate trends (daily)
    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayBugs = recentBugs.filter(
        bug => {
          const bugDate = new Date(bug.timestamp);
          bugDate.setHours(0, 0, 0, 0);
          return bugDate.getTime() === date.getTime();
        }
      );

      const dayFeatures = recentFeatures.filter(
        feature => {
          const featureDate = new Date(feature.timestamp);
          featureDate.setHours(0, 0, 0, 0);
          return featureDate.getTime() === date.getTime();
        }
      );

      const rate = dayFeatures.length > 0 
        ? (dayBugs.length / dayFeatures.length) * 100 
        : 0;

      trends.push({
        date: date.toISOString(),
        count: dayBugs.length,
        rate
      });
    }

    // Calculate average bug rate
    const averageRate = recentFeatures.length > 0
      ? (recentBugs.length / recentFeatures.length) * 100
      : 0;

    // Convert bugs by feature to array
    const byFeature = Array.from(bugsByFeature.entries()).map(([featureId, data]) => {
      const feature = recentFeatures.find(f => f.id === featureId);
      const rate = feature ? (data.bugs / 1) * 100 : 0; // Simplified - 1 feature per entry
      return {
        feature: feature?.name || featureId,
        bugs: data.bugs,
        rate
      };
    });

    return {
      total: recentBugs.length,
      byFeature,
      byCategory: bugsByCategory,
      trends,
      averageRate
    };
  }

  /**
   * Get delivery metrics
   */
  getDeliveryMetrics(userId, timeRange = '7d') {
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentFeatures = this.metrics.features.filter(
      feature => new Date(feature.timestamp) >= cutoffDate
    );

    if (recentFeatures.length === 0) {
      return {
        totalFeatures: 0,
        avgTimeToCode: 0,
        avgQuality: 0,
        avgFilesPerFeature: 0,
        successRate: 0
      };
    }

    const avgTimeToCode = recentFeatures.reduce((sum, f) => sum + f.generationTime, 0) / recentFeatures.length;
    const avgQuality = recentFeatures.reduce((sum, f) => sum + (f.quality || 0), 0) / recentFeatures.length;
    const avgFilesPerFeature = recentFeatures.reduce((sum, f) => sum + f.filesGenerated, 0) / recentFeatures.length;

    return {
      totalFeatures: recentFeatures.length,
      avgTimeToCode,
      avgQuality,
      avgFilesPerFeature,
      successRate: 100 // Simplified - assume all features are successful
    };
  }

  /**
   * Reset metrics (for testing)
   */
  reset() {
    this.metrics = {
      features: [],
      bugs: [],
      timings: []
    };
    log.info('Delivery metrics reset');
  }
}

// Singleton instance
let deliveryMetricsInstance: DeliveryMetrics | null = null;

function getDeliveryMetrics() {
  if (!deliveryMetricsInstance) {
    deliveryMetricsInstance = new DeliveryMetrics();
  }
  return deliveryMetricsInstance;
}

module.exports = {
  DeliveryMetrics,
  getDeliveryMetrics
};
