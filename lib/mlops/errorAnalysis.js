/**
 * Error Analysis System
 * 
 * Learns from code generation failures to improve future attempts
 * Uses BEAST MODE's databaseWriter to analyze error patterns
 */

const { getDatabaseWriter } = require('./databaseWriter');

// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}
const log = createLogger('ErrorAnalysis');

class ErrorAnalysis {
  constructor() {
    this.dbWriter = null;
    this.errorPatterns = new Map();
    this.improvements = new Map();
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    if (!this.dbWriter) {
      this.dbWriter = getDatabaseWriter();
      await this.dbWriter.initialize();
    }
  }

  /**
   * Analyze errors from database
   * Returns patterns and insights
   */
  async analyzeErrors(options = {}) {
    await this.initialize();

    const {
      days = 7,
      serviceName = 'beast-mode-code-generation',
      limit = 1000
    } = options;

    try {
      // Query errors from database
      const errors = await this.dbWriter.read('ml_predictions', {
        service_name: serviceName,
        prediction_type: 'code_generation_error',
        created_at: `>${new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()}`
      }, { limit });

      if (!errors || errors.length === 0) {
        log.info('No errors found to analyze');
        return {
          totalErrors: 0,
          patterns: [],
          insights: [],
          recommendations: []
        };
      }

      log.info(`Analyzing ${errors.length} errors...`);

      // Analyze error patterns
      const patterns = this.extractPatterns(errors);
      const insights = this.generateInsights(patterns, errors);
      const recommendations = this.generateRecommendations(insights);

      // Store patterns for future use
      patterns.forEach((pattern, key) => {
        this.errorPatterns.set(key, pattern);
      });

      return {
        totalErrors: errors.length,
        patterns: Array.from(patterns.values()),
        insights,
        recommendations,
        topErrors: this.getTopErrors(errors, 10)
      };
    } catch (error) {
      log.error('Error analyzing failures:', error);
      throw error;
    }
  }

  /**
   * Extract common error patterns
   */
  extractPatterns(errors) {
    const patterns = new Map();

    // Group by error message
    const errorGroups = new Map();
    errors.forEach(error => {
      const errorMsg = error.context?.error || 'Unknown error';
      const key = this.normalizeError(errorMsg);
      
      if (!errorGroups.has(key)) {
        errorGroups.set(key, []);
      }
      errorGroups.get(key).push(error);
    });

    // Analyze each group
    errorGroups.forEach((group, normalizedError) => {
      const sampleError = group[0];
      const errorMsg = sampleError.context?.error || 'Unknown';
      
      // Extract context patterns
      const contexts = group.map(e => e.context || {});
      const commonContexts = this.findCommonContexts(contexts);
      
      patterns.set(normalizedError, {
        errorMessage: errorMsg,
        count: group.length,
        percentage: (group.length / errors.length) * 100,
        firstSeen: new Date(Math.min(...group.map(e => new Date(e.created_at || Date.now())))),
        lastSeen: new Date(Math.max(...group.map(e => new Date(e.created_at || Date.now())))),
        contexts: commonContexts,
        samples: group.slice(0, 5) // Keep 5 samples
      });
    });

    return patterns;
  }

  /**
   * Normalize error message for grouping
   */
  normalizeError(errorMsg) {
    // Remove paths, line numbers, and variable values
    return errorMsg
      .replace(/\/[^\s]+/g, '[PATH]')
      .replace(/:\d+:\d+/g, ':[LINE]')
      .replace(/['"][^'"]+['"]/g, '[STRING]')
      .replace(/\d+/g, '[NUMBER]')
      .substring(0, 200); // Limit length
  }

  /**
   * Find common context patterns
   */
  findCommonContexts(contexts) {
    const common = {
      hasBounty: 0,
      hasRepo: 0,
      hasDossier: 0,
      messageLengths: [],
      errorTypes: new Set()
    };

    contexts.forEach(ctx => {
      if (ctx.requestContext?.bounty) common.hasBounty++;
      if (ctx.requestContext?.repo) common.hasRepo++;
      if (ctx.requestContext?.dossier) common.hasDossier++;
      if (ctx.message) common.messageLengths.push(ctx.message.length);
      
      const error = ctx.error || '';
      if (error.includes('module')) common.errorTypes.add('module_resolution');
      if (error.includes('syntax')) common.errorTypes.add('syntax_error');
      if (error.includes('timeout')) common.errorTypes.add('timeout');
      if (error.includes('API')) common.errorTypes.add('api_error');
    });

    return {
      ...common,
      errorTypes: Array.from(common.errorTypes),
      avgMessageLength: common.messageLengths.length > 0
        ? common.messageLengths.reduce((a, b) => a + b, 0) / common.messageLengths.length
        : 0
    };
  }

