/**
 * Code Review Automation
 * 
 * Automatically reviews code and provides feedback
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
const log = createLogger('CodeReviewAutomation');

class CodeReviewAutomation {
  constructor() {
    this.reviewRules = new Map(); // ruleId -> rule
    this.initializeRules();
  }

  /**
   * Initialize review rules
   */
  initializeRules() {
    // Security rules
    this.reviewRules.set('security_hardcoded_secrets', {
      category: 'security',
      severity: 'critical',
      pattern: /(?:password|secret|api[_-]?key|token)\s*[:=]\s*['"][^'"]+['"]/gi,
      message: 'Hardcoded secrets detected. Use environment variables or secure storage.',
      suggestion: 'Move sensitive values to environment variables or secure vault.'
    });

    this.reviewRules.set('security_sql_injection', {
      category: 'security',
      severity: 'high',
      pattern: /\$\{.*\}\s*\+\s*['"]/gi,
      message: 'Potential SQL injection vulnerability. Use parameterized queries.',
      suggestion: 'Use parameterized queries or ORM methods instead of string concatenation.'
    });

    // Code quality rules
    this.reviewRules.set('quality_long_function', {
      category: 'quality',
      severity: 'medium',
      check: (code) => {
        const lines = code.split('\n').length;
        return lines > 50;
      },
      message: 'Function is too long (>50 lines). Consider breaking it into smaller functions.',
      suggestion: 'Extract logical sections into separate functions.'
    });

    this.reviewRules.set('quality_complexity', {
      category: 'quality',
      severity: 'medium',
      check: (code) => {
        const complexity = (code.match(/\b(if|else|for|while|switch|case)\b/gi) || []).length;
        return complexity > 10;
      },
      message: 'High cyclomatic complexity detected. Consider simplifying the logic.',
      suggestion: 'Break down complex conditionals into smaller, named functions.'
    });

    this.reviewRules.set('quality_magic_numbers', {
      category: 'quality',
      severity: 'low',
      pattern: /\b\d{3,}\b/g,
      message: 'Magic numbers detected. Consider using named constants.',
      suggestion: 'Extract numbers to named constants with descriptive names.'
    });

    // Performance rules
    this.reviewRules.set('performance_n_plus_one', {
      category: 'performance',
      severity: 'medium',
      pattern: /for\s*\([^)]+\)\s*\{[^}]*\.(?:find|filter|map|forEach)\(/gi,
      message: 'Potential N+1 query problem. Consider batching or eager loading.',
      suggestion: 'Batch database queries or use eager loading to reduce round trips.'
    });

    // Best practices
    this.reviewRules.set('best_practice_console_log', {
      category: 'best_practice',
      severity: 'low',
      pattern: /console\.(log|debug|info)\(/gi,
      message: 'Console.log statements found. Consider using proper logging.',
      suggestion: 'Replace console.log with a proper logging library.'
    });

    this.reviewRules.set('best_practice_error_handling', {
      category: 'best_practice',
      severity: 'medium',
      check: (code) => {
        return !code.includes('try') && (code.includes('await') || code.includes('fetch'));
      },
      message: 'Async operations without error handling detected.',
      suggestion: 'Wrap async operations in try-catch blocks.'
    });
  }

  /**
   * Review code
   */
  reviewCode(code, filePath, options = {}) {
    const issues = [];
    const rulesToCheck = options.rules || Array.from(this.reviewRules.keys());

    rulesToCheck.forEach(ruleId => {
      const rule = this.reviewRules.get(ruleId);
      if (!rule) return;

      let match = false;

      if (rule.pattern) {
        const matches = code.match(rule.pattern);
        if (matches && matches.length > 0) {
          match = true;
        }
      } else if (rule.check) {
        match = rule.check(code);
      }

      if (match) {
        const issue = {
          ruleId,
          category: rule.category,
          severity: rule.severity,
          message: rule.message,
          suggestion: rule.suggestion,
          file: filePath,
          line: this.findLineNumber(code, rule.pattern || rule.check),
          confidence: this.calculateConfidence(rule, code)
        };
        issues.push(issue);
      }
    });

    return {
      file: filePath,
      issues,
      summary: this.generateSummary(issues),
      score: this.calculateScore(issues)
    };
  }

  /**
   * Find line number for issue
   */
  findLineNumber(code, pattern) {
    if (typeof pattern === 'function') {
      // For function-based checks, return first line
      return 1;
    }
    
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(rule, code) {
    let confidence = 0.7; // Base confidence

    // Pattern matches are more confident
    if (rule.pattern) {
      confidence = 0.85;
    }

    // Function checks might have false positives
    if (rule.check) {
      confidence = 0.75;
    }

    return confidence;
  }

  /**
   * Generate review summary
   */
  generateSummary(issues) {
    const bySeverity = {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length
    };

    const byCategory = {};
    issues.forEach(issue => {
      byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
    });

    return {
      total: issues.length,
      bySeverity,
      byCategory,
      criticalIssues: bySeverity.critical > 0,
      needsAttention: bySeverity.critical + bySeverity.high > 0
    };
  }

  /**
   * Calculate review score (0-100)
   */
  calculateScore(issues) {
    if (issues.length === 0) return 100;

    let score = 100;
    
    issues.forEach(issue => {
      const penalties = {
        critical: 20,
        high: 10,
        medium: 5,
        low: 2
      };
      score -= penalties[issue.severity] || 0;
    });

    return Math.max(0, score);
  }

  /**
   * Review multiple files
   */
  reviewCodebase(files, options = {}) {
    const reviews = files.map(file => 
      this.reviewCode(file.content || '', file.path, options)
    );

    const overallSummary = {
      filesReviewed: reviews.length,
      totalIssues: reviews.reduce((sum, r) => sum + r.issues.length, 0),
      averageScore: reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length,
      criticalFiles: reviews.filter(r => r.summary.criticalIssues).length,
      byCategory: {},
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };

    reviews.forEach(review => {
      review.issues.forEach(issue => {
        overallSummary.byCategory[issue.category] = 
          (overallSummary.byCategory[issue.category] || 0) + 1;
        overallSummary.bySeverity[issue.severity]++;
      });
    });

    return {
      reviews,
      overallSummary
    };
  }
}

// Singleton instance
let codeReviewInstance = null;

function getCodeReviewAutomation() {
  if (!codeReviewInstance) {
    codeReviewInstance = new CodeReviewAutomation();
  }
  return codeReviewInstance;
}

module.exports = {
  CodeReviewAutomation,
  getCodeReviewAutomation
};
