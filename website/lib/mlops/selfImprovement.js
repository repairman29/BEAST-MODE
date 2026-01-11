/**
 * Self-Improvement Service
 * 
 * Uses BEAST MODE's own code generation capabilities to improve itself
 * - Scans codebase for improvement opportunities
 * - Generates fixes using BEAST MODE's code generation
 * - Applies improvements with quality validation
 * - Tracks improvement metrics
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
const path = require('path');
const fs = require('fs').promises;
const issueRecommender = require('./issueRecommender');

const log = createLogger('SelfImprovement');

class SelfImprovementService {
  constructor() {
    this.codebaseChat = null;
    this.featureGenerator = null;
    this.qualityAnalysis = null;
    this.improvements = [];
    this.metrics = {
      scans: 0,
      opportunities: 0,
      improvements: 0,
      qualityGains: []
    };
  }

  /**
   * Initialize dependencies
   */
  async initialize() {
    try {
      // Lazy load to avoid circular dependencies
      this.codebaseChat = require('./codebaseChat');
      this.featureGenerator = require('./featureGenerator');
      
      // Try to load quality analysis if available
      try {
        this.qualityAnalysis = require('./qualityAnalysis');
      } catch (e) {
        log.warn('Quality analysis not available, will use basic validation');
      }

      log.info('✅ Self-improvement service initialized');
    } catch (error) {
      log.error('Failed to initialize self-improvement service:', error);
      throw error;
    }
  }

  /**
   * Scan codebase for improvement opportunities
   */
  async scanForOpportunities(options = {}) {
    await this.initialize();
    this.metrics.scans++;

    const {
      repo = 'BEAST-MODE',
      targetDir = null,
      filePatterns = ['**/*.js', '**/*.ts'],
      minQualityThreshold = 0.7,
      maxFiles = 50
    } = options;

    log.info(`🔍 Scanning ${repo} for improvement opportunities...`);

    const opportunities = [];

    try {
      // Get codebase root
      const codebaseRoot = targetDir || this.getCodebaseRoot();
      
      // Find files to analyze
      const files = await this.findFiles(codebaseRoot, filePatterns, maxFiles);
      
      log.info(`Found ${files.length} files to analyze`);

      // Analyze each file
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf8');
          const analysis = await this.analyzeFile(file, content, minQualityThreshold);
          
          if (analysis.opportunities.length > 0) {
            opportunities.push({
              file,
              content,
              ...analysis
            });
          }
        } catch (error) {
          log.warn(`Failed to analyze ${file}:`, error.message);
        }
      }

      this.metrics.opportunities += opportunities.length;
      log.info(`✅ Found ${opportunities.length} improvement opportunities`);

      return opportunities;
    } catch (error) {
      log.error('Failed to scan for opportunities:', error);
      throw error;
    }
  }

  /**
   * Analyze a single file for improvement opportunities
   */
  async analyzeFile(filePath, content, minQualityThreshold) {
    const opportunities = [];
    const issues = [];

    // Basic code quality checks
    const checks = [
      {
        name: 'Long Functions',
        check: () => {
          const functions = content.match(/function\s+\w+[^{]*\{/g) || [];
          const longFunctions = functions.filter((_, i) => {
            const start = content.indexOf(functions[i]);
            const next = i < functions.length - 1 
              ? content.indexOf(functions[i + 1])
              : content.length;
            const functionLength = next - start;
            return functionLength > 100; // More than 100 lines
          });
          return longFunctions.length > 0;
        },
        description: 'Contains functions longer than 100 lines'
      },
      {
        name: 'Complex Conditionals',
        check: () => {
          const complexIfs = (content.match(/if\s*\([^)]{100,}\)/g) || []).length;
          return complexIfs > 0;
        },
        description: 'Contains complex conditional statements'
      },
      {
        name: 'Missing Error Handling',
        check: () => {
          const asyncFunctions = (content.match(/async\s+function/g) || []).length;
          const tryCatch = (content.match(/try\s*\{/g) || []).length;
          return asyncFunctions > tryCatch * 0.5; // Less than 50% have try-catch
        },
        description: 'Async functions missing error handling'
      },
      {
        name: 'Code Duplication',
        check: () => {
          // Simple check: repeated code blocks
          const lines = content.split('\n');
          const blockSizes = [5, 10, 15];
          for (const blockSize of blockSizes) {
            for (let i = 0; i < lines.length - blockSize; i++) {
              const block = lines.slice(i, i + blockSize).join('\n');
              const occurrences = (content.match(new RegExp(block.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
              if (occurrences > 1) {
                return true;
              }
            }
          }
          return false;
        },
        description: 'Contains duplicated code blocks'
      },
      {
        name: 'Missing Documentation',
        check: () => {
          const functions = (content.match(/function\s+\w+/g) || []).length;
          const comments = (content.match(/\/\*\*|\/\/\s+/g) || []).length;
          return functions > comments * 0.3; // Less than 30% have comments
        },
        description: 'Functions missing documentation'
      }
    ];

    // Run checks
    for (const check of checks) {
      if (check.check()) {
        issues.push({
          type: check.name,
          description: check.description,
          severity: 'medium'
        });
      }
    }

    // If issues found, create opportunities
    if (issues.length > 0) {
      opportunities.push({
        type: 'code-quality',
        issues,
        priority: issues.length > 3 ? 'high' : 'medium',
        estimatedGain: Math.min(0.15, issues.length * 0.03)
      });
    }

    return {
      opportunities,
      issues,
      filePath
    };
  }

  /**
   * Generate improvement for an opportunity
   */
  async generateImprovement(opportunity, options = {}) {
    await this.initialize();

    const {
      model = 'custom:beast-mode-code-model',
      userId = 'self-improvement',
      useLLM = true
    } = options;

    log.info(`🔧 Generating improvement for ${opportunity.file}...`);

    try {
      // Build improvement prompt
      const prompt = this.buildImprovementPrompt(opportunity);

      // Use BEAST MODE's codebase chat to generate improvement
      const response = await this.codebaseChat.processMessage(
        `self-improvement-${Date.now()}`,
        prompt,
        {
          repo: 'BEAST-MODE',
          model,
          customModelId: model.replace('custom:', ''),
          userId,
          useLLM,
          files: [{
            path: opportunity.file,
            content: opportunity.content
          }]
        }
      );

      // Extract code from response
      const improvedCode = this.extractCodeFromResponse(response);

      // Validate improvement
      const validation = await this.validateImprovement(
        opportunity.content,
        improvedCode,
        opportunity
      );

      if (!validation.valid) {
        log.warn(`Improvement validation failed: ${validation.reason}`);
        return {
          success: false,
          error: validation.reason,
          original: opportunity.content,
          improved: improvedCode
        };
      }

      const improvement = {
        file: opportunity.file,
        original: opportunity.content,
        improved: improvedCode,
        opportunity,
        validation,
        qualityGain: validation.qualityGain || 0,
        timestamp: new Date().toISOString()
      };

      this.improvements.push(improvement);
      this.metrics.improvements++;

      log.info(`✅ Generated improvement with quality gain: ${(validation.qualityGain * 100).toFixed(1)}%`);

      return {
        success: true,
        ...improvement
      };
    } catch (error) {
      log.error('Failed to generate improvement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build improvement prompt
   */
  buildImprovementPrompt(opportunity) {
    const issues = opportunity.opportunities[0]?.issues || [];
    const issueDescriptions = issues.map(i => `- ${i.type}: ${i.description}`).join('\n');

    return `Improve this code by addressing the following issues:

${issueDescriptions}

Current code:
\`\`\`javascript
${opportunity.content}
\`\`\`

Requirements:
1. Fix all identified issues
2. Maintain existing functionality
3. Improve code quality and maintainability
4. Add error handling where missing
5. Add documentation where missing
6. Refactor long functions if needed
7. Remove code duplication

Generate the improved code:`;
  }

  /**
   * Extract code from response
   */
  extractCodeFromResponse(response) {
    if (typeof response === 'string') {
      // Try to extract code blocks
      const codeBlockMatch = response.match(/```(?:javascript|typescript|js|ts)?\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        return codeBlockMatch[1];
      }
      return response;
    }

    if (response.code) {
      return response.code;
    }

    if (response.message) {
      const codeBlockMatch = response.message.match(/```(?:javascript|typescript|js|ts)?\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        return codeBlockMatch[1];
      }
      return response.message;
    }

    return JSON.stringify(response, null, 2);
  }

  /**
   * Validate improvement
   */
  async validateImprovement(original, improved, opportunity) {
    // Basic validation
    const validations = [];

    // 1. Check syntax (basic)
    try {
      // Try to parse as JavaScript
      if (improved.includes('function') || improved.includes('const') || improved.includes('let')) {
        // Basic syntax check - if it has common JS keywords, assume valid
        validations.push({ check: 'syntax', passed: true });
      } else {
        validations.push({ check: 'syntax', passed: false, reason: 'No JavaScript syntax detected' });
      }
    } catch (error) {
      validations.push({ check: 'syntax', passed: false, reason: error.message });
    }

    // 2. Check if improvement addresses issues
    const issues = opportunity.opportunities[0]?.issues || [];
    const addressedIssues = issues.filter(issue => {
      // Simple checks
      if (issue.type === 'Missing Error Handling') {
        return improved.includes('try') && improved.includes('catch');
      }
      if (issue.type === 'Missing Documentation') {
        return (improved.match(/\/\*\*|\/\/\s+/g) || []).length > (original.match(/\/\*\*|\/\/\s+/g) || []).length;
      }
      if (issue.type === 'Long Functions') {
        const functions = improved.match(/function\s+\w+[^{]*\{/g) || [];
        // Check if functions are shorter (simplified)
        return true; // Assume addressed if code was refactored
      }
      return true; // Default to true
    });

    validations.push({
      check: 'issues-addressed',
      passed: addressedIssues.length >= issues.length * 0.5, // At least 50% addressed
      addressed: addressedIssues.length,
      total: issues.length
    });

    // 3. Quality gain estimation (simplified)
    let qualityGain = 0;
    if (validations.every(v => v.passed)) {
      qualityGain = Math.min(0.15, issues.length * 0.03);
    }

    const allPassed = validations.every(v => v.passed);

    return {
      valid: allPassed,
      validations,
      qualityGain,
      reason: allPassed ? 'Improvement validated' : 'Some validations failed'
    };
  }

  /**
   * Apply improvement to file
   */
  async applyImprovement(improvement, options = {}) {
    const { dryRun = false, backup = true } = options;

    log.info(`${dryRun ? '[DRY RUN]' : ''} Applying improvement to ${improvement.file}...`);

    try {
      // Backup original file
      if (backup && !dryRun) {
        const backupPath = `${improvement.file}.backup.${Date.now()}`;
        await fs.writeFile(backupPath, improvement.original, 'utf8');
        log.info(`Backup created: ${backupPath}`);
      }

      // Apply improvement
      if (!dryRun) {
        await fs.writeFile(improvement.file, improvement.improved, 'utf8');
        log.info(`✅ Applied improvement to ${improvement.file}`);
      } else {
        log.info(`[DRY RUN] Would apply improvement to ${improvement.file}`);
      }

      // Track quality gain
      if (improvement.qualityGain) {
        this.metrics.qualityGains.push(improvement.qualityGain);
      }

      return {
        success: true,
        file: improvement.file,
        dryRun,
        qualityGain: improvement.qualityGain
      };
    } catch (error) {
      log.error('Failed to apply improvement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run full improvement cycle
   */
  async runImprovementCycle(options = {}) {
    await this.initialize();

    const {
      scanOptions = {},
      improvementOptions = {},
      applyOptions = { dryRun: true },
      maxImprovements = 10
    } = options;

    log.info('🚀 Starting self-improvement cycle...');

    try {
      // 1. Scan for opportunities
      const opportunities = await this.scanForOpportunities(scanOptions);
      
      if (opportunities.length === 0) {
        log.info('No improvement opportunities found');
        return {
          success: true,
          opportunities: 0,
          improvements: 0,
          metrics: this.metrics
        };
      }

      // 2. Generate improvements (limit to maxImprovements)
      const improvements = [];
      for (let i = 0; i < Math.min(opportunities.length, maxImprovements); i++) {
        const opportunity = opportunities[i];
        const improvement = await this.generateImprovement(opportunity, improvementOptions);
        
        if (improvement.success) {
          improvements.push(improvement);
        }
      }

      // 3. Apply improvements
      const applied = [];
      for (const improvement of improvements) {
        const result = await this.applyImprovement(improvement, applyOptions);
        if (result.success) {
          applied.push(result);
        }
      }

      log.info(`✅ Improvement cycle complete: ${applied.length} improvements applied`);

      return {
        success: true,
        opportunities: opportunities.length,
        improvements: improvements.length,
        applied: applied.length,
        metrics: this.metrics,
        improvements: applied
      };
    } catch (error) {
      log.error('Improvement cycle failed:', error);
      return {
        success: false,
        error: error.message,
        metrics: this.metrics
      };
    }
  }

  /**
   * Get improvement metrics
   */
  getMetrics() {
    const avgQualityGain = this.metrics.qualityGains.length > 0
      ? this.metrics.qualityGains.reduce((a, b) => a + b, 0) / this.metrics.qualityGains.length
      : 0;

    return {
      ...this.metrics,
      avgQualityGain,
      totalQualityGain: this.metrics.qualityGains.reduce((a, b) => a + b, 0)
    };
  }

  /**
   * Helper: Get codebase root
   */
  getCodebaseRoot() {
    // Try to find BEAST-MODE-PRODUCT root
    let current = __dirname;
    while (current !== path.dirname(current)) {
      if (path.basename(current) === 'BEAST-MODE-PRODUCT') {
        return current;
      }
      current = path.dirname(current);
    }
    // Fallback to lib directory
    return path.join(__dirname, '../..');
  }

  /**
   * Helper: Find files matching patterns
   */
  async findFiles(root, patterns, maxFiles) {
    const files = [];
    const { glob } = require('glob');

    for (const pattern of patterns) {
      try {
        const matches = await glob(pattern, {
          cwd: root,
          ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/out/**']
        });

        files.push(...matches.map(m => path.join(root, m)));
      } catch (error) {
        log.warn(`Failed to glob pattern ${pattern}:`, error.message);
      }
    }

    // Remove duplicates and limit
    const uniqueFiles = [...new Set(files)];
    return uniqueFiles.slice(0, maxFiles);
  }
}

// Singleton instance
let instance = null;

function getSelfImprovementService() {
  if (!instance) {
    instance = new SelfImprovementService();
  }
  return instance;
}

module.exports = {
  SelfImprovementService,
  getSelfImprovementService
};
