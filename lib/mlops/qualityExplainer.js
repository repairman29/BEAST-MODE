/**
 * Quality Explanation Service
 * Uses BEAST MODE's LLM to explain quality scores
 */

const axios = require('axios');
const { createLogger } = require('../utils/logger');

const log = createLogger('QualityExplainer');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class QualityExplainer {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Explain a quality score using LLM
   * @param {number} score - Quality score (0-1)
   * @param {string} code - Code that was analyzed
   * @param {Array} issues - Issues found
   * @param {Object} context - Additional context
   * @returns {Promise<string>} Explanation
   */
  async explainQuality(score, code, issues = [], context = {}) {
    const cacheKey = `${score}-${code.substring(0, 100)}-${issues.length}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `quality-explanation-${Date.now()}`,
        message: `Explain why this code has a quality score of ${(score * 100).toFixed(1)}%.

Code:
\`\`\`javascript
${code.substring(0, 2000)}
\`\`\`

Issues found:
${issues.map(i => `- ${i.type}: ${i.description}`).join('\n')}

Context:
${JSON.stringify(context, null, 2)}

Provide a clear, actionable explanation that:
1. Explains why the score is what it is
2. Highlights the main issues
3. Suggests how to improve the score
4. Is written for developers (technical but clear)

Return only the explanation, no code blocks or markdown.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        const explanation = response.data.message.trim();
        this.cache.set(cacheKey, explanation);
        return explanation;
      }

      throw new Error('No explanation in response');
    } catch (error) {
      log.error('Failed to generate quality explanation:', error.message);
      // Fallback to simple explanation
      return this.generateFallbackExplanation(score, issues);
    }
  }

  /**
   * Generate fallback explanation when LLM fails
   */
  generateFallbackExplanation(score, issues) {
    const percentage = (score * 100).toFixed(1);
    const issueCount = issues.length;
    
    if (score >= 0.8) {
      return `Quality score: ${percentage}% - Excellent code quality. ${issueCount > 0 ? `Minor issues found: ${issueCount}.` : 'No issues detected.'}`;
    } else if (score >= 0.6) {
      return `Quality score: ${percentage}% - Good code quality with room for improvement. ${issueCount} issue(s) found. Focus on addressing the main issues to improve the score.`;
    } else {
      return `Quality score: ${percentage}% - Code quality needs improvement. ${issueCount} issue(s) found. Review and fix the identified issues to significantly improve the score.`;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new QualityExplainer();
