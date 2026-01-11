/**
 * Knowledge Repository System
 * 
 * Stores and manages knowledge for LLM training:
 * - UX Psychology Principles
 * - Software Development Best Practices
 * - Design Patterns
 * - Code Quality Standards
 * - Architecture Patterns
 * 
 * Supports:
 * - Vector embeddings for RAG (Retrieval-Augmented Generation)
 * - Fine-tuning data preparation
 * - Continuous knowledge updates
 */

const fs = require('fs').promises;
const path = require('path');
const { getMLStorageClient } = require('./storageClient');
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

const logger = createLogger('KnowledgeRepository');

class KnowledgeRepository {
  constructor() {
    this.knowledgeDir = path.join(__dirname, '../../knowledge-base');
    this.categories = {
      'ux-principles': 'UX Psychology Principles',
      'software-engineering': 'Software Engineering Best Practices',
      'design-patterns': 'Design Patterns',
      'code-quality': 'Code Quality Standards',
      'architecture': 'Architecture Patterns',
      'api-design': 'API Design Principles',
      'security': 'Security Best Practices',
      'performance': 'Performance Optimization',
      'testing': 'Testing Strategies',
      'devops': 'DevOps Practices'
    };
    this.storage = getMLStorageClient();
  }

  /**
   * Initialize knowledge repository
   */
  async initialize() {
    try {
      // Ensure knowledge directory exists
      await fs.mkdir(this.knowledgeDir, { recursive: true });
      
      // Create category directories
      for (const category of Object.keys(this.categories)) {
        await fs.mkdir(path.join(this.knowledgeDir, category), { recursive: true });
      }

      logger.info('✅ Knowledge repository initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize knowledge repository:', error);
      return false;
    }
  }

