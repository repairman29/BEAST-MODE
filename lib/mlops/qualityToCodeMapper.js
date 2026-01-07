/**
 * Quality-to-Code Mapper
 * 
 * Maps repository-level quality insights to specific code-level improvements.
 * Bridges the gap between "repo needs tests" and "add tests to src/utils/helpers.ts"
 */

class QualityToCodeMapper {
  constructor() {
    this.mappingRules = new Map();
    this.initializeMappingRules();
  }

  /**
   * Initialize mapping rules for quality recommendations → code actions
   */
  initializeMappingRules() {
    // Test coverage mappings
    this.mappingRules.set('add_tests', {
      filePatterns: [/\.(js|ts|jsx|tsx|py)$/],
      excludePatterns: [/\.(test|spec)\./, /test_/, /_test\./],
      action: 'generate_tests',
      priority: 'high',
    });

    // Documentation mappings
    this.mappingRules.set('add_documentation', {
      filePatterns: [/\.(js|ts|jsx|tsx|py|rs|go|java)$/],
      excludePatterns: [],
      action: 'generate_docs',
      priority: 'medium',
    });

    // Type safety mappings
    this.mappingRules.set('add_type_safety', {
      filePatterns: [/\.(ts|tsx)$/],
      excludePatterns: [/\.d\.ts$/],
      action: 'add_types',
      priority: 'medium',
    });

    // CI/CD mappings
    this.mappingRules.set('add_ci_cd', {
      filePatterns: [/^\.github\/workflows\/.*\.yml$/, /^\.github\/workflows\/.*\.yaml$/],
      excludePatterns: [],
      action: 'generate_workflow',
      priority: 'high',
    });

    // README mappings
    this.mappingRules.set('add_readme', {
      filePatterns: [/^README\.(md|txt)$/i],
      excludePatterns: [],
      action: 'generate_readme',
      priority: 'high',
    });
  }

  /**
   * Map quality recommendation to specific file actions
   * @param {Object} recommendation - Quality recommendation
   * @param {Array} files - Array of file objects with path and content
   * @param {Object} repoContext - Repository context
   * @returns {Array} Mapped file actions
   */
  mapRecommendationToFiles(recommendation, files, repoContext) {
    const actions = [];
    const recType = this.identifyRecommendationType(recommendation);
    
    if (!recType) {
      return actions;
    }

    const rule = this.mappingRules.get(recType);
    if (!rule) {
      return actions;
    }

    // Filter files based on patterns
    const candidateFiles = files.filter(file => {
      // Check include patterns
      const matchesPattern = rule.filePatterns.some(pattern => pattern.test(file.path));
      if (!matchesPattern) return false;

      // Check exclude patterns
      const matchesExclude = rule.excludePatterns.some(pattern => pattern.test(file.path));
      if (matchesExclude) return false;

      return true;
    });

    // Apply specific mapping logic based on recommendation type
    switch (recType) {
      case 'add_tests':
        return this.mapTestsRecommendation(recommendation, candidateFiles, repoContext);
      
      case 'add_documentation':
        return this.mapDocumentationRecommendation(recommendation, candidateFiles, repoContext);
      
      case 'add_type_safety':
        return this.mapTypeSafetyRecommendation(recommendation, candidateFiles, repoContext);
      
      case 'add_ci_cd':
        return this.mapCICDRecommendation(recommendation, repoContext);
      
      case 'add_readme':
        return this.mapReadmeRecommendation(recommendation, repoContext);
      
      default:
        return actions;
    }
  }

  /**
   * Identify recommendation type from action text
   */
  identifyRecommendationType(recommendation) {
    const action = recommendation.action?.toLowerCase() || '';
    
    if (action.includes('test') || action.includes('coverage')) {
      return 'add_tests';
    }
    if (action.includes('documentation') || action.includes('readme') || action.includes('docs')) {
      return 'add_documentation';
    }
    if (action.includes('type safety') || action.includes('type checking') || action.includes('linting')) {
      return 'add_type_safety';
    }
    if (action.includes('ci/cd') || action.includes('ci') || action.includes('pipeline')) {
      return 'add_ci_cd';
    }
    if (action.includes('readme')) {
      return 'add_readme';
    }
    
    return null;
  }

  /**
   * Map "Add Tests" recommendation to specific files
   */
  mapTestsRecommendation(recommendation, files, repoContext) {
    const actions = [];
    
    // Find files without tests
    const filesWithoutTests = files.filter(file => {
      // Check if test file exists
      const testFile = this.findTestFile(file.path, files);
      return !testFile;
    });

    // Prioritize by importance (main files, not test files themselves)
    const importantFiles = filesWithoutTests
      .filter(f => !f.path.includes('test') && !f.path.includes('spec'))
      .slice(0, 10); // Top 10 files

    importantFiles.forEach(file => {
      actions.push({
        type: 'generate_tests',
        file: file.path,
        recommendation: recommendation.action,
        priority: recommendation.priority || 'high',
        estimatedImpact: recommendation.estimatedGain || 0.15,
        context: {
          language: this.detectLanguage(file.path, file.content),
          functions: this.extractFunctions(file.content, file.path),
        },
      });
    });

    return actions;
  }

