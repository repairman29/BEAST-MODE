/**
 * Automated Code Review
 * 
 * AI-powered code review suggestions and pattern analysis
 */

class AutomatedCodeReview {
  constructor(options = {}) {
    this.options = {
      checkQuality: true,
      checkSecurity: true,
      checkBestPractices: true,
      checkPerformance: true,
      checkAccessibility: false,
      ...options,
    };
  }

  /**
   * Review code changes
   */
  async reviewCodeChanges(changes) {
    if (!Array.isArray(changes) || changes.length === 0) {
      return {
        quality_score: 0,
        issues: [],
        suggestions: [],
        security_concerns: [],
        best_practices: [],
        overall_assessment: 'No code to review',
      };
    }

    const allIssues = [];
    const allSuggestions = [];
    const securityConcerns = [];
    const bestPractices = [];
    let totalScore = 0;

    for (const change of changes) {
      const { path, content, language } = change;
      
      if (!content || content.trim().length === 0) {
        allIssues.push({
          severity: 'low',
          type: 'empty_file',
          message: `File ${path} is empty`,
          file: path,
        });
        continue;
      }

      // Quality checks
      if (this.options.checkQuality) {
        const qualityIssues = this.checkQuality(content, path, language);
        allIssues.push(...qualityIssues);
      }

      // Security checks
      if (this.options.checkSecurity) {
        const securityIssues = this.checkSecurity(content, path, language);
        securityConcerns.push(...securityIssues);
        allIssues.push(...securityIssues);
      }

      // Best practices
      if (this.options.checkBestPractices) {
        const practiceChecks = this.checkBestPractices(content, path, language);
        bestPractices.push(...practiceChecks);
        practiceChecks.filter(p => !p.passed).forEach(p => {
          allIssues.push({
            severity: 'medium',
            type: 'best_practice',
            message: p.note || p.check,
            file: path,
          });
        });
      }

      // Performance checks
      if (this.options.checkPerformance) {
        const perfIssues = this.checkPerformance(content, path, language);
        allIssues.push(...perfIssues);
      }
    }

    // Calculate quality score
    const issueCount = allIssues.length;
    const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
    const highCount = allIssues.filter(i => i.severity === 'high').length;
    
    totalScore = Math.max(0, 100 - (criticalCount * 20) - (highCount * 10) - (issueCount * 2));

    // Generate suggestions
    if (issueCount > 0) {
      allSuggestions.push({
        type: 'code_quality',
        description: `Address ${issueCount} issue(s) found in code review`,
        impact: issueCount > 10 ? 'high' : 'medium',
      });
    }

    return {
      quality_score: totalScore,
      issues: allIssues,
      suggestions: allSuggestions,
      security_concerns: securityConcerns,
      best_practices: bestPractices,
      overall_assessment: this.generateAssessment(totalScore, issueCount),
    };
  }

