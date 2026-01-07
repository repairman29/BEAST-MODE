/**
 * Real-Time Code Suggestions
 * 
 * Provides inline code completion and suggestions as you type.
 * Foundation for Copilot-like experience.
 */

const codebaseIndexer = require('./codebaseIndexer');
const llmCodeGenerator = require('./llmCodeGenerator');

class RealtimeSuggestions {
  constructor() {
    this.suggestionCache = new Map();
    this.activeSuggestions = new Map();
  }

  /**
   * Get suggestions for current cursor position
   * @param {string} filePath - Current file path
   * @param {string} content - File content
   * @param {number} cursorLine - Cursor line number
   * @param {number} cursorColumn - Cursor column number
   * @param {Object} context - Additional context
   * @returns {Promise<Array>} Suggestions
   */
  async getSuggestions(filePath, content, cursorLine, cursorColumn, context = {}) {
    const {
      maxSuggestions = 5,
      useLLM = true,
      userApiKey = null,
    } = context;

    try {
      // 1. Extract context around cursor
      const localContext = this.extractLocalContext(content, cursorLine, cursorColumn);
      
      // 2. Get codebase context
      const codebaseContext = await this.getCodebaseContext(filePath, localContext);
      
      // 3. Generate suggestions
      const suggestions = await this.generateSuggestions(
        localContext,
        codebaseContext,
        { maxSuggestions, useLLM, userApiKey }
      );

      // 4. Rank and filter suggestions
      const ranked = this.rankSuggestions(suggestions, localContext, codebaseContext);

      return ranked.slice(0, maxSuggestions);
    } catch (error) {
      console.error('[Realtime Suggestions] Error:', error);
      return [];
    }
  }

  /**
   * Extract local context around cursor
   */
  extractLocalContext(content, cursorLine, cursorColumn) {
    const lines = content.split('\n');
    const currentLine = lines[cursorLine - 1] || '';
    const beforeCursor = currentLine.substring(0, cursorColumn);
    const afterCursor = currentLine.substring(cursorColumn);

    // Get context lines (3 before, 3 after)
    const contextLines = {
      before: lines.slice(Math.max(0, cursorLine - 4), cursorLine - 1),
      current: currentLine,
      after: lines.slice(cursorLine, Math.min(lines.length, cursorLine + 3)),
    };

    // Detect what user is typing
    const intent = this.detectIntent(beforeCursor, contextLines);

    return {
      beforeCursor,
      afterCursor,
      contextLines,
      intent,
      line: cursorLine,
      column: cursorColumn,
    };
  }

