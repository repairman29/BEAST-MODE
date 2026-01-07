/**
 * Echeo-Core Technology Integrations for BEAST MODE
 * 
 * Integrates echeo-core technologies into BEAST MODE:
 * - Tree-Sitter parser for multi-language AST parsing
 * - Ollama embeddings for local embedding generation
 * - Vector matching with Ship Velocity Score
 * 
 * Based on: echeo-core (repairman29/echeo-core)
 */

const path = require('path');
const { createLogger } = require('./utils/logger');

const log = createLogger('EcheoIntegrations');

// Use unified config if available
let getUnifiedConfig = null;
try {
  const configPath = path.join(__dirname, '../../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

// Helper function to get config value
function getConfigValue(key, defaultValue = null) {
  if (getUnifiedConfig) {
    try {
      const config = getUnifiedConfig();
      const value = config.get(key);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    } catch (error) {
      // Fallback to process.env
    }
  }
  // Fallback to process.env for backward compatibility
  return process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : defaultValue;
}

class EcheoIntegrations {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.ollamaUrl = options.ollamaUrl || getConfigValue('OLLAMA_URL', 'http://localhost:11434');
    this.ollamaModel = options.ollamaModel || getConfigValue('OLLAMA_MODEL', 'nomic-embed-text');
    this.useOllama = options.useOllama !== false;
    this.useTreeSitter = options.useTreeSitter !== false;
    
    // Load echeo integrations
    this.treeSitter = null;
    this.ollama = null;
    this.vectorMatcher = null;
    
    if (this.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize echeo integrations
   */
  async initialize() {
    try {
      // Load tree-sitter parser
      if (this.useTreeSitter) {
        try {
          const treeSitterPath = path.join(__dirname, '../../shared-utils/echeo-integrations/tree-sitter-parser');
          const { TreeSitterParser } = require(treeSitterPath);
          this.treeSitter = new TreeSitterParser({
            useRustBinary: true,
            ollamaUrl: this.ollamaUrl
          });
          log.info('[Echeo] Tree-Sitter parser loaded for BEAST MODE');
        } catch (error) {
          log.debug('[Echeo] Tree-Sitter parser not available:', error.message);
        }
      }

      // Load Ollama embeddings
      if (this.useOllama) {
        try {
          const ollamaPath = path.join(__dirname, '../../shared-utils/echeo-integrations/ollama-embeddings');
          const { OllamaEmbeddings } = require(ollamaPath);
          this.ollama = new OllamaEmbeddings({
            ollamaUrl: this.ollamaUrl,
            model: this.ollamaModel,
            fallback: 'openai' // Fallback to OpenAI if Ollama unavailable
          });
          
          // Check Ollama availability
          const availability = await this.ollama.checkAvailability();
          if (availability.available) {
            log.info('[Echeo] Ollama embeddings available for BEAST MODE');
          } else {
            log.debug('[Echeo] Ollama not available, will use fallback:', availability.error);
          }
        } catch (error) {
          log.debug('[Echeo] Ollama embeddings not available:', error.message);
        }
      }

      // Load vector matcher
      try {
        const vectorPath = path.join(__dirname, '../../shared-utils/echeo-integrations/vector-matching');
        const { VectorMatcher } = require(vectorPath);
        this.vectorMatcher = new VectorMatcher({
          minScore: 0.3,
          calculateVelocity: true
        });
        log.info('[Echeo] Vector matcher loaded for BEAST MODE');
      } catch (error) {
        log.debug('[Echeo] Vector matcher not available:', error.message);
      }
    } catch (error) {
      log.debug('[Echeo] Failed to initialize integrations:', error.message);
    }
  }

  /**
   * Parse code with tree-sitter (multi-language)
   */
  async parseCode(code, language) {
    if (!this.treeSitter) {
      return null;
    }

    try {
      // Map language names
      const langMap = {
        'javascript': 'typescript', // tree-sitter-typescript handles JS
        'typescript': 'typescript',
        'rust': 'rust',
        'python': 'python',
        'go': 'go'
      };

      const mappedLang = langMap[language.toLowerCase()] || language.toLowerCase();
      
      if (!['typescript', 'rust', 'python', 'go'].includes(mappedLang)) {
        return null; // Not supported by tree-sitter
      }

      const ast = await this.treeSitter.parse(code, mappedLang);
      return ast;
    } catch (error) {
      log.debug('[Echeo] Tree-Sitter parsing failed:', error.message);
      return null;
    }
  }

  /**
   * Generate embedding with Ollama (with OpenAI fallback)
   */
  async generateEmbedding(text, options = {}) {
    if (!this.ollama) {
      return null;
    }

    try {
      const embedding = await this.ollama.generate(text, {
        model: options.model || this.ollamaModel
      });
      return embedding;
    } catch (error) {
      log.debug('[Echeo] Embedding generation failed:', error.message);
      return null;
    }
  }

  /**
   * Find similar code using enhanced vector matching
   */
  async findSimilar(capability, candidates, options = {}) {
    if (!this.vectorMatcher) {
      return [];
    }

    try {
      const matches = await this.vectorMatcher.findSimilar(capability, candidates, {
        minScore: options.minScore || 0.3,
        calculateVelocity: options.calculateVelocity !== false
      });
      return matches;
    } catch (error) {
      log.debug('[Echeo] Vector matching failed:', error.message);
      return [];
    }
  }

  /**
   * Check if echeo integrations are available
   */
  isAvailable() {
    return {
      treeSitter: !!this.treeSitter,
      ollama: !!this.ollama,
      vectorMatcher: !!this.vectorMatcher,
      enabled: this.enabled
    };
  }
}

// Singleton instance
let echeoIntegrationsInstance = null;

/**
 * Get echeo integrations instance
 */
function getEcheoIntegrations(options = {}) {
  if (!echeoIntegrationsInstance) {
    echeoIntegrationsInstance = new EcheoIntegrations(options);
  }
  return echeoIntegrationsInstance;
}

module.exports = {
  EcheoIntegrations,
  getEcheoIntegrations
};

