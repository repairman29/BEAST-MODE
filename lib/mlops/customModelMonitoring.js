/**
 * Custom Model Monitoring
 * 
 * Tracks usage, performance, and cost savings for custom models
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('CustomModelMonitoring');

class CustomModelMonitoring {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byModel: new Map(),
        byEndpoint: new Map(),
        success: 0,
        failures: 0
      },
      performance: {
        latencies: [],
        averageLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0
      },
      costs: {
        customModelCost: 0,
        providerModelCost: 0,
        savings: 0
      },
      errors: []
    };
    
    this.maxHistory = 1000;
  }

  /**
   * Record a custom model request
   */
  recordRequest(modelId, endpoint, latency, success, error = null, usage = null) {
    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.failures++;
      if (error) {
        this.metrics.errors.push({
          modelId,
          endpoint,
          error: error.message || error,
          timestamp: new Date().toISOString()
        });
        // Keep only last 100 errors
        if (this.metrics.errors.length > 100) {
          this.metrics.errors.shift();
        }
      }
    }

    // Track by model
    const modelCount = this.metrics.requests.byModel.get(modelId) || 0;
    this.metrics.requests.byModel.set(modelId, modelCount + 1);

    // Track by endpoint
    const endpointCount = this.metrics.requests.byEndpoint.get(endpoint) || 0;
    this.metrics.requests.byEndpoint.set(endpoint, endpointCount + 1);

    // Track latency
    if (latency !== undefined && latency !== null) {
      this.metrics.performance.latencies.push(latency);
      if (this.metrics.performance.latencies.length > this.maxHistory) {
        this.metrics.performance.latencies.shift();
      }

      // Calculate percentiles
      const sorted = [...this.metrics.performance.latencies].sort((a, b) => a - b);
      const len = sorted.length;
      this.metrics.performance.averageLatency = 
        sorted.reduce((a, b) => a + b, 0) / len;
      this.metrics.performance.p50Latency = sorted[Math.floor(len * 0.5)] || 0;
      this.metrics.performance.p95Latency = sorted[Math.floor(len * 0.95)] || 0;
      this.metrics.performance.p99Latency = sorted[Math.floor(len * 0.99)] || 0;
    }

    // Calculate cost savings
    if (usage && usage.total_tokens) {
      const customCost = (usage.total_tokens / 1000) * 0.001; // $0.001 per 1K tokens
      const providerCost = (usage.total_tokens / 1000) * 0.03; // $0.03 per 1K tokens (GPT-4)
      const savings = providerCost - customCost;

      this.metrics.costs.customModelCost += customCost;
      this.metrics.costs.providerModelCost += providerCost;
      this.metrics.costs.savings += savings;
    }

    // Write to database if available
    this.writeToDatabase(modelId, endpoint, latency, success, usage).catch(err => {
      log.warn('Failed to write to database:', err.message);
    });
  }

  /**
   * Write metrics to database
   */
  async writeToDatabase(modelId, endpoint, latency, success, usage) {
    try {
      const { getDatabaseWriter } = require('./databaseWriter');
      const dbWriter = getDatabaseWriter();
      
      if (!dbWriter || !dbWriter.initialized) {
        return; // Database not available
      }

      await dbWriter.writePrediction({
        serviceName: 'custom-models',
        predictionType: 'code-generation',
        predictedValue: success ? 1 : 0,
        actualValue: success ? 1 : 0,
        confidence: 1.0,
        context: {
          modelId,
          endpoint,
          latency,
          usage,
          timestamp: new Date().toISOString()
        },
        modelVersion: modelId,
        source: 'custom_model'
      });
    } catch (error) {
      // Non-critical - just log
      log.debug('Database write failed (non-critical):', error.message);
    }
  }

  /**
   * Get metrics summary
   */
  getMetrics() {
    const successRate = this.metrics.requests.total > 0
      ? (this.metrics.requests.success / this.metrics.requests.total) * 100
      : 0;

    const savingsPercent = this.metrics.costs.providerModelCost > 0
      ? (this.metrics.costs.savings / this.metrics.costs.providerModelCost) * 100
      : 0;

    return {
      requests: {
        total: this.metrics.requests.total,
        success: this.metrics.requests.success,
        failures: this.metrics.requests.failures,
        successRate: successRate.toFixed(2) + '%',
        byModel: Object.fromEntries(this.metrics.requests.byModel),
        byEndpoint: Object.fromEntries(this.metrics.requests.byEndpoint)
      },
      performance: {
        averageLatency: this.metrics.performance.averageLatency.toFixed(2) + 'ms',
        p50Latency: this.metrics.performance.p50Latency.toFixed(2) + 'ms',
        p95Latency: this.metrics.performance.p95Latency.toFixed(2) + 'ms',
        p99Latency: this.metrics.performance.p99Latency.toFixed(2) + 'ms'
      },
      costs: {
        customModelCost: '$' + this.metrics.costs.customModelCost.toFixed(4),
        providerModelCost: '$' + this.metrics.costs.providerModelCost.toFixed(4),
        savings: '$' + this.metrics.costs.savings.toFixed(4),
        savingsPercent: savingsPercent.toFixed(1) + '%'
      },
      errors: this.metrics.errors.slice(-10) // Last 10 errors
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const successRate = this.metrics.requests.total > 0
      ? (this.metrics.requests.success / this.metrics.requests.total) * 100
      : 100;

    const avgLatency = this.metrics.performance.averageLatency;

    let status = 'healthy';
    let issues = [];

    if (successRate < 90) {
      status = 'degraded';
      issues.push(`Low success rate: ${successRate.toFixed(1)}%`);
    }

    if (avgLatency > 5000) {
      status = 'degraded';
      issues.push(`High latency: ${avgLatency.toFixed(0)}ms`);
    }

    if (this.metrics.requests.failures > this.metrics.requests.success) {
      status = 'unhealthy';
      issues.push('More failures than successes');
    }

    return {
      status,
      successRate: successRate.toFixed(1) + '%',
      averageLatency: avgLatency.toFixed(0) + 'ms',
      totalRequests: this.metrics.requests.total,
      issues
    };
  }

  /**
   * Reset metrics (for testing)
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        byModel: new Map(),
        byEndpoint: new Map(),
        success: 0,
        failures: 0
      },
      performance: {
        latencies: [],
        averageLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0
      },
      costs: {
        customModelCost: 0,
        providerModelCost: 0,
        savings: 0
      },
      errors: []
    };
  }
}

// Singleton instance
let customModelMonitoring = null;

function getCustomModelMonitoring() {
  if (!customModelMonitoring) {
    customModelMonitoring = new CustomModelMonitoring();
  }
  return customModelMonitoring;
}

module.exports = {
  CustomModelMonitoring,
  getCustomModelMonitoring
};
