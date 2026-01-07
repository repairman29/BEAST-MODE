/**
 * Quality Validator
 * 
 * Validates that generated code meets quality standards.
 * Checks syntax, patterns, tests, and overall quality.
 */

const { fileQualityScorer } = require('./fileQualityScorer');
const patternAnalyzer = require('./patternAnalyzer');

class QualityValidator {
  constructor() {
    this.validationHistory = new Map();
  }

  /**
   * Validate generated code quality
   * @param {string} repo - Repository name
   * @param {Array} generatedFiles - Generated code files
   * @param {Object} originalQuality - Original quality metrics
   * @returns {Object} Validation results
   */
  async validateImprovement(repo, generatedFiles, originalQuality = {}) {
    const validation = {
      passed: false,
      score: 0,
      issues: [],
      warnings: [],
      recommendations: [],
      metrics: {},
      beforeAfter: {},
    };

    try {
      // 1. Syntax Validation
      const syntaxResults = await this.validateSyntax(generatedFiles);
      validation.metrics.syntax = syntaxResults;

      // 2. Pattern Matching
      const patternResults = await this.validatePatterns(repo, generatedFiles);
      validation.metrics.patterns = patternResults;

      // 3. Quality Scoring
      const qualityResults = await this.scoreGeneratedCode(generatedFiles);
      validation.metrics.quality = qualityResults;

      // 4. Test Coverage
      const testResults = await this.validateTests(generatedFiles);
      validation.metrics.tests = testResults;

      // 5. Security Check
      const securityResults = await this.validateSecurity(generatedFiles);
      validation.metrics.security = securityResults;

      // 6. Performance Check
      const performanceResults = await this.validatePerformance(generatedFiles);
      validation.metrics.performance = performanceResults;

      // 7. Documentation Check
      const docsResults = await this.validateDocumentation(generatedFiles);
      validation.metrics.documentation = docsResults;

      // 8. Integration Check
      const integrationResults = await this.validateIntegration(repo, generatedFiles);
      validation.metrics.integration = integrationResults;

      // Calculate overall score
      validation.score = this.calculateOverallScore(validation.metrics);

      // Determine if passed
      validation.passed = validation.score >= 0.7; // 70% threshold

      // Generate issues and recommendations
      validation.issues = this.collectIssues(validation.metrics);
      validation.warnings = this.collectWarnings(validation.metrics);
      validation.recommendations = this.generateRecommendations(validation.metrics);

      // Before/after comparison
      validation.beforeAfter = {
        before: originalQuality.quality || 0,
        after: qualityResults.overallScore || 0,
        improvement: (qualityResults.overallScore || 0) - (originalQuality.quality || 0),
      };

      // Store validation history
      this.validationHistory.set(`${repo}-${Date.now()}`, validation);

      return validation;
    } catch (error) {
      validation.error = error.message;
      return validation;
    }
  }

  /**
   * Validate syntax
   */
  async validateSyntax(files) {
    const results = {
      valid: 0,
      invalid: 0,
      errors: [],
      total: files.length,
    };

    for (const file of files) {
      try {
        // Try to parse/validate syntax based on language
        const isValid = await this.checkFileSyntax(file);
        if (isValid) {
          results.valid++;
        } else {
          results.invalid++;
          results.errors.push({
            file: file.fileName,
            error: 'Syntax validation failed',
          });
        }
      } catch (error) {
        results.invalid++;
        results.errors.push({
          file: file.fileName,
          error: error.message,
        });
      }
    }

    results.score = results.total > 0 ? results.valid / results.total : 0;
    return results;
  }

