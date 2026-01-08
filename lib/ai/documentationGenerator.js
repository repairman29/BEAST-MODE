/**
 * Documentation Generator
 * 
 * Generates comprehensive documentation for code
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('DocumentationGenerator');

class DocumentationGenerator {
  constructor() {
    this.documentation = new Map(); // docId -> documentation
  }

  /**
   * Generate documentation for code
   */
  generateDocumentation(code, filePath, options = {}) {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const language = options.language || this.detectLanguage(filePath);
    const format = options.format || 'markdown';

    const analysis = this.analyzeCode(code, language);
    const documentation = this.buildDocumentation(analysis, format, options);

    const doc = {
      id: docId,
      file: filePath,
      language,
      format,
      documentation,
      analysis,
      generatedAt: new Date().toISOString()
    };

    this.documentation.set(docId, doc);
    log.info(`Documentation generated: ${docId} for ${filePath}`);
    return doc;
  }

  /**
   * Analyze code structure
   */
  analyzeCode(code, language) {
    return {
      functions: this.extractFunctions(code, language),
      classes: this.extractClasses(code, language),
      exports: this.extractExports(code, language),
      imports: this.extractImports(code, language),
      complexity: this.estimateComplexity(code),
      dependencies: this.extractDependencies(code)
    };
  }

  /**
   * Extract functions
   */
  extractFunctions(code, language) {
    const functions = [];

    if (language === 'javascript' || language === 'typescript') {
      const patterns = [
        /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g,
        /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
        /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function/g
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(code)) !== null) {
          functions.push({
            name: match[1],
            type: 'function',
            signature: match[0]
          });
        }
      });
    } else if (language === 'python') {
      const pattern = /def\s+(\w+)\s*\([^)]*\)/g;
      let match;
      while ((match = pattern.exec(code)) !== null) {
        functions.push({
          name: match[1],
          type: 'function',
          signature: match[0]
        });
      }
    }

    return functions;
  }

  /**
   * Extract classes
   */
  extractClasses(code, language) {
    const classes = [];

    if (language === 'javascript' || language === 'typescript') {
      const pattern = /(?:export\s+)?class\s+(\w+)/g;
      let match;
      while ((match = pattern.exec(code)) !== null) {
        classes.push({
          name: match[1],
          type: 'class'
        });
      }
    } else if (language === 'python') {
      const pattern = /class\s+(\w+)/g;
      let match;
      while ((match = pattern.exec(code)) !== null) {
        classes.push({
          name: match[1],
          type: 'class'
        });
      }
    }

    return classes;
  }

  /**
   * Extract exports
   */
  extractExports(code, language) {
    const exports = [];

    if (language === 'javascript' || language === 'typescript') {
      const patterns = [
        /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g,
        /export\s*\{([^}]+)\}/g
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(code)) !== null) {
          if (match[1].includes(',')) {
            match[1].split(',').forEach(exp => {
              exports.push(exp.trim());
            });
          } else {
            exports.push(match[1]);
          }
        }
      });
    }

    return [...new Set(exports)];
  }

  /**
   * Extract imports
   */
  extractImports(code, language) {
    const imports = [];
    const patterns = [
      /import\s+.*?from\s+['"](.+?)['"]/g,
      /require\(['"](.+?)['"]\)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        imports.push(match[1]);
      }
    });

    return [...new Set(imports)];
  }

  /**
   * Estimate complexity
   */
  estimateComplexity(code) {
    const patterns = [
      /\bif\b/gi,
      /\belse\b/gi,
      /\bfor\b/gi,
      /\bwhile\b/gi,
      /\bswitch\b/gi,
      /\bcatch\b/gi
    ];

    const complexity = patterns.reduce((sum, pattern) => {
      const matches = code.match(pattern);
      return sum + (matches ? matches.length : 0);
    }, 1);

    return {
      score: complexity,
      level: complexity < 5 ? 'low' : complexity < 10 ? 'medium' : 'high'
    };
  }

  /**
   * Extract dependencies
   */
  extractDependencies(code) {
    return this.extractImports(code, 'javascript');
  }

  /**
   * Build documentation
   */
  buildDocumentation(analysis, format, options) {
    if (format === 'markdown') {
      return this.buildMarkdownDoc(analysis, options);
    } else if (format === 'jsdoc') {
      return this.buildJSDoc(analysis, options);
    } else if (format === 'python') {
      return this.buildPythonDoc(analysis, options);
    }

    return this.buildMarkdownDoc(analysis, options);
  }

  /**
   * Build Markdown documentation
   */
  buildMarkdownDoc(analysis, options) {
    let doc = `# ${options.title || 'Code Documentation'}\n\n`;
    
    if (options.description) {
      doc += `${options.description}\n\n`;
    }

    doc += `## Overview\n\n`;
    doc += `- **Functions**: ${analysis.functions.length}\n`;
    doc += `- **Classes**: ${analysis.classes.length}\n`;
    doc += `- **Exports**: ${analysis.exports.length}\n`;
    doc += `- **Complexity**: ${analysis.complexity.level} (score: ${analysis.complexity.score})\n\n`;

    if (analysis.functions.length > 0) {
      doc += `## Functions\n\n`;
      analysis.functions.forEach(func => {
        doc += `### ${func.name}\n\n`;
        doc += `\`\`\`\n${func.signature}\n\`\`\`\n\n`;
        doc += `*Documentation needed*\n\n`;
      });
    }

    if (analysis.classes.length > 0) {
      doc += `## Classes\n\n`;
      analysis.classes.forEach(cls => {
        doc += `### ${cls.name}\n\n`;
        doc += `*Documentation needed*\n\n`;
      });
    }

    if (analysis.dependencies.length > 0) {
      doc += `## Dependencies\n\n`;
      analysis.dependencies.forEach(dep => {
        doc += `- ${dep}\n`;
      });
      doc += `\n`;
    }

    return doc;
  }

  /**
   * Build JSDoc documentation
   */
  buildJSDoc(analysis, options) {
    let doc = '';

    analysis.functions.forEach(func => {
      doc += `/**\n`;
      doc += ` * ${func.name}\n`;
      doc += ` * @description Function description needed\n`;
      doc += ` * @returns {*} Return value description\n`;
      doc += ` */\n`;
      doc += `${func.signature}\n\n`;
    });

    return doc;
  }

  /**
   * Build Python docstring documentation
   */
  buildPythonDoc(analysis, options) {
    let doc = '';

    analysis.functions.forEach(func => {
      doc += `def ${func.name}():\n`;
      doc += `    """\n`;
      doc += `    ${func.name}\n\n`;
      doc += `    Description needed.\n\n`;
      doc += `    Returns:\n`;
      doc += `        Return value description\n`;
      doc += `    """\n`;
      doc += `    pass\n\n`;
    });

    return doc;
  }

  /**
   * Detect language from file path
   */
  detectLanguage(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'go': 'go'
    };
    return langMap[ext] || 'javascript';
  }

  /**
   * Generate README
   */
  generateREADME(codebase, options = {}) {
    const readme = {
      title: options.title || 'Project',
      description: options.description || 'Project description',
      installation: options.installation || 'npm install',
      usage: options.usage || 'npm start',
      features: this.extractFeatures(codebase),
      structure: this.extractStructure(codebase)
    };

    const markdown = `# ${readme.title}\n\n${readme.description}\n\n## Installation\n\n\`\`\`bash\n${readme.installation}\n\`\`\`\n\n## Usage\n\n\`\`\`bash\n${readme.usage}\n\`\`\`\n\n## Features\n\n${readme.features.map(f => `- ${f}`).join('\n')}\n\n## Project Structure\n\n\`\`\`\n${readme.structure}\n\`\`\`\n`;

    return {
      readme,
      markdown
    };
  }

  /**
   * Extract features from codebase
   */
  extractFeatures(codebase) {
    const features = [];
    const files = codebase.files || [];

    // Simple feature detection
    if (files.some(f => f.path.includes('api'))) features.push('REST API');
    if (files.some(f => f.path.includes('test'))) features.push('Testing');
    if (files.some(f => f.path.includes('component'))) features.push('Components');

    return features.length > 0 ? features : ['Core functionality'];
  }

  /**
   * Extract project structure
   */
  extractStructure(codebase) {
    const files = codebase.files || [];
    const dirs = new Set();

    files.forEach(file => {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        dirs.add(parts[0]);
      }
    });

    return Array.from(dirs).join('\n');
  }
}

// Singleton instance
let documentationGeneratorInstance = null;

function getDocumentationGenerator() {
  if (!documentationGeneratorInstance) {
    documentationGeneratorInstance = new DocumentationGenerator();
  }
  return documentationGeneratorInstance;
}

module.exports = {
  DocumentationGenerator,
  getDocumentationGenerator
};
