/**
 * Knowledge RAG (Retrieval-Augmented Generation)
 * 
 * Uses knowledge repository for context-aware generation
 * Retrieves relevant knowledge and includes it in prompts
 */

const { getKnowledgeRepository } = require('./knowledgeRepository');
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

const logger = createLogger('KnowledgeRAG');

class KnowledgeRAG {
  constructor() {
    this.repo = getKnowledgeRepository();
  }

  /**
   * Get relevant knowledge for a query
   * @param {string} query - User query
   * @param {number} maxResults - Maximum results to return
   */
  async getRelevantKnowledge(query, maxResults = 5) {
    try {
      const results = await this.repo.searchKnowledge(query);
      return results.slice(0, maxResults);
    } catch (error) {
      logger.error('Failed to get relevant knowledge:', error);
      return [];
    }
  }

  /**
   * Build context prompt with knowledge
   * @param {string} query - User query
   * @param {string} category - Optional category filter
   */
  async buildContextPrompt(query, category = null) {
    try {
      const knowledge = await this.getRelevantKnowledge(query, 5);
      
      if (knowledge.length === 0) {
        return query; // No relevant knowledge found
      }

      // Build context from knowledge
      const context = knowledge.map(k => 
        `**${k.title}**\n${k.content}`
      ).join('\n\n');

      // Combine with query
      const prompt = `You are an expert software engineer and UX designer. Apply these principles:

${context}

---

User Query: ${query}

Provide a response that applies the relevant principles above.`;

      return prompt;
    } catch (error) {
      logger.error('Failed to build context prompt:', error);
      return query; // Fallback to original query
    }
  }

  /**
   * Enhance code generation with knowledge
   * @param {string} featureRequest - Feature request
   * @param {string} codebaseContext - Codebase context
   */
  async enhanceCodeGeneration(featureRequest, codebaseContext) {
    try {
      // Search for relevant knowledge
      const query = `${featureRequest} ${codebaseContext}`;
      const knowledge = await this.getRelevantKnowledge(query, 3);

      if (knowledge.length === 0) {
        return null; // No enhancement needed
      }

      // Build enhancement context
      const enhancement = {
        principles: knowledge.map(k => ({
          title: k.title,
          content: k.content,
          category: k.category
        })),
        guidance: `When generating code, apply these principles: ${knowledge.map(k => k.title).join(', ')}`
      };

      return enhancement;
    } catch (error) {
      logger.error('Failed to enhance code generation:', error);
      return null;
    }
  }
}

// Singleton instance
let knowledgeRAGInstance = null;

function getKnowledgeRAG() {
  if (!knowledgeRAGInstance) {
    knowledgeRAGInstance = new KnowledgeRAG();
  }
  return knowledgeRAGInstance;
}

module.exports = {
  KnowledgeRAG,
  getKnowledgeRAG
};
