/**
 * BEAST MODE Automated Code Review
 * 
 * AI-powered code review suggestions and pattern analysis
 */

const { QualityEngine } = require('../quality');

class AutomatedCodeReview {
  constructor(options = {}) {
    this.options = {
      checkSecurity: options.checkSecurity !== false,
      checkPerformance: options.checkPerformance !== false,
      checkBestPractices: options.checkBestPractices !== false,
      checkAccessibility: options.checkAccessibility !== false,
      ...options
    };
    this.qualityEngine = new QualityEngine();
  }

  /**
   * Review code changes
   */
  async reviewCodeChanges(changes) {
    const reviews = [];

    for (const change of changes) {
      const review = await this.reviewFile(change);
      reviews.push(review);
    }

    return {
      reviews: reviews,
      summary: this.generateSummary(reviews),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Review a single file
   */
  async reviewFile(fileChange) {
    const { file, additions, deletions, diff } = fileChange;
    
    const issues = [];
    const suggestions = [];
    const positives = [];

    // Analyze additions
    if (additions && additions.length > 0) {
      const additionAnalysis = await this.analyzeCode(additions.join('\n'), file);
      issues.push(...additionAnalysis.issues);
      suggestions.push(...additionAnalysis.suggestions);
      positives.push(...additionAnalysis.positives);
    }

    // Check for common issues
    const commonIssues = this.checkCommonIssues(diff, file);
    issues.push(...commonIssues);

    // Security checks
    if (this.options.checkSecurity) {
      const securityIssues = await this.checkSecurity(diff, file);
      issues.push(...securityIssues);
    }

    // Performance checks
    if (this.options.checkPerformance) {
      const performanceIssues = await this.checkPerformance(diff, file);
      issues.push(...performanceIssues);
    }

    // Best practices checks
    if (this.options.checkBestPractices) {
      const bestPracticeIssues = await this.checkBestPractices(diff, file);
      issues.push(...bestPracticeIssues);
    }

    return {
      file: file,
      issues: issues,
      suggestions: suggestions,
      positives: positives,
      score: this.calculateReviewScore(issues, suggestions, positives),
      approved: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0
    };
  }

  /**
   * Analyze code
   */
  async analyzeCode(code, filePath) {
    const issues = [];
    const suggestions = [];
    const positives = [];

    // Detect language
    const language = this.detectLanguage(filePath);

    // Code quality checks
    if (this.detectCodeSmell(code)) {
      issues.push({
        type: 'code_smell',
        severity: 'medium',
        message: 'Potential code smell detected',
        line: this.findLineNumber(code, 'code_smell'),
        suggestion: 'Consider refactoring for better maintainability'
      });
    }

    // Complexity checks
    const complexity = this.calculateComplexity(code);
    if (complexity > 10) {
      issues.push({
        type: 'high_complexity',
        severity: 'medium',
        message: `High cyclomatic complexity (${complexity})`,
        suggestion: 'Consider breaking into smaller functions'
      });
    }

    // Positive feedback
    if (this.hasGoodPractices(code)) {
      positives.push({
        type: 'good_practice',
        message: 'Code follows good practices',
        examples: this.extractGoodPractices(code)
      });
    }

    return { issues, suggestions, positives };
  }

  /**
   * Check common issues
   */
  checkCommonIssues(diff, filePath) {
    const issues = [];
    const language = this.detectLanguage(filePath);

    // Check for console.log in production code
    if (diff.includes('console.log') && !filePath.includes('test')) {
      issues.push({
        type: 'debug_code',
        severity: 'low',
        message: 'console.log found - consider removing for production',
        suggestion: 'Use proper logging framework or remove debug statements'
      });
    }

    // Check for TODO/FIXME comments
    const todoMatches = diff.match(/TODO|FIXME|HACK|XXX/gi);
    if (todoMatches) {
      issues.push({
        type: 'todo_comment',
        severity: 'low',
        message: `${todoMatches.length} TODO/FIXME comment(s) found`,
        suggestion: 'Address or create issues for TODOs'
      });
    }

    // Check for commented code
    if (this.hasCommentedCode(diff)) {
      issues.push({
        type: 'commented_code',
        severity: 'low',
        message: 'Commented code detected',
        suggestion: 'Remove commented code or explain why it\'s needed'
      });
    }

    // Language-specific checks
    if (language === 'javascript' || language === 'typescript') {
      // Check for var usage
      if (diff.includes(' var ')) {
        issues.push({
          type: 'var_usage',
          severity: 'low',
          message: 'var keyword used - prefer const or let',
          suggestion: 'Use const for constants, let for variables'
        });
      }

      // Check for == instead of ===
      if (diff.includes(' == ')) {
        issues.push({
          type: 'loose_equality',
          severity: 'medium',
          message: 'Loose equality (==) used - prefer strict equality (===)',
          suggestion: 'Use === for type-safe comparisons'
        });
      }
    }

    return issues;
  }

  /**
   * Check security issues
   */
  async checkSecurity(diff, filePath) {
    const issues = [];

    // SQL injection
    if (diff.includes('query(') && diff.includes('${') && !diff.includes('parameterized')) {
      issues.push({
        type: 'sql_injection',
        severity: 'critical',
        message: 'Potential SQL injection vulnerability',
        suggestion: 'Use parameterized queries or prepared statements'
      });
    }

    // XSS vulnerabilities
    if (diff.includes('innerHTML') || diff.includes('dangerouslySetInnerHTML')) {
      issues.push({
        type: 'xss',
        severity: 'high',
        message: 'Potential XSS vulnerability - unsafe HTML insertion',
        suggestion: 'Use textContent or sanitize input before insertion'
      });
    }

    // Hardcoded secrets
    const secretPatterns = [
      /password\s*=\s*['"][^'"]+['"]/i,
      /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
      /secret\s*=\s*['"][^'"]+['"]/i
    ];

    secretPatterns.forEach(pattern => {
      if (pattern.test(diff)) {
        issues.push({
          type: 'hardcoded_secret',
          severity: 'critical',
          message: 'Potential hardcoded secret detected',
          suggestion: 'Use environment variables or secure secret management'
        });
      }
    });

    // Insecure random
    if (diff.includes('Math.random()') && diff.includes('crypto')) {
      issues.push({
        type: 'insecure_random',
        severity: 'medium',
        message: 'Math.random() used for security-sensitive operations',
        suggestion: 'Use crypto.getRandomValues() for secure random numbers'
      });
    }

    return issues;
  }

  /**
   * Check performance issues
   */
  async checkPerformance(diff, filePath) {
    const issues = [];

    // N+1 queries
    if (diff.includes('forEach') && diff.includes('await') && diff.includes('query')) {
      issues.push({
        type: 'n_plus_one',
        severity: 'medium',
        message: 'Potential N+1 query problem',
        suggestion: 'Batch queries or use eager loading'
      });
    }

    // Inefficient loops
    if (this.hasInefficientLoop(diff)) {
      issues.push({
        type: 'inefficient_loop',
        severity: 'low',
        message: 'Inefficient loop detected',
        suggestion: 'Consider using more efficient array methods or caching'
      });
    }

    // Memory leaks
    if (diff.includes('addEventListener') && !diff.includes('removeEventListener')) {
      issues.push({
        type: 'memory_leak',
        severity: 'medium',
        message: 'Event listener added without cleanup',
        suggestion: 'Ensure event listeners are removed when no longer needed'
      });
    }

    return issues;
  }

  /**
   * Check best practices
   */
  async checkBestPractices(diff, filePath) {
    const issues = [];
    const language = this.detectLanguage(filePath);

    // Error handling
    if (diff.includes('throw') && !diff.includes('catch')) {
      issues.push({
        type: 'unhandled_error',
        severity: 'medium',
        message: 'Error thrown without proper handling',
        suggestion: 'Add try-catch or error handling'
      });
    }

    // Async/await best practices
    if (language === 'javascript' || language === 'typescript') {
      if (diff.includes('async') && diff.includes('forEach')) {
        issues.push({
          type: 'async_forEach',
          severity: 'low',
          message: 'async/await in forEach may not work as expected',
          suggestion: 'Use for...of loop or Promise.all() for async operations'
        });
      }
    }

    return issues;
  }

  /**
   * Calculate review score
   */
  calculateReviewScore(issues, suggestions, positives) {
    let score = 100;

    issues.forEach(issue => {
      if (issue.severity === 'critical') score -= 20;
      else if (issue.severity === 'high') score -= 10;
      else if (issue.severity === 'medium') score -= 5;
      else if (issue.severity === 'low') score -= 2;
    });

    // Bonus for positives
    positives.forEach(() => {
      score += 2;
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate review summary
   */
  generateSummary(reviews) {
    const totalIssues = reviews.reduce((sum, r) => sum + r.issues.length, 0);
    const criticalIssues = reviews.reduce((sum, r) => 
      sum + r.issues.filter(i => i.severity === 'critical').length, 0);
    const highIssues = reviews.reduce((sum, r) => 
      sum + r.issues.filter(i => i.severity === 'high').length, 0);
    const averageScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;
    const approved = reviews.filter(r => r.approved).length;

    return {
      totalFiles: reviews.length,
      approvedFiles: approved,
      totalIssues: totalIssues,
      criticalIssues: criticalIssues,
      highIssues: highIssues,
      averageScore: Math.round(averageScore),
      overallApproval: approved === reviews.length,
      recommendation: this.getRecommendation(criticalIssues, highIssues, averageScore)
    };
  }

  /**
   * Get recommendation
   */
  getRecommendation(criticalIssues, highIssues, averageScore) {
    if (criticalIssues > 0) {
      return 'Request changes - critical issues must be addressed';
    }
    if (highIssues > 3) {
      return 'Request changes - too many high-severity issues';
    }
    if (averageScore < 70) {
      return 'Request changes - code quality needs improvement';
    }
    if (averageScore < 85) {
      return 'Approve with suggestions - minor improvements recommended';
    }
    return 'Approve - code looks good!';
  }

  // Helper methods
  detectLanguage(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust'
    };
    return langMap[ext] || 'unknown';
  }

  detectCodeSmell(code) {
    // Simple code smell detection
    return code.length > 1000 && code.split('\n').length > 100;
  }

  calculateComplexity(code) {
    let complexity = 1;
    const keywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||'];
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) complexity += matches.length;
    });
    return complexity;
  }

  hasGoodPractices(code) {
    return code.includes('const ') || code.includes('async ') || code.includes('try');
  }

  extractGoodPractices(code) {
    const practices = [];
    if (code.includes('const ')) practices.push('Uses const for constants');
    if (code.includes('async ')) practices.push('Uses async/await');
    if (code.includes('try')) practices.push('Has error handling');
    return practices;
  }

  hasCommentedCode(diff) {
    const lines = diff.split('\n');
    let commentedBlocks = 0;
    lines.forEach(line => {
      if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
        commentedBlocks++;
      }
    });
    return commentedBlocks > 5;
  }

  hasInefficientLoop(diff) {
    return diff.includes('for (') && diff.includes('.length') && !diff.includes('const length');
  }

  findLineNumber(code, pattern) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) {
        return i + 1;
      }
    }
    return null;
  }
}

module.exports = AutomatedCodeReview;

