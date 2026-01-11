/**
 * Advanced Scaler Service
 * Predictive scaling, scheduled scaling, cost-aware scaling
 * 
 * Month 10: Advanced Scaling & Performance Monitoring
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
const { getAutoScaler } = require('./autoScaler');
const logger = createLogger('AdvancedScaler');

class AdvancedScaler {
  constructor() {
    this.schedules = [];
    this.predictions = [];
    this.costHistory = [];
  }

  /**
   * Initialize advanced scaler
   */
  async initialize() {
    try {
      this.autoScaler = getAutoScaler();
      await this.autoScaler.initialize();
      logger.info('✅ Advanced scaler initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize advanced scaler:', error);
      return false;
    }
  }

  /**
   * Predictive scaling based on forecast
   */
  async predictiveScale(forecast, options = {}) {
    try {
      const {
        lookahead = 3600000, // 1 hour
        confidence = 0.7
      } = options;

      logger.info(`Predictive scaling: ${lookahead}ms lookahead, ${confidence} confidence`);

      // Analyze forecast
      const analysis = this.analyzeForecast(forecast, lookahead);

      // Predict required instances
      const predictedInstances = this.predictInstances(analysis, confidence);

      // Get current instances
      const currentStatus = this.autoScaler.getScalingStatus();
      const currentInstances = currentStatus.currentInstances;

      // Scale if needed
      if (predictedInstances !== currentInstances) {
        const scaling = await this.scaleToInstances(predictedInstances, 'predictive');
        
        const prediction = {
          id: `prediction_${Date.now()}`,
          forecast,
          analysis,
          predictedInstances,
          currentInstances,
          scaling,
          confidence,
          timestamp: Date.now()
        };

        this.predictions.push(prediction);
        return prediction;
      }

      return {
        predictedInstances,
        currentInstances,
        action: 'no_change',
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Predictive scaling failed:', error);
      return null;
    }
  }

  /**
   * Analyze forecast
   */
  analyzeForecast(forecast, lookahead) {
    const now = Date.now();
    const futureTime = now + lookahead;

    // Find forecast points within lookahead
    const relevantPoints = forecast.filter(f => f.timestamp <= futureTime);

    if (relevantPoints.length === 0) {
      return { maxLoad: 0, avgLoad: 0, trend: 'stable' };
    }

    const loads = relevantPoints.map(f => f.load || f.value || 0);
    const maxLoad = Math.max(...loads);
    const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;

    // Calculate trend
    const firstHalf = loads.slice(0, Math.floor(loads.length / 2));
    const secondHalf = loads.slice(Math.floor(loads.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let trend = 'stable';
    if (secondAvg > firstAvg * 1.1) trend = 'increasing';
    else if (secondAvg < firstAvg * 0.9) trend = 'decreasing';

    return {
      maxLoad,
      avgLoad,
      trend,
      points: relevantPoints.length
    };
  }

  /**
   * Predict required instances
   */
  predictInstances(analysis, confidence) {
    // Simplified prediction: instances = load / capacity_per_instance
    const capacityPerInstance = 100; // requests per second per instance
    const requiredCapacity = analysis.maxLoad * confidence;
    const instances = Math.ceil(requiredCapacity / capacityPerInstance);

    return Math.max(1, Math.min(instances, 20)); // Min 1, max 20
  }

  /**
   * Scale to specific instance count
   */
  async scaleToInstances(targetInstances, reason) {
    const currentStatus = this.autoScaler.getScalingStatus();
    const currentInstances = currentStatus.currentInstances;

    if (targetInstances === currentInstances) {
      return { action: 'no_change', instances: currentInstances };
    }

    // Simulate scaling
    const action = targetInstances > currentInstances ? 'scale_up' : 'scale_down';
    
    // Use auto-scaler's evaluateScaling with synthetic metrics
    const metrics = {
      cpuUsage: targetInstances > currentInstances ? 90 : 30,
      memoryUsage: targetInstances > currentInstances ? 85 : 40,
      requestRate: targetInstances * 100
    };

    await this.autoScaler.evaluateScaling(metrics);

    return {
      action,
      from: currentInstances,
      to: targetInstances,
      reason,
      timestamp: Date.now()
    };
  }

  /**
   * Schedule scaling
   */
  scheduleScaling(schedule) {
    try {
      const scheduled = {
        id: `schedule_${Date.now()}`,
        name: schedule.name,
        cron: schedule.cron,
        targetInstances: schedule.targetInstances,
        enabled: schedule.enabled !== false,
        createdAt: Date.now()
      };

      this.schedules.push(scheduled);
      logger.info(`Scaling schedule created: ${scheduled.name}`);

      return scheduled;
    } catch (error) {
      logger.error('Schedule creation failed:', error);
      return null;
    }
  }

  /**
   * Cost-aware scaling
   */
  async costAwareScale(metrics, costConstraints) {
    try {
      const {
        maxCost = Infinity,
        costPerInstance = 0.1,
        budget = Infinity
      } = costConstraints;

      // Calculate current cost
      const currentStatus = this.autoScaler.getScalingStatus();
      const currentInstances = currentStatus.currentInstances;
      const currentCost = currentInstances * costPerInstance;

      // Evaluate scaling needs
      const decisions = await this.autoScaler.evaluateScaling(metrics);

      if (decisions.length === 0) {
        return { action: 'no_change', cost: currentCost };
      }

      const decision = decisions[0];
      let targetInstances = currentInstances;

      if (decision.action === 'scale_up') {
        targetInstances = Math.min(
          Math.ceil(currentInstances * decision.factor),
          Math.floor(maxCost / costPerInstance)
        );
      } else {
        targetInstances = Math.max(
          Math.floor(currentInstances * decision.factor),
          1
        );
      }

      const newCost = targetInstances * costPerInstance;

      // Check budget
      if (newCost > budget) {
        logger.warn(`Scaling would exceed budget: ${newCost} > ${budget}`);
        return { action: 'budget_exceeded', cost: currentCost };
      }

      // Scale
      const scaling = await this.scaleToInstances(targetInstances, 'cost_aware');

      // Record cost
      this.costHistory.push({
        instances: targetInstances,
        cost: newCost,
        timestamp: Date.now()
      });

      return {
        ...scaling,
        cost: newCost,
        savings: currentCost - newCost
      };
    } catch (error) {
      logger.error('Cost-aware scaling failed:', error);
      return null;
    }
  }

  /**
   * Multi-metric scaling
   */
  async multiMetricScale(metrics) {
    try {
      // Evaluate each metric
      const evaluations = await Promise.all([
        this.autoScaler.evaluateScaling({ ...metrics, cpuUsage: metrics.cpuUsage }),
        this.autoScaler.evaluateScaling({ ...metrics, memoryUsage: metrics.memoryUsage }),
        this.autoScaler.evaluateScaling({ ...metrics, requestRate: metrics.requestRate })
      ]);

      // Combine decisions
      const decisions = evaluations.flat();

      // Find consensus
      const scaleUpCount = decisions.filter(d => d.action === 'scale_up').length;
      const scaleDownCount = decisions.filter(d => d.action === 'scale_down').length;

      let action = 'no_change';
      if (scaleUpCount >= 2) {
        action = 'scale_up';
      } else if (scaleDownCount >= 2) {
        action = 'scale_down';
      }

      if (action !== 'no_change') {
        const currentStatus = this.autoScaler.getScalingStatus();
        const factor = action === 'scale_up' ? 2 : 0.5;
        const targetInstances = action === 'scale_up'
          ? Math.min(Math.ceil(currentStatus.currentInstances * factor), 20)
          : Math.max(Math.floor(currentStatus.currentInstances * factor), 1);

        return await this.scaleToInstances(targetInstances, 'multi_metric');
      }

      return { action: 'no_change' };
    } catch (error) {
      logger.error('Multi-metric scaling failed:', error);
      return null;
    }
  }

  /**
   * Get scaling statistics
   */
  getScalingStatistics() {
    return {
      predictions: this.predictions.length,
      schedules: this.schedules.length,
      costHistory: this.costHistory.length,
      avgCost: this.costHistory.length > 0
        ? this.costHistory.reduce((sum, h) => sum + h.cost, 0) / this.costHistory.length
        : 0,
      timestamp: Date.now()
    };
  }
}

// Singleton instance
let instance = null;

function getAdvancedScaler() {
  if (!instance) {
    instance = new AdvancedScaler();
  }
  return instance;
}

module.exports = {
  AdvancedScaler,
  getAdvancedScaler
};