  /**
   * Add knowledge entry
   * @param {string} category - Knowledge category
   * @param {string} title - Entry title
   * @param {string} content - Entry content
   * @param {object} metadata - Additional metadata
   */
  async addKnowledge(category, title, content, metadata = {}) {
    try {
      if (!this.categories[category]) {
        throw new Error(`Invalid category: ${category}`);
      }

      const entry = {
        id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category,
        title,
        content,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: metadata.source || 'manual',
          tags: metadata.tags || []
        }
      };

      // Save locally
      const filePath = path.join(this.knowledgeDir, category, `${entry.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(entry, null, 2));

      // Also save to Storage for backup (if available)
      try {
        const storagePath = `knowledge-base/${category}/${entry.id}.json`;
        if (this.storage && typeof this.storage.uploadFile === 'function') {
          await this.storage.uploadFile(storagePath, JSON.stringify(entry, null, 2));
        }
      } catch (storageError) {
        // Storage is optional, continue without it
        logger.debug('Storage upload skipped:', storageError.message);
      }

      logger.info(`✅ Added knowledge entry: ${title} (${category})`);
      return entry;
    } catch (error) {
      logger.error('Failed to add knowledge:', error);
      throw error;
    }
  }

  /**
   * Load knowledge from file
   * @param {string} filePath - Path to knowledge file
   */
  async loadKnowledgeFromFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Handle different formats
      if (Array.isArray(data)) {
        // Multiple entries
        for (const entry of data) {
          await this.addKnowledge(
            entry.category || 'software-engineering',
            entry.title,
            entry.content,
            entry.metadata || {}
          );
        }
      } else if (data.category && data.title && data.content) {
        // Single entry
        await this.addKnowledge(
          data.category,
          data.title,
          data.content,
          data.metadata || {}
        );
      } else {
        throw new Error('Invalid knowledge file format');
      }

      logger.info(`✅ Loaded knowledge from: ${filePath}`);
    } catch (error) {
      logger.error('Failed to load knowledge from file:', error);
      throw error;
    }
  }

  /**
   * Get all knowledge for a category
   * @param {string} category - Knowledge category
   */
  async getKnowledgeByCategory(category) {
    try {
      const categoryDir = path.join(this.knowledgeDir, category);
      
      if (!await this.directoryExists(categoryDir)) {
        return [];
      }

      const files = await fs.readdir(categoryDir);
      const knowledge = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(categoryDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          knowledge.push(JSON.parse(content));
        }
      }

      return knowledge;
    } catch (error) {
      logger.error('Failed to get knowledge by category:', error);
      return [];
    }
  }

  /**
   * Search knowledge
   * @param {string} query - Search query
   * @param {string} category - Optional category filter
   */
  async searchKnowledge(query, category = null) {
    try {
      const categories = category ? [category] : Object.keys(this.categories);
      const results = [];

      for (const cat of categories) {
        const knowledge = await this.getKnowledgeByCategory(cat);
        
        for (const entry of knowledge) {
          // Simple text search (can be enhanced with embeddings)
          const searchText = `${entry.title} ${entry.content}`.toLowerCase();
          const queryLower = query.toLowerCase();
          
          if (searchText.includes(queryLower)) {
            results.push({
              ...entry,
              relevance: this.calculateRelevance(queryLower, searchText)
            });
          }
        }
      }

      // Sort by relevance
      results.sort((a, b) => b.relevance - a.relevance);
      return results;
    } catch (error) {
      logger.error('Failed to search knowledge:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score (simple)
   */
  calculateRelevance(query, text) {
    const queryWords = query.split(' ');
    let matches = 0;
    
    for (const word of queryWords) {
      if (text.includes(word)) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
  }

  /**
   * Convert knowledge to training data format
   * @param {string} category - Optional category filter
   */
  async toTrainingData(category = null) {
    try {
      const categories = category ? [category] : Object.keys(this.categories);
      const trainingExamples = [];

      for (const cat of categories) {
        const knowledge = await this.getKnowledgeByCategory(cat);
        
        for (const entry of knowledge) {
          // Create training example in format suitable for fine-tuning
          trainingExamples.push({
            instruction: `You are an expert software engineer and UX designer. Apply the following ${this.categories[cat]} principle:`,
            input: entry.title,
            output: entry.content,
            category: cat,
            metadata: entry.metadata
          });
        }
      }

      return trainingExamples;
    } catch (error) {
      logger.error('Failed to convert knowledge to training data:', error);
      return [];
    }
  }

  /**
   * Export knowledge for fine-tuning
   * @param {string} outputPath - Output file path
   * @param {string} category - Optional category filter
   */
  async exportForFineTuning(outputPath, category = null) {
    try {
      const trainingData = await this.toTrainingData(category);
      
      const exportData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        category: category || 'all',
        count: trainingData.length,
        examples: trainingData
      };

      await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
      
      // Also upload to Storage (if available)
      try {
        const storagePath = `training-data/knowledge-base-${category || 'all'}-${Date.now()}.json`;
        if (this.storage && typeof this.storage.uploadFile === 'function') {
          await this.storage.uploadFile(storagePath, JSON.stringify(exportData, null, 2));
        }
      } catch (storageError) {
        // Storage is optional, continue without it
        logger.debug('Storage upload skipped:', storageError.message);
      }

      logger.info(`✅ Exported ${trainingData.length} training examples to ${outputPath}`);
      return exportData;
    } catch (error) {
      logger.error('Failed to export for fine-tuning:', error);
      throw error;
    }
  }

  /**
   * Check if directory exists
   */
  async directoryExists(dirPath) {
    try {
      await fs.access(dirPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const stats = {
        total: 0,
        byCategory: {}
      };

      for (const category of Object.keys(this.categories)) {
        const knowledge = await this.getKnowledgeByCategory(category);
        stats.byCategory[category] = knowledge.length;
        stats.total += knowledge.length;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return { total: 0, byCategory: {} };
    }
  }
}

// Singleton instance
let knowledgeRepositoryInstance = null;

function getKnowledgeRepository() {
  if (!knowledgeRepositoryInstance) {
    knowledgeRepositoryInstance = new KnowledgeRepository();
  }
  return knowledgeRepositoryInstance;
}

module.exports = {
  KnowledgeRepository,
  getKnowledgeRepository
};
