/**
 * Codebase Indexer
 * 
 * Fast codebase search and understanding.
 * Foundation for real-time suggestions, chat, and multi-file editing.
 */

const fs = require('fs');
const path = require('path');

class CodebaseIndexer {
  constructor() {
    this.index = new Map(); // File path -> metadata
    this.embeddings = new Map(); // File path -> vector embedding
    this.dependencyGraph = new Map(); // File path -> [dependencies]
    this.symbols = new Map(); // Symbol name -> [locations]
    this.lastIndexed = null;
  }

  /**
   * Index a codebase
   * @param {string} repoPath - Path to repository
   * @param {Object} options - Indexing options
   * @returns {Promise<Object>} Indexing results
   */
  async indexCodebase(repoPath, options = {}) {
    const {
      maxFiles = 1000,
      excludePatterns = ['node_modules', '.git', 'dist', 'build'],
      includeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.rs', '.go'],
    } = options;

    console.log(`[Codebase Indexer] Indexing ${repoPath}...`);

    const files = this.findCodeFiles(repoPath, {
      maxFiles,
      excludePatterns,
      includeExtensions,
    });

    const results = {
      filesIndexed: 0,
      symbolsIndexed: 0,
      dependenciesFound: 0,
      errors: [],
    };

    // Index each file
    for (const filePath of files) {
      try {
        await this.indexFile(filePath, repoPath);
        results.filesIndexed++;
      } catch (error) {
        results.errors.push({ file: filePath, error: error.message });
      }
    }

    // Build dependency graph
    this.buildDependencyGraph();
    results.dependenciesFound = this.dependencyGraph.size;

    // Index symbols
    this.indexSymbols();
    results.symbolsIndexed = this.symbols.size;

    this.lastIndexed = new Date();
    console.log(`[Codebase Indexer] Indexed ${results.filesIndexed} files, ${results.symbolsIndexed} symbols`);

    return results;
  }

