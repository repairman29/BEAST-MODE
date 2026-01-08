/**
 * Context-Aware Code Generator
 * 
 * Enhances code generation to match codebase style and patterns.
 * Phase 2.2: Context-Aware Generation
 */

class ContextAwareGenerator {
  constructor() {
    this.styleCache = new Map();
  }

  /**
   * Analyze codebase style from existing files
   * @param {Array} files - Array of {path, content} objects
   * @returns {Object} Codebase style analysis
   */
  analyzeCodebaseStyle(files) {
    if (files.length === 0) {
      return this.getDefaultStyle();
    }

    const style = {
      indentation: this.detectIndentation(files),
      naming: this.detectNamingConventions(files),
      patterns: this.detectCommonPatterns(files),
      imports: this.detectImportStyle(files),
      exports: this.detectExportStyle(files),
      comments: this.detectCommentStyle(files),
      language: this.detectPrimaryLanguage(files),
    };

    return style;
  }

  /**
   * Detect indentation style (tabs vs spaces, 2 vs 4 spaces)
   */
  detectIndentation(files) {
    const indentCounts = { tabs: 0, spaces2: 0, spaces4: 0 };
    
    files.forEach(file => {
      const lines = file.content.split('\n').slice(0, 50); // Sample first 50 lines
      lines.forEach(line => {
        if (line.trim().length === 0) return;
        
        const match = line.match(/^(\s+)/);
        if (match) {
          const indent = match[1];
          if (indent.includes('\t')) {
            indentCounts.tabs++;
          } else {
            const spaces = indent.length;
            if (spaces % 4 === 0) {
              indentCounts.spaces4++;
            } else if (spaces % 2 === 0) {
              indentCounts.spaces2++;
            }
          }
        }
      });
    });

    // Determine most common
    if (indentCounts.tabs > indentCounts.spaces2 && indentCounts.tabs > indentCounts.spaces4) {
      return { type: 'tabs', size: 1 };
    } else if (indentCounts.spaces4 > indentCounts.spaces2) {
      return { type: 'spaces', size: 4 };
    } else {
      return { type: 'spaces', size: 2 };
    }
  }

