/**
 * Multi-File Editor
 * 
 * Handles editing multiple files simultaneously with dependency tracking
 * and consistency checks.
 */

const codebaseIndexer = require('./codebaseIndexer');

class MultiFileEditor {
  constructor() {
    this.editSessions = new Map(); // sessionId -> { files: [], operations: [] }
    this.dependencyGraph = new Map();
  }

  /**
   * Start a multi-file editing session
   * @param {string} sessionId - Session ID
   * @param {Array} files - Files to edit
   * @param {Object} options - Editing options
   * @returns {Promise<Object>} Session info
   */
  async startSession(sessionId, files, options = {}) {
    const {
      analyzeDependencies = true,
      checkConsistency = true,
    } = options;

    // Analyze dependencies
    let dependencies = [];
    if (analyzeDependencies) {
      dependencies = await this.analyzeDependencies(files);
    }

    // Check for conflicts
    const conflicts = checkConsistency ? await this.checkConflicts(files) : [];

    const session = {
      sessionId,
      files: files.map(f => ({
        path: f.path,
        originalContent: f.content,
        newContent: f.content,
        language: this.detectLanguage(f.path),
        status: 'pending',
      })),
      dependencies,
      conflicts,
      operations: [],
      createdAt: new Date(),
    };

    this.editSessions.set(sessionId, session);

    return {
      sessionId,
      filesCount: files.length,
      dependenciesCount: dependencies.length,
      conflictsCount: conflicts.length,
    };
  }

  /**
   * Analyze dependencies between files
   */
  async analyzeDependencies(files) {
    const dependencies = [];

    for (const file of files) {
      const fileContext = codebaseIndexer.getFileContext(file.path);
      if (fileContext) {
        // Find dependencies within the edit set
        const relatedFiles = [
          ...fileContext.dependencies,
          ...fileContext.dependents,
        ].filter(dep => files.some(f => f.path === dep.path));

        if (relatedFiles.length > 0) {
          dependencies.push({
            file: file.path,
            dependsOn: relatedFiles.map(f => f.path),
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Check for conflicts between file edits
   */
  async checkConflicts(files) {
    const conflicts = [];

    // Check for duplicate exports
    const exports = new Map();
    for (const file of files) {
      const fileExports = this.extractExports(file.content, file.path);
      for (const exp of fileExports) {
        if (exports.has(exp)) {
          conflicts.push({
            type: 'duplicate_export',
            export: exp,
            files: [exports.get(exp), file.path],
            severity: 'high',
          });
        } else {
          exports.set(exp, file.path);
        }
      }
    }

    // Check for circular dependencies
    const circular = this.detectCircularDependencies(files);
    if (circular.length > 0) {
      conflicts.push({
        type: 'circular_dependency',
        files: circular,
        severity: 'high',
      });
    }

    return conflicts;
  }

  /**
   * Extract exports from file
   */
  extractExports(content, filePath) {
    const exports = [];
    const ext = filePath.split('.').pop()?.toLowerCase();

    if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') {
      const patterns = [
        /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g,
        /export\s+\{([^}]+)\}/g,
        /module\.exports\s*=\s*(\w+)/g,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          if (match[1]) {
            exports.push(...match[1].split(',').map(e => e.trim()));
          }
        }
      }
    }

    return exports.filter(Boolean);
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies(files) {
    // Simplified circular dependency detection
    // In production, use proper graph algorithms
    const graph = new Map();

    for (const file of files) {
      const fileContext = codebaseIndexer.getFileContext(file.path);
      if (fileContext) {
        const deps = fileContext.dependencies
          .map(d => d.path)
          .filter(dep => files.some(f => f.path === dep));
        graph.set(file.path, deps);
      }
    }

    // Simple cycle detection (DFS)
    const visited = new Set();
    const recStack = new Set();
    const cycles = [];

    const dfs = (node, path) => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recStack.has(neighbor)) {
          // Cycle detected
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart));
        }
      }

      recStack.delete(node);
    };

    for (const file of files) {
      if (!visited.has(file.path)) {
        dfs(file.path, []);
      }
    }