  /**
   * Map "Add Documentation" recommendation to specific files
   */
  mapDocumentationRecommendation(recommendation, files, repoContext) {
    const actions = [];
    
    // Find files without documentation
    const filesWithoutDocs = files.filter(file => {
      return !this.hasDocumentation(file.content);
    }).slice(0, 20); // Top 20 files

    filesWithoutDocs.forEach(file => {
      actions.push({
        type: 'generate_docs',
        file: file.path,
        recommendation: recommendation.action,
        priority: recommendation.priority || 'medium',
        estimatedImpact: recommendation.estimatedGain || 0.10,
        context: {
          language: this.detectLanguage(file.path, file.content),
          exports: this.extractExports(file.content, file.path),
          functions: this.extractFunctions(file.content, file.path),
        },
      });
    });

    return actions;
  }

  /**
   * Map "Add Type Safety" recommendation to TypeScript files
   */
  mapTypeSafetyRecommendation(recommendation, files, repoContext) {
    const actions = [];
    
    // Find TypeScript files without types
    const tsFiles = files.filter(file => {
      return /\.(ts|tsx)$/.test(file.path) && 
             !/\.d\.ts$/.test(file.path) &&
             !this.hasTypeAnnotations(file.content);
    }).slice(0, 10);

    tsFiles.forEach(file => {
      actions.push({
        type: 'add_types',
        file: file.path,
        recommendation: recommendation.action,
        priority: recommendation.priority || 'medium',
        estimatedImpact: recommendation.estimatedGain || 0.10,
        context: {
          functions: this.extractFunctions(file.content, file.path),
          variables: this.extractVariables(file.content),
        },
      });
    });

    return actions;
  }

  /**
   * Map "Add CI/CD" recommendation to workflow file generation
   */
  mapCICDRecommendation(recommendation, repoContext) {
    return [{
      type: 'generate_workflow',
      file: '.github/workflows/ci.yml',
      recommendation: recommendation.action,
      priority: recommendation.priority || 'high',
      estimatedImpact: recommendation.estimatedGain || 0.12,
      context: {
        language: repoContext.language || 'JavaScript',
        hasTests: repoContext.hasTests || false,
      },
    }];
  }

  /**
   * Map "Add README" recommendation to README generation
   */
  mapReadmeRecommendation(recommendation, repoContext) {
    return [{
      type: 'generate_readme',
      file: 'README.md',
      recommendation: recommendation.action,
      priority: recommendation.priority || 'high',
      estimatedImpact: recommendation.estimatedGain || 0.08,
      context: {
        repo: repoContext.repo,
        language: repoContext.language || 'Unknown',
        hasTests: repoContext.hasTests || false,
        hasCI: repoContext.hasCI || false,
      },
    }];
  }

  /**
   * Helper: Find test file for a given source file
   */
  findTestFile(filePath, allFiles) {
    const baseName = filePath.replace(/\.(js|ts|jsx|tsx|py)$/, '');
    const testPatterns = [
      `${baseName}.test.js`,
      `${baseName}.test.ts`,
      `${baseName}.spec.js`,
      `${baseName}.spec.ts`,
      `${baseName}_test.py`,
      `test_${baseName.split('/').pop()}.py`,
    ];

    return allFiles.find(f => testPatterns.some(pattern => f.path.includes(pattern)));
  }

  /**
   * Helper: Detect language from file path and content
   */
  detectLanguage(filePath, content) {
    const ext = filePath.split('.').pop()?.toLowerCase();
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
    return langMap[ext] || 'Unknown';
  }

  /**
   * Helper: Check if file has documentation
   */
  hasDocumentation(content) {
    return /\/\*\*[\s\S]*?\*\//.test(content) || // JSDoc
           /""".*?"""/s.test(content) || // Python docstring
           /'''.*?'''/s.test(content); // Python docstring
  }

  /**
   * Helper: Check if TypeScript file has type annotations
   */
  hasTypeAnnotations(content) {
    return /:\s*\w+/.test(content) || // Type annotations
           /interface\s+\w+/.test(content) || // Interfaces
           /type\s+\w+/.test(content); // Type aliases
  }

  /**
   * Helper: Extract functions from code
   */
  extractFunctions(content, filePath) {
    const functions = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // JavaScript/TypeScript functions
      const funcMatch = line.match(/(?:function|const|let|var|export\s+(?:default\s+)?(?:function|const|let|var))\s+(\w+)\s*[=(]/);
      if (funcMatch) {
        functions.push({
          name: funcMatch[1],
          line: index + 1,
          type: 'function',
        });
      }
      
      // Python functions
      const pyMatch = line.match(/def\s+(\w+)\s*\(/);
      if (pyMatch) {
        functions.push({
          name: pyMatch[1],
          line: index + 1,
          type: 'function',
        });
      }
    });
    
    return functions;
  }

  /**
   * Helper: Extract exports from code
   */
  extractExports(content, filePath) {
    const exports = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('export')) {
        exports.push({
          line: index + 1,
          content: line.trim(),
        });
      }
    });
    
    return exports;
  }

  /**
   * Helper: Extract variables (for type annotation)
   */
  extractVariables(content) {
    const variables = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const varMatch = line.match(/(?:const|let|var)\s+(\w+)/);
      if (varMatch && !line.includes(':')) { // No type annotation
        variables.push({
          name: varMatch[1],
          line: index + 1,
        });
      }
    });
    
    return variables;
  }
}

module.exports = new QualityToCodeMapper();

