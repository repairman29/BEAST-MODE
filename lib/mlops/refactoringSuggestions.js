/**
 * Refactoring Suggestions
 * Uses BEAST MODE's LLM to suggest refactoring improvements
 */

const axios = require('axios');
const { createLogger } = require('../utils/logger');

const log = createLogger('RefactoringSuggestions');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class RefactoringSuggestions {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get refactoring suggestions for code
   * @param {string} code - Code to refactor
   * @param {string} filePath - File path
   * @param {Object} context - Additional context
   * @returns {Promise<Array>} Refactoring suggestions
   */
  async getSuggestions(code, filePath, context = {}) {
    const cacheKey = `${filePath}-${code.substring(0, 500)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `refactoring-suggestions-${Date.now()}`,
        message: `Analyze this code and suggest refactoring improvements:

File: ${filePath}

Code:
\`\`\`javascript
${code}
\`\`\`

Context:
${JSON.stringify(context, null, 2)}

Focus on:
1. Code duplication
2. Complexity reduction
3. Performance optimization
4. Maintainability improvements
5. Readability enhancements
6. Design pattern application

For each suggestion, provide:
- Type of refactoring
- Current issue
- Suggested improvement
- Refactored code example
- Benefits

Return as JSON array of suggestion objects with: type, issue, improvement, codeExample, benefits.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        let suggestions = [];
        try {
          // Try to parse as JSON
          const jsonMatch = response.data.message.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            suggestions = JSON.parse(jsonMatch[0]);
          } else {
            // Parse as structured text
            suggestions = this.parseSuggestions(response.data.message);
          }
        } catch (parseError) {
          log.warn('Failed to parse suggestions as JSON, using text parser');
          suggestions = this.parseSuggestions(response.data.message);
        }

        this.cache.set(cacheKey, suggestions);
        return suggestions;
      }

      throw new Error('No suggestions in response');
    } catch (error) {
      log.error('Failed to get refactoring suggestions:', error.message);
      // Fallback to basic suggestions
      return this.generateFallbackSuggestions(code);
    }
  }

  /**
   * Get refactored code
   * @param {string} code - Original code
   * @param {Object} suggestion - Refactoring suggestion
   * @returns {Promise<string>} Refactored code
   */
  async getRefactoredCode(code, suggestion) {
    try {
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `refactoring-apply-${Date.now()}`,
        message: `Apply this refactoring suggestion:

Suggestion: ${suggestion.type}
Issue: ${suggestion.issue}
Improvement: ${suggestion.improvement}

Original Code:
\`\`\`javascript
${code}
\`\`\`

Apply the refactoring and return ONLY the refactored code, no explanations.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        let refactoredCode = response.data.message.trim();
        
        // Extract code from markdown if present
        const codeBlockMatch = refactoredCode.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
        if (codeBlockMatch) {
          refactoredCode = codeBlockMatch[1].trim();
        }

        return refactoredCode;
      }
    } catch (error) {
      log.error('Failed to get refactored code:', error.message);
    }

    return null;
  }

  /**
   * Parse suggestions from text
   */
  parseSuggestions(text) {
    const suggestions = [];
    const lines = text.split('\n');
    let currentSuggestion = null;

    for (const line of lines) {
      if (line.match(/^\d+\./)) {
        if (currentSuggestion) suggestions.push(currentSuggestion);
        currentSuggestion = {
          type: line.replace(/^\d+\.\s*/, '').trim(),
          issue: '',
          improvement: '',
          codeExample: null,
          benefits: []
        };
      } else if (currentSuggestion) {
        if (line.toLowerCase().includes('issue:') || line.toLowerCase().includes('problem:')) {
          currentSuggestion.issue = line.replace(/.*(?:issue|problem):\s*/i, '').trim();
        } else if (line.toLowerCase().includes('improvement:') || line.toLowerCase().includes('suggestion:')) {
          currentSuggestion.improvement = line.replace(/.*(?:improvement|suggestion):\s*/i, '').trim();
        } else if (line.includes('```')) {
          // Code block - skip for now (would need more complex parsing)
        } else if (line.toLowerCase().includes('benefit:')) {
          currentSuggestion.benefits.push(line.replace(/.*benefit:\s*/i, '').trim());
        } else if (line.trim()) {
          if (!currentSuggestion.issue) {
            currentSuggestion.issue = line.trim();
          } else if (!currentSuggestion.improvement) {
            currentSuggestion.improvement = line.trim();
          }
        }
      }
    }
    if (currentSuggestion) suggestions.push(currentSuggestion);

    return suggestions.length > 0 ? suggestions : this.generateFallbackSuggestions('');
  }

  /**
   * Generate fallback suggestions
   */
  generateFallbackSuggestions(code) {
    const suggestions = [];
    
    // Basic complexity check
    const lines = code.split('\n').length;
    if (lines > 100) {
      suggestions.push({
        type: 'Extract Function',
        issue: 'Function is too long',
        improvement: 'Break down into smaller, focused functions',
        codeExample: null,
        benefits: ['Improved readability', 'Easier testing', 'Better maintainability']
      });
    }

    // Check for duplication
    const functions = code.match(/(?:function|const)\s+\w+/g) || [];
    if (functions.length > 10) {
      suggestions.push({
        type: 'Extract Module',
        issue: 'Too many functions in one file',
        improvement: 'Split into multiple modules',
        codeExample: null,
        benefits: ['Better organization', 'Easier navigation', 'Reduced coupling']
      });
    }

    return suggestions;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new RefactoringSuggestions();