    return cycles.length > 0 ? cycles[0] : [];
  }

  /**
   * Update file in session
   */
  updateFile(sessionId, filePath, newContent) {
    const session = this.editSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const file = session.files.find(f => f.path === filePath);
    if (!file) {
      throw new Error('File not found in session');
    }

    file.newContent = newContent;
    file.status = 'modified';

    // Record operation
    session.operations.push({
      type: 'update',
      file: filePath,
      timestamp: new Date(),
    });

    // Re-check conflicts
    this.recheckConflicts(session);

    return {
      success: true,
      file: filePath,
      conflicts: session.conflicts,
    };
  }

  /**
   * Re-check conflicts after update
   */
  recheckConflicts(session) {
    const files = session.files.map(f => ({
      path: f.path,
      content: f.newContent,
    }));
    this.checkConflicts(files).then(conflicts => {
      session.conflicts = conflicts;
    });
  }

  /**
   * Apply all changes
   */
  async applyChanges(sessionId, options = {}) {
    const {
      createPR = false,
      autoResolveConflicts = false,
    } = options;

    const session = this.editSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check for conflicts
    if (session.conflicts.length > 0 && !autoResolveConflicts) {
      return {
        success: false,
        error: 'Conflicts must be resolved before applying changes',
        conflicts: session.conflicts,
      };
    }

    // Resolve conflicts if needed
    if (session.conflicts.length > 0 && autoResolveConflicts) {
      await this.resolveConflicts(session);
    }

    // Apply changes
    const results = {
      applied: [],
      failed: [],
    };

    for (const file of session.files) {
      if (file.status === 'modified') {
        try {
          // In production, this would actually write to files or create PRs
          results.applied.push({
            file: file.path,
            changes: this.calculateDiff(file.originalContent, file.newContent),
          });
          file.status = 'applied';
        } catch (error) {
          results.failed.push({
            file: file.path,
            error: error.message,
          });
          file.status = 'failed';
        }
      }
    }

    // Create PR if requested
    if (createPR && results.applied.length > 0) {
      const pr = await this.createPullRequest(session, results.applied);
      return {
        success: true,
        applied: results.applied,
        pr,
      };
    }

    return {
      success: true,
      applied: results.applied,
      failed: results.failed,
    };
  }

  /**
   * Calculate diff between old and new content
   */
  calculateDiff(oldContent, newContent) {
    // Simplified diff calculation
    // In production, use proper diff algorithm
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    return {
      added: newLines.length - oldLines.length,
      removed: oldLines.length - newLines.length,
      modified: oldLines.filter((line, i) => line !== newLines[i]).length,
    };
  }

  /**
   * Resolve conflicts automatically
   */
  async resolveConflicts(session) {
    for (const conflict of session.conflicts) {
      if (conflict.type === 'duplicate_export') {
        // Rename one of the exports
        const file = session.files.find(f => f.path === conflict.files[1]);
        if (file) {
          // Simple renaming - in production, use AST
          file.newContent = file.newContent.replace(
            new RegExp(`export\\s+(?:const|let|var|function|class)\\s+${conflict.export}`, 'g'),
            `export const ${conflict.export}Renamed`
          );
        }
      }
    }

    // Re-check conflicts
    const files = session.files.map(f => ({
      path: f.path,
      content: f.newContent,
    }));
    session.conflicts = await this.checkConflicts(files);
  }

  /**
   * Create pull request
   */
  async createPullRequest(session, appliedChanges) {
    // In production, this would use GitHub API
    return {
      prNumber: Math.floor(Math.random() * 1000),
      url: `https://github.com/${session.repo}/pull/${Math.floor(Math.random() * 1000)}`,
      title: `Multi-file edit: ${appliedChanges.length} files`,
      description: `Applied changes to ${appliedChanges.length} files`,
    };
  }

  /**
   * Detect language from file path
   */
  detectLanguage(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
    };
    return langMap[ext] || 'unknown';
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId) {
    const session = this.editSessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId,
      filesCount: session.files.length,
      modifiedCount: session.files.filter(f => f.status === 'modified').length,
      conflictsCount: session.conflicts.length,
      operationsCount: session.operations.length,
      createdAt: session.createdAt,
    };
  }

  /**
   * Cancel session
   */
  cancelSession(sessionId) {
    this.editSessions.delete(sessionId);
    return { success: true };
  }
}

module.exports = new MultiFileEditor();

