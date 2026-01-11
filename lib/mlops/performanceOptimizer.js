/**
 * Performance Optimizer
 * Uses BEAST MODE's LLM to suggest performance optimizations
 */

const axios = require('axios');
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

const log = createLogger('PerformanceOptimizer');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class PerformanceOptimizer {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get performance optimization suggestions
   * @param {string} code - Code to optimize
   * @param {string} filePath - File path
   * @param {Object} metrics - Performance metrics (optional)
   * @returns {Promise<Array>} Optimization suggestions
   */
  async getOptimizations(code, filePath, metrics = {}) {
    const cacheKey = `${filePath}-${code.substring(0, 500)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `performance-optimization-${Date.now()}`,
        message: `Analyze this code for performance optimization opportunities:

File: ${filePath}

Code:
\`\`\`javascript
${code}
\`\`\`

${Object.keys(metrics).length > 0 ? `Performance Metrics:\n${JSON.stringify(metrics, null, 2)}` : ''}

Focus on:
1. Algorithm improvements
2. Caching opportunities
3. Lazy loading possibilities
4. Memory optimization
5. Async/await patterns
6. Database query optimization
7. Loop optimization
8. Unnecessary computations

For each optimization, provide:
- Type of optimization
- Current performance issue
- Suggested improvement
- Optimized code example
- Expected performance gain

Return as JSON array of optimization objects with: type, issue, improvement, codeExample, expectedGain.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        let optimizations = [];
        try {
          // Try to parse as JSON
          const jsonMatch = response.data.message.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            optimizations = JSON.parse(jsonMatch[0]);
          } else {
            // Parse as structured text
            optimizations = this.parseOptimizations(response.data.message);
          }
        } catch (parseError) {
          log.warn('Failed to parse optimizations as JSON, using text parser');
          optimizations = this.parseOptimizations(response.data.message);
        }

        this.cache.set(cacheKey, optimizations);
        return optimizations;
      }

      throw new Error('No optimizations in response');
    } catch (error) {
      log.error('Failed to get performance optimizations:', error.message);
      // Fallback to basic optimizations
      return this.generateFallbackOptimizations(code);
    }
  }

  /**
   * Get optimized code
   * @param {string} code - Original code
   * @param {Object} optimization - Optimization suggestion
   * @returns {Promise<string>} Optimized code
   */
  async getOptimizedCode(code, optimization) {
    try {
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `performance-apply-${Date.now()}`,
        message: `Apply this performance optimization:

Type: ${optimization.type}
Issue: ${optimization.issue}
Improvement: ${optimization.improvement}

Original Code:
\`\`\`javascript
${code}
\`\`\`

Apply the optimization and return ONLY the optimized code, no explanations.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        let optimizedCode = response.data.message.trim();
        
        // Extract code from markdown if present
        const codeBlockMatch = optimizedCode.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
        if (codeBlockMatch) {
          optimizedCode = codeBlockMatch[1].trim();
        }

        return optimizedCode;
      }
    } catch (error) {
      log.error('Failed to get optimized code:', error.message);
    }

    return null;
  }

  /**
   * Parse optimizations from text
   */
  parseOptimizations(text) {
    const optimizations = [];
    const lines = text.split('\n');
    let currentOpt = null;

    for (const line of lines) {
      if (line.match(/^\d+\./)) {
        if (currentOpt) optimizations.push(currentOpt);
        currentOpt = {
          type: line.replace(/^\d+\.\s*/, '').trim(),
          issue: '',
          improvement: '',
          codeExample: null,
          expectedGain: null
        };
      } else if (currentOpt) {
        if (line.toLowerCase().includes('issue:') || line.toLowerCase().includes('problem:')) {
          currentOpt.issue = line.replace(/.*(?:issue|problem):\s*/i, '').trim();
        } else if (line.toLowerCase().includes('improvement:') || line.toLowerCase().includes('solution:')) {
          currentOpt.improvement = line.replace(/.*(?:improvement|solution):\s*/i, '').trim();
        } else if (line.toLowerCase().includes('gain:') || line.toLowerCase().includes('improvement:')) {
          currentOpt.expectedGain = line.replace(/.*(?:gain|improvement):\s*/i, '').trim();
        } else if (line.trim()) {
          if (!currentOpt.issue) {
            currentOpt.issue = line.trim();
          } else if (!currentOpt.improvement) {
            currentOpt.improvement = line.trim();
          }
        }
      }
    }
    if (currentOpt) optimizations.push(currentOpt);

    return optimizations.length > 0 ? optimizations : this.generateFallbackOptimizations('');
  }

  /**
   * Generate fallback optimizations
   */
  generateFallbackOptimizations(code) {
    const optimizations = [];
    
    // Check for common performance issues
    if (code.includes('for (') && code.includes('for (')) {
      optimizations.push({
        type: 'Nested Loop Optimization',
        issue: 'Nested loops detected',
        improvement: 'Consider using more efficient algorithms or data structures',
        codeExample: null,
        expectedGain: 'O(n²) → O(n log n) or better'
      });
    }

    if (code.includes('.map(') && code.includes('.filter(') && code.includes('.map(')) {
      optimizations.push({
        type: 'Array Method Chaining',
        issue: 'Multiple array iterations',
        improvement: 'Combine map/filter operations into single pass',
        codeExample: null,
        expectedGain: '2-3x faster'
      });
    }

    return optimizations;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new PerformanceOptimizer();