  /**
   * Detect naming conventions (camelCase, snake_case, PascalCase)
   */
  detectNamingConventions(files) {
    const conventions = {
      camelCase: 0,
      snake_case: 0,
      PascalCase: 0,
      kebabCase: 0, // Changed from kebab-case to kebabCase
    };

    files.forEach(file => {
      const content = file.content;
      
      // Function names
      const funcMatches = content.match(/(?:function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
      if (funcMatches) {
        funcMatches.forEach(match => {
          const name = match.split(/\s+/).pop();
          if (name.includes('_')) conventions.snake_case++;
          else if (name[0] === name[0].toUpperCase()) conventions.PascalCase++;
          else if (name.includes('-')) conventions.kebabCase++; // Changed from kebab-case to kebabCase
          else conventions.camelCase++;
        });
      }

      // Class names
      const classMatches = content.match(/class\s+([A-Z][a-zA-Z0-9_$]*)/g);
      if (classMatches) {
        conventions.PascalCase += classMatches.length;
      }
    });

    // Determine most common
    const max = Math.max(...Object.values(conventions));
    const convention = Object.keys(conventions).find(key => conventions[key] === max);
    
    return {
      functions: convention || 'camelCase',
      classes: 'PascalCase', // Classes are usually PascalCase
      variables: convention || 'camelCase',
    };
  }

  /**
   * Detect common patterns in codebase
   */
  detectCommonPatterns(files) {
    const patterns = {
      usesAsyncAwait: 0,
      usesPromises: 0,
      usesCallbacks: 0,
      usesArrowFunctions: 0,
      usesRegularFunctions: 0,
      usesTypeScript: 0,
      usesJSDoc: 0,
      usesES6Modules: 0,
      usesCommonJS: 0,
    };

    files.forEach(file => {
      const content = file.content;
      
      if (/async\s+function|await\s+/.test(content)) patterns.usesAsyncAwait++;
      if (/\.then\(|\.catch\(|new Promise/.test(content)) patterns.usesPromises++;
      if (/function\s*\([^)]*\)\s*\{/.test(content)) patterns.usesCallbacks++;
      if (/=>\s*\{|=>\s*[^{]/.test(content)) patterns.usesArrowFunctions++;
      if (/function\s+\w+/.test(content)) patterns.usesRegularFunctions++;
      if (/:\s*\w+|interface\s+|type\s+/.test(content)) patterns.usesTypeScript++;
      if (/\/\*\*[\s\S]*?\*\//.test(content)) patterns.usesJSDoc++;
      if (/^import\s+|^export\s+/.test(content)) patterns.usesES6Modules++;
      if (/require\(|module\.exports/.test(content)) patterns.usesCommonJS++;
    });

    return patterns;
  }

  /**
   * Detect import style
   */
  detectImportStyle(files) {
    let es6Imports = 0;
    let commonJSRequires = 0;

    files.forEach(file => {
      const content = file.content;
      if (/^import\s+/.test(content)) es6Imports++;
      if (/require\(/.test(content)) commonJSRequires++;
    });

    return {
      style: es6Imports > commonJSRequires ? 'es6' : 'commonjs',
      preferDefault: false, // Would need deeper analysis
    };
  }

  /**
   * Detect export style
   */
  detectExportStyle(files) {
    let namedExports = 0;
    let defaultExports = 0;

    files.forEach(file => {
      const content = file.content;
      if (/export\s+(const|let|var|function|class)\s+/.test(content)) namedExports++;
      if (/export\s+default/.test(content)) defaultExports++;
    });

    return {
      preferDefault: defaultExports > namedExports,
    };
  }

  /**
   * Detect comment style
   */
  detectCommentStyle(files) {
    let jsdoc = 0;
    let singleLine = 0;
    let multiLine = 0;

    files.forEach(file => {
      const content = file.content;
      if (/\/\*\*[\s\S]*?\*\//.test(content)) jsdoc++;
      if (/\/\/.*/.test(content)) singleLine++;
      if (/\/\*[\s\S]*?\*\//.test(content)) multiLine++;
    });

    return {
      preferJSDoc: jsdoc > 0,
      preferSingleLine: singleLine > multiLine,
    };
  }

  /**
   * Detect primary programming language
   */
  detectPrimaryLanguage(files) {
    const languages = {};
    
    files.forEach(file => {
      const ext = file.path.split('.').pop()?.toLowerCase();
      languages[ext] = (languages[ext] || 0) + 1;
    });

    const max = Math.max(...Object.values(languages));
    const lang = Object.keys(languages).find(key => languages[key] === max);

    const langMap = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'jsx': 'JavaScript',
      'tsx': 'TypeScript',
      'py': 'Python',
      'rs': 'Rust',
      'go': 'Go',
      'java': 'Java',
    };

    return langMap[lang] || 'JavaScript';
  }

  /**
   * Get default style (fallback)
   */
  getDefaultStyle() {
    return {
      indentation: { type: 'spaces', size: 2 },
      naming: {
        functions: 'camelCase',
        classes: 'PascalCase',
        variables: 'camelCase',
      },
      patterns: {
        usesAsyncAwait: true,
        usesArrowFunctions: true,
        usesES6Modules: true,
      },
      imports: { style: 'es6' },
      exports: { preferDefault: false },
      comments: { preferJSDoc: true },
      language: 'JavaScript',
    };
  }

  /**
   * Apply style to generated code
   * @param {string} code - Generated code
   * @param {Object} style - Codebase style
   * @returns {string} Styled code
   */
  applyStyle(code, style) {
    let styledCode = code;

    // Apply indentation
    const indent = style.indentation.type === 'tabs' 
      ? '\t' 
      : ' '.repeat(style.indentation.size);

    // Replace spaces with tabs or adjust spacing
    if (style.indentation.type === 'tabs') {
      styledCode = styledCode.replace(/^ {2,}/gm, (match) => {
        return '\t'.repeat(Math.floor(match.length / 2));
      });
    } else {
      styledCode = styledCode.replace(/^\t+/gm, (match) => {
        return ' '.repeat(match.length * style.indentation.size);
      });
    }

    // Apply naming conventions (basic - would need AST for full transformation)
    // This is a simplified version

    return styledCode;
  }
}

module.exports = new ContextAwareGenerator();

