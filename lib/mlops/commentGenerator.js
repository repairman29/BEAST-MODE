/**
 * Code Comment Generator
 * Uses BEAST MODE's LLM to generate inline comments
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

const log = createLogger('CommentGenerator');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class CommentGenerator {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate comments for code
   * @param {string} code - Code to comment
   * @param {string} language - Programming language
   * @param {Object} options - Options
   * @returns {Promise<string>} Code with comments
   */
  async generateComments(code, language = 'javascript', options = {}) {
    const cacheKey = `${language}-${code.substring(0, 500)}`;
    if (this.cache.has(cacheKey) && !options.force) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `comment-generation-${Date.now()}`,
        message: `Add inline comments to this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Requirements:
- Add comments explaining what each function/class does
- Explain complex logic and algorithms
- Document important edge cases
- Use clear, concise comments
- Follow ${language} comment style conventions
- Don't over-comment obvious code

Return ONLY the code with comments added, no explanations outside the code.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        let commentedCode = response.data.message.trim();
        
        // Extract code from markdown if present
        const codeBlockMatch = commentedCode.match(/```(?:javascript|js|typescript|ts)?\n([\s\S]*?)```/);
        if (codeBlockMatch) {
          commentedCode = codeBlockMatch[1].trim();
        }

        this.cache.set(cacheKey, commentedCode);
        return commentedCode;
      }

      throw new Error('No commented code in response');
    } catch (error) {
      log.error('Failed to generate comments:', error.message);
      // Fallback: return original code
      return code;
    }
  }

  /**
   * Generate function documentation comment
   * @param {string} functionCode - Function code
   * @param {string} language - Programming language
   * @returns {Promise<string>} Documentation comment
   */
  async generateFunctionDoc(functionCode, language = 'javascript') {
    try {
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `function-doc-${Date.now()}`,
        message: `Generate a ${language === 'javascript' ? 'JSDoc' : 'docstring'} comment for this function:

\`\`\`${language}
${functionCode}
\`\`\`

Return ONLY the comment block, no code.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        return response.data.message.trim();
      }
    } catch (error) {
      log.error('Failed to generate function doc:', error.message);
    }

    return null;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new CommentGenerator();
