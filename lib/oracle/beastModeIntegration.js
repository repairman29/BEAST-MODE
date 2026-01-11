/**
 * BEAST MODE - Oracle Integration
 * 
 * Uses BEAST MODE's code generation to help Oracle generate better knowledge
 */

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
const log = createLogger('BeastModeOracleIntegration');

class BeastModeOracleIntegration {
  constructor() {
    this.codebaseChat = null;
    this.initialized = false;
  }

  /**
   * Initialize dependencies
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Lazy load to avoid circular dependencies
      this.codebaseChat = require('../mlops/codebaseChat');

      this.initialized = true;
      log.info('✅ BEAST MODE - Oracle integration initialized');
    } catch (error) {
      log.error('Failed to initialize integration:', error);
      throw error;
    }
  }

  /**
   * Generate knowledge from code using BEAST MODE's code generation
   */
  async generateKnowledgeFromCode(code, context = {}) {
    await this.initialize();

    const {
      repo = context.repo || 'unknown',
      filePath = context.filePath || '',
      model = 'custom:beast-mode-code-model',
      userId = 'oracle',
      useLLM = true
    } = context;

    log.info(`📚 Generating knowledge from code: ${filePath}`);

    try {
      // Build knowledge extraction prompt
      const prompt = this.buildKnowledgePrompt(code, context);

      // Use BEAST MODE's codebase chat to extract knowledge
      const response = await this.codebaseChat.processMessage(
        `oracle-knowledge-${Date.now()}`,
        prompt,
        {
          repo,
          model,
          customModelId: model.replace('custom:', ''),
          userId,
          useLLM,
          files: [{
            path: filePath,
            content: code
          }]
        }
      );

      // Extract knowledge from response
      const knowledge = this.extractKnowledgeFromResponse(response);

      // Validate knowledge
      const validation = await this.validateKnowledge(knowledge);

      return {
        success: true,
        knowledge,
        validation,
        source: 'beast-mode-enhanced'
      };
    } catch (error) {
      log.error('Failed to generate knowledge:', error);
      return {
        success: false,
        error: error.message,
        source: 'beast-mode-enhanced'
      };
    }
  }

  /**
   * Build knowledge extraction prompt
   */
  buildKnowledgePrompt(code, context) {
    const filePath = context.filePath || 'unknown';
    const purpose = context.purpose || 'general knowledge extraction';

    return `Extract knowledge from this code for ${purpose}:

File: ${filePath}

Code:
\`\`\`javascript
${code}
\`\`\`

Extract:
1. What this code does (purpose and functionality)
2. Key patterns and conventions used
3. Dependencies and relationships
4. Best practices demonstrated
5. Potential improvements or considerations
6. Related concepts or patterns

Format as structured knowledge that can be stored in a knowledge base:`;
  }

  /**
   * Extract knowledge from response
   */
  extractKnowledgeFromResponse(response) {
    if (typeof response === 'string') {
      return {
        content: response,
        type: 'text',
        extracted: new Date().toISOString()
      };
    }

    if (response.message) {
      return {
        content: response.message,
        type: 'text',
        extracted: new Date().toISOString()
      };
    }

    return {
      content: JSON.stringify(response, null, 2),
      type: 'structured',
      extracted: new Date().toISOString()
    };
  }

  /**
   * Validate knowledge
   */
  async validateKnowledge(knowledge) {
    // Basic validation
    const validations = [];

    // Check if knowledge has content
    if (knowledge.content && knowledge.content.length > 10) {
      validations.push({ check: 'has-content', passed: true });
    } else {
      validations.push({ check: 'has-content', passed: false, reason: 'Knowledge content too short' });
    }

    // Check if knowledge is structured
    if (knowledge.type) {
      validations.push({ check: 'has-type', passed: true });
    } else {
      validations.push({ check: 'has-type', passed: false, reason: 'Missing knowledge type' });
    }

    const allPassed = validations.every(v => v.passed);

    return {
      valid: allPassed,
      validations,
      reason: allPassed ? 'Knowledge validated' : 'Some validations failed'
    };
  }
}

// Singleton instance
let instance = null;

function getBeastModeOracleIntegration() {
  if (!instance) {
    instance = new BeastModeOracleIntegration();
  }
  return instance;
}

module.exports = {
  BeastModeOracleIntegration,
  getBeastModeOracleIntegration
};
