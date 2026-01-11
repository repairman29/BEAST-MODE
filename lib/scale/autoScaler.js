/**
 * Auto-Scaler Service
 * Automatically scales resources based on demand
 * 
 * Month 10: Scale & Performance
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
const logger = createLogger('AutoScaler');

class AutoScaler {
  constructor() {
    this.scalingHistory = [];
    this.currentInstances = 1;
    this.minInstances = 1;
    this.maxInstances = 10;
    this.scalingPolicies = {
      cpu: { threshold: 80, scaleUp: 2, scaleDown: 0.5 },
      memory: { threshold: 85, scaleUp: 2, scaleDown: 0.5 },
      requests: { threshold: 100, scaleUp: 2, scaleDown: 0.5 }
    };
  }

  /**
   * Initialize auto-scaler
   */
  async initialize(options = {}) {
    try {
      this.config = {
        minInstances: 1,
        maxInstances: 10,
        scaleUpCooldown: 300000, // 5 minutes
        scaleDownCooldown: 600000, // 10 minutes
        ...options
      };

      this.minInstances = this.config.minInstances;
      this.maxInstances = this.config.maxInstances;
      this.lastScaleUp = 0;
      this.lastScaleDown = 0;

      logger.info('✅ Auto-scaler initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize auto-scaler:', error);
      return false;
    }
  }

  /**
   * Evaluate scaling needs
   */
  async evaluateScaling(metrics) {
    try {
      const {
        cpuUsage = 0,
        memoryUsage = 0,
        requestRate = 0,
        responseTime = 0
      } = metrics;

      const decisions = [];

      // Check CPU-based scaling
      if (cpuUsage > this.scalingPolicies.cpu.threshold) {
        decisions.push({
          reason: 'high_cpu',
          metric: 'cpu',
          value: cpuUsage,
          threshold: this.scalingPolicies.cpu.threshold,
          action: 'scale_up',
          factor: this.scalingPolicies.cpu.scaleUp
        });
      } else if (cpuUsage < this.scalingPolicies.cpu.threshold * 0.5) {
        decisions.push({
          reason: 'low_cpu',
          metric: 'cpu',
          value: cpuUsage,
          threshold: this.scalingPolicies.cpu.threshold,
          action: 'scale_down',
          factor: this.scalingPolicies.cpu.scaleDown
        });
      }

      // Check memory-based scaling
      if (memoryUsage > this.scalingPolicies.memory.threshold) {
        decisions.push({
          reason: 'high_memory',
          metric: 'memory',
          value: memoryUsage,
          threshold: this.scalingPolicies.memory.threshold,
          action: 'scale_up',
          factor: this.scalingPolicies.memory.scaleUp
        });
      } else if (memoryUsage < this.scalingPolicies.memory.threshold * 0.5) {
        decisions.push({
          reason: 'low_memory',
          metric: 'memory',
          value: memoryUsage,
          threshold: this.scalingPolicies.memory.threshold,
          action: 'scale_down',
          factor: this.scalingPolicies.memory.scaleDown
        });
      }

      // Check request-based scaling
      if (requestRate > this.scalingPolicies.requests.threshold) {
        decisions.push({
          reason: 'high_requests',
          metric: 'requests',
          value: requestRate,
          threshold: this.scalingPolicies.requests.threshold,
          action: 'scale_up',
          factor: this.scalingPolicies.requests.scaleUp
        });
      } else if (requestRate < this.scalingPolicies.requests.threshold * 0.3) {
        decisions.push({
          reason: 'low_requests',
          metric: 'requests',
          value: requestRate,
          threshold: this.scalingPolicies.requests.threshold,
          action: 'scale_down',
          factor: this.scalingPolicies.requests.scaleDown
        });
      }

      // Execute scaling decision
      if (decisions.length > 0) {
        const primaryDecision = decisions[0];
        await this.executeScaling(primaryDecision);
      }

      return decisions;
    } catch (error) {
      logger.error('Scaling evaluation failed:', error);
      return [];
    }
  }

  /**
   * Execute scaling
   */
  async executeScaling(decision) {
    try {
      const now = Date.now();

      // Check cooldown periods
      if (decision.action === 'scale_up' && now - this.lastScaleUp < this.config.scaleUpCooldown) {
        logger.info('Scale-up cooldown active, skipping');
        return false;
      }

      if (decision.action === 'scale_down' && now - this.lastScaleDown < this.config.scaleDownCooldown) {
        logger.info('Scale-down cooldown active, skipping');
        return false;
      }

      // Calculate new instance count
      let newInstances = this.currentInstances;
      
      if (decision.action === 'scale_up') {
        newInstances = Math.min(
          Math.ceil(this.currentInstances * decision.factor),
          this.maxInstances
        );
      } else if (decision.action === 'scale_down') {
        newInstances = Math.max(
          Math.floor(this.currentInstances * decision.factor),
          this.minInstances
        );
      }

      // Only scale if change is significant
      if (newInstances === this.currentInstances) {
        return false;
      }

      // Execute scaling (simulated)
      const oldInstances = this.currentInstances;
      this.currentInstances = newInstances;

      // Record scaling event
      const scalingEvent = {
        id: `scale_${Date.now()}`,
        action: decision.action,
        reason: decision.reason,
        oldInstances,
        newInstances,
        decision,
        timestamp: Date.now()
      };

      this.scalingHistory.push(scalingEvent);

      if (decision.action === 'scale_up') {
        this.lastScaleUp = now;
      } else {
        this.lastScaleDown = now;
      }

      logger.info(`Scaling ${decision.action}: ${oldInstances} -> ${newInstances} instances (${decision.reason})`);

      // Keep only last 1000 scaling events
      if (this.scalingHistory.length > 1000) {
        this.scalingHistory.shift();
      }

      return scalingEvent;
    } catch (error) {
      logger.error('Scaling execution failed:', error);
      return null;
    }
  }

  /**
   * Get scaling status
   */
  getScalingStatus() {
    return {
      currentInstances: this.currentInstances,
      minInstances: this.minInstances,
      maxInstances: this.maxInstances,
      lastScaleUp: this.lastScaleUp,
      lastScaleDown: this.lastScaleDown,
      scalingHistory: this.scalingHistory.slice(-10),
      timestamp: Date.now()
    };
  }

  /**
   * Get scaling statistics
   */
  getScalingStatistics() {
    const scaleUps = this.scalingHistory.filter(e => e.action === 'scale_up').length;
    const scaleDowns = this.scalingHistory.filter(e => e.action === 'scale_down').length;

    return {
      totalScalingEvents: this.scalingHistory.length,
      scaleUps,
      scaleDowns,
      currentInstances: this.currentInstances,
      timestamp: Date.now()
    };
  }
}

// Singleton instance
let instance = null;

function getAutoScaler() {
  if (!instance) {
    instance = new AutoScaler();
  }
  return instance;
}

module.exports = {
  AutoScaler,
  getAutoScaler
};

