/**
 * Context-Aware Model Selector
 * Selects models based on codebase context (language, task, etc.)
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

const log = createLogger('ContextAwareModelSelector');

class ContextAwareModelSelector {
  constructor() {
    this.languageModels = new Map([
      ['typescript', 'custom:beast-mode-ts-model'],
      ['javascript', 'custom:beast-mode-js-model'],
      ['python', 'custom:beast-mode-python-model'],
      ['java', 'custom:beast-mode-java-model'],
      ['go', 'custom:beast-mode-go-model'],
      ['rust', 'custom:beast-mode-rust-model']
    ]);

    this.taskModels = new Map([
      ['code-generation', 'custom:beast-mode-code-model'],
      ['documentation', 'custom:beast-mode-docs-model'],
      ['testing', 'custom:beast-mode-test-model'],
      ['refactoring', 'custom:beast-mode-refactor-model'],
      ['security', 'custom:beast-mode-security-model'],
      ['performance', 'custom:beast-mode-perf-model']
    ]);

    this.defaultModel = 'custom:beast-mode-code-model';
  }

  /**
   * Select model based on context
   * @param {Object} context - Context (code, filePath, task, etc.)
   * @returns {string} Model ID
   */
  selectModel(context = {}) {
    const { code, filePath, task, language } = context;

    // Priority 1: Task-specific model
    if (task && this.taskModels.has(task)) {
      const model = this.taskModels.get(task);
      log.debug(`Selected task-specific model: ${model} for task: ${task}`);
      return model;
    }

    // Priority 2: Language-specific model
    const detectedLanguage = language || this.detectLanguage(code, filePath);
    if (detectedLanguage && this.languageModels.has(detectedLanguage)) {
      const model = this.languageModels.get(detectedLanguage);
      log.debug(`Selected language-specific model: ${model} for language: ${detectedLanguage}`);
      return model;
    }

    // Priority 3: Default model
    log.debug(`Using default model: ${this.defaultModel}`);
    return this.defaultModel;
  }

  /**
   * Detect programming language
   * @param {string} code - Code content
   * @param {string} filePath - File path
   * @returns {string|null} Language
   */
  detectLanguage(code, filePath) {
    // Try file extension first
    if (filePath) {
      const ext = this.getFileExtension(filePath);
      const extMap = {
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.py': 'python',
        '.java': 'java',
        '.go': 'go',
        '.rs': 'rust',
        '.cpp': 'cpp',
        '.c': 'c',
        '.rb': 'ruby',
        '.php': 'php'
      };
      
      if (extMap[ext]) {
        return extMap[ext];
      }
    }

    // Try code patterns
    if (code) {
      if (code.includes('interface ') || code.includes('type ') || code.includes(': string') || code.includes(': number')) {
        return 'typescript';
      }
      if (code.includes('def ') || code.includes('import ') && code.includes('from ')) {
        return 'python';
      }
      if (code.includes('package ') || code.includes('public class')) {
        return 'java';
      }
      if (code.includes('fn ') || code.includes('impl ')) {
        return 'rust';
      }
      if (code.includes('func ') && code.includes('package ')) {
        return 'go';
      }
    }

    return null;
  }

  /**
   * Get file extension
   */
  getFileExtension(filePath) {
    const parts = filePath.split('.');
    if (parts.length > 1) {
      return '.' + parts[parts.length - 1].toLowerCase();
    }
    return '';
  }

  /**
   * Register language model
   * @param {string} language - Language
   * @param {string} modelId - Model ID
   */
  registerLanguageModel(language, modelId) {
    this.languageModels.set(language, modelId);
    log.info(`Registered language model: ${language} → ${modelId}`);
  }

  /**
   * Register task model
   * @param {string} task - Task type
   * @param {string} modelId - Model ID
   */
  registerTaskModel(task, modelId) {
    this.taskModels.set(task, modelId);
    log.info(`Registered task model: ${task} → ${modelId}`);
  }

  /**
   * Get available models
   * @returns {Object} Available models
   */
  getAvailableModels() {
    return {
      languages: Object.fromEntries(this.languageModels),
      tasks: Object.fromEntries(this.taskModels),
      default: this.defaultModel
    };
  }
}

// Singleton instance
let instance = null;

function getContextAwareModelSelector() {
  if (!instance) {
    instance = new ContextAwareModelSelector();
  }
  return instance;
}

module.exports = { ContextAwareModelSelector, getContextAwareModelSelector };