  /**
   * Check file syntax
   */
  async checkFileSyntax(file) {
    const ext = file.fileName.split('.').pop()?.toLowerCase();
    const code = file.code;

    try {
      switch (ext) {
        case 'js':
        case 'jsx':
          // Try to parse as JavaScript
          if (typeof require !== 'undefined') {
            try {
              // Use acorn or esprima if available
              const acorn = require('acorn');
              acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });
              return true;
            } catch (e) {
              // Fallback: basic check
              return this.basicSyntaxCheck(code, 'javascript');
            }
          }
          return this.basicSyntaxCheck(code, 'javascript');

        case 'ts':
        case 'tsx':
          // TypeScript - would need TypeScript compiler
          // For now, basic check
          return this.basicSyntaxCheck(code, 'typescript');

        case 'py':
          // Python - would need Python parser
          return this.basicSyntaxCheck(code, 'python');

        default:
          // Unknown language - basic validation
          return this.basicSyntaxCheck(code, 'generic');
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Basic syntax check
   */
  basicSyntaxCheck(code, language) {
    // Basic checks that work for most languages
    if (!code || code.trim().length === 0) {
      return false;
    }

    // Check for balanced brackets
    const brackets = { '(': ')', '[': ']', '{': '}' };
    const stack = [];
    let inString = false;
    let stringChar = null;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const prevChar = i > 0 ? code[i - 1] : null;

      // Handle string literals
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
        continue;
      }

      if (inString) continue;

      // Check brackets
      if (brackets[char]) {
        stack.push(char);
      } else if (Object.values(brackets).includes(char)) {
        const last = stack.pop();
        if (!last || brackets[last] !== char) {
          return false;
        }
      }
    }

