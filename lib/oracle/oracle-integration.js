/**
 * BEAST MODE Oracle Integration
 * Leverages Oracle AI for architectural insights and code understanding
 */

const path = require('path');
const fs = require('fs').promises;
const { createLogger } = require('../utils/logger');

const log = createLogger('OracleIntegration');

class OracleIntegration {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      cacheEnabled: true,
      apiEndpoint: options.apiEndpoint || 'http://localhost:3006', // Oracle standalone port
      ...options
    };

    this.oracleService = null;
    this.cache = new Map();
    this.initialized = false;
  }

  /**
   * Initialize Oracle integration
   */
  async initialize() {
    if (this.initialized) return;

    log.info('🔮 Initializing BEAST MODE Oracle Integration...');

    try {
      // Try to connect to Oracle standalone service
      if (this.options.enabled) {
        await this.connectToOracle();
      }

      this.initialized = true;
      log.info('✅ BEAST MODE Oracle Integration ready');

    } catch (error) {
      log.warn('⚠️ Oracle integration failed, running in degraded mode:', error.message);
      // Continue without Oracle - BEAST MODE can still function
      this.initialized = true;
    }
  }

  /**
   * Connect to Oracle service
   */
  async connectToOracle() {
    try {
      // Test Oracle connectivity
      const response = await fetch(`${this.options.apiEndpoint}/health`, {
        timeout: 5000
      });

      if (response.ok) {
        log.info('🔗 Connected to Oracle service');
        this.oracleService = { endpoint: this.options.apiEndpoint };
      } else {
        throw new Error(`Oracle health check failed: ${response.status}`);
      }
    } catch (error) {
      // Fallback: try to load local Oracle service
      try {
        const oraclePath = path.join(__dirname, '../../../oracle-standalone/src/services/oracleService');
        const OracleService = require(oraclePath);
        this.oracleService = new OracleService();
        await this.oracleService.initializeEmbeddings();
        log.info('🔗 Loaded local Oracle service');
      } catch (localError) {
        throw new Error(`Cannot connect to Oracle: ${error.message}`);
      }
    }
  }

  /**
   * Analyze code architecture and provide insights
   */
  async analyzeArchitecture(codebasePath, options = {}) {
    const cacheKey = `architecture_${codebasePath}`;

    if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      if (!this.oracleService) {
        return this.generateFallbackAnalysis(codebasePath);
      }

      const analysis = await this.performOracleAnalysis(codebasePath, options);

      if (this.options.cacheEnabled) {
        this.cache.set(cacheKey, analysis);
      }

      return analysis;

    } catch (error) {
      log.warn('Oracle architecture analysis failed:', error.message);
      return this.generateFallbackAnalysis(codebasePath);
    }
  }

  /**
   * Perform actual Oracle analysis
   */
  async performOracleAnalysis(codebasePath, options) {
    const analysis = {
      architecturalInsights: [],
      codeQuality: {},
      recommendations: [],
      complexity: {},
      dependencies: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Get critical paths analysis
      const criticalPaths = await this.oracleService.getCriticalPaths();
      analysis.architecturalInsights.push({
        type: 'critical-paths',
        data: criticalPaths,
        insight: `Found ${criticalPaths.length} critical architectural paths`
      });

      // Analyze key files
      const keyFiles = await this.findKeyFiles(codebasePath);
      for (const file of keyFiles.slice(0, 5)) { // Limit to top 5
        try {
          const fileContext = await this.oracleService.getFileContext(file);
          const dependencyAnalysis = await this.oracleService.getDependencyAnalysis(file);

          analysis.codeQuality[file] = {
            context: fileContext,
            dependencies: dependencyAnalysis,
            complexity: this.calculateComplexity(fileContext)
          };
        } catch (error) {
          log.debug(`Failed to analyze ${file}:`, error.message);
        }
      }

      // Generate architectural alignment check
      analysis.recommendations = await this.generateRecommendations(analysis);

    } catch (error) {
      log.warn('Oracle analysis partially failed:', error.message);
    }

    return analysis;
  }

  /**
   * Generate fallback analysis when Oracle is unavailable
   */
  generateFallbackAnalysis(codebasePath) {
    return {
      architecturalInsights: [{
        type: 'basic-analysis',
        data: { files: 'unknown' },
        insight: 'Oracle unavailable - basic file structure analysis only'
      }],
      codeQuality: {
        status: 'oracle-unavailable',
        fallback: true
      },
      recommendations: [
        'Connect to Oracle service for advanced architectural analysis',
        'Enable Oracle integration in BEAST MODE configuration'
      ],
      complexity: { status: 'unknown' },
      dependencies: { status: 'unknown' },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Find key files in the codebase
   */
  async findKeyFiles(codebasePath) {
    const keyFiles = [];
    const patterns = [
      'package.json',
      'index.js',
      'main.js',
      'app.js',
      'server.js',
      'lib/index.js',
      'src/index.js',
      'src/app.js'
    ];

    for (const pattern of patterns) {
      const filePath = path.join(codebasePath, pattern);
      try {
        await fs.access(filePath);
        keyFiles.push(filePath);
      } catch (error) {
        // File doesn't exist, continue
      }
    }

    return keyFiles;
  }

  /**
   * Calculate code complexity from context
   */
  calculateComplexity(fileContext) {
    // Simple complexity calculation based on file structure
    const lines = fileContext.content?.split('\n').length || 0;
    const functions = (fileContext.content?.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
    const classes = (fileContext.content?.match(/class\s+\w+/g) || []).length;

    return {
      lines,
      functions,
      classes,
      score: Math.min(100, (lines / 10) + (functions * 2) + (classes * 5))
    };
  }

  /**
   * Generate architectural recommendations
   */
  async generateRecommendations(analysis) {
    const recommendations = [];

    // Check for architectural issues
    if (Object.keys(analysis.codeQuality).length === 0) {
      recommendations.push('Enable Oracle integration for detailed code analysis');
    }

    // Check complexity
    const avgComplexity = Object.values(analysis.codeQuality)
      .reduce((sum, file) => sum + (file.complexity?.score || 0), 0) /
      Math.max(1, Object.keys(analysis.codeQuality).length);

    if (avgComplexity > 50) {
      recommendations.push('Consider refactoring high-complexity files');
    }

    // Check for missing architectural insights
    if (analysis.architecturalInsights.length === 0) {
      recommendations.push('Connect Oracle for architectural pattern analysis');
    }

    return recommendations;
  }

  /**
   * Search Oracle knowledge base
   */
  async searchKnowledge(query, options = {}) {
    if (!this.oracleService) {
      return { results: [], status: 'oracle-unavailable' };
    }

    try {
      const results = await this.oracleService.searchKnowledge(query, options);
      return {
        results,
        status: 'success',
        source: 'oracle'
      };
    } catch (error) {
      log.warn('Oracle knowledge search failed:', error.message);
      return {
        results: [],
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Get system health from Oracle
   */
  async getSystemHealth() {
    if (!this.oracleService) {
      return { status: 'oracle-unavailable' };
    }

    try {
      return await this.oracleService.getSystemHealth();
    } catch (error) {
      log.warn('Oracle system health check failed:', error.message);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Check if Oracle integration is available
   */
  isAvailable() {
    return this.oracleService !== null;
  }

  /**
   * Get Oracle integration status
   */
  getStatus() {
    return {
      enabled: this.options.enabled,
      available: this.isAvailable(),
      endpoint: this.options.apiEndpoint,
      cacheEnabled: this.options.cacheEnabled,
      cacheSize: this.cache.size
    };
  }
}

module.exports = OracleIntegration;