  /**
   * Find all code files in repository
   */
  findCodeFiles(rootPath, options) {
    const files = [];
    const { maxFiles, excludePatterns, includeExtensions } = options;

    const shouldExclude = (filePath) => {
      return excludePatterns.some(pattern => filePath.includes(pattern));
    };

    const shouldInclude = (filePath) => {
      const ext = path.extname(filePath);
      return includeExtensions.includes(ext);
    };

    const walk = (dir) => {
      if (files.length >= maxFiles) return;

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (files.length >= maxFiles) break;

          const fullPath = path.join(dir, entry.name);

          if (shouldExclude(fullPath)) continue;

          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (entry.isFile() && shouldInclude(fullPath)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    walk(rootPath);
    return files;
  }

  /**
   * Index a single file
   */
  async indexFile(filePath, repoPath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(repoPath, filePath);
    const ext = path.extname(filePath);
    const language = this.detectLanguage(ext);

    // Extract metadata
    const metadata = {
      path: relativePath,
      fullPath: filePath,
      language,
      size: content.length,
      lines: content.split('\n').length,
      functions: this.extractFunctions(content, language),
      classes: this.extractClasses(content, language),
      imports: this.extractImports(content, language),
      exports: this.extractExports(content, language),
      lastModified: fs.statSync(filePath).mtime,
    };

    // Store in index
    this.index.set(relativePath, metadata);

    // Generate embedding (simplified - in production, use actual embeddings)
    const embedding = this.generateEmbedding(content, metadata);
    this.embeddings.set(relativePath, embedding);

    return metadata;
  }

  /**
   * Detect language from extension
   */
  detectLanguage(ext) {
    const langMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.rs': 'rust',
      '.go': 'go',
      '.java': 'java',
    };
    return langMap[ext.toLowerCase()] || 'unknown';
  }

  /**
   * Extract functions from code
   */
  extractFunctions(content, language) {
    const functions = [];

    if (language === 'javascript' || language === 'typescript') {
      // Match function declarations and arrow functions
      const patterns = [
        /(?:function|const|let|var)\s+(\w+)\s*[=:]?\s*(?:\([^)]*\)|async\s*\([^)]*\))\s*[=>{]/g,
        /function\s+(\w+)\s*\([^)]*\)/g,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          functions.push({
            name: match[1],
            line: content.substring(0, match.index).split('\n').length,
          });
        }
      }
    } else if (language === 'python') {
      const pattern = /def\s+(\w+)\s*\(/g;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push({
          name: match[1],
          line: content.substring(0, match.index).split('\n').length,
        });
      }
    }

    return functions;
  }

  /**
   * Extract classes from code
   */
  extractClasses(content, language) {
    const classes = [];

    if (language === 'javascript' || language === 'typescript') {
      const pattern = /class\s+(\w+)/g;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        classes.push({
          name: match[1],
          line: content.substring(0, match.index).split('\n').length,
        });
      }
    } else if (language === 'python') {
      const pattern = /class\s+(\w+)/g;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        classes.push({
          name: match[1],
          line: content.substring(0, match.index).split('\n').length,
        });
      }
    }

    return classes;
  }

  /**
   * Extract imports from code
   */
  extractImports(content, language) {
    const imports = [];

    if (language === 'javascript' || language === 'typescript') {
      const patterns = [
        /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g,
        /require\(['"]([^'"]+)['"]\)/g,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          imports.push(match[1]);
        }
      }
    } else if (language === 'python') {
      const pattern = /(?:from\s+(\S+)\s+)?import\s+([^\n]+)/g;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }
    }

    return imports;
  }

  /**
   * Extract exports from code
   */
  extractExports(content, language) {
    const exports = [];

    if (language === 'javascript' || language === 'typescript') {
      const patterns = [
        /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g,
        /export\s+\{([^}]+)\}/g,
        /module\.exports\s*=\s*(\w+)/g,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          if (match[1]) {
            exports.push(match[1].split(',').map(e => e.trim()));
          }
        }
      }
    }

    return exports.flat();
  }

  /**
   * Generate embedding for file (simplified)
   * In production, use actual vector embeddings (OpenAI, etc.)
   */
  generateEmbedding(content, metadata) {
    // Simplified embedding - in production, use actual embeddings
    // This is a placeholder that represents file characteristics
    return {
      language: metadata.language,
      functions: metadata.functions.length,
      classes: metadata.classes.length,
      size: metadata.size,
      // In production, this would be a vector from an embedding model
      vector: null, // Would be actual vector
    };
  }

  /**
   * Build dependency graph
   */
  buildDependencyGraph() {
    this.dependencyGraph.clear();

    for (const [filePath, metadata] of this.index.entries()) {
      const dependencies = [];

      for (const imp of metadata.imports) {
        // Resolve import to file path
        const resolvedPath = this.resolveImport(filePath, imp);
        if (resolvedPath) {
          dependencies.push(resolvedPath);
        }
      }

      this.dependencyGraph.set(filePath, dependencies);
    }
  }

  /**
   * Resolve import to file path
   */
  resolveImport(fromPath, importPath) {
    // Simplified resolution - in production, handle all cases
    if (importPath.startsWith('.')) {
      // Relative import
      const dir = path.dirname(fromPath);
      const resolved = path.resolve(dir, importPath);
      // Try different extensions
      for (const ext of ['.js', '.ts', '.jsx', '.tsx', '']) {
        const fullPath = resolved + ext;
        if (this.index.has(fullPath)) {
          return fullPath;
        }
      }
    } else {
      // Absolute import - check node_modules, etc.
      // Simplified for now
    }
    return null;
  }

  /**
   * Index symbols (functions, classes, etc.)
   */
  indexSymbols() {
    this.symbols.clear();

    for (const [filePath, metadata] of this.index.entries()) {
      // Index functions
      for (const func of metadata.functions) {
        if (!this.symbols.has(func.name)) {
          this.symbols.set(func.name, []);
        }
        this.symbols.get(func.name).push({
          file: filePath,
          line: func.line,
          type: 'function',
        });
      }

      // Index classes
      for (const cls of metadata.classes) {
        if (!this.symbols.has(cls.name)) {
          this.symbols.set(cls.name, []);
        }
        this.symbols.get(cls.name).push({
          file: filePath,
          line: cls.line,
          type: 'class',
        });
      }
    }
  }

  /**
   * Search codebase
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async search(query, options = {}) {
    const {
      type = 'semantic', // 'semantic', 'text', 'symbol'
      limit = 10,
    } = options;

    const results = [];

    if (type === 'symbol') {
      // Search symbols
      for (const [symbol, locations] of this.symbols.entries()) {
        if (symbol.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            type: 'symbol',
            name: symbol,
            locations,
            score: 1.0,
          });
        }
      }
    } else {
      // Semantic/text search (simplified)
      for (const [filePath, metadata] of this.index.entries()) {
        // Simple text matching for now
        // In production, use actual semantic search with embeddings
        const score = this.calculateRelevance(query, metadata);
        if (score > 0) {
          results.push({
            type: 'file',
            path: filePath,
            metadata,
            score,
          });
        }
      }
    }

    // Sort by score and limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate relevance score (simplified)
   */
  calculateRelevance(query, metadata) {
    let score = 0;
    const queryLower = query.toLowerCase();

    // Check file path
    if (metadata.path.toLowerCase().includes(queryLower)) {
      score += 0.5;
    }

    // Check function names
    for (const func of metadata.functions) {
      if (func.name.toLowerCase().includes(queryLower)) {
        score += 0.3;
      }
    }

    // Check class names
    for (const cls of metadata.classes) {
      if (cls.name.toLowerCase().includes(queryLower)) {
        score += 0.3;
      }
    }

    return score;
  }

  /**
   * Get file context for a given file
   */
  getFileContext(filePath) {
    const metadata = this.index.get(filePath);
    if (!metadata) return null;

    const dependencies = this.dependencyGraph.get(filePath) || [];
    const dependents = [];

    // Find files that depend on this file
    for (const [otherPath, deps] of this.dependencyGraph.entries()) {
      if (deps.includes(filePath)) {
        dependents.push(otherPath);
      }
    }

    return {
      file: metadata,
      dependencies: dependencies.map(dep => this.index.get(dep)).filter(Boolean),
      dependents: dependents.map(dep => this.index.get(dep)).filter(Boolean),
    };
  }

  /**
   * Get codebase statistics
   */
  getStats() {
    return {
      filesIndexed: this.index.size,
      symbolsIndexed: this.symbols.size,
      dependencies: this.dependencyGraph.size,
      lastIndexed: this.lastIndexed,
      languages: this.getLanguageStats(),
    };
  }

  /**
   * Get language statistics
   */
  getLanguageStats() {
    const stats = {};
    for (const metadata of this.index.values()) {
      stats[metadata.language] = (stats[metadata.language] || 0) + 1;
    }
    return stats;
  }
}

module.exports = new CodebaseIndexer();

