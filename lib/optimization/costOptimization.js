/**
 * Cost Optimization Service
 * Tracks and optimizes ML system costs
 * 
 * Month 8: Advanced Optimization
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
const logger = createLogger('CostOptimization');

class CostOptimization {
  constructor() {
    this.costTracking = new Map();
    this.costPredictions = new Map();
    this.budgets = new Map();
    this.costHistory = [];
  }

  /**
   * Initialize cost optimization
   */
  async initialize() {
    try {
      logger.info('✅ Cost optimization initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize cost optimization:', error);
      return false;
    }
  }

  /**
   * Track cost for operation
   */
  trackCost(operation, cost, metadata = {}) {
    const costEntry = {
      operation,
      cost,
      timestamp: Date.now(),
      metadata
    };

    this.costHistory.push(costEntry);

    // Update cost tracking by operation type
    const current = this.costTracking.get(operation) || {
      total: 0,
      count: 0,
      avg: 0,
      lastCost: 0
    };

    current.total += cost;
    current.count++;
    current.avg = current.total / current.count;
    current.lastCost = cost;
    current.lastUpdated = Date.now();

    this.costTracking.set(operation, current);

    // Keep only last 10000 entries
    if (this.costHistory.length > 10000) {
      this.costHistory.shift();
    }

    logger.debug(`Cost tracked: ${operation} = $${cost.toFixed(4)}`);
    return costEntry;
  }

  /**
   * Get cost for operation
   */
  getOperationCost(operation) {
    return this.costTracking.get(operation) || null;
  }

  /**
   * Get total cost
   */
  getTotalCost(timeRange = null) {
    let costs = this.costHistory;

    if (timeRange) {
      const startTime = Date.now() - timeRange;
      costs = costs.filter(c => c.timestamp >= startTime);
    }

    return costs.reduce((sum, c) => sum + c.cost, 0);
  }

  /**
   * Predict cost
   */
  predictCost(operation, volume) {
    const operationCost = this.costTracking.get(operation);
    if (!operationCost) {
      return null;
    }

    // Simple prediction based on average cost
    const predictedCost = operationCost.avg * volume;

    const prediction = {
      operation,
      volume,
      predictedCost,
      confidence: 0.85,
      timestamp: Date.now()
    };

    this.costPredictions.set(`${operation}_${Date.now()}`, prediction);
    return prediction;
  }

  /**
   * Set budget
   */
  setBudget(tenantId, budget) {
    this.budgets.set(tenantId, {
      tenantId,
      budget,
      spent: 0,
      createdAt: Date.now(),
      alerts: []
    });

    logger.info(`Budget set for tenant ${tenantId}: $${budget}`);
    return this.budgets.get(tenantId);
  }

  /**
   * Check budget
   */
  checkBudget(tenantId) {
    const budget = this.budgets.get(tenantId);
    if (!budget) {
      return { withinBudget: true };
    }

    // Calculate spent (simplified - would track actual costs)
    const tenantCosts = this.costHistory.filter(c => 
      c.metadata.tenantId === tenantId
    );
    budget.spent = tenantCosts.reduce((sum, c) => sum + c.cost, 0);

    const percentage = (budget.spent / budget.budget) * 100;
    const withinBudget = budget.spent < budget.budget;

    // Alert thresholds
    if (percentage >= 90 && !budget.alerts.includes('90')) {
      budget.alerts.push('90');
      logger.warn(`Budget alert: Tenant ${tenantId} at 90% of budget`);
    }
    if (percentage >= 100 && !budget.alerts.includes('100')) {
      budget.alerts.push('100');
      logger.error(`Budget exceeded: Tenant ${tenantId} over budget`);
    }

    return {
      withinBudget,
      budget: budget.budget,
      spent: budget.spent,
      remaining: budget.budget - budget.spent,
      percentage: percentage.toFixed(2)
    };
  }

  /**
   * Optimize costs
   */
  optimizeCosts(tenantId = null) {
    const recommendations = [];

    // Analyze costs
    const operations = Array.from(this.costTracking.entries());
    const sortedByCost = operations.sort((a, b) => b[1].total - a[1].total);

    // Top cost drivers
    const topCostDrivers = sortedByCost.slice(0, 5);
    recommendations.push({
      type: 'top_cost_drivers',
      data: topCostDrivers.map(([op, cost]) => ({
        operation: op,
        totalCost: cost.total,
        avgCost: cost.avg,
        count: cost.count
      }))
    });

    // Cost reduction opportunities
    const highAvgCost = operations.filter(([op, cost]) => cost.avg > 0.01);
    if (highAvgCost.length > 0) {
      recommendations.push({
        type: 'high_cost_operations',
        data: highAvgCost.map(([op, cost]) => ({
          operation: op,
          avgCost: cost.avg,
          recommendation: 'Consider optimization or caching'
        }))
      });
    }

    // Budget recommendations
    if (tenantId) {
      const budgetCheck = this.checkBudget(tenantId);
      if (!budgetCheck.withinBudget) {
        recommendations.push({
          type: 'budget_exceeded',
          data: {
            tenantId,
            spent: budgetCheck.spent,
            budget: budgetCheck.budget,
            recommendation: 'Reduce usage or increase budget'
          }
        });
      }
    }

    return recommendations;
  }

  /**
   * Get cost analytics
   */
  getCostAnalytics(timeRange = 30 * 24 * 60 * 60 * 1000) {
    const startTime = Date.now() - timeRange;
    const recentCosts = this.costHistory.filter(c => c.timestamp >= startTime);

    const byOperation = {};
    for (const cost of recentCosts) {
      if (!byOperation[cost.operation]) {
        byOperation[cost.operation] = 0;
      }
      byOperation[cost.operation] += cost.cost;
    }

    const total = recentCosts.reduce((sum, c) => sum + c.cost, 0);
    const avgPerDay = total / (timeRange / (24 * 60 * 60 * 1000));

    return {
      total,
      avgPerDay,
      byOperation,
      timeRange,
      timestamp: Date.now()
    };
  }
}

// Singleton instance
let instance = null;

function getCostOptimization() {
  if (!instance) {
    instance = new CostOptimization();
  }
  return instance;
}

module.exports = {
  CostOptimization,
  getCostOptimization
};