    return stack.length === 0;
  }

  /**
   * Validate patterns match codebase
   */
  async validatePatterns(repo, files) {
    const results = {
      matches: 0,
      mismatches: 0,
      issues: [],
      score: 0,
    };

    // Get codebase patterns (would need to fetch from repo)
    // For now, check against common patterns
    for (const file of files) {
      const patternMatch = this.checkPatternMatch(file);
      if (patternMatch.matches) {
        results.matches++;
      } else {
        results.mismatches++;
        results.issues.push({
          file: file.fileName,
          issue: patternMatch.issue,
        });
      }
    }

    results.score = files.length > 0 ? results.matches / files.length : 0;
    return results;
  }

  /**
   * Check if file matches codebase patterns
   */
  checkPatternMatch(file) {
    const code = file.code;
    const issues = [];

    // Check for common patterns
    // 1. Error handling
    if (code.includes('async') || code.includes('await')) {
      if (!code.includes('try') && !code.includes('catch') && !code.includes('error')) {
        issues.push('Async functions should have error handling');
      }
    }

    // 2. Type annotations (if TypeScript)
    if (file.fileName.endsWith('.ts') || file.fileName.endsWith('.tsx')) {
      const functionMatches = code.match(/(?:function|const|let|var)\s+\w+\s*[=:]/g);
      if (functionMatches && functionMatches.length > 0) {
        const hasTypes = functionMatches.some(match => {
          const funcCode = code.substring(code.indexOf(match));
          return funcCode.includes(':') && (funcCode.includes('string') || funcCode.includes('number') || funcCode.includes('boolean'));
        });
        if (!hasTypes) {
          issues.push('TypeScript functions should have type annotations');
        }
      }
    }

    // 3. Documentation
    if (!code.includes('/**') && !code.includes('//') && !code.includes('"""')) {
      issues.push('Code should include documentation');
    }

    // 4. Exports (if module)
    if (code.includes('export') || code.includes('module.exports')) {
      // Good - has exports
    } else if (code.includes('class') || code.includes('function')) {
      issues.push('Module should export its main functionality');
    }

    return {
      matches: issues.length === 0,
      issue: issues.join('; '),
    };
  }

  /**
   * Score generated code quality
   */
  async scoreGeneratedCode(files) {
    const scores = [];
    let totalScore = 0;

    for (const file of files) {
      const fileScore = await fileQualityScorer.scoreFile(
        file.fileName,
        file.code,
        {
          language: file.language,
          isGenerated: true,
        }
      );

      scores.push({
        fileName: file.fileName,
        score: fileScore.overallScore || 0,
        factors: fileScore.factors,
      });

      totalScore += fileScore.overallScore || 0;
    }

    return {
      overallScore: files.length > 0 ? totalScore / files.length : 0,
      fileScores: scores,
      averageScore: totalScore / files.length,
    };
  }

  /**
   * Validate tests
   */
  async validateTests(files) {
    const results = {
      hasTests: false,
      testCount: 0,
      coverage: 0,
      score: 0,
    };

    // Check if test files were generated
    const testFiles = files.filter(f => 
      f.fileName.includes('test') || 
      f.fileName.includes('spec') ||
      f.fileName.includes('__tests__')
    );

    results.hasTests = testFiles.length > 0;
    results.testCount = testFiles.length;

    // Check if main files have corresponding tests
    const mainFiles = files.filter(f => 
      !f.fileName.includes('test') && 
      !f.fileName.includes('spec')
    );

    if (mainFiles.length > 0) {
      results.coverage = testFiles.length / mainFiles.length;
    }

    // Score: 0.5 if no tests, 0.7 if some tests, 1.0 if all files have tests
    if (results.hasTests && results.coverage >= 0.8) {
      results.score = 1.0;
    } else if (results.hasTests && results.coverage >= 0.5) {
      results.score = 0.7;
    } else if (results.hasTests) {
      results.score = 0.5;
    } else {
      results.score = 0.3;
    }

    return results;
  }

  /**
   * Validate security
   */
  async validateSecurity(files) {
    const results = {
      issues: [],
      score: 1.0,
      warnings: [],
    };

    const securityPatterns = [
      { pattern: /eval\s*\(/, issue: 'Use of eval() is dangerous', severity: 'high' },
      { pattern: /innerHTML\s*=/, issue: 'innerHTML can lead to XSS', severity: 'medium' },
      { pattern: /password\s*=\s*['"]/, issue: 'Hardcoded passwords', severity: 'critical' },
      { pattern: /api[_-]?key\s*=\s*['"]/, issue: 'Hardcoded API keys', severity: 'critical' },
      { pattern: /SELECT\s+\*\s+FROM/i, issue: 'SQL SELECT * can expose sensitive data', severity: 'low' },
      { pattern: /\.exec\(/, issue: 'Shell execution can be dangerous', severity: 'high' },
    ];

    for (const file of files) {
      for (const { pattern, issue, severity } of securityPatterns) {
        if (pattern.test(file.code)) {
          results.issues.push({
            file: file.fileName,
            issue,
            severity,
          });

          // Reduce score based on severity
          if (severity === 'critical') {
            results.score -= 0.3;
          } else if (severity === 'high') {
            results.score -= 0.2;
          } else if (severity === 'medium') {
            results.score -= 0.1;
          } else {
            results.score -= 0.05;
          }
        }
      }
    }

    results.score = Math.max(0, results.score);
    return results;
  }

  /**
   * Validate performance
   */
  async validatePerformance(files) {
    const results = {
      issues: [],
      score: 1.0,
    };

    const performancePatterns = [
      { pattern: /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)\s*\{/, issue: 'Nested loops can be slow', severity: 'medium' },
      { pattern: /\.map\([^)]*\)\.map\(/, issue: 'Multiple array iterations', severity: 'low' },
      { pattern: /while\s*\(true\)/, issue: 'Infinite loops without breaks', severity: 'high' },
    ];

    for (const file of files) {
      for (const { pattern, issue, severity } of performancePatterns) {
        if (pattern.test(file.code)) {
          results.issues.push({
            file: file.fileName,
            issue,
            severity,
          });

          if (severity === 'high') {
            results.score -= 0.15;
          } else if (severity === 'medium') {
            results.score -= 0.1;
          } else {
            results.score -= 0.05;
          }
        }
      }
    }

    results.score = Math.max(0, results.score);
    return results;
  }

  /**
   * Validate documentation
   */
  async validateDocumentation(files) {
    const results = {
      documented: 0,
      undocumented: 0,
      score: 0,
    };

    for (const file of files) {
      const hasDocs = 
        file.code.includes('/**') || 
        file.code.includes('//') ||
        file.code.includes('"""') ||
        file.code.includes("'''");

      if (hasDocs) {
        results.documented++;
      } else {
        results.undocumented++;
      }
    }

    results.score = files.length > 0 ? results.documented / files.length : 0;
    return results;
  }

  /**
   * Validate integration
   */
  async validateIntegration(repo, files) {
    const results = {
      canIntegrate: true,
      issues: [],
      score: 1.0,
    };

    // Check if files can be integrated
    // 1. Check for proper imports/exports
    for (const file of files) {
      if (file.fileName.includes('route') || file.fileName.includes('api')) {
        // API files should export handlers
        if (!file.code.includes('export') && !file.code.includes('module.exports')) {
          results.issues.push({
            file: file.fileName,
            issue: 'API file should export handlers',
          });
          results.score -= 0.2;
        }
      }

      // 2. Check for environment variables (should use process.env)
      if (file.code.includes('localhost') || file.code.includes('127.0.0.1')) {
        results.issues.push({
          file: file.fileName,
          issue: 'Hardcoded URLs should use environment variables',
        });
        results.score -= 0.1;
      }
    }

    results.score = Math.max(0, results.score);
    results.canIntegrate = results.score >= 0.7;
    return results;
  }

  /**
   * Calculate overall score
   */
  calculateOverallScore(metrics) {
    const weights = {
      syntax: 0.20,      // 20% - Must be valid
      patterns: 0.15,   // 15% - Should match codebase
      quality: 0.25,   // 25% - Overall quality
      tests: 0.15,     // 15% - Test coverage
      security: 0.10,  // 10% - Security issues
      performance: 0.05, // 5% - Performance
      documentation: 0.05, // 5% - Documentation
      integration: 0.05,  // 5% - Integration readiness
    };

    let totalScore = 0;
    let totalWeight = 0;

    if (metrics.syntax) {
      totalScore += metrics.syntax.score * weights.syntax;
      totalWeight += weights.syntax;
    }

    if (metrics.patterns) {
      totalScore += metrics.patterns.score * weights.patterns;
      totalWeight += weights.patterns;
    }

    if (metrics.quality) {
      totalScore += (metrics.quality.overallScore || 0) * weights.quality;
      totalWeight += weights.quality;
    }

    if (metrics.tests) {
      totalScore += metrics.tests.score * weights.tests;
      totalWeight += weights.tests;
    }

    if (metrics.security) {
      totalScore += metrics.security.score * weights.security;
      totalWeight += weights.security;
    }

    if (metrics.performance) {
      totalScore += metrics.performance.score * weights.performance;
      totalWeight += weights.performance;
    }

    if (metrics.documentation) {
      totalScore += metrics.documentation.score * weights.documentation;
      totalWeight += weights.documentation;
    }

    if (metrics.integration) {
      totalScore += metrics.integration.score * weights.integration;
      totalWeight += weights.integration;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Collect issues
   */
  collectIssues(metrics) {
    const issues = [];

    if (metrics.syntax && metrics.syntax.errors) {
      issues.push(...metrics.syntax.errors.map(e => ({
        type: 'syntax',
        severity: 'high',
        ...e,
      })));
    }

    if (metrics.security && metrics.security.issues) {
      issues.push(...metrics.security.issues.map(i => ({
        type: 'security',
        ...i,
      })));
    }

    if (metrics.performance && metrics.performance.issues) {
      issues.push(...metrics.performance.issues.map(i => ({
        type: 'performance',
        ...i,
      })));
    }

    return issues;
  }

  /**
   * Collect warnings
   */
  collectWarnings(metrics) {
    const warnings = [];

    if (metrics.patterns && metrics.patterns.issues) {
      warnings.push(...metrics.patterns.issues.map(i => ({
        type: 'pattern',
        ...i,
      })));
    }

    if (metrics.tests && !metrics.tests.hasTests) {
      warnings.push({
        type: 'tests',
        issue: 'No test files generated',
        severity: 'medium',
      });
    }

    if (metrics.documentation && metrics.documentation.undocumented > 0) {
      warnings.push({
        type: 'documentation',
        issue: `${metrics.documentation.undocumented} files lack documentation`,
        severity: 'low',
      });
    }

    return warnings;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];

    if (metrics.tests && metrics.tests.coverage < 0.8) {
      recommendations.push({
        action: 'Add more test files',
        impact: 'high',
        reason: `Test coverage is ${(metrics.tests.coverage * 100).toFixed(0)}%, aim for 80%+`,
      });
    }

    if (metrics.security && metrics.security.score < 0.8) {
      recommendations.push({
        action: 'Review security issues',
        impact: 'critical',
        reason: `${metrics.security.issues.length} security issues found`,
      });
    }

    if (metrics.documentation && metrics.documentation.score < 0.7) {
      recommendations.push({
        action: 'Add documentation',
        impact: 'medium',
        reason: `${metrics.documentation.undocumented} files need documentation`,
      });
    }

    if (metrics.patterns && metrics.patterns.score < 0.8) {
      recommendations.push({
        action: 'Match codebase patterns better',
        impact: 'medium',
        reason: 'Generated code should match existing patterns',
      });
    }

    return recommendations;
  }

  /**
   * Get validation history
   */
  getValidationHistory(repo, limit = 10) {
    const history = [];
    for (const [key, validation] of this.validationHistory.entries()) {
      if (key.startsWith(repo)) {
        history.push(validation);
      }
    }
    return history.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }
}

module.exports = new QualityValidator();
