/**
 * Pattern Analyzer
 * 
 * Analyzes codebase-wide patterns, themes, and opportunities.
 * Goes beyond file-by-file to identify architectural insights.
 */

const { fileQualityScorer } = require('./fileQualityScorer');

class PatternAnalyzer {
  constructor() {
    this.patterns = new Map();
    this.themes = new Map();
  }

  /**
   * Analyze codebase for patterns and themes
   * @param {Array} files - Array of {path, content} objects
   * @param {Object} repoContext - Repository context
   * @returns {Object} Pattern analysis with themes and opportunities
   */
  async analyzePatterns(files, repoContext) {
    const analysis = {
      themes: [],
      opportunities: [],
      patterns: {},
      architecturalInsights: [],
      codebaseHealth: {},
    };

    // Analyze file-level quality first
    const fileAnalysis = await fileQualityScorer.scoreRepository(files, repoContext);

    // 1. Identify Themes (recurring patterns across files)
    analysis.themes = this.identifyThemes(files, fileAnalysis);

    // 2. Identify Opportunities (bigger improvements)
    analysis.opportunities = this.identifyOpportunities(files, fileAnalysis, repoContext);

    // 3. Detect Patterns (code patterns, architectural patterns)
    analysis.patterns = this.detectPatterns(files);

    // 4. Architectural Insights (high-level recommendations)
    analysis.architecturalInsights = this.generateArchitecturalInsights(
      files,
      fileAnalysis,
      analysis.themes,
      analysis.opportunities
    );

    // 5. Codebase Health (overall assessment)
    analysis.codebaseHealth = this.assessCodebaseHealth(fileAnalysis, analysis);

    return analysis;
  }

