/**
 * Issue Recommendation Service
 * Uses BEAST MODE's LLM to suggest specific fixes for issues
 */

const axios = require('axios');
const { createLogger } = require('../utils/logger');

const log = createLogger('IssueRecommender');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class IssueRecommender {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get recommendations for an issue
   * @param {Object} issue - Issue object
   * @param {string} code - Code with the issue
   * @param {string} filePath - File path
   * @param {Object} context - Additional context
   * @returns {Promise<Array>} Recommendations
   */
  async getRecommendations(issue, code, filePath, context = {}) {
    const cacheKey = `${issue.type}-${issue.description}-${filePath}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `issue-recommendations-${Date.now()}`,
        message: `Provide specific, actionable recommendations to fix this issue:

Issue Type: ${issue.type}
Severity: ${issue.severity}
Description: ${issue.description}

Code:
\`\`\`javascript
${code.substring(0, 2000)}
\`\`\`

File: ${filePath}

Context:
${JSON.stringify(context, null, 2)}

Provide 3-5 specific recommendations:
1. What the issue is
2. Why it's a problem
3. How to fix it (specific steps)
4. Code examples if helpful
5. Prevention strategies

Return as a JSON array of recommendation objects with: title, description, steps, codeExample (optional).`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        let recommendations = [];
        try {
          // Try to parse as JSON
          const jsonMatch = response.data.message.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            recommendations = JSON.parse(jsonMatch[0]);
          } else {
            // Parse as structured text
            recommendations = this.parseRecommendations(response.data.message);
          }
        } catch (parseError) {
          log.warn('Failed to parse recommendations as JSON, using text parser');
          recommendations = this.parseRecommendations(response.data.message);
        }

        this.cache.set(cacheKey, recommendations);
        return recommendations;
      }

      throw new Error('No recommendations in response');
    } catch (error) {
      log.error('Failed to generate recommendations:', error.message);
      // Fallback to generic recommendations
      return this.generateFallbackRecommendations(issue);
    }
  }

  /**
   * Parse recommendations from text
   */
  parseRecommendations(text) {
    const recommendations = [];
    const lines = text.split('\n');
    let currentRec = null;

    for (const line of lines) {
      if (line.match(/^\d+\./)) {
        if (currentRec) recommendations.push(currentRec);
        currentRec = {
          title: line.replace(/^\d+\.\s*/, '').trim(),
          description: '',
          steps: []
        };
      } else if (currentRec && line.trim()) {
        if (line.includes(':')) {
          currentRec.description = line.trim();
        } else {
          currentRec.steps.push(line.trim());
        }
      }
    }
    if (currentRec) recommendations.push(currentRec);

    return recommendations.length > 0 ? recommendations : this.generateFallbackRecommendations({ type: 'unknown' });
  }

  /**
   * Generate fallback recommendations
   */
  generateFallbackRecommendations(issue) {
    return [
      {
        title: `Fix ${issue.type} issue`,
        description: issue.description || 'Address the identified issue',
        steps: [
          'Review the code around the issue location',
          'Identify the root cause',
          'Apply the appropriate fix',
          'Test the fix thoroughly'
        ]
      }
    ];
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new IssueRecommender();
