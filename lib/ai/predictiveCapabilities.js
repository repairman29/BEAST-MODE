/**
 * Predictive Capabilities
 * 
 * Bug prediction, quality forecasting, and performance predictions
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('PredictiveCapabilities');

class PredictiveCapabilities {
  constructor() {
    this.predictions = new Map(); // predictionId -> prediction data
    this.history = []; // Historical data for predictions
  }

  /**
   * Predict bugs in code
   */
  predictBugs(code, filePath, history = []) {
    const riskFactors = this.analyzeRiskFactors(code, filePath, history);
    const bugProbability = this.calculateBugProbability(riskFactors);
    const predictedBugs = this.identifyPotentialBugs(code, riskFactors);

    const prediction = {
      id: `bug-pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: filePath,
      bugProbability,
      riskFactors,
      predictedBugs,
      confidence: this.calculateConfidence(riskFactors),
      timestamp: new Date().toISOString()
    };

    this.predictions.set(prediction.id, prediction);
    log.info(`Bug prediction: ${filePath} (${(bugProbability * 100).toFixed(1)}% risk)`);
    return prediction;
  }

  /**
   * Analyze risk factors
   */
  analyzeRiskFactors(code, filePath, history) {
    const factors = {
      complexity: this.calculateComplexity(code),
      size: code.split('\n').length,
      testCoverage: this.estimateTestCoverage(filePath, history),
      recentChanges: this.countRecentChanges(filePath, history),
      errorHandling: this.assessErrorHandling(code),
      dependencies: this.countDependencies(code),
      codeSmells: this.detectCodeSmells(code)
    };

    // Calculate risk score
    factors.riskScore = (
      (factors.complexity > 10 ? 0.3 : 0) +
      (factors.size > 200 ? 0.2 : 0) +
      (factors.testCoverage < 0.5 ? 0.2 : 0) +
      (factors.recentChanges > 5 ? 0.15 : 0) +
      (factors.errorHandling < 0.5 ? 0.1 : 0) +
      (factors.codeSmells > 3 ? 0.05 : 0)
    );

    return factors;
  }

  /**
   * Calculate cyclomatic complexity
   */
  calculateComplexity(code) {
    const patterns = [
      /\bif\b/gi,
      /\belse\b/gi,
      /\bfor\b/gi,
      /\bwhile\b/gi,
      /\bswitch\b/gi,
      /\bcase\b/gi,
      /\bcatch\b/gi,
      /\?\s*.*\s*:/g // Ternary operators
    ];

    return patterns.reduce((sum, pattern) => {
      const matches = code.match(pattern);
      return sum + (matches ? matches.length : 0);
    }, 1); // Base complexity of 1
  }

  /**
   * Estimate test coverage
   */
  estimateTestCoverage(filePath, history) {
    // Check if test file exists
    const testFile = filePath.replace(/\.(js|ts|jsx|tsx)$/, '.test.$1') ||
                     filePath.replace(/\.(js|ts|jsx|tsx)$/, '.spec.$1');
    
    const hasTest = history.some(h => h.path === testFile);
    return hasTest ? 0.7 : 0.2; // Rough estimate
  }

  /**
   * Count recent changes
   */
  countRecentChanges(filePath, history) {
    const recent = history.filter(h => 
      h.path === filePath && 
      new Date(h.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    return recent.length;
  }

  /**
   * Assess error handling
   */
  assessErrorHandling(code) {
    const hasTryCatch = code.includes('try') && code.includes('catch');
    const hasErrorHandling = code.includes('catch') || code.includes('error');
    const asyncOperations = (code.match(/\bawait\b/g) || []).length;
    
    if (asyncOperations === 0) return 1.0;
    if (hasTryCatch) return 0.8;
    if (hasErrorHandling) return 0.5;
    return 0.2;
  }

  /**
   * Count dependencies
   */
  countDependencies(code) {
    const importPattern = /(?:import|require)\(?['"](.+?)['"]\)?/g;
    const matches = code.match(importPattern);
    return matches ? matches.length : 0;
  }

  /**
   * Detect code smells
   */
  detectCodeSmells(code) {
    let smells = 0;

    // Long function
    if (code.split('\n').length > 50) smells++;

    // Magic numbers
    if ((code.match(/\b\d{3,}\b/g) || []).length > 5) smells++;

    // Deep nesting
    const maxNesting = this.calculateMaxNesting(code);
    if (maxNesting > 4) smells++;

    // Duplicate code patterns
    if (this.hasDuplicatePatterns(code)) smells++;

    return smells;
  }

  /**
   * Calculate max nesting level
   */
  calculateMaxNesting(code) {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of code) {
      if (char === '{' || char === '(') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}' || char === ')') {
        currentDepth--;
      }
    }

    return maxDepth;
  }

  /**
   * Check for duplicate patterns
   */
  hasDuplicatePatterns(code) {
    const lines = code.split('\n');
    const lineCounts = new Map();
    
    lines.forEach(line => {
      const normalized = line.trim().replace(/\s+/g, ' ');
      if (normalized.length > 20) {
        lineCounts.set(normalized, (lineCounts.get(normalized) || 0) + 1);
      }
    });

    return Array.from(lineCounts.values()).some(count => count > 3);
  }

  /**
   * Calculate bug probability
   */
  calculateBugProbability(riskFactors) {
    // Normalize risk score to probability (0-1)
    return Math.min(0.95, riskFactors.riskScore);
  }

  /**
   * Identify potential bugs
   */
  identifyPotentialBugs(code, riskFactors) {
    const bugs = [];

    // Null pointer risks
    if (code.includes('.') && !code.includes('?.') && !code.includes('if')) {
      bugs.push({
        type: 'null_pointer',
        severity: 'medium',
        message: 'Potential null pointer access without null check'
      });
    }

    // Memory leaks
    if (code.includes('setInterval') || code.includes('setTimeout')) {
      if (!code.includes('clearInterval') && !code.includes('clearTimeout')) {
        bugs.push({
          type: 'memory_leak',
          severity: 'high',
          message: 'Timer may not be cleared, potential memory leak'
        });
      }
    }

    // Race conditions
    if (code.includes('async') && code.includes('await')) {
      const awaitCount = (code.match(/\bawait\b/g) || []).length;
      if (awaitCount > 5) {
        bugs.push({
          type: 'race_condition',
          severity: 'medium',
          message: 'Multiple async operations may cause race conditions'
        });
      }
    }

    // High complexity
    if (riskFactors.complexity > 15) {
      bugs.push({
        type: 'high_complexity',
        severity: 'medium',
        message: `High cyclomatic complexity (${riskFactors.complexity}) increases bug risk`
      });
    }

    return bugs;
  }

  /**
   * Calculate confidence
   */
  calculateConfidence(riskFactors) {
    // More data = higher confidence
    const dataPoints = Object.keys(riskFactors).length;
    return Math.min(0.95, 0.5 + (dataPoints * 0.05));
  }

  /**
   * Forecast quality trends
   */
  forecastQualityTrend(historicalData, days = 30) {
    if (historicalData.length < 3) {
      return {
        forecast: 'insufficient_data',
        confidence: 0.3
      };
    }

    // Simple linear regression for trend
    const values = historicalData.map(d => d.quality || d.score || 0);
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Forecast future values
    const forecast = [];
    for (let i = 0; i < days; i++) {
      const futureValue = slope * (n + i) + intercept;
      forecast.push({
        day: i + 1,
        predictedQuality: Math.max(0, Math.min(1, futureValue)),
        confidence: Math.max(0.5, 1 - (i * 0.02)) // Decreasing confidence
      });
    }

    return {
      forecast,
      trend: slope > 0 ? 'improving' : slope < 0 ? 'declining' : 'stable',
      slope,
      confidence: 0.7
    };
  }

  /**
   * Predict resource usage
   */
  predictResourceUsage(codebase, options = {}) {
    const analysis = {
      estimatedMemory: this.estimateMemoryUsage(codebase),
      estimatedCPU: this.estimateCPUUsage(codebase),
      estimatedNetwork: this.estimateNetworkUsage(codebase),
      bottlenecks: this.identifyBottlenecks(codebase)
    };

    return {
      ...analysis,
      recommendations: this.generateResourceRecommendations(analysis)
    };
  }

  /**
   * Estimate memory usage
   */
  estimateMemoryUsage(codebase) {
    const files = codebase.files || [];
    const totalLines = files.reduce((sum, f) => sum + (f.content?.split('\n').length || 0), 0);
    
    // Rough estimate: ~1KB per 10 lines
    return {
      estimated: totalLines * 0.1, // KB
      unit: 'KB',
      confidence: 0.6
    };
  }

  /**
   * Estimate CPU usage
   */
  estimateCPUUsage(codebase) {
    const files = codebase.files || [];
    let complexity = 0;

    files.forEach(file => {
      const content = file.content || '';
      complexity += this.calculateComplexity(content);
    });

    return {
      estimated: complexity * 0.1, // Arbitrary units
      unit: 'complexity_score',
      confidence: 0.5
    };
  }

  /**
   * Estimate network usage
   */
  estimateNetworkUsage(codebase) {
    const files = codebase.files || [];
    const apiCalls = files.reduce((sum, f) => {
      const content = f.content || '';
      return sum + (content.match(/\b(fetch|axios|request|http)\./gi) || []).length;
    }, 0);

    return {
      estimated: apiCalls,
      unit: 'api_calls',
      confidence: 0.7
    };
  }

  /**
   * Identify bottlenecks
   */
  identifyBottlenecks(codebase) {
    const bottlenecks = [];
    const files = codebase.files || [];

    files.forEach(file => {
      const content = file.content || '';
      const complexity = this.calculateComplexity(content);

      if (complexity > 15) {
        bottlenecks.push({
          file: file.path,
          type: 'high_complexity',
          severity: 'medium',
          message: `High complexity (${complexity}) may cause performance issues`
        });
      }

      // Check for synchronous operations
      if (content.includes('sync') && !content.includes('async')) {
        bottlenecks.push({
          file: file.path,
          type: 'synchronous_io',
          severity: 'high',
          message: 'Synchronous I/O operations may block event loop'
        });
      }
    });

    return bottlenecks;
  }

  /**
   * Generate resource recommendations
   */
  generateResourceRecommendations(analysis) {
    const recommendations = [];

    if (analysis.bottlenecks.length > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        message: `Found ${analysis.bottlenecks.length} potential bottlenecks. Consider optimization.`
      });
    }

    if (analysis.estimatedMemory.estimated > 1000) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: 'High memory usage predicted. Consider memory optimization.'
      });
    }

    return recommendations;
  }
}

// Singleton instance
let predictiveCapabilitiesInstance = null;

function getPredictiveCapabilities() {
  if (!predictiveCapabilitiesInstance) {
    predictiveCapabilitiesInstance = new PredictiveCapabilities();
  }
  return predictiveCapabilitiesInstance;
}

module.exports = {
  PredictiveCapabilities,
  getPredictiveCapabilities
};
