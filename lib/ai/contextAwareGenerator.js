/**
 * Context-Aware Code Generator
 * 
 * Generates code with deep understanding of codebase context
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('ContextAwareGenerator');

class ContextAwareGenerator {
  constructor() {
    this.contextCache = new Map(); // repo -> context
  }

  /**
   * Build comprehensive context
   */
  async buildContext(repo, files = [], currentFile = null) {
    const context = {
      repo,
      files: files.map(f => ({
        path: f.path,
        language: this.detectLanguage(f.path),
        size: f.content?.length || 0,
        imports: this.extractImports(f.content || ''),
        exports: this.extractExports(f.content || ''),
        functions: this.extractFunctions(f.content || ''),
        classes: this.extractClasses(f.content || '')
      })),
      currentFile: currentFile ? {
        path: currentFile.path,
        content: currentFile.content,
        language: this.detectLanguage(currentFile.path),
        cursor: currentFile.cursor || null
      } : null,
      patterns: this.detectPatterns(files),
      dependencies: this.extractDependencies(files),
      architecture: this.inferArchitecture(files)
    };

    this.contextCache.set(repo, context);
    return context;
  }

  /**
   * Generate code with context awareness
   */
  async generateWithContext(prompt, context, options = {}) {
    const enhancedPrompt = this.buildEnhancedPrompt(prompt, context);
    
    // Use context to guide generation
    const constraints = this.buildConstraints(context);
    const examples = this.findSimilarExamples(context, prompt);

    return {
      prompt: enhancedPrompt,
      constraints,
      examples,
      context: {
        repo: context.repo,
        fileCount: context.files.length,
        languages: [...new Set(context.files.map(f => f.language))],
        architecture: context.architecture
      }
    };
  }

  /**
   * Build enhanced prompt with context
   */
  buildEnhancedPrompt(prompt, context) {
    let enhanced = `Context-Aware Code Generation Request

Repository: ${context.repo}
Architecture: ${context.architecture.type || 'Unknown'}
Languages: ${context.files.map(f => f.language).filter(Boolean).join(', ') || 'Unknown'}

Current File Context:`;
    
    if (context.currentFile) {
      enhanced += `\n- File: ${context.currentFile.path}`;
      enhanced += `\n- Language: ${context.currentFile.language}`;
      if (context.currentFile.content) {
        const preview = context.currentFile.content.substring(0, 500);
        enhanced += `\n- Preview:\n${preview}...`;
      }
    }

    enhanced += `\n\nRelated Files:`;
    context.files.slice(0, 5).forEach(f => {
      enhanced += `\n- ${f.path} (${f.language})`;
    });

    enhanced += `\n\nPatterns Detected:`;
    Object.entries(context.patterns).slice(0, 3).forEach(([pattern, count]) => {
      enhanced += `\n- ${pattern}: ${count} occurrences`;
    });

    enhanced += `\n\nUser Request:\n${prompt}`;

    enhanced += `\n\nInstructions:
- Follow existing code patterns and style
- Use same dependencies and imports
- Match architecture and structure
- Maintain consistency with codebase`;

    return enhanced;
  }

  /**
   * Build generation constraints from context
   */
  buildConstraints(context) {
    return {
      languages: [...new Set(context.files.map(f => f.language).filter(Boolean))],
      style: context.patterns.style || 'standard',
      dependencies: context.dependencies,
      architecture: context.architecture
    };
  }

  /**
   * Find similar examples in context
   */
  findSimilarExamples(context, prompt) {
    // Simple similarity based on keywords
    const keywords = prompt.toLowerCase().split(/\s+/);
    const examples = [];

    context.files.forEach(file => {
      if (!file.content) return;
      
      const content = file.content.toLowerCase();
      const matches = keywords.filter(k => content.includes(k)).length;
      
      if (matches > 0) {
        examples.push({
          file: file.path,
          relevance: matches / keywords.length,
          preview: file.content.substring(0, 200)
        });
      }
    });

    return examples
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);
  }

  /**
   * Detect language from file path
   */
  detectLanguage(path) {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: any = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'java': 'java', 'go': 'go', 'rs': 'rust',
      'cpp': 'cpp', 'c': 'c', 'cs': 'csharp', 'php': 'php',
      'rb': 'ruby', 'swift': 'swift', 'kt': 'kotlin'
    };
    return langMap[ext] || 'unknown';
  }

  /**
   * Extract imports from code
   */
  extractImports(content) {
    const imports = [];
    const importPatterns = [
      /import\s+.*?from\s+['"](.+?)['"]/g,
      /require\(['"](.+?)['"]\)/g,
      /#include\s+[<"](.+?)[>"]/g
    ];

    importPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    });

    return [...new Set(imports)];
  }

  /**
   * Extract exports from code
   */
  extractExports(content) {
    const exports = [];
    const exportPatterns = [
      /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g,
      /module\.exports\s*=\s*\{([^}]+)\}/g
    ];

    exportPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        exports.push(match[1]);
      }
    });

    return [...new Set(exports)];
  }

  /**
   * Extract functions from code
   */
  extractFunctions(content) {
    const functions = [];
    const functionPatterns = [
      /(?:function|const|let|var)\s+(\w+)\s*[=:]\s*(?:async\s+)?\(/g,
      /(?:async\s+)?function\s+(\w+)\s*\(/g
    ];

    functionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push(match[1]);
      }
    });

    return [...new Set(functions)];
  }

  /**
   * Extract classes from code
   */
  extractClasses(content) {
    const classes = [];
    const classPattern = /class\s+(\w+)/g;
    let match;
    while ((match = classPattern.exec(content)) !== null) {
      classes.push(match[1]);
    }
    return [...new Set(classes)];
  }

  /**
   * Detect patterns in codebase
   */
  detectPatterns(files) {
    const patterns: any = {
      style: 'standard',
      testing: 0,
      async: 0,
      functional: 0
    };

    files.forEach(file => {
      const content = file.content || '';
      if (content.includes('test') || content.includes('spec')) patterns.testing++;
      if (content.includes('async') || content.includes('await')) patterns.async++;
      if (content.includes('=>') && !content.includes('class')) patterns.functional++;
    });

    return patterns;
  }

  /**
   * Extract dependencies
   */
  extractDependencies(files) {
    const deps = new Set();
    files.forEach(file => {
      this.extractImports(file.content || '').forEach(dep => deps.add(dep));
    });
    return Array.from(deps);
  }

  /**
   * Infer architecture
   */
  inferArchitecture(files) {
    const hasReact = files.some(f => f.path.includes('react') || f.content?.includes('React'));
    const hasNext = files.some(f => f.path.includes('next') || f.content?.includes('next'));
    const hasExpress = files.some(f => f.content?.includes('express') || f.content?.includes('app.use'));
    
    if (hasNext) return { type: 'nextjs', framework: 'Next.js' };
    if (hasReact) return { type: 'react', framework: 'React' };
    if (hasExpress) return { type: 'express', framework: 'Express.js' };
    
    return { type: 'unknown', framework: 'Unknown' };
  }
}

// Singleton instance
let contextAwareGeneratorInstance = null;

function getContextAwareGenerator() {
  if (!contextAwareGeneratorInstance) {
    contextAwareGeneratorInstance = new ContextAwareGenerator();
  }
  return contextAwareGeneratorInstance;
}

module.exports = {
  ContextAwareGenerator,
  getContextAwareGenerator
};
