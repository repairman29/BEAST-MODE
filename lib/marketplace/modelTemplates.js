/**
 * Model Templates
 * 
 * Pre-configured model templates for common use cases
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
const log = createLogger('ModelTemplates');

class ModelTemplates {
  constructor() {
    this.templates = new Map(); // templateId -> template
    this.initializeTemplates();
  }

  /**
   * Initialize default templates
   */
  initializeTemplates() {
    // Code generation template
    this.templates.set('code-generation', {
      id: 'code-generation',
      name: 'Code Generation',
      description: 'Template for generating code in various languages',
      category: 'code',
      config: {
        temperature: 0.7,
        maxTokens: 4000,
        stopSequences: ['```', '---'],
        systemPrompt: 'You are an expert code generator. Generate clean, well-documented code following best practices.'
      },
      useCases: ['function generation', 'class creation', 'API endpoints'],
      languages: ['javascript', 'typescript', 'python', 'java', 'go']
    });

    // Code review template
    this.templates.set('code-review', {
      id: 'code-review',
      name: 'Code Review',
      description: 'Template for automated code review',
      category: 'quality',
      config: {
        temperature: 0.3,
        maxTokens: 2000,
        systemPrompt: 'You are a senior code reviewer. Analyze code for bugs, security issues, and best practices.'
      },
      useCases: ['security review', 'bug detection', 'style checking'],
      languages: ['all']
    });

    // Test generation template
    this.templates.set('test-generation', {
      id: 'test-generation',
      name: 'Test Generation',
      description: 'Template for generating comprehensive test suites',
      category: 'testing',
      config: {
        temperature: 0.5,
        maxTokens: 3000,
        systemPrompt: 'You are a test engineer. Generate comprehensive test cases covering normal, edge, and error cases.'
      },
      useCases: ['unit tests', 'integration tests', 'e2e tests'],
      frameworks: ['jest', 'mocha', 'pytest', 'junit']
    });

    // Documentation template
    this.templates.set('documentation', {
      id: 'documentation',
      name: 'Documentation Generation',
      description: 'Template for generating code documentation',
      category: 'documentation',
      config: {
        temperature: 0.4,
        maxTokens: 2000,
        systemPrompt: 'You are a technical writer. Generate clear, comprehensive documentation for code.'
      },
      useCases: ['API docs', 'function docs', 'README generation'],
      formats: ['markdown', 'jsdoc', 'python docstrings']
    });

    // Refactoring template
    this.templates.set('refactoring', {
      id: 'refactoring',
      name: 'Code Refactoring',
      description: 'Template for refactoring code to improve quality',
      category: 'refactoring',
      config: {
        temperature: 0.6,
        maxTokens: 4000,
        systemPrompt: 'You are a refactoring expert. Improve code quality while maintaining functionality.'
      },
      useCases: ['code cleanup', 'pattern application', 'performance optimization'],
      languages: ['all']
    });

    // Chat assistant template
    this.templates.set('chat-assistant', {
      id: 'chat-assistant',
      name: 'Chat Assistant',
      description: 'Template for conversational code assistance',
      category: 'chat',
      config: {
        temperature: 0.8,
        maxTokens: 2000,
        systemPrompt: 'You are a helpful coding assistant. Provide clear, concise answers to coding questions.'
      },
      useCases: ['code explanation', 'debugging help', 'learning'],
      languages: ['all']
    });
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId) {
    return this.templates.get(templateId);
  }

  /**
   * List all templates
   */
  listTemplates(filters = {}) {
    let templates = Array.from(this.templates.values());

    if (filters.category) {
      templates = templates.filter(t => t.category === filters.category);
    }

    if (filters.language) {
      templates = templates.filter(t => 
        !t.languages || t.languages.includes(filters.language) || t.languages.includes('all')
      );
    }

    if (filters.useCase) {
      templates = templates.filter(t => 
        t.useCases && t.useCases.some(uc => uc.includes(filters.useCase))
      );
    }

    return templates;
  }

  /**
   * Create custom template
   */
  createTemplate(templateData) {
    const templateId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const template = {
      id: templateId,
      name: templateData.name,
      description: templateData.description || '',
      category: templateData.category || 'custom',
      config: templateData.config || {},
      useCases: templateData.useCases || [],
      languages: templateData.languages || ['all'],
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    this.templates.set(templateId, template);
    log.info(`Custom template created: ${templateId}`);
    return template;
  }

  /**
   * Apply template to model configuration
   */
  applyTemplate(templateId, baseConfig = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return {
      ...baseConfig,
      ...template.config,
      template: templateId,
      templateName: template.name
    };
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category) {
    return Array.from(this.templates.values())
      .filter(t => t.category === category);
  }

  /**
   * Search templates
   */
  searchTemplates(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values())
      .filter(t => 
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.useCases.some(uc => uc.toLowerCase().includes(lowerQuery))
      );
  }
}

// Singleton instance
let modelTemplatesInstance = null;

function getModelTemplates() {
  if (!modelTemplatesInstance) {
    modelTemplatesInstance = new ModelTemplates();
  }
  return modelTemplatesInstance;
}

module.exports = {
  ModelTemplates,
  getModelTemplates
};
