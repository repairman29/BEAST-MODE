/**
 * Learning System
 * 
 * Learns from user preferences and codebase patterns
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('LearningSystem');

class LearningSystem {
  constructor() {
    this.userPreferences = new Map(); // userId -> preferences
    this.patterns = new Map(); // patternId -> pattern data
    this.feedback = []; // Feedback history
  }

  /**
   * Learn from user preference
   */
  learnPreference(userId, preference) {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, {
        codingStyle: {},
        modelPreferences: {},
        featureUsage: {},
        feedbackHistory: []
      });
    }

    const prefs = this.userPreferences.get(userId);

    // Update coding style preferences
    if (preference.codingStyle) {
      Object.assign(prefs.codingStyle, preference.codingStyle);
    }

    // Update model preferences
    if (preference.modelPreferences) {
      Object.assign(prefs.modelPreferences, preference.modelPreferences);
    }

    // Track feature usage
    if (preference.feature) {
      prefs.featureUsage[preference.feature] = 
        (prefs.featureUsage[preference.feature] || 0) + 1;
    }

    // Store feedback
    if (preference.feedback) {
      prefs.feedbackHistory.push({
        ...preference.feedback,
        timestamp: new Date().toISOString()
      });
    }

    log.info(`Preference learned for user: ${userId}`);
    return prefs;
  }

  /**
   * Recognize codebase patterns
   */
  recognizePatterns(codebase) {
    const patterns = {
      architecture: this.detectArchitecture(codebase),
      patterns: this.detectDesignPatterns(codebase),
      conventions: this.detectConventions(codebase),
      dependencies: this.detectDependencyPatterns(codebase)
    };

    const patternId = `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.patterns.set(patternId, {
      id: patternId,
      codebase: codebase.repo || 'unknown',
      patterns,
      recognizedAt: new Date().toISOString()
    });

    log.info(`Patterns recognized: ${patternId}`);
    return patterns;
  }

  /**
   * Detect architecture pattern
   */
  detectArchitecture(codebase) {
    const files = codebase.files || [];
    const hasMVC = files.some(f => 
      f.path.includes('controller') || 
      f.path.includes('model') || 
      f.path.includes('view')
    );
    const hasLayered = files.some(f => 
      f.path.includes('service') || 
      f.path.includes('repository') || 
      f.path.includes('domain')
    );
    const hasMicroservices = files.some(f => 
      f.path.includes('service') && 
      files.filter(f2 => f2.path.includes('service')).length > 3
    );

    if (hasMicroservices) return { type: 'microservices', confidence: 0.8 };
    if (hasLayered) return { type: 'layered', confidence: 0.7 };
    if (hasMVC) return { type: 'mvc', confidence: 0.7 };
    return { type: 'monolithic', confidence: 0.6 };
  }

  /**
   * Detect design patterns
   */
  detectDesignPatterns(codebase) {
    const patterns = [];
    const files = codebase.files || [];

    files.forEach(file => {
      const content = file.content || '';

      // Singleton pattern
      if (content.includes('getInstance') && content.includes('private')) {
        patterns.push({ pattern: 'singleton', file: file.path });
      }

      // Factory pattern
      if (content.includes('Factory') && content.includes('create')) {
        patterns.push({ pattern: 'factory', file: file.path });
      }

      // Observer pattern
      if (content.includes('subscribe') || content.includes('on(')) {
        patterns.push({ pattern: 'observer', file: file.path });
      }

      // Strategy pattern
      if (content.includes('Strategy') && content.includes('execute')) {
        patterns.push({ pattern: 'strategy', file: file.path });
      }
    });

    return patterns;
  }

  /**
   * Detect coding conventions
   */
  detectConventions(codebase) {
    const conventions = {
      naming: {},
      structure: {},
      style: {}
    };

    const files = codebase.files || [];
    
    // Detect naming conventions
    const camelCase = files.filter(f => 
      /[a-z][A-Z]/.test(f.content || '')
    ).length;
    const snakeCase = files.filter(f => 
      /[a-z]_[a-z]/.test(f.content || '')
    ).length;

    conventions.naming = camelCase > snakeCase ? 'camelCase' : 'snake_case';

    // Detect structure conventions
    const hasTests = files.filter(f => 
      f.path.includes('test') || f.path.includes('spec')
    ).length;
    conventions.structure.hasTests = hasTests > 0;
    conventions.structure.testRatio = hasTests / files.length;

    return conventions;
  }

  /**
   * Detect dependency patterns
   */
  detectDependencyPatterns(codebase) {
    const dependencies = new Set();
    const files = codebase.files || [];

    files.forEach(file => {
      const imports = this.extractImports(file.content || '');
      imports.forEach(dep => dependencies.add(dep));
    });

    return {
      total: dependencies.size,
      common: Array.from(dependencies).slice(0, 10),
      patterns: this.analyzeDependencyPatterns(Array.from(dependencies))
    };
  }

  /**
   * Extract imports
   */
  extractImports(content) {
    const imports = [];
    const patterns = [
      /import\s+.*?from\s+['"](.+?)['"]/g,
      /require\(['"](.+?)['"]\)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    });

    return imports;
  }

  /**
   * Analyze dependency patterns
   */
  analyzeDependencyPatterns(dependencies) {
    const patterns = {
      frameworks: dependencies.filter(d => 
        ['react', 'vue', 'angular', 'express', 'next'].some(f => d.includes(f))
      ),
      utilities: dependencies.filter(d => 
        ['lodash', 'underscore', 'ramda'].some(u => d.includes(u))
      ),
      testing: dependencies.filter(d => 
        ['jest', 'mocha', 'pytest', 'jasmine'].some(t => d.includes(t))
      )
    };

    return patterns;
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId) {
    return this.userPreferences.get(userId) || {
      codingStyle: {},
      modelPreferences: {},
      featureUsage: {},
      feedbackHistory: []
    };
  }

  /**
   * Get recognized patterns for codebase
   */
  getPatterns(codebaseId) {
    const patterns = Array.from(this.patterns.values())
      .filter(p => p.codebase === codebaseId);
    return patterns.length > 0 ? patterns[0] : null;
  }

  /**
   * Adapt model selection based on learning
   */
  adaptModelSelection(userId, task, context) {
    const prefs = this.getUserPreferences(userId);
    const modelPrefs = prefs.modelPreferences || {};

    // Use learned preferences
    if (modelPrefs[task]) {
      return {
        model: modelPrefs[task],
        confidence: 0.8,
        reason: 'learned_preference'
      };
    }

    // Fall back to default
    return {
      model: 'default',
      confidence: 0.5,
      reason: 'default_fallback'
    };
  }
}

// Singleton instance
let learningSystemInstance = null;

function getLearningSystem() {
  if (!learningSystemInstance) {
    learningSystemInstance = new LearningSystem();
  }
  return learningSystemInstance;
}

module.exports = {
  LearningSystem,
  getLearningSystem
};
