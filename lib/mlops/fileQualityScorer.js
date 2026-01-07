/**
 * File-Level Quality Scorer
 * 
 * Bridges repository quality insights to code-level improvements.
 * Scores individual files and maps quality factors to specific code issues.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const qualitySupabase = require('./qualitySupabaseIntegration');

class FileQualityScorer {
  constructor() {
    this.fileScores = new Map();
    this.qualityFactors = new Map();
  }

  /**
   * Calculate file hash for change detection
   */
  calculateFileHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Score a single file's quality
   * @param {string} filePath - Path to the file
   * @param {string} content - File content
   * @param {Object} repoContext - Repository context (language, hasTests, hasCI, etc.)
   * @returns {Object} File quality score and factors
   */
  scoreFile(filePath, content, repoContext = {}) {
    const extension = path.extname(filePath);
    const language = this.detectLanguage(extension, content);
    const fileName = path.basename(filePath);
    
    const factors = {
      // Code quality indicators
      hasTests: this.hasTests(filePath, repoContext),
      isTestFile: this.isTestFile(filePath),
      hasDocumentation: this.hasDocumentation(content),
      hasComments: this.hasComments(content),
      complexity: this.calculateComplexity(content, language),
      length: content.split('\n').length,
      duplication: 0, // Would need codebase analysis
      
      // Best practices
      followsNaming: this.followsNamingConventions(fileName, language),
      hasErrorHandling: this.hasErrorHandling(content, language),
      hasTypeSafety: this.hasTypeSafety(content, language),
      
      // Structure
      hasExports: this.hasExports(content, language),
      hasImports: this.hasImports(content, language),
      isModular: this.isModular(content, language),
      
      // Security
      hasSecurityIssues: this.hasSecurityIssues(content, language),
      
      // Performance
      hasPerformanceIssues: this.hasPerformanceIssues(content, language),
    };

    // Calculate quality score (0-1)
    const score = this.calculateFileScore(factors, repoContext);
    
    // Identify improvement opportunities
    const improvements = this.identifyImprovements(factors, repoContext, language);
    
    return {
      filePath,
      fileName,
      language,
      score,
      factors,
      improvements,
      qualityLevel: this.getQualityLevel(score),
    };
  }

  /**
   * Detect programming language from file extension and content
   */
  detectLanguage(extension, content) {
    const langMap = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'JavaScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.rs': 'Rust',
      '.go': 'Go',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.rb': 'Ruby',
      '.php': 'PHP',
    };
    
    if (langMap[extension]) {
      return langMap[extension];
    }
    
    // Fallback: detect from content
    if (content.includes('def ') && content.includes('import ')) return 'Python';
    if (content.includes('function ') || content.includes('const ') || content.includes('let ')) {
      return content.includes('interface ') || content.includes('type ') ? 'TypeScript' : 'JavaScript';
    }
    
    return 'Unknown';
  }

  /**
   * Check if file has corresponding tests
   */
  hasTests(filePath, repoContext) {
    // Check if test file exists
    const testPatterns = [
      filePath.replace(/\.(js|ts|jsx|tsx)$/, '.test.$1'),
      filePath.replace(/\.(js|ts|jsx|tsx)$/, '.spec.$1'),
      filePath.replace(/\.py$/, '_test.py'),
      filePath.replace(/\.py$/, 'test_'),
    ];
    
    // Would need to check file system or repo context
    return repoContext.hasTests || false;
  }

  /**
   * Check if file is a test file
   */
  isTestFile(filePath) {
    return /\.(test|spec)\.(js|ts|jsx|tsx|py)$/i.test(filePath) ||
           /test_.*\.py$/i.test(filePath) ||
           /.*_test\.py$/i.test(filePath);
  }

  /**
   * Check if file has documentation
   */
  hasDocumentation(content) {
    // Check for JSDoc, docstrings, comments
    const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(content);
    const hasDocstring = /""".*?"""/s.test(content) || /'''.*?'''/s.test(content);
    const hasComments = /\/\/.*|\/\*[\s\S]*?\*\//.test(content);
    
    return hasJSDoc || hasDocstring || (hasComments && content.split('\n').filter(l => l.trim().startsWith('//') || l.trim().startsWith('/*')).length > 5);
  }

  /**
   * Check if file has comments
   */
  hasComments(content) {
    return /\/\/.*|\/\*[\s\S]*?\*\//.test(content);
  }

  /**
   * Calculate code complexity (simplified)
   */
  calculateComplexity(content, language) {
    const lines = content.split('\n');
    let complexity = 1; // Base complexity
    
    // Count control flow statements
    const complexityKeywords = {
      'JavaScript': ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'],
      'TypeScript': ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'],
      'Python': ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'and', 'or'],
    };
    
    const keywords = complexityKeywords[language] || complexityKeywords['JavaScript'];
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) complexity += matches.length;
    });
    
    // Normalize by file length
    const normalizedComplexity = Math.min(complexity / Math.max(lines.length / 10, 1), 10);
    
    return {
      raw: complexity,
      normalized: normalizedComplexity,
      level: normalizedComplexity < 3 ? 'low' : normalizedComplexity < 6 ? 'medium' : 'high',
    };
  }

  /**
   * Check if file follows naming conventions
   */
  followsNamingConventions(fileName, language) {
    // Check file naming
    if (language === 'Python') {
      return /^[a-z_][a-z0-9_]*\.py$/.test(fileName) || /^[A-Z][a-zA-Z0-9]*\.py$/.test(fileName);
    }
    if (language === 'JavaScript' || language === 'TypeScript') {
      return /^[a-z][a-zA-Z0-9]*\.(js|ts|jsx|tsx)$/.test(fileName) || /^[A-Z][a-zA-Z0-9]*\.(js|ts|jsx|tsx)$/.test(fileName);
    }
    return true; // Default: assume OK
  }

  /**
   * Check if file has error handling
   */
  hasErrorHandling(content, language) {
    if (language === 'JavaScript' || language === 'TypeScript') {
      return /try\s*\{|catch\s*\(|\.catch\(|if\s*\(.*error/i.test(content);
    }
    if (language === 'Python') {
      return /try:|except|raise|assert/.test(content);
    }
    return false;
  }

  /**
   * Check if file has type safety
   */
  hasTypeSafety(content, language) {
    if (language === 'TypeScript') {
      return /:\s*\w+|interface\s+\w+|type\s+\w+/.test(content);
    }
    if (language === 'Python') {
      return /:\s*\w+|->\s*\w+|def\s+\w+\([^)]*:\s*\w+/.test(content); // Type hints
    }
    return false;
  }

  /**
   * Check if file has exports
   */
  hasExports(content, language) {
    if (language === 'JavaScript' || language === 'TypeScript') {
      return /export\s+(default\s+)?(function|class|const|let|var)|module\.exports/.test(content);
    }
    if (language === 'Python') {
      return false; // Python doesn't need explicit exports
    }
    return true; // Default: assume OK
  }

  /**
   * Check if file has imports
   */
  hasImports(content, language) {
    if (language === 'JavaScript' || language === 'TypeScript') {
      return /import\s+.*from|require\(/.test(content);
    }
    if (language === 'Python') {
      return /^import\s+|^from\s+.*import/.test(content);
    }
    return false;
  }

  /**
   * Check if file is modular (has functions/classes)
   */
  isModular(content, language) {
    if (language === 'JavaScript' || language === 'TypeScript') {
      return /(function|const|let|var)\s+\w+\s*=|class\s+\w+|export\s+(function|class|const)/.test(content);
    }
    if (language === 'Python') {
      return /def\s+\w+|class\s+\w+/.test(content);
    }
    return false;
  }

  /**
   * Check for security issues (simplified)
   */
  hasSecurityIssues(content, language) {
    const securityPatterns = [
      /eval\s*\(/i,
      /innerHTML\s*=/i,
      /dangerouslySetInnerHTML/i,
      /\.innerHTML/i,
      /sql\s*\+/i, // SQL concatenation
      /password\s*=\s*["']/i, // Hardcoded passwords
    ];
    
    return securityPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check for performance issues (simplified)
   */
  hasPerformanceIssues(content, language) {
    const performancePatterns = [
      /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)\s*\{/s, // Nested loops
      /\.map\([^)]*\)\.map\(/i, // Multiple map chains
      /\.filter\([^)]*\)\.filter\(/i, // Multiple filter chains
    ];
    
    return performancePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Calculate file quality score (0-1)
   */
  calculateFileScore(factors, repoContext) {
    let score = 0.5; // Base score
    
    // Positive factors
    if (factors.hasTests) score += 0.15;
    if (factors.hasDocumentation) score += 0.10;
    if (factors.hasComments) score += 0.05;
    if (factors.followsNaming) score += 0.05;
    if (factors.hasErrorHandling) score += 0.10;
    if (factors.hasTypeSafety) score += 0.10;
    if (factors.isModular) score += 0.05;
    
    // Negative factors
    if (factors.complexity.level === 'high') score -= 0.15;
    if (factors.complexity.level === 'medium') score -= 0.08;
    if (factors.hasSecurityIssues) score -= 0.20;
    if (factors.hasPerformanceIssues) score -= 0.10;
    if (factors.length > 500) score -= 0.05; // Very long files
    if (factors.length < 10 && !factors.isTestFile) score -= 0.05; // Very short files (likely incomplete)
    
    // Normalize to 0-1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get quality level label
   */
  getQualityLevel(score) {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  }

  /**
   * Identify improvement opportunities for a file
   */
  identifyImprovements(factors, repoContext, language) {
    const improvements = [];
    
    if (!factors.hasTests && !factors.isTestFile) {
      improvements.push({
        type: 'add_tests',
        priority: 'high',
        message: `Add tests for ${path.basename(factors.filePath || 'this file')}`,
        estimatedImpact: 0.15,
      });
    }
    
    if (!factors.hasDocumentation) {
      improvements.push({
        type: 'add_documentation',
        priority: 'medium',
        message: `Add documentation (JSDoc/docstrings)`,
        estimatedImpact: 0.10,
      });
    }
    
    if (factors.complexity.level === 'high') {
      improvements.push({
        type: 'reduce_complexity',
        priority: 'high',
        message: `Reduce complexity (current: ${factors.complexity.normalized.toFixed(1)})`,
        estimatedImpact: 0.15,
      });
    }
    
    if (!factors.hasErrorHandling) {
      improvements.push({
        type: 'add_error_handling',
        priority: 'medium',
        message: `Add error handling (try/catch or equivalent)`,
        estimatedImpact: 0.10,
      });
    }
    
    if (language === 'TypeScript' && !factors.hasTypeSafety) {
      improvements.push({
        type: 'add_type_safety',
        priority: 'medium',
        message: `Add TypeScript type annotations`,
        estimatedImpact: 0.10,
      });
    }
    
    if (factors.hasSecurityIssues) {
      improvements.push({
        type: 'fix_security',
        priority: 'critical',
        message: `Fix security issues (eval, innerHTML, SQL injection risks)`,
        estimatedImpact: 0.20,
      });
    }
    
    if (factors.hasPerformanceIssues) {
      improvements.push({
        type: 'fix_performance',
        priority: 'medium',
        message: `Optimize performance (nested loops, multiple iterations)`,
        estimatedImpact: 0.10,
      });
    }
    
    return improvements.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Score all files in a repository
   * @param {Array} files - Array of {path, content} objects
   * @param {Object} repoContext - Repository context
   * @param {string} repo - Repository name (for Supabase storage)
   * @returns {Object} Repository file quality analysis
   */
  async scoreRepository(files, repoContext, repo = null) {
    const fileScores = [];
    const qualityDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
    const improvementsByType = {};
    let totalScore = 0;
    
    // Score files and store in Supabase if repo provided
    for (const { path: filePath, content } of files) {
      const fileHash = this.calculateFileHash(content);
      const fileScore = this.scoreFile(filePath, content, repoContext);
      fileScores.push(fileScore);
      
      qualityDistribution[fileScore.qualityLevel]++;
      totalScore += fileScore.score;
      
      // Store in Supabase if repo provided
      if (repo) {
        await qualitySupabase.storeFileQualityScore(
          repo,
          filePath,
          fileScore.fileName,
          fileScore.language,
          fileScore.score,
          fileScore.factors,
          fileScore.improvements,
          fileHash
        ).catch(err => {
          console.warn(`[File Quality Scorer] Failed to store score for ${filePath}:`, err.message);
        });
      }
      
      // Aggregate improvements
      fileScore.improvements.forEach(improvement => {
        if (!improvementsByType[improvement.type]) {
          improvementsByType[improvement.type] = [];
        }
        improvementsByType[improvement.type].push({
          file: filePath,
          ...improvement,
        });
      });
    }
    
    const averageScore = fileScores.length > 0 ? totalScore / fileScores.length : 0;
    
    // Identify top improvement opportunities
    const topImprovements = Object.values(improvementsByType)
      .flat()
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.estimatedImpact - a.estimatedImpact;
      })
      .slice(0, 20); // Top 20 improvements
    
    // Files needing most improvement
    const filesNeedingImprovement = fileScores
      .filter(f => f.score < 0.6)
      .sort((a, b) => a.score - b.score)
      .slice(0, 10);
    
    return {
      averageScore,
      fileCount: fileScores.length,
      qualityDistribution,
      fileScores: fileScores.sort((a, b) => b.score - a.score),
      topImprovements,
      filesNeedingImprovement,
      improvementsByType,
    };
  }

  /**
   * Map repository quality insights to file-level improvements
   * @param {Array} qualityRecommendations - Repository-level quality recommendations
   * @param {Object} fileAnalysis - File-level quality analysis
   * @returns {Array} Mapped improvements with file-level actions
   */
  mapQualityToCode(qualityRecommendations, fileAnalysis) {
    const mappedImprovements = [];
    
    qualityRecommendations.forEach(rec => {
      // Map "Add Test Coverage" → specific files needing tests
      if (rec.action.includes('Test') || rec.action.includes('test')) {
        const filesNeedingTests = fileAnalysis.fileScores
          .filter(f => !f.factors.hasTests && !f.factors.isTestFile)
          .slice(0, 10);
        
        mappedImprovements.push({
          recommendation: rec,
          files: filesNeedingTests.map(f => ({
            path: f.filePath,
            action: 'add_tests',
            priority: rec.priority,
            estimatedImpact: rec.estimatedGain || 0.15,
          })),
        });
      }
      
      // Map "Add Documentation" → files without docs
      if (rec.action && (rec.action.includes('Documentation') || rec.action.includes('README'))) {
        const filesNeedingDocs = fileAnalysis.fileScores
          .filter(f => !f.factors.hasDocumentation)
          .slice(0, 10);
        
        if (filesNeedingDocs.length > 0) {
          mappedImprovements.push({
            recommendation: rec,
            files: filesNeedingDocs.map(f => ({
              path: f.filePath,
              action: 'add_documentation',
              priority: rec.priority,
              estimatedImpact: rec.estimatedGain || 0.10,
            })),
          });
        }
      }
      
      // Map "Add Type Safety" → TypeScript files without types
      if (rec.action && (rec.action.includes('Type Safety') || rec.action.includes('Linting'))) {
        const filesNeedingTypes = fileAnalysis.fileScores
          .filter(f => f.language === 'TypeScript' && !f.factors.hasTypeSafety)
          .slice(0, 10);
        
        if (filesNeedingTypes.length > 0) {
          mappedImprovements.push({
            recommendation: rec,
            files: filesNeedingTypes.map(f => ({
              path: f.filePath,
              action: 'add_type_safety',
              priority: rec.priority,
              estimatedImpact: rec.estimatedGain || 0.10,
            })),
          });
        }
      }
    });
    
    return mappedImprovements;
  }
}

module.exports = new FileQualityScorer();