  checkQuality(content, path, language) {
    const issues = [];
    const lines = content.split('\n');

    // Check for very long files
    if (lines.length > 500) {
      issues.push({
        severity: 'medium',
        type: 'file_size',
        message: `File ${path} is very long (${lines.length} lines). Consider splitting into smaller modules.`,
        file: path,
        suggestion: 'Split into smaller, focused modules',
      });
    }

    // Check for very long functions
    let inFunction = false;
    let functionStart = 0;
    let functionLineCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/(function|const\s+\w+\s*=\s*(async\s+)?\(|def\s+\w+)/)) {
        inFunction = true;
        functionStart = i;
        functionLineCount = 0;
      }
      if (inFunction) {
        functionLineCount++;
        if (line.match(/^[\s]*\}/) || line.match(/^[\s]*$/)) {
          if (functionLineCount > 50) {
            issues.push({
              severity: 'medium',
              type: 'function_length',
              message: `Function starting at line ${functionStart + 1} in ${path} is very long (${functionLineCount} lines)`,
              file: path,
              line: functionStart + 1,
              suggestion: 'Break into smaller functions',
            });
          }
          inFunction = false;
        }
      }
    }

    // Check for TODO/FIXME
    if (content.includes('TODO') || content.includes('FIXME')) {
      issues.push({
        severity: 'low',
        type: 'todo',
        message: `File ${path} contains TODO/FIXME comments`,
        file: path,
        suggestion: 'Address TODO/FIXME items before merging',
      });
    }

    // Check for console.log (in production code)
    if (content.includes('console.log') && !path.includes('test')) {
      issues.push({
        severity: 'low',
        type: 'debug_code',
        message: `File ${path} contains console.log statements`,
        file: path,
        suggestion: 'Remove console.log statements or use proper logging',
      });
    }

    return issues;
  }

  checkSecurity(content, path, language) {
    const issues = [];
    const lowerContent = content.toLowerCase();

    // Check for hardcoded secrets
    const secretPatterns = [
      /password\s*=\s*['"][^'"]+['"]/i,
      /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
      /secret\s*=\s*['"][^'"]+['"]/i,
      /token\s*=\s*['"][^'"]+['"]/i,
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        issues.push({
          severity: 'critical',
          type: 'hardcoded_secret',
          message: `File ${path} may contain hardcoded secrets`,
          file: path,
          suggestion: 'Use environment variables or secure storage',
        });
      }
    }

    // Check for SQL injection risks
    if (language === 'javascript' || language === 'typescript') {
      const sqlPattern = /query\s*\(\s*['"`][^'"`]*\$\{/;
      if (sqlPattern.test(content)) {
        issues.push({
          severity: 'high',
          type: 'sql_injection_risk',
          message: `File ${path} may be vulnerable to SQL injection`,
          file: path,
          suggestion: 'Use parameterized queries',
        });
      }
    }

    // Check for // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() usage
    if (content.includes('eval(') || content.includes('Function(')) {
      issues.push({
        severity: 'critical',
        type: 'code_injection_risk',
        message: `File ${path} uses eval() or Function() - security risk`,
        file: path,
        suggestion: 'Avoid eval() and Function() - use safer alternatives',
      });
    }

    return issues;
  }

  checkBestPractices(content, path, language) {
    const checks = [];

    // Error handling
    if (language === 'javascript' || language === 'typescript') {
      const hasAsync = content.includes('async') || content.includes('await');
      const hasTryCatch = content.includes('try') && content.includes('catch');
      
      if (hasAsync && !hasTryCatch) {
        checks.push({
          check: 'error_handling',
          passed: false,
          note: `File ${path} uses async/await but may lack error handling`,
        });
      } else {
        checks.push({
          check: 'error_handling',
          passed: true,
        });
      }
    }

    // Documentation
    const hasComments = (content.match(/\/\*\*|\/\/|\#/g) || []).length > 5;
    checks.push({
      check: 'documentation',
      passed: hasComments,
      note: hasComments ? 'File has adequate comments' : `File ${path} may benefit from more documentation`,
    });

    // Type safety (for TypeScript)
    if (language === 'typescript') {
      const hasTypes = content.includes(':') && (content.includes('string') || content.includes('number') || content.includes('boolean'));
      checks.push({
        check: 'type_safety',
        passed: hasTypes,
        note: hasTypes ? 'File uses TypeScript types' : `File ${path} may benefit from explicit types`,
      });
    }

    return checks;
  }

  checkPerformance(content, path, language) {
    const issues = [];

    // Check for nested loops
    const nestedLoopPattern = /for\s*\([^)]+\)\s*\{[^}]*for\s*\([^)]+\)/;
    if (nestedLoopPattern.test(content)) {
      issues.push({
        severity: 'medium',
        type: 'performance',
        message: `File ${path} contains nested loops - potential performance issue`,
        file: path,
        suggestion: 'Consider optimizing nested loops or using more efficient algorithms',
      });
    }

    // Check for synchronous operations in async context
    if (language === 'javascript' || language === 'typescript') {
      if (content.includes('async') && content.includes('readFileSync')) {
        issues.push({
          severity: 'high',
          type: 'performance',
          message: `File ${path} uses synchronous file operations in async context`,
          file: path,
          suggestion: 'Use async file operations (readFile instead of readFileSync)',
        });
      }
    }

    return issues;
  }

  generateAssessment(score, issueCount) {
    if (score >= 90) {
      return 'Excellent code quality. Ready for production.';
    } else if (score >= 70) {
      return `Good code quality with ${issueCount} issue(s) to address.`;
    } else if (score >= 50) {
      return `Code quality needs improvement. ${issueCount} issue(s) found.`;
    } else {
      return `Code quality is poor. ${issueCount} critical issue(s) need immediate attention.`;
    }
  }
}

module.exports = AutomatedCodeReview;
module.exports.default = AutomatedCodeReview;
