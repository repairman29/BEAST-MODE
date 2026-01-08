/**
 * Error Message Enhancer
 * Uses BEAST MODE's LLM to generate helpful error messages
 */

const axios = require('axios');
const { createLogger } = require('../utils/logger');

const log = createLogger('ErrorMessageEnhancer');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class ErrorMessageEnhancer {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Enhance an error message
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Context (code, file, etc.)
   * @returns {Promise<string>} Enhanced error message
   */
  async enhanceError(error, context = {}) {
    const errorMessage = error instanceof Error ? error.message : error;
    const cacheKey = `${errorMessage}-${context.filePath || ''}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `error-enhancement-${Date.now()}`,
        message: `Transform this error message into a helpful, actionable message for developers:

Original Error: ${errorMessage}

Context:
${context.code ? `Code:\n\`\`\`javascript\n${context.code.substring(0, 1000)}\n\`\`\`` : ''}
${context.filePath ? `File: ${context.filePath}` : ''}
${context.stack ? `Stack: ${context.stack.substring(0, 500)}` : ''}

Create an enhanced error message that:
1. Explains what went wrong in plain language
2. Explains why it happened (root cause)
3. Provides specific steps to fix it
4. Is friendly and helpful (not technical jargon)

Return ONLY the enhanced error message, no explanations.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        const enhanced = response.data.message.trim();
        this.cache.set(cacheKey, enhanced);
        return enhanced;
      }

      throw new Error('No enhanced message in response');
    } catch (error) {
      log.error('Failed to enhance error message:', error.message);
      // Fallback: return original with context
      return this.generateFallbackMessage(errorMessage, context);
    }
  }

  /**
   * Generate fallback error message
   */
  generateFallbackMessage(errorMessage, context) {
    let message = errorMessage;
    
    if (context.filePath) {
      message += ` (in ${context.filePath})`;
    }
    
    if (context.code) {
      message += '. Check the code around this location.';
    }
    
    return message;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new ErrorMessageEnhancer();
