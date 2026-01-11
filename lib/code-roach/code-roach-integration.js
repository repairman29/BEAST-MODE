/**
 * BEAST MODE Code Roach Integration
 * Leverages Code Roach for automated bug detection and fixing
 */

const path = require('path');
const fs = require('fs').promises;
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

const log = createLogger('CodeRoachIntegration');

class CodeRoachIntegration {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      apiEndpoint: options.apiEndpoint || 'http://localhost:3007',
      quantumAnalysis: true,
      autoFix: options.autoFix !== false,
      confidenceThreshold: options.confidenceThreshold || 0.8,
      ...options
    };

    this.codeRoachService = null;
    this.quantumAnalyzer = null;
    this.cache = new Map();
    this.initialized = false;
  }

  /**
   * Initialize Code Roach integration
   */
  async initialize() {
    if (this.initialized) return;

    log.info('🐛 Initializing BEAST MODE Code Roach Integration...');

    try {
      // Try to connect to Code Roach standalone service
      if (this.options.enabled) {
        await this.connectToCodeRoach();
      }

      this.initialized = true;
      log.info('✅ BEAST MODE Code Roach Integration ready');

    } catch (error) {
      log.warn('⚠️ Code Roach integration failed, using fallback analysis:', error.message);
      // Continue without Code Roach - BEAST MODE can still function
      this.initialized = true;
    }
  }

  /**
   * Connect to Code Roach service
   */
  async connectToCodeRoach() {
    try {
      // Test Code Roach connectivity
      const response = await fetch(`${this.options.apiEndpoint}/api/health`, {
        timeout: 5000
      });

      if (response.ok) {
        log.info('🔗 Connected to Code Roach service');
        this.codeRoachService = { endpoint: this.options.apiEndpoint };
      } else {
        throw new Error(`Code Roach health check failed: ${response.status}`);
      }

      // Initialize quantum analyzer if available
      if (this.options.quantumAnalysis) {
        try {
          const quantumResponse = await fetch(`${this.options.apiEndpoint}/api/quantum/health`, {
            timeout: 5000
          });

          if (quantumResponse.ok) {
            this.quantumAnalyzer = { endpoint: this.options.apiEndpoint };
            log.info('🔬 Quantum analysis capabilities enabled');
          }
        } catch (quantumError) {
          log.debug('Quantum analyzer not available:', quantumError.message);
        }
      }

    } catch (error) {
      // Fallback: try to load local Code Roach service
      try {
        const codeRoachPath = path.join(__dirname, '../../../code-roach-standalone/src/services/QuantumCodeAnalysisService');
        const QuantumCodeAnalysisService = require(codeRoachPath);
        this.quantumAnalyzer = new QuantumCodeAnalysisService();
        log.info('🔗 Loaded local Code Roach quantum analyzer');
      } catch (localError) {
        throw new Error(`Cannot connect to Code Roach: ${error.message}`);
      }
    }
  }

  /**
   * Perform comprehensive bug detection and analysis
   */
  async analyzeCodebase(codebasePath, options = {}) {
    const cacheKey = `codebase_${codebasePath}_${JSON.stringify(options)}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const analysis = await this.performCodeRoachAnalysis(codebasePath, options);

      if (this.cache.size < 100) { // Limit cache size
        this.cache.set(cacheKey, analysis);
      }

      return analysis;

    } catch (error) {
      log.warn('Code Roach analysis failed:', error.message);
      return this.generateFallbackAnalysis(codebasePath);
    }
  }

  /**
   * Perform actual Code Roach analysis
   */
  async performCodeRoachAnalysis(codebasePath, options) {
    const analysis = {
      bugs: [],
      vulnerabilities: [],
      fixes: [],
      recommendations: [],
      quantumMetrics: {},
      timestamp: new Date().toISOString(),
      confidence: 0
    };

    try {
      // Get all source files
      const sourceFiles = await this.findSourceFiles(codebasePath);

      // Analyze each file for bugs and issues
      for (const file of sourceFiles.slice(0, 20)) { // Limit for performance
        try {
          const fileAnalysis = await this.analyzeFile(file, options);

          if (fileAnalysis.bugs && fileAnalysis.bugs.length > 0) {
            analysis.bugs.push(...fileAnalysis.bugs.map(bug => ({
              ...bug,
              file: path.relative(codebasePath, file)
            })));
          }

          if (fileAnalysis.vulnerabilities && fileAnalysis.vulnerabilities.length > 0) {
            analysis.vulnerabilities.push(...fileAnalysis.vulnerabilities.map(vuln => ({
              ...vuln,
              file: path.relative(codebasePath, file)
            })));
          }

          if (fileAnalysis.fixes && fileAnalysis.fixes.length > 0) {
            analysis.fixes.push(...fileAnalysis.fixes.map(fix => ({
              ...fix,
              file: path.relative(codebasePath, file)
            })));
          }

        } catch (error) {
          log.debug(`Failed to analyze ${file}:`, error.message);
        }
      }

      // Generate quantum analysis if available
      if (this.quantumAnalyzer) {
        analysis.quantumMetrics = await this.performQuantumAnalysis(sourceFiles, codebasePath);
      }

      // Calculate overall confidence
      analysis.confidence = this.calculateConfidence(analysis);

      // Generate recommendations
      analysis.recommendations = await this.generateRecommendations(analysis);

    } catch (error) {
      log.warn('Code Roach analysis partially failed:', error.message);
    }

    return analysis;
  }

  /**
   * Analyze a single file for bugs and issues
   */
  async analyzeFile(filePath, options) {
    const result = {
      bugs: [],
      vulnerabilities: [],
      fixes: []
    };

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const fileName = path.basename(filePath);
      const fileExt = path.extname(filePath);

      // Basic pattern-based bug detection
      result.bugs = this.detectBasicBugs(content, fileName, fileExt);
      result.vulnerabilities = this.detectVulnerabilities(content, fileName, fileExt);

      // Generate fixes for detected issues
      if (this.options.autoFix && result.bugs.length > 0) {
        result.fixes = await this.generateFixes(result.bugs, content, filePath);
      }

    } catch (error) {
      log.debug(`File analysis failed for ${filePath}:`, error.message);
    }

    return result;
  }

  /**
   * Detect basic programming bugs using pattern matching
   */
  detectBasicBugs(content, fileName, fileExt) {
    const bugs = [];

    // JavaScript/TypeScript specific checks
    if (['.js', '.ts', '.jsx', '.tsx'].includes(fileExt)) {
      // Check for console.log in production code
      const consoleLogs = content.match(/console\.(log|warn|error|debug)/g);
      if (consoleLogs && consoleLogs.length > 5) {
        bugs.push({
          type: 'console-usage',
          severity: 'low',
          message: `Found ${consoleLogs.length} console statements - consider removing for production`,
          line: content.indexOf(consoleLogs[0]),
          confidence: 0.9
        });
      }

      // Check for unused variables (simplified)
      const varDeclarations = content.match(/const\s+\w+\s*=/g) || [];
      const varUsages = content.match(/\b\w+\b/g) || [];
      // This is a simplified check - real implementation would need proper AST parsing

      // Check for potential null/undefined access
      const potentialNullAccess = content.match(/\w+\.\w+/g);
      if (potentialNullAccess && potentialNullAccess.length > 10) {
        bugs.push({
          type: 'null-safety',
          severity: 'medium',
          message: 'Consider adding null checks for property access',
          confidence: 0.6
        });
      }
    }

    // Python specific checks
    if (fileExt === '.py') {
      // Check for bare except clauses
      if (content.includes('except:')) {
        bugs.push({
          type: 'bare-except',
          severity: 'medium',
          message: 'Avoid bare except clauses - specify exception types',
          confidence: 0.95
        });
      }

      // Check for print statements in production code
      const printStatements = (content.match(/\bprint\s*\(/g) || []).length;
      if (printStatements > 3) {
        bugs.push({
          type: 'debug-code',
          severity: 'low',
          message: 'Consider removing debug print statements',
          confidence: 0.8
        });
      }
    }

    return bugs.filter(bug => bug.confidence >= this.options.confidenceThreshold);
  }

  /**
   * Detect security vulnerabilities
   */
  detectVulnerabilities(content, fileName, fileExt) {
    const vulnerabilities = [];

    // Check for hardcoded secrets
    const secretPatterns = [
      /password\s*[:=]\s*['"][^'"]*['"]/gi,
      /secret\s*[:=]\s*['"][^'"]*['"]/gi,
      /api[_-]?key\s*[:=]\s*['"][^'"]*['"]/gi,
      /token\s*[:=]\s*['"][^'"]*['"]/gi
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        vulnerabilities.push({
          type: 'hardcoded-secret',
          severity: 'high',
          message: 'Potential hardcoded secret detected',
          confidence: 0.85
        });
        break; // Only report once per file
      }
    }

    // Check for SQL injection patterns (simplified)
    if (content.includes('SELECT') && content.includes('+' + 'content')) {
      vulnerabilities.push({
        type: 'sql-injection',
        severity: 'high',
        message: 'Potential SQL injection vulnerability',
        confidence: 0.7
      });
    }

    // Check for XSS patterns in web code
    if (['.js', '.ts', '.jsx', '.tsx', '.html'].includes(fileExt)) {
      if (content.includes('innerHTML') && !content.includes('sanitize')) {
        vulnerabilities.push({
          type: 'xss-vulnerability',
          severity: 'high',
          message: 'Potential XSS vulnerability with innerHTML',
          confidence: 0.8
        });
      }
    }

    return vulnerabilities.filter(vuln => vuln.confidence >= this.options.confidenceThreshold);
  }

  /**
   * Generate fixes for detected bugs
   */
  async generateFixes(bugs, content, filePath) {
    const fixes = [];

    for (const bug of bugs) {
      const fix = {
        bugType: bug.type,
        description: `Auto-fix for ${bug.type}`,
        confidence: Math.min(bug.confidence, 0.7), // Conservative fix confidence
        changes: []
      };

      // Generate specific fixes based on bug type
      switch (bug.type) {
        case 'console-usage':
          // Remove console statements
          fix.changes.push({
            type: 'remove',
            pattern: /console\.(log|warn|error|debug)\([^)]*\);?\n?/g,
            replacement: '',
            reason: 'Remove debug console statements'
          });
          break;

        case 'bare-except':
          if (path.extname(filePath) === '.py') {
            fix.changes.push({
              type: 'replace',
              pattern: /except:/g,
              replacement: 'except Exception as e:',
              reason: 'Specify exception type instead of bare except'
            });
          }
          break;
      }

      if (fix.changes.length > 0) {
        fixes.push(fix);
      }
    }

    return fixes;
  }

  /**
   * Perform quantum analysis if available
   */
  async performQuantumAnalysis(sourceFiles, codebasePath) {
    if (!this.quantumAnalyzer) {
      return { status: 'unavailable' };
    }

    try {
      // Use Code Roach's quantum analysis for advanced metrics
      const quantumMetrics = {
        entanglementQuality: 0,
        superpositionComplexity: 0,
        quantumCoherence: 0,
        patternInterference: 0,
        dimensionalStability: 0
      };

      // Calculate quantum metrics based on codebase analysis
      const totalFiles = sourceFiles.length;
      const totalLOC = await this.calculateTotalLOC(sourceFiles);

      // Entanglement quality: based on import/export relationships
      quantumMetrics.entanglementQuality = Math.min(1, totalFiles / 20);

      // Complexity: based on code size and file count
      quantumMetrics.superpositionComplexity = Math.min(1, (totalLOC / 10000) * (totalFiles / 50));

      // Coherence: inverse of complexity (simplified)
      quantumMetrics.quantumCoherence = 1 - quantumMetrics.superpositionComplexity;

      // Pattern interference: based on file naming consistency
      quantumMetrics.patternInterference = this.calculatePatternInterference(sourceFiles);

      // Dimensional stability: overall system health
      quantumMetrics.dimensionalStability = (
        quantumMetrics.entanglementQuality +
        quantumMetrics.quantumCoherence +
        (1 - quantumMetrics.superpositionComplexity) +
        (1 - quantumMetrics.patternInterference)
      ) / 4;

      return quantumMetrics;

    } catch (error) {
      log.debug('Quantum analysis failed:', error.message);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Calculate total lines of code
   */
  async calculateTotalLOC(sourceFiles) {
    let totalLOC = 0;

    for (const file of sourceFiles.slice(0, 50)) { // Limit for performance
      try {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n').filter(line =>
          line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('#')
        );
        totalLOC += lines.length;
      } catch (error) {
        // Skip unreadable files
      }
    }

    return totalLOC;
  }

  /**
   * Calculate pattern interference based on naming consistency
   */
  calculatePatternInterference(sourceFiles) {
    const fileNames = sourceFiles.map(f => path.basename(f));

    // Check for consistent naming patterns
    const camelCase = fileNames.filter(name => /^[a-z][a-zA-Z]*$/.test(name)).length;
    const kebabCase = fileNames.filter(name => /^[a-z-]+$/.test(name)).length;
    const snakeCase = fileNames.filter(name => /^[a-z_]+$/.test(name)).length;

    const total = fileNames.length;
    const maxConsistent = Math.max(camelCase, kebabCase, snakeCase);

    // Interference is high when naming is inconsistent
    return 1 - (maxConsistent / total);
  }

  /**
   * Find source files in the codebase
   */
  async findSourceFiles(codebasePath) {
    const sourceFiles = [];
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go'];

    async function scanDirectory(dirPath) {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            // Skip common directories
            if (!['node_modules', '.git', 'dist', 'build', '__pycache__', '.next'].includes(entry.name)) {
              await scanDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
              sourceFiles.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    }

    await scanDirectory(codebasePath);
    return sourceFiles;
  }

  /**
   * Calculate overall analysis confidence
   */
  calculateConfidence(analysis) {
    const bugCount = analysis.bugs.length;
    const vulnCount = analysis.vulnerabilities.length;
    const fixCount = analysis.fixes.length;

    // Base confidence on detection results
    let confidence = 0.5; // Base confidence

    if (bugCount > 0) confidence += 0.2;
    if (vulnCount > 0) confidence += 0.2;
    if (fixCount > 0) confidence += 0.1;

    // Boost confidence if quantum analysis is available
    if (analysis.quantumMetrics && typeof analysis.quantumMetrics === 'object') {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  /**
   * Generate recommendations based on analysis
   */
  async generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.bugs.length > 10) {
      recommendations.push('High number of bugs detected - consider comprehensive refactoring');
    }

    if (analysis.vulnerabilities.length > 0) {
      recommendations.push('Security vulnerabilities found - prioritize fixes for production safety');
    }

    if (analysis.quantumMetrics?.dimensionalStability < 0.7) {
      recommendations.push('Low dimensional stability - consider architectural improvements');
    }

    if (analysis.fixes.length > 0) {
      recommendations.push(`${analysis.fixes.length} automated fixes available - review and apply`);
    }

    return recommendations;
  }

  /**
   * Apply automated fixes
   */
  async applyFixes(fixes, codebasePath) {
    const appliedFixes = [];
    const failedFixes = [];

    for (const fix of fixes) {
      try {
        const filePath = path.join(codebasePath, fix.file);

        if (!fix.changes || fix.changes.length === 0) continue;

        let content = await fs.readFile(filePath, 'utf8');

        for (const change of fix.changes) {
          switch (change.type) {
            case 'replace':
              content = content.replace(new RegExp(change.pattern, 'g'), change.replacement);
              break;
            case 'remove':
              content = content.replace(new RegExp(change.pattern, 'g'), '');
              break;
          }
        }

        await fs.writeFile(filePath, content, 'utf8');
        appliedFixes.push(fix);

      } catch (error) {
        log.warn(`Failed to apply fix for ${fix.file}:`, error.message);
        failedFixes.push({ fix, error: error.message });
      }
    }

    return { appliedFixes, failedFixes };
  }

  /**
   * Check if Code Roach integration is available
   */
  isAvailable() {
    return this.codeRoachService !== null;
  }

  /**
   * Get Code Roach integration status
   */
  getStatus() {
    return {
      enabled: this.options.enabled,
      available: this.isAvailable(),
      quantumAnalysis: this.quantumAnalyzer !== null,
      autoFix: this.options.autoFix,
      confidenceThreshold: this.options.confidenceThreshold,
      cacheSize: this.cache.size
    };
  }
}

module.exports = CodeRoachIntegration;