  /**
   * Detect user intent from context
   */
  detectIntent(beforeCursor, contextLines) {
    const text = beforeCursor.trim();

    // Function call
    if (text.match(/\.\w+\($/)) {
      return { type: 'function_call', context: 'method' };
    }

    // Variable assignment
    if (text.match(/(?:const|let|var)\s+\w+\s*=\s*$/)) {
      return { type: 'variable', context: 'assignment' };
    }

    // Import statement
    if (text.match(/import\s+(?:\{[^}]*\})?\s+from\s+['"]$/)) {
      return { type: 'import', context: 'module' };
    }

    // Function definition
    if (text.match(/(?:function|const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{?$/)) {
      return { type: 'function', context: 'definition' };
    }

    // Class definition
    if (text.match(/class\s+\w+\s+(?:extends\s+\w+)?\s*\{$/)) {
      return { type: 'class', context: 'definition' };
    }

    // Generic completion
    return { type: 'completion', context: 'generic' };
  }

  /**
   * Get codebase context for suggestions
   */
  async getCodebaseContext(filePath, localContext) {
    const context = {
      currentFile: null,
      relatedFiles: [],
      symbols: [],
      patterns: [],
    };

    try {
      // Get current file context from indexer
      const fileContext = codebaseIndexer.getFileContext(filePath);
      if (fileContext) {
        context.currentFile = fileContext.file;
        context.relatedFiles = [
          ...fileContext.dependencies.slice(0, 3),
          ...fileContext.dependents.slice(0, 3),
        ];
      }

      // Search for relevant symbols
      if (localContext.intent.type === 'function_call') {
        const symbolName = localContext.beforeCursor.match(/\.(\w+)$/)?.[1];
        if (symbolName) {
          const searchResults = await codebaseIndexer.search(symbolName, {
            type: 'symbol',
            limit: 5,
          });
          context.symbols = searchResults;
        }
      }

      // Extract patterns from related files
      context.patterns = this.extractPatterns(context.relatedFiles);
    } catch (error) {
      console.warn('[Realtime Suggestions] Could not get codebase context:', error);
    }

    return context;
  }

  /**
   * Extract patterns from files
   */
  extractPatterns(files) {
    const patterns = [];

    for (const file of files) {
      if (!file) continue;

      // Extract common patterns
      for (const func of file.functions || []) {
        patterns.push({
          type: 'function',
          name: func.name,
          file: file.path,
        });
      }

      for (const cls of file.classes || []) {
        patterns.push({
          type: 'class',
          name: cls.name,
          file: file.path,
        });
      }
    }

    return patterns;
  }

  /**
   * Generate suggestions
   */
  async generateSuggestions(localContext, codebaseContext, options) {
    const { maxSuggestions, useLLM, userApiKey } = options;
    const suggestions = [];

    // 1. Pattern-based suggestions (fast, no LLM)
    const patternSuggestions = this.generatePatternSuggestions(localContext, codebaseContext);
    suggestions.push(...patternSuggestions);

    // 2. LLM-based suggestions (slower, better quality)
    if (useLLM && userApiKey && suggestions.length < maxSuggestions) {
      try {
        const llmSuggestions = await this.generateLLMSuggestions(
          localContext,
          codebaseContext,
          userApiKey
        );
        suggestions.push(...llmSuggestions);
      } catch (error) {
        console.warn('[Realtime Suggestions] LLM generation failed:', error);
      }
    }

    return suggestions;
  }

  /**
   * Generate pattern-based suggestions
   */
  generatePatternSuggestions(localContext, codebaseContext) {
    const suggestions = [];
    const { intent, beforeCursor } = localContext;

    // Function call suggestions
    if (intent.type === 'function_call') {
      const objectName = beforeCursor.match(/(\w+)\.\w+$/)?.[1];
      if (objectName) {
        // Find methods on this object from codebase
        for (const pattern of codebaseContext.patterns) {
          if (pattern.type === 'function' && pattern.name.startsWith(objectName)) {
            suggestions.push({
              text: pattern.name,
              type: 'function',
              score: 0.8,
              source: 'pattern',
            });
          }
        }
      }
    }

    // Import suggestions
    if (intent.type === 'import') {
      // Suggest imports from codebase
      for (const file of codebaseContext.relatedFiles) {
        if (file.exports && file.exports.length > 0) {
          suggestions.push({
            text: file.exports[0],
            type: 'import',
            score: 0.7,
            source: 'pattern',
            file: file.path,
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Generate LLM-based suggestions
   */
  async generateLLMSuggestions(localContext, codebaseContext, userApiKey) {
    const prompt = this.buildSuggestionPrompt(localContext, codebaseContext);

    try {
      // Use LLM to generate suggestions
      const llmCodeGen = require('./llmCodeGenerator');
      
      if (!llmCodeGen.initializeOpenAI(userApiKey)) {
        return [];
      }

      const response = await llmCodeGen.generateWithOpenAI(prompt, codebaseContext, {
        model: 'gpt-4o-mini', // Fast model for real-time
        temperature: 0.3, // Lower temperature for more predictable suggestions
        maxTokens: 100, // Short suggestions
      });

      // Parse suggestions from response
      return this.parseSuggestions(response, localContext);
    } catch (error) {
      console.error('[Realtime Suggestions] LLM error:', error);
      return [];
    }
  }

  /**
   * Build prompt for LLM suggestions
   */
  buildSuggestionPrompt(localContext, codebaseContext) {
    const { intent, beforeCursor, contextLines } = localContext;

    let prompt = `You are a code completion assistant. Suggest the next few tokens to complete the code.

Current context:
${contextLines.before.join('\n')}
${contextLines.current}
${contextLines.after.join('\n')}

Cursor position: Line ${localContext.line}, Column ${localContext.column}
User is typing: "${beforeCursor}"

Intent: ${intent.type} (${intent.context})

`;

    if (codebaseContext.currentFile) {
      prompt += `Current file: ${codebaseContext.currentFile.path}
Language: ${codebaseContext.currentFile.language}
`;
    }

    if (codebaseContext.patterns.length > 0) {
      prompt += `\nCommon patterns in codebase:
${codebaseContext.patterns.slice(0, 5).map(p => `- ${p.name} (${p.type})`).join('\n')}
`;
    }

    prompt += `\nSuggest the next few tokens to complete the code. Be concise and match the codebase style.`;

    return prompt;
  }

  /**
   * Parse suggestions from LLM response
   */
  parseSuggestions(response, localContext) {
    const suggestions = [];
    const lines = response.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 100) {
        suggestions.push({
          text: trimmed,
          type: localContext.intent.type,
          score: 0.9,
          source: 'llm',
        });
      }
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Rank suggestions by relevance
   */
  rankSuggestions(suggestions, localContext, codebaseContext) {
    return suggestions.map(suggestion => {
      let score = suggestion.score || 0.5;

      // Boost pattern-based suggestions
      if (suggestion.source === 'pattern') {
        score += 0.1;
      }

      // Boost LLM suggestions
      if (suggestion.source === 'llm') {
        score += 0.2;
      }

      // Boost suggestions that match codebase style
      if (this.matchesCodebaseStyle(suggestion, codebaseContext)) {
        score += 0.1;
      }

      return {
        ...suggestion,
        score: Math.min(1.0, score),
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Check if suggestion matches codebase style
   */
  matchesCodebaseStyle(suggestion, codebaseContext) {
    // Check if suggestion text appears in codebase patterns
    for (const pattern of codebaseContext.patterns) {
      if (suggestion.text.includes(pattern.name)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get quality hint for current position
   */
  async getQualityHint(filePath, content, cursorLine, cursorColumn) {
    // Use quality validator to provide hints
    const qualityValidator = require('./qualityValidator');
    
    // Extract code around cursor
    const context = this.extractLocalContext(content, cursorLine, cursorColumn);
    
    // Quick quality check
    const hint = {
      message: null,
      severity: 'info',
      suggestion: null,
    };

    // Check for common issues
    if (context.beforeCursor.includes('eval(')) {
      hint.message = 'Using eval() is dangerous';
      hint.severity = 'warning';
      hint.suggestion = 'Consider using safer alternatives';
    }

    if (context.beforeCursor.includes('innerHTML')) {
      hint.message = 'innerHTML can lead to XSS';
      hint.severity = 'warning';
      hint.suggestion = 'Use textContent or sanitize input';
    }

    return hint;
  }
}

module.exports = new RealtimeSuggestions();

