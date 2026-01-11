/**
 * Progressive Enhancement
 * Combines heuristics with LLM enhancement for cost-effective analysis
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

const log = createLogger('ProgressiveEnhancer');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class ProgressiveEnhancer {
  constructor(options = {}) {
    this.options = {
      confidenceThreshold: options.confidenceThreshold || 0.7,
      useCache: options.useCache !== false,
      ...options
    };
    this.cache = new Map();
  }

  /**
   * Analyze with progressive enhancement
   * @param {string} code - Code to analyze
   * @param {string} filePath - File path
   * @param {Function} heuristicAnalyzer - Heuristic analysis function
   * @param {Object} options - Options
   * @returns {Promise<Object>} Enhanced analysis result
   */
  async analyzeWithEnhancement(code, filePath, heuristicAnalyzer, options = {}) {
    // Step 1: Run heuristic analysis (fast, free)
    const heuristicResult = await heuristicAnalyzer(code, filePath);
    
    // Step 2: Check if enhancement is needed
    const needsEnhancement = this.shouldEnhance(heuristicResult, options);
    
    if (!needsEnhancement) {
      log.debug('Heuristic analysis sufficient, skipping LLM enhancement');
      return {
        ...heuristicResult,
        enhanced: false,
        source: 'heuristic'
      };
    }

    // Step 3: Enhance with LLM
    log.debug('Enhancing analysis with LLM');
    const enhancedResult = await this.enhanceWithLLM(heuristicResult, code, filePath, options);
    
    return {
      ...enhancedResult,
      enhanced: true,
      source: 'heuristic+llm',
      originalHeuristic: heuristicResult
    };
  }

  /**
   * Determine if enhancement is needed
   */
  shouldEnhance(heuristicResult, options) {
    const threshold = options.confidenceThreshold || this.options.confidenceThreshold;
    
    // Enhance if confidence is low
    if (heuristicResult.confidence !== undefined && heuristicResult.confidence < threshold) {
      return true;
    }
    
    // Enhance if quality is low
    if (heuristicResult.quality !== undefined && heuristicResult.quality < threshold) {
      return true;
    }
    
    // Enhance if issues found
    if (heuristicResult.issues && heuristicResult.issues.length > 0) {
      return true;
    }
    
    // Enhance if explicitly requested
    if (options.forceEnhancement) {
      return true;
    }
    
    return false;
  }

  /**
   * Enhance result with LLM
   */
  async enhanceWithLLM(heuristicResult, code, filePath, options = {}) {
    const cacheKey = `${filePath}-${code.substring(0, 500)}-${JSON.stringify(heuristicResult)}`;
    if (this.options.useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `progressive-enhancement-${Date.now()}`,
        message: `Enhance this code analysis with additional insights:

File: ${filePath}

Code:
\`\`\`javascript
${code.substring(0, 2000)}
\`\`\`

Current Analysis:
${JSON.stringify(heuristicResult, null, 2)}

Enhance the analysis by:
1. Providing deeper insights
2. Identifying additional issues
3. Suggesting improvements
4. Explaining complex patterns
5. Adding context-aware recommendations

Return enhanced analysis as JSON with same structure plus additional insights.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        let enhanced = null;
        try {
          // Try to parse as JSON
          const jsonMatch = response.data.message.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            enhanced = JSON.parse(jsonMatch[0]);
          } else {
            // Merge with heuristic result
            enhanced = {
              ...heuristicResult,
              insights: response.data.message,
              enhanced: true
            };
          }
        } catch (parseError) {
          log.warn('Failed to parse enhanced result as JSON, using text merge');
          enhanced = {
            ...heuristicResult,
            insights: response.data.message,
            enhanced: true
          };
        }

        if (this.options.useCache) {
          this.cache.set(cacheKey, enhanced);
        }
        
        return enhanced;
      }

      throw new Error('No enhancement in response');
    } catch (error) {
      log.error('Failed to enhance with LLM:', error.message);
      // Return original heuristic result
      return {
        ...heuristicResult,
        enhanced: false,
        error: error.message
      };
    }
  }

  /**
   * Combine heuristic and LLM results
   */
  combineResults(heuristicResult, llmResult) {
    return {
      // Use LLM insights where available, fallback to heuristic
      quality: llmResult.quality !== undefined ? llmResult.quality : heuristicResult.quality,
      confidence: llmResult.confidence !== undefined ? llmResult.confidence : heuristicResult.confidence,
      
      // Merge issues (deduplicate)
      issues: this.mergeIssues(heuristicResult.issues || [], llmResult.issues || []),
      
      // Combine recommendations
      recommendations: [
        ...(heuristicResult.recommendations || []),
        ...(llmResult.recommendations || [])
      ],
      
      // Add insights from LLM
      insights: llmResult.insights || llmResult.message,
      
      // Metadata
      source: 'heuristic+llm',
      heuristic: heuristicResult,
      llm: llmResult
    };
  }

  /**
   * Merge issues, deduplicating
   */
  mergeIssues(heuristicIssues, llmIssues) {
    const merged = [...heuristicIssues];
    const seen = new Set(heuristicIssues.map(i => i.type + i.description));
    
    for (const issue of llmIssues) {
      const key = issue.type + issue.description;
      if (!seen.has(key)) {
        merged.push(issue);
        seen.add(key);
      }
    }
    
    return merged;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = { ProgressiveEnhancer };
