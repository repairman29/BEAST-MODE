/**
 * Multi-File Refactoring
 * 
 * Refactors code across multiple files while maintaining consistency
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('MultiFileRefactoring');

class MultiFileRefactoring {
  constructor() {
    this.refactorings = new Map(); // refactoringId -> refactoring data
  }

  /**
   * Plan multi-file refactoring
   */
  planRefactoring(files, refactoringType, options = {}) {
    const refactoringId = `refactor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const plan = {
      id: refactoringId,
      type: refactoringType,
      files: files.map(f => ({
        path: f.path,
        currentContent: f.content,
        changes: this.analyzeChanges(f, refactoringType, options)
      })),
      dependencies: this.analyzeDependencies(files),
      order: this.determineOrder(files, refactoringType),
      estimatedImpact: this.estimateImpact(files, refactoringType),
      createdAt: new Date().toISOString()
    };

    this.refactorings.set(refactoringId, plan);
    log.info(`Refactoring planned: ${refactoringId} (${refactoringType})`);
    return plan;
  }

  /**
   * Analyze changes needed for a file
   */
  analyzeChanges(file, refactoringType, options) {
    const changes = [];

    switch (refactoringType) {
      case 'rename_function':
        if (file.content?.includes(options.oldName)) {
          changes.push({
            type: 'replace',
            pattern: new RegExp(`\\b${options.oldName}\\b`, 'g'),
            replacement: options.newName,
            count: (file.content.match(new RegExp(`\\b${options.oldName}\\b`, 'g')) || []).length
          });
        }
        break;

      case 'extract_common':
        // Find common patterns to extract
        changes.push({
          type: 'extract',
          description: 'Extract common code to shared module'
        });
        break;

      case 'update_imports':
        // Update import paths
        changes.push({
          type: 'update_imports',
          oldPath: options.oldPath,
          newPath: options.newPath
        });
        break;
    }

    return changes;
  }

  /**
   * Analyze dependencies between files
   */
  analyzeDependencies(files) {
    const dependencies = new Map();

    files.forEach(file => {
      const imports = this.extractImports(file.content || '');
      const deps = files
        .filter(f => imports.some(imp => f.path.includes(imp.split('/').pop() || '')))
        .map(f => f.path);
      
      if (deps.length > 0) {
        dependencies.set(file.path, deps);
      }
    });

    return Object.fromEntries(dependencies);
  }

  /**
   * Determine refactoring order
   */
  determineOrder(files, refactoringType) {
    // Simple topological sort based on dependencies
    const dependencies = this.analyzeDependencies(files);
    const ordered = [];
    const visited = new Set();

    const visit = (filePath) => {
      if (visited.has(filePath)) return;
      visited.add(filePath);

      const deps = dependencies[filePath] || [];
      deps.forEach(dep => visit(dep));
      ordered.push(filePath);
    };

    files.forEach(f => visit(f.path));
    return ordered;
  }

  /**
   * Estimate impact
   */
  estimateImpact(files, refactoringType) {
    return {
      filesAffected: files.length,
      linesChanged: files.reduce((sum, f) => sum + (f.content?.split('\n').length || 0), 0),
      risk: files.length > 10 ? 'high' : files.length > 5 ? 'medium' : 'low',
      estimatedTime: files.length * 2 // minutes per file
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
}

// Singleton instance
let multiFileRefactoringInstance = null;

function getMultiFileRefactoring() {
  if (!multiFileRefactoringInstance) {
    multiFileRefactoringInstance = new MultiFileRefactoring();
  }
  return multiFileRefactoringInstance;
}

module.exports = {
  MultiFileRefactoring,
  getMultiFileRefactoring
};
