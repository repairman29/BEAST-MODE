/**
 * BEAST MODE Advanced AI Recommendations
 * 
 * Neural code generation, context-aware completions, and pattern recognition
 */

const { QualityEngine } = require('../quality');

class AdvancedRecommendations {
  constructor(options = {}) {
    this.options = {
      useNeuralGeneration: options.useNeuralGeneration !== false,
      contextAware: options.contextAware !== false,
      patternRecognition: options.patternRecognition !== false,
      ...options
    };
    this.qualityEngine = new QualityEngine();
  }

  /**
   * Generate neural code suggestions
   */
  async generateCodeSuggestions(context) {
    const { code, filePath, language, cursorPosition, surroundingCode } = context;
    
    // Analyze code patterns
    const patterns = await this.analyzePatterns(code, language);
    
    // Generate context-aware suggestions
    const suggestions = await this.generateContextAwareSuggestions({
      code,
      filePath,
      language,
      cursorPosition,
      surroundingCode,
      patterns
    });

    return {
      suggestions: suggestions.map(s => ({
        ...s,
        confidence: this.calculateConfidence(s, patterns),
        reasoning: this.generateReasoning(s, patterns)
      })),
      patterns: patterns,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze code patterns
   */
  async analyzePatterns(code, language) {
    const patterns = {
      style: {},
      structure: {},
      bestPractices: [],
      antiPatterns: []
    };

    // Detect common patterns
    if (language === 'javascript' || language === 'typescript') {
      // Detect async/await patterns
      if (code.includes('async') && code.includes('await')) {
        patterns.structure.asyncAwait = true;
      }

      // Detect promise chains
      if (code.includes('.then(') || code.includes('.catch(')) {
        patterns.structure.promises = true;
      }

      // Detect class vs functional patterns
      if (code.includes('class ') && code.includes('extends')) {
        patterns.structure.classBased = true;
      } else if (code.includes('const ') && code.includes('=>')) {
        patterns.structure.functional = true;
      }

      // Detect error handling patterns
      if (code.includes('try') && code.includes('catch')) {
        patterns.structure.errorHandling = true;
      }

      // Detect testing patterns
      if (code.includes('describe(') || code.includes('test(') || code.includes('it(')) {
        patterns.structure.testing = true;
      }
    }

    // Detect best practices
    if (code.includes('use strict') || code.includes('"use strict"')) {
      patterns.bestPractices.push('strict mode');
    }

    if (code.includes('const ') && !code.includes('let ')) {
      patterns.bestPractices.push('prefer const');
    }

    // Detect anti-patterns
    if (code.includes('eval(')) {
      patterns.antiPatterns.push('eval usage');
    }

    if (code.includes('==') && !code.includes('===')) {
      patterns.antiPatterns.push('loose equality');
    }

    return patterns;
  }

  /**
   * Generate context-aware suggestions
   */
  async generateContextAwareSuggestions(context) {
    const { code, language, patterns, cursorPosition, surroundingCode } = context;
    const suggestions = [];

    // Type safety suggestions
    if (language === 'typescript' || language === 'javascript') {
      if (patterns.antiPatterns.includes('loose equality')) {
        suggestions.push({
          type: 'refactor',
          priority: 'high',
          title: 'Use strict equality',
          description: 'Replace == with === for type-safe comparisons',
          code: code.replace(/==/g, '==='),
          location: this.findLocation(code, '==')
        });
      }

      if (patterns.structure.promises && !patterns.structure.asyncAwait) {
        suggestions.push({
          type: 'refactor',
          priority: 'medium',
          title: 'Consider async/await',
          description: 'Convert promise chains to async/await for better readability',
          example: this.generateAsyncAwaitExample(code)
        });
      }
    }

    // Performance suggestions
    if (code.includes('for (') && code.includes('.length')) {
      suggestions.push({
        type: 'performance',
        priority: 'low',
        title: 'Cache array length',
        description: 'Cache array.length in loop to avoid repeated property access',
        example: this.generateCachedLengthExample(code)
      });
    }

    // Security suggestions
    if (code.includes('innerHTML') || code.includes('document.write')) {
      suggestions.push({
        type: 'security',
        priority: 'high',
        title: 'XSS vulnerability risk',
        description: 'Use textContent or sanitize input to prevent XSS attacks',
        example: this.generateSecureExample(code)
      });
    }

    // Code quality suggestions
    if (this.detectLongFunction(code)) {
      suggestions.push({
        type: 'quality',
        priority: 'medium',
        title: 'Function too long',
        description: 'Consider breaking this function into smaller, focused functions',
        metrics: {
          lines: this.countLines(code),
          complexity: this.calculateComplexity(code)
        }
      });
    }

    return suggestions;
  }

  /**
   * Calculate suggestion confidence
   */
  calculateConfidence(suggestion, patterns) {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on pattern matches
    if (suggestion.type === 'refactor' && patterns.structure) {
      confidence += 0.2;
    }

    if (suggestion.priority === 'high') {
      confidence += 0.2;
    }

    if (suggestion.example) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate reasoning for suggestion
   */
  generateReasoning(suggestion, patterns) {
    const reasons = [];

    if (suggestion.type === 'refactor') {
      reasons.push('Improves code readability and maintainability');
    }

    if (suggestion.type === 'performance') {
      reasons.push('Optimizes runtime performance');
    }

    if (suggestion.type === 'security') {
      reasons.push('Addresses potential security vulnerability');
    }

    if (suggestion.priority === 'high') {
      reasons.push('High priority - should be addressed soon');
    }

    return reasons.join('. ') + '.';
  }

  /**
   * Generate async/await example
   */
  generateAsyncAwaitExample(code) {
    // Simple example generation
    return code
      .replace(/\.then\(/g, 'await ')
      .replace(/\.catch\(/g, 'try { ... } catch (')
      .replace(/\)/g, '');
  }

  /**
   * Generate cached length example
   */
  generateCachedLengthExample(code) {
    return code.replace(
      /for\s*\([^)]*\.length[^)]*\)/g,
      (match) => {
        const arrayMatch = match.match(/(\w+)\.length/);
        if (arrayMatch) {
          const arrayName = arrayMatch[1];
          return match.replace(
            new RegExp(`${arrayName}\\.length`, 'g'),
            `${arrayName}Length`
          ).replace(/for\s*\(/, `const ${arrayName}Length = ${arrayName}.length;\nfor (`);
        }
        return match;
      }
    );
  }

  /**
   * Generate secure example
   */
  generateSecureExample(code) {
    return code
      .replace(/\.innerHTML\s*=/g, '.textContent =')
      .replace(/document\.write\(/g, '// Use safe DOM manipulation instead of document.write(');
  }

  /**
   * Detect long function
   */
  detectLongFunction(code) {
    const lines = code.split('\n').filter(line => line.trim());
    return lines.length > 50; // Threshold for "long" function
  }

  /**
   * Count lines
   */
  countLines(code) {
    return code.split('\n').length;
  }

  /**
   * Calculate complexity
   */
  calculateComplexity(code) {
    let complexity = 1; // Base complexity

    // Count control flow statements
    const controlFlow = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
    controlFlow.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  /**
   * Find location of pattern in code
   */
  findLocation(code, pattern) {
    const index = code.indexOf(pattern);
    if (index === -1) return null;

    const beforeMatch = code.substring(0, index);
    const line = beforeMatch.split('\n').length;
    const column = beforeMatch.split('\n').pop().length + 1;

    return { line, column };
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(userId, projectContext) {
    // This would integrate with user history and preferences
    const baseRecommendations = await this.generateCodeSuggestions(projectContext);
    
    // Personalize based on user patterns
    const personalized = baseRecommendations.suggestions.map(suggestion => ({
      ...suggestion,
      personalized: true,
      relevance: this.calculateRelevance(suggestion, userId)
    }));

    return {
      ...baseRecommendations,
      suggestions: personalized.sort((a, b) => b.relevance - a.relevance)
    };
  }

  /**
   * Calculate relevance for user
   */
  calculateRelevance(suggestion, userId) {
    // This would use user history, preferences, etc.
    // For now, return base relevance
    return suggestion.confidence || 0.5;
  }
}

module.exports = AdvancedRecommendations;