  /**
   * Generate insights from patterns
   */
  generateInsights(patterns, errors) {
    const insights = [];

    // Most common error
    const mostCommon = Array.from(patterns.values())
      .sort((a, b) => b.count - a.count)[0];
    
    if (mostCommon) {
      insights.push({
        type: 'most_common_error',
        severity: 'high',
        message: `Most common error: "${mostCommon.errorMessage.substring(0, 100)}" (${mostCommon.count} occurrences, ${mostCommon.percentage.toFixed(1)}%)`,
        recommendation: `Focus on fixing: ${mostCommon.errorMessage.substring(0, 50)}`
      });
    }

    // Error trends
    const recentErrors = errors.filter(e => {
      const created = new Date(e.created_at || Date.now());
      return created > new Date(Date.now() - 24 * 60 * 60 * 1000);
    });

    if (recentErrors.length > errors.length * 0.3) {
      insights.push({
        type: 'increasing_errors',
        severity: 'high',
        message: `Error rate is high: ${recentErrors.length} errors in last 24h (${((recentErrors.length / errors.length) * 100).toFixed(1)}% of total)`,
        recommendation: 'Investigate recent changes or system issues'
      });
    }

    // Context patterns
    patterns.forEach((pattern, key) => {
      if (pattern.contexts.errorTypes.includes('module_resolution')) {
        insights.push({
          type: 'module_resolution_issue',
          severity: 'medium',
          message: `Module resolution errors detected (${pattern.count} occurrences)`,
          recommendation: 'Review module paths and bundling configuration'
        });
      }
    });

    return insights;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(insights) {
    const recommendations = [];

    insights.forEach(insight => {
      if (insight.type === 'module_resolution_issue') {
        recommendations.push({
          priority: 'high',
          action: 'Fix module resolution',
          details: 'Update import paths to use @/ aliases consistently',
          estimatedImpact: 'high'
        });
      }

      if (insight.type === 'most_common_error') {
        recommendations.push({
          priority: 'high',
          action: 'Address most common error',
          details: insight.recommendation,
          estimatedImpact: 'high'
        });
      }
    });

    return recommendations;
  }

  /**
   * Get top errors by frequency
   */
  getTopErrors(errors, limit = 10) {
    const errorCounts = new Map();

    errors.forEach(error => {
      const errorMsg = error.context?.error || 'Unknown error';
      const normalized = this.normalizeError(errorMsg);
      
      if (!errorCounts.has(normalized)) {
        errorCounts.set(normalized, {
          message: errorMsg.substring(0, 200),
          count: 0,
          samples: []
        });
      }

      const entry = errorCounts.get(normalized);
      entry.count++;
      if (entry.samples.length < 3) {
        entry.samples.push({
          timestamp: error.created_at,
          context: error.context?.requestContext
        });
      }
    });

    return Array.from(errorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Generate improved prompt based on error patterns
   */
  async generateImprovedPrompt(originalPrompt, context = {}) {
    await this.initialize();

    // Get recent errors for similar contexts
    const recentErrors = await this.dbWriter.read('ml_predictions', {
      service_name: 'beast-mode-code-generation',
      prediction_type: 'code_generation_error',
      created_at: `>${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`
    }, { limit: 50 });

    // Build improvement suggestions
    const improvements = [];
    
    if (recentErrors && recentErrors.length > 0) {
      const moduleErrors = recentErrors.filter(e => 
        e.context?.error?.includes('module') || 
        e.context?.error?.includes('require')
      );

      if (moduleErrors.length > 0) {
        improvements.push('CRITICAL: Ensure all code uses proper module imports. Avoid relative paths that break in bundled environments.');
      }

      const syntaxErrors = recentErrors.filter(e => 
        e.context?.error?.includes('syntax') || 
        e.context?.error?.includes('parse')
      );

      if (syntaxErrors.length > 0) {
        improvements.push('CRITICAL: Ensure all generated code is valid JavaScript/TypeScript. No TypeScript syntax in .js files.');
      }
    }

    // Build improved prompt
    let improvedPrompt = originalPrompt;

    if (improvements.length > 0) {
      improvedPrompt = `IMPORTANT: Based on recent error analysis, follow these requirements:\n\n${improvements.join('\n')}\n\n---\n\n${originalPrompt}`;
    }

    return improvedPrompt;
  }

  /**
   * Track improvement effectiveness
   */
  async trackImprovement(improvementId, originalError, improvedResult) {
    await this.initialize();

    try {
      await this.dbWriter.writeFeedback({
        predictionId: null,
        serviceName: 'beast-mode-code-generation',
        feedbackType: 'improvement_tracking',
        feedbackScore: improvedResult.success ? 1 : 0,
        feedbackText: `Improvement ${improvementId}: ${improvedResult.success ? 'Success' : 'Failed'}`,
        metadata: {
          improvementId,
          originalError: originalError.substring(0, 500),
          result: improvedResult
        }
      });
    } catch (error) {
      log.warn('Failed to track improvement:', error.message);
    }
  }
}

// Singleton instance
let errorAnalysisInstance = null;

function getErrorAnalysis() {
  if (!errorAnalysisInstance) {
    errorAnalysisInstance = new ErrorAnalysis();
  }
  return errorAnalysisInstance;
}

module.exports = { getErrorAnalysis, ErrorAnalysis };