  /**
   * Identify themes across the codebase
   */
  identifyThemes(files, fileAnalysis) {
    const themes = [];

    // Theme 1: Testing Coverage
    const filesWithoutTests = fileAnalysis.fileScores.filter(f => !f.factors.hasTests && !f.factors.isTestFile);
    if (filesWithoutTests.length > 3) {
      themes.push({
        name: 'Missing Test Coverage',
        severity: 'high',
        description: `${filesWithoutTests.length} files lack test coverage. This is a systemic issue affecting code reliability.`,
        affectedFiles: filesWithoutTests.length,
        totalFiles: fileAnalysis.fileCount,
        impact: 'High - Affects reliability and maintainability',
        recommendation: 'Implement comprehensive test suite across all modules',
        estimatedEffort: '2-4 weeks',
        estimatedImpact: 0.20, // 20% quality improvement
      });
    }

    // Theme 2: Documentation
    const filesWithoutDocs = fileAnalysis.fileScores.filter(f => !f.factors.hasDocumentation);
    if (filesWithoutDocs.length > 5) {
      themes.push({
        name: 'Documentation Gap',
        severity: 'medium',
        description: `${filesWithoutDocs.length} files lack proper documentation. This hinders onboarding and maintenance.`,
        affectedFiles: filesWithoutDocs.length,
        totalFiles: fileAnalysis.fileCount,
        impact: 'Medium - Affects developer experience',
        recommendation: 'Add JSDoc/docstrings to all public APIs and complex functions',
        estimatedEffort: '1-2 weeks',
        estimatedImpact: 0.10,
      });
    }

    // Theme 3: Type Safety
    const tsFiles = fileAnalysis.fileScores.filter(f => f.language === 'TypeScript');
    const tsFilesWithoutTypes = tsFiles.filter(f => !f.factors.hasTypeSafety);
    if (tsFilesWithoutTypes.length > 0 && tsFiles.length > 0) {
      themes.push({
        name: 'Incomplete Type Safety',
        severity: 'medium',
        description: `${tsFilesWithoutTypes.length} of ${tsFiles.length} TypeScript files lack proper type annotations.`,
        affectedFiles: tsFilesWithoutTypes.length,
        totalFiles: tsFiles.length,
        impact: 'Medium - Reduces type safety benefits',
        recommendation: 'Add TypeScript type annotations to all functions and variables',
        estimatedEffort: '1-2 weeks',
        estimatedImpact: 0.12,
      });
    }

    // Theme 4: Error Handling
    const filesWithoutErrorHandling = fileAnalysis.fileScores.filter(f => !f.factors.hasErrorHandling);
    if (filesWithoutErrorHandling.length > 5) {
      themes.push({
        name: 'Missing Error Handling',
        severity: 'high',
        description: `${filesWithoutErrorHandling.length} files lack proper error handling. This can lead to runtime failures.`,
        affectedFiles: filesWithoutErrorHandling.length,
        totalFiles: fileAnalysis.fileCount,
        impact: 'High - Affects reliability and user experience',
        recommendation: 'Add try/catch blocks and error boundaries throughout the codebase',
        estimatedEffort: '2-3 weeks',
        estimatedImpact: 0.15,
      });
    }

    // Theme 5: Code Complexity
    const highComplexityFiles = fileAnalysis.fileScores.filter(
      f => f.factors.complexity && f.factors.complexity.level === 'high'
    );
    if (highComplexityFiles.length > 3) {
      themes.push({
        name: 'High Code Complexity',
        severity: 'medium',
        description: `${highComplexityFiles.length} files have high complexity. This makes maintenance difficult.`,
        affectedFiles: highComplexityFiles.length,
        totalFiles: fileAnalysis.fileCount,
        impact: 'Medium - Affects maintainability',
        recommendation: 'Refactor complex functions into smaller, focused modules',
        estimatedEffort: '3-4 weeks',
        estimatedImpact: 0.18,
      });
    }

    // Theme 6: Security Issues
    const filesWithSecurityIssues = fileAnalysis.fileScores.filter(f => f.factors.hasSecurityIssues);
    if (filesWithSecurityIssues.length > 0) {
      themes.push({
        name: 'Security Vulnerabilities',
        severity: 'critical',
        description: `${filesWithSecurityIssues.length} files contain potential security issues (eval, innerHTML, SQL injection risks).`,
        affectedFiles: filesWithSecurityIssues.length,
        totalFiles: fileAnalysis.fileCount,
        impact: 'Critical - Security risk',
        recommendation: 'Immediately review and fix security vulnerabilities',
        estimatedEffort: '1 week',
        estimatedImpact: 0.25,
      });
    }

    return themes.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Identify bigger opportunities (beyond individual files)
   */
  identifyOpportunities(files, fileAnalysis, repoContext) {
    const opportunities = [];

    // Opportunity 1: Add CI/CD Pipeline
    if (!repoContext.hasCI) {
      opportunities.push({
        type: 'infrastructure',
        title: 'Implement CI/CD Pipeline',
        description: 'Automate testing, building, and deployment with GitHub Actions or similar.',
        impact: 'High - Improves development workflow and code quality',
        effort: 'Low - Can be done in 1-2 days',
        estimatedQualityGain: 0.12,
        filesToGenerate: ['.github/workflows/ci.yml'],
        businessValue: 'Faster iteration, automated quality checks, reduced manual errors',
      });
    }

    // Opportunity 2: Add Testing Framework
    if (!repoContext.hasTests) {
      opportunities.push({
        type: 'testing',
        title: 'Set Up Testing Framework',
        description: 'Add Jest/Vitest (JS/TS) or pytest (Python) testing framework with example tests.',
        impact: 'High - Enables reliable development',
        effort: 'Medium - 1 week setup + ongoing',
        estimatedQualityGain: 0.20,
        filesToGenerate: [
          'jest.config.js',
          'tests/example.test.js',
          'package.json (add test scripts)',
        ],
        businessValue: 'Prevents regressions, enables confident refactoring',
      });
    }

    // Opportunity 3: Add TypeScript
    const jsFiles = fileAnalysis.fileScores.filter(f => f.language === 'JavaScript');
    if (jsFiles.length > 5 && !fileAnalysis.fileScores.some(f => f.language === 'TypeScript')) {
      opportunities.push({
        type: 'language',
        title: 'Migrate to TypeScript',
        description: 'Gradually migrate JavaScript files to TypeScript for better type safety.',
        impact: 'High - Long-term maintainability',
        effort: 'High - 4-6 weeks gradual migration',
        estimatedQualityGain: 0.15,
        filesToGenerate: ['tsconfig.json', 'example migration guide'],
        businessValue: 'Catches errors at compile time, better IDE support',
      });
    }

    // Opportunity 4: Add API Documentation
    const hasAPI = files.some(f => f.path.includes('api') || f.path.includes('route'));
    if (hasAPI && !files.some(f => f.path.includes('swagger') || f.path.includes('openapi'))) {
      opportunities.push({
        type: 'documentation',
        title: 'Add API Documentation',
        description: 'Generate OpenAPI/Swagger documentation for all API endpoints.',
        impact: 'Medium - Improves developer experience',
        effort: 'Medium - 1 week',
        estimatedQualityGain: 0.08,
        filesToGenerate: ['swagger.yaml', 'api-docs.md'],
        businessValue: 'Easier API integration, better developer onboarding',
      });
    }

    // Opportunity 5: Add Monitoring/Logging
    const hasMonitoring = files.some(f => 
      f.path.includes('monitoring') || 
      f.path.includes('logging') || 
      f.path.includes('sentry') ||
      f.path.includes('datadog')
    );
    if (!hasMonitoring && files.length > 10) {
      opportunities.push({
        type: 'observability',
        title: 'Add Application Monitoring',
        description: 'Implement error tracking, performance monitoring, and logging.',
        impact: 'High - Production reliability',
        effort: 'Medium - 1 week',
        estimatedQualityGain: 0.10,
        filesToGenerate: ['lib/monitoring.js', 'lib/error-tracking.js'],
        businessValue: 'Proactive issue detection, better user experience',
      });
    }

    // Opportunity 6: Add Database Migrations
    const hasDB = files.some(f => 
      f.path.includes('database') || 
      f.path.includes('db') || 
      f.path.includes('migration') ||
      f.path.includes('schema')
    );
    if (hasDB && !files.some(f => f.path.includes('migrations'))) {
      opportunities.push({
        type: 'database',
        title: 'Set Up Database Migrations',
        description: 'Add migration system (Prisma, TypeORM, Alembic) for version-controlled schema changes.',
        impact: 'High - Database reliability',
        effort: 'Medium - 1 week',
        estimatedQualityGain: 0.12,
        filesToGenerate: ['migrations/001_initial.sql', 'migration-runner.js'],
        businessValue: 'Safe schema changes, rollback capability',
      });
    }

    return opportunities.sort((a, b) => b.estimatedQualityGain - a.estimatedQualityGain);
  }

  /**
   * Detect code patterns across the codebase
   */
  detectPatterns(files) {
    const patterns = {
      architectural: [],
      code: [],
      antiPatterns: [],
    };

    // Detect architectural patterns
    const hasMVC = this.detectMVC(files);
    const hasLayered = this.detectLayeredArchitecture(files);
    const hasMicroservices = this.detectMicroservices(files);
    const hasMonolith = this.detectMonolith(files);

    if (hasMVC) patterns.architectural.push({ name: 'MVC Pattern', confidence: hasMVC });
    if (hasLayered) patterns.architectural.push({ name: 'Layered Architecture', confidence: hasLayered });
    if (hasMicroservices) patterns.architectural.push({ name: 'Microservices', confidence: hasMicroservices });
    if (hasMonolith) patterns.architectural.push({ name: 'Monolith', confidence: hasMonolith });

    // Detect code patterns
    const asyncPattern = this.detectAsyncPattern(files);
    const errorHandlingPattern = this.detectErrorHandlingPattern(files);
    const dependencyInjection = this.detectDependencyInjection(files);

    if (asyncPattern) patterns.code.push({ name: 'Async/Await Pattern', confidence: asyncPattern });
    if (errorHandlingPattern) patterns.code.push({ name: 'Error Handling Pattern', confidence: errorHandlingPattern });
    if (dependencyInjection) patterns.code.push({ name: 'Dependency Injection', confidence: dependencyInjection });

    // Detect anti-patterns
    const godObjects = this.detectGodObjects(files);
    const codeDuplication = this.detectCodeDuplication(files);
    const tightCoupling = this.detectTightCoupling(files);

    if (godObjects) patterns.antiPatterns.push({ name: 'God Objects', count: godObjects });
    if (codeDuplication) patterns.antiPatterns.push({ name: 'Code Duplication', severity: codeDuplication });
    if (tightCoupling) patterns.antiPatterns.push({ name: 'Tight Coupling', severity: tightCoupling });

    return patterns;
  }

  /**
   * Generate architectural insights
   */
  generateArchitecturalInsights(files, fileAnalysis, themes, opportunities) {
    const insights = [];

    // Insight 1: Overall Architecture Assessment
    const avgQuality = fileAnalysis.averageScore;
    if (avgQuality < 0.5) {
      insights.push({
        type: 'architecture',
        title: 'Codebase Needs Refactoring',
        description: `Average quality score is ${(avgQuality * 100).toFixed(1)}%. Consider a systematic refactoring effort.`,
        priority: 'high',
        actionable: 'Start with highest-impact themes, then work through opportunities',
        estimatedImpact: '20-30% quality improvement',
      });
    }

    // Insight 2: Technology Stack Opportunities
    const languages = [...new Set(fileAnalysis.fileScores.map(f => f.language))];
    if (languages.length > 3) {
      insights.push({
        type: 'technology',
        title: 'Multi-Language Codebase',
        description: `Codebase uses ${languages.length} languages. Consider consolidating for better maintainability.`,
        priority: 'medium',
        actionable: 'Identify primary language, plan gradual migration',
        estimatedImpact: 'Reduced complexity, better tooling',
      });
    }

    // Insight 3: Testing Strategy
    const testCoverage = fileAnalysis.fileScores.filter(f => f.factors.hasTests || f.factors.isTestFile).length;
    const coveragePercent = (testCoverage / fileAnalysis.fileCount) * 100;
    if (coveragePercent < 20) {
      insights.push({
        type: 'testing',
        title: 'Low Test Coverage',
        description: `Only ${coveragePercent.toFixed(1)}% of files have tests. Aim for 70%+ coverage.`,
        priority: 'high',
        actionable: 'Implement testing framework, add tests for critical paths first',
        estimatedImpact: '30-40% quality improvement',
      });
    }

    // Insight 4: Documentation Strategy
    const docsCoverage = fileAnalysis.fileScores.filter(f => f.factors.hasDocumentation).length;
    const docsPercent = (docsCoverage / fileAnalysis.fileCount) * 100;
    if (docsPercent < 30) {
      insights.push({
        type: 'documentation',
        title: 'Documentation Gap',
        description: `Only ${docsPercent.toFixed(1)}% of files are documented. This hinders onboarding.`,
        priority: 'medium',
        actionable: 'Add JSDoc/docstrings to public APIs, create architecture docs',
        estimatedImpact: 'Faster onboarding, better maintainability',
      });
    }

    // Insight 5: Security Posture
    const securityIssues = fileAnalysis.fileScores.filter(f => f.factors.hasSecurityIssues).length;
    if (securityIssues > 0) {
      insights.push({
        type: 'security',
        title: 'Security Review Needed',
        description: `${securityIssues} files have potential security issues. Immediate review required.`,
        priority: 'critical',
        actionable: 'Audit security issues, implement security best practices',
        estimatedImpact: 'Critical - Prevents security breaches',
      });
    }

    return insights;
  }

  /**
   * Assess overall codebase health
   */
  assessCodebaseHealth(fileAnalysis, patternAnalysis) {
    const health = {
      score: fileAnalysis.averageScore,
      grade: this.getHealthGrade(fileAnalysis.averageScore),
      strengths: [],
      weaknesses: [],
      recommendations: [],
    };

    // Identify strengths
    if (fileAnalysis.qualityDistribution.excellent > 0) {
      health.strengths.push(`${fileAnalysis.qualityDistribution.excellent} excellent quality files`);
    }
    if (fileAnalysis.fileScores.some(f => f.factors.hasTests)) {
      health.strengths.push('Some test coverage exists');
    }
    if (fileAnalysis.fileScores.some(f => f.factors.hasDocumentation)) {
      health.strengths.push('Some documentation exists');
    }

    // Identify weaknesses
    if (fileAnalysis.qualityDistribution.poor > 0) {
      health.weaknesses.push(`${fileAnalysis.qualityDistribution.poor} files need significant improvement`);
    }
    if (patternAnalysis.themes.some(t => t.severity === 'critical')) {
      health.weaknesses.push('Critical issues detected');
    }
    if (fileAnalysis.averageScore < 0.6) {
      health.weaknesses.push('Overall quality below target');
    }

    // Top recommendations
    health.recommendations = patternAnalysis.themes
      .slice(0, 3)
      .map(theme => ({
        action: theme.recommendation,
        impact: theme.estimatedImpact,
        effort: theme.estimatedEffort,
      }));

    return health;
  }

  /**
   * Get health grade
   */
  getHealthGrade(score) {
    if (score >= 0.8) return 'A';
    if (score >= 0.7) return 'B';
    if (score >= 0.6) return 'C';
    if (score >= 0.5) return 'D';
    return 'F';
  }

  // Pattern detection helpers
  detectMVC(files) {
    const hasModels = files.some(f => f.path.includes('model') || f.path.includes('Model'));
    const hasViews = files.some(f => f.path.includes('view') || f.path.includes('View') || f.path.includes('component'));
    const hasControllers = files.some(f => f.path.includes('controller') || f.path.includes('Controller') || f.path.includes('route'));
    return hasModels && hasViews && hasControllers ? 0.8 : 0;
  }

  detectLayeredArchitecture(files) {
    const layers = ['service', 'repository', 'domain', 'infrastructure', 'presentation'];
    const foundLayers = layers.filter(layer => 
      files.some(f => f.path.toLowerCase().includes(layer))
    );
    return foundLayers.length / layers.length;
  }

  detectMicroservices(files) {
    const indicators = ['service', 'microservice', 'api-gateway', 'docker-compose'];
    const found = indicators.filter(ind => 
      files.some(f => f.path.toLowerCase().includes(ind))
    );
    return found.length > 2 ? 0.7 : 0;
  }

  detectMonolith(files) {
    // Simple heuristic: if most files are in one directory structure
    const topLevelDirs = new Set();
    files.forEach(f => {
      const parts = f.path.split('/');
      if (parts.length > 1) {
        topLevelDirs.add(parts[0]);
      }
    });
    return topLevelDirs.size < 5 ? 0.6 : 0;
  }

  detectAsyncPattern(files) {
    let asyncCount = 0;
    let totalCount = 0;
    files.forEach(f => {
      if (f.content.includes('async') || f.content.includes('await')) {
        asyncCount++;
      }
      totalCount++;
    });
    return totalCount > 0 ? asyncCount / totalCount : 0;
  }

  detectErrorHandlingPattern(files) {
    let errorHandlingCount = 0;
    let totalCount = 0;
    files.forEach(f => {
      if (f.content.includes('try') || f.content.includes('catch') || f.content.includes('error')) {
        errorHandlingCount++;
      }
      totalCount++;
    });
    return totalCount > 0 ? errorHandlingCount / totalCount : 0;
  }

  detectDependencyInjection(files) {
    // Look for DI patterns (constructor injection, etc.)
    const diPatterns = ['constructor', 'inject', 'dependency', 'di'];
    let diCount = 0;
    files.forEach(f => {
      if (diPatterns.some(pattern => f.content.toLowerCase().includes(pattern))) {
        diCount++;
      }
    });
    return files.length > 0 ? diCount / files.length : 0;
  }

  detectGodObjects(files) {
    // Files with very high complexity and many responsibilities
    return files.filter(f => {
      const lines = f.content.split('\n').length;
      const functions = (f.content.match(/function|const\s+\w+\s*=|def\s+\w+/g) || []).length;
      return lines > 500 && functions > 20;
    }).length;
  }

  detectCodeDuplication(files) {
    // Simple heuristic: look for similar function signatures
    const functionSignatures = new Map();
    files.forEach(f => {
      const matches = f.content.match(/(?:function|const|let|var|def)\s+(\w+)\s*\([^)]*\)/g);
      if (matches) {
        matches.forEach(match => {
          const sig = match.toLowerCase();
          functionSignatures.set(sig, (functionSignatures.get(sig) || 0) + 1);
        });
      }
    });
    
    const duplicates = Array.from(functionSignatures.values()).filter(count => count > 1).length;
    return duplicates > 5 ? 'high' : duplicates > 2 ? 'medium' : 'low';
  }

  detectTightCoupling(files) {
    // Look for many imports/dependencies
    let highCouplingCount = 0;
    files.forEach(f => {
      const imports = (f.content.match(/import|require/g) || []).length;
      if (imports > 15) {
        highCouplingCount++;
      }
    });
    return highCouplingCount > files.length * 0.3 ? 'high' : highCouplingCount > 0 ? 'medium' : 'low';
  }
}

module.exports = new PatternAnalyzer();

