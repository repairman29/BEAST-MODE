/**
 * Codebase Context Builder
 * 
 * Builds comprehensive context for generating full features/applications.
 * Gathers all necessary information for LLM code generation.
 */

const patternAnalyzer = require('./patternAnalyzer');
const { fileQualityScorer } = require('./fileQualityScorer');

class CodebaseContextBuilder {
  constructor() {
    this.contextCache = new Map();
  }

  /**
   * Build comprehensive context for feature/app generation
   * @param {string} repo - Repository name
   * @param {Array} files - Repository files
   * @param {Object} repoContext - Repository context
   * @param {string} featureRequest - User's feature request
   * @returns {Object} Complete context for code generation
   */
  async buildContext(repo, files, repoContext, featureRequest) {
    // 1. File-level analysis
    const fileAnalysis = await fileQualityScorer.scoreRepository(files, repoContext, repo);

    // 2. Pattern analysis
    const patternAnalysis = await patternAnalyzer.analyzePatterns(files, repoContext);

    // 3. Codebase structure
    const structure = this.analyzeStructure(files);

    // 4. Technology stack
    const techStack = this.analyzeTechStack(files, repoContext);

    // 5. Existing patterns and conventions
    const conventions = this.extractConventions(files);

    // 6. Dependencies and integrations
    const dependencies = this.analyzeDependencies(files);

    // 7. API/Interface patterns
    const apiPatterns = this.analyzeAPIPatterns(files);

    // 8. Database schema (if applicable)
    const databaseSchema = this.analyzeDatabaseSchema(files);

    // 9. Build generation prompt
    const generationPrompt = this.buildGenerationPrompt(
      featureRequest,
      fileAnalysis,
      patternAnalysis,
      structure,
      techStack,
      conventions,
      dependencies,
      apiPatterns,
      databaseSchema
    );

    return {
      repo,
      featureRequest,
      fileAnalysis,
      patternAnalysis,
      structure,
      techStack,
      conventions,
      dependencies,
      apiPatterns,
      databaseSchema,
      generationPrompt,
      contextSummary: this.buildContextSummary(
        fileAnalysis,
        patternAnalysis,
        structure,
        techStack
      ),
    };
  }

  /**
   * Analyze codebase structure
   */
  analyzeStructure(files) {
    const structure = {
      directories: new Set(),
      fileTypes: {},
      entryPoints: [],
      mainModules: [],
    };

    files.forEach(file => {
      // Extract directory structure
      const parts = file.path.split('/');
      if (parts.length > 1) {
        structure.directories.add(parts[0]);
      }

      // Count file types
      const ext = file.path.split('.').pop()?.toLowerCase();
      structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;

      // Identify entry points
      if (file.path.includes('index') || file.path.includes('main') || file.path.includes('app')) {
        structure.entryPoints.push(file.path);
      }

      // Identify main modules
      if (file.path.includes('src/') || file.path.includes('lib/') || file.path.includes('components/')) {
        structure.mainModules.push(file.path);
      }
    });

    return {
      directories: Array.from(structure.directories),
      fileTypes: structure.fileTypes,
      entryPoints: structure.entryPoints,
      mainModules: structure.mainModules.slice(0, 10), // Top 10
      depth: this.calculateMaxDepth(files),
    };
  }

  /**
   * Analyze technology stack
   */
  analyzeTechStack(files, repoContext) {
    const stack = {
      languages: {},
      frameworks: [],
      libraries: [],
      tools: [],
      databases: [],
      services: [],
    };

    // Languages
    files.forEach(file => {
      const ext = file.path.split('.').pop()?.toLowerCase();
      const langMap = {
        'js': 'JavaScript',
        'ts': 'TypeScript',
        'jsx': 'React',
        'tsx': 'React + TypeScript',
        'py': 'Python',
        'rs': 'Rust',
        'go': 'Go',
        'java': 'Java',
      };
      if (langMap[ext]) {
        stack.languages[langMap[ext]] = (stack.languages[langMap[ext]] || 0) + 1;
      }
    });

    // Frameworks (from file paths and content)
    const frameworkIndicators = {
      'react': ['react', 'jsx', 'tsx'],
      'next': ['next', 'pages', 'app'],
      'vue': ['vue'],
      'angular': ['angular', 'component.ts'],
      'express': ['express', 'app.js', 'server.js'],
      'fastapi': ['fastapi', 'main.py'],
      'django': ['django', 'settings.py'],
      'flask': ['flask', 'app.py'],
    };

    Object.keys(frameworkIndicators).forEach(framework => {
      if (files.some(f => 
        frameworkIndicators[framework].some(ind => 
          f.path.toLowerCase().includes(ind)
        )
      )) {
        stack.frameworks.push(framework);
      }
    });

    // Libraries (from imports)
    const commonLibraries = new Set();
    files.forEach(file => {
      const imports = file.content.match(/from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]/g) || [];
      imports.forEach(imp => {
        const lib = imp.replace(/from\s+|require\(|['"]/g, '').split('/')[0];
        if (lib && !lib.startsWith('.') && !lib.startsWith('@')) {
          commonLibraries.add(lib);
        }
      });
    });
    stack.libraries = Array.from(commonLibraries).slice(0, 20);

    // Tools (from config files)
    const toolFiles = files.filter(f => 
      f.path.includes('package.json') ||
      f.path.includes('requirements.txt') ||
      f.path.includes('Cargo.toml') ||
      f.path.includes('go.mod')
    );
    stack.tools = toolFiles.map(f => f.path);

    // Databases (from content)
    const dbIndicators = ['postgres', 'mysql', 'mongodb', 'redis', 'sqlite', 'prisma', 'typeorm', 'sequelize'];
    dbIndicators.forEach(db => {
      if (files.some(f => f.content.toLowerCase().includes(db))) {
        stack.databases.push(db);
      }
    });

    // Services (from content)
    const serviceIndicators = ['aws', 'azure', 'gcp', 'vercel', 'supabase', 'stripe', 'twilio'];
    serviceIndicators.forEach(service => {
      if (files.some(f => f.content.toLowerCase().includes(service))) {
        stack.services.push(service);
      }
    });

    return stack;
  }

  /**
   * Extract code conventions
   */
  extractConventions(files) {
    const conventions = {
      naming: {},
      fileStructure: {},
      importStyle: {},
      exportStyle: {},
      codeStyle: {},
    };

    // Analyze naming from function/class names
    const names = [];
    files.forEach(file => {
      const funcMatches = file.content.match(/(?:function|const|let|var|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
      if (funcMatches) {
        funcMatches.forEach(match => {
          const name = match.split(/\s+/).pop();
          names.push(name);
        });
      }
    });

    // Determine naming convention
    const camelCase = names.filter(n => /^[a-z][a-zA-Z0-9]*$/.test(n)).length;
    const PascalCase = names.filter(n => /^[A-Z][a-zA-Z0-9]*$/.test(n)).length;
    const snake_case = names.filter(n => /^[a-z_][a-z0-9_]*$/.test(n)).length;

    conventions.naming = {
      functions: camelCase > PascalCase && camelCase > snake_case ? 'camelCase' : 
                 PascalCase > snake_case ? 'PascalCase' : 'snake_case',
      classes: 'PascalCase', // Usually PascalCase
    };

    // File structure
    conventions.fileStructure = {
      usesBarrelExports: files.some(f => f.path.includes('index') && f.content.includes('export')),
      componentStructure: files.some(f => f.path.includes('components/')) ? 'components/' : 'src/',
    };

    // Import style
    const es6Imports = files.filter(f => /^import\s+/.test(f.content)).length;
    const commonJSImports = files.filter(f => /require\(/.test(f.content)).length;
    conventions.importStyle = {
      style: es6Imports > commonJSImports ? 'es6' : 'commonjs',
    };

    // Export style
    const namedExports = files.filter(f => /export\s+(const|let|var|function|class)/.test(f.content)).length;
    const defaultExports = files.filter(f => /export\s+default/.test(f.content)).length;
    conventions.exportStyle = {
      preferDefault: defaultExports > namedExports,
    };

    return conventions;
  }

  /**
   * Analyze dependencies
   */
  analyzeDependencies(files) {
    const dependencies = {
      internal: [],
      external: [],
      patterns: {},
    };

    files.forEach(file => {
      // Extract imports
      const imports = file.content.match(/(?:import|from|require)\(?['"]([^'"]+)['"]/g) || [];
      imports.forEach(imp => {
        const dep = imp.replace(/import|from|require\(|['"]/g, '').trim();
        if (dep.startsWith('.') || dep.startsWith('@/')) {
          dependencies.internal.push(dep);
        } else if (!dep.includes('node_modules')) {
          dependencies.external.push(dep.split('/')[0]);
        }
      });
    });

    // Count dependency patterns
    dependencies.external.forEach(dep => {
      dependencies.patterns[dep] = (dependencies.patterns[dep] || 0) + 1;
    });

    return {
      internal: [...new Set(dependencies.internal)].slice(0, 20),
      external: [...new Set(dependencies.external)].slice(0, 30),
      topDependencies: Object.entries(dependencies.patterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
    };
  }

  /**
   * Analyze API patterns
   */
  analyzeAPIPatterns(files) {
    const apiFiles = files.filter(f => 
      f.path.includes('api/') || 
      f.path.includes('route') || 
      f.path.includes('endpoint') ||
      f.content.includes('app.get') ||
      f.content.includes('app.post') ||
      f.content.includes('router.')
    );

    const patterns = {
      framework: null,
      routeStructure: [],
      httpMethods: {},
      middleware: [],
      errorHandling: {},
    };

    apiFiles.forEach(file => {
      // Detect framework
      if (file.content.includes('express') || file.content.includes('app.')) {
        patterns.framework = 'express';
      } else if (file.content.includes('fastapi') || file.content.includes('@app.')) {
        patterns.framework = 'fastapi';
      } else if (file.path.includes('route.ts') || file.path.includes('route.js')) {
        patterns.framework = 'nextjs';
      }

      // Extract HTTP methods
      ['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
        const regex = new RegExp(`\\.${method}\\(|@${method}\\(`, 'gi');
        if (regex.test(file.content)) {
          patterns.httpMethods[method] = (patterns.httpMethods[method] || 0) + 1;
        }
      });

      // Extract middleware
      if (file.content.includes('middleware') || file.content.includes('auth') || file.content.includes('cors')) {
        patterns.middleware.push(file.path);
      }
    });

    return patterns;
  }

  /**
   * Analyze database schema
   */
  analyzeDatabaseSchema(files) {
    const schemaFiles = files.filter(f => 
      f.path.includes('schema') ||
      f.path.includes('migration') ||
      f.path.includes('model') ||
      f.path.includes('prisma')
    );

    const schema = {
      orm: null,
      tables: [],
      relationships: [],
    };

    schemaFiles.forEach(file => {
      // Detect ORM
      if (file.content.includes('prisma')) {
        schema.orm = 'prisma';
      } else if (file.content.includes('typeorm') || file.content.includes('Entity')) {
        schema.orm = 'typeorm';
      } else if (file.content.includes('sequelize')) {
        schema.orm = 'sequelize';
      } else if (file.content.includes('sqlalchemy')) {
        schema.orm = 'sqlalchemy';
      }

      // Extract table/model names
      const tableMatches = file.content.match(/(?:model|table|class)\s+(\w+)/gi) || [];
      tableMatches.forEach(match => {
        const name = match.split(/\s+/).pop();
        if (name) schema.tables.push(name);
      });

      // Extract relationships
      if (file.content.includes('hasMany') || file.content.includes('belongsTo') || file.content.includes('@relation')) {
        schema.relationships.push(file.path);
      }
    });

    return schema;
  }

  /**
   * Build generation prompt for LLM
   */
  buildGenerationPrompt(
    featureRequest,
    fileAnalysis,
    patternAnalysis,
    structure,
    techStack,
    conventions,
    dependencies,
    apiPatterns,
    databaseSchema
  ) {
    const primaryLanguage = Object.keys(techStack.languages).sort((a, b) => 
      techStack.languages[b] - techStack.languages[a]
    )[0] || 'JavaScript';

    const prompt = `You are an expert ${primaryLanguage} developer tasked with implementing a new feature for this codebase.

## Feature Request
${featureRequest}

## Codebase Context

### Technology Stack
- Primary Language: ${primaryLanguage}
- Frameworks: ${techStack.frameworks.join(', ') || 'None detected'}
- Key Libraries: ${techStack.libraries.slice(0, 10).join(', ')}
- Databases: ${techStack.databases.join(', ') || 'None'}
- Services: ${techStack.services.join(', ') || 'None'}

### Codebase Structure
- Main Directories: ${structure.directories.slice(0, 5).join(', ')}
- Entry Points: ${structure.entryPoints.slice(0, 3).join(', ')}
- File Types: ${Object.keys(structure.fileTypes).slice(0, 5).join(', ')}

### Code Conventions
- Naming: Functions use ${conventions.naming.functions}, Classes use ${conventions.naming.classes}
- Import Style: ${conventions.importStyle.style}
- Export Style: ${conventions.exportStyle.preferDefault ? 'Default exports preferred' : 'Named exports preferred'}

### API Patterns (if applicable)
- Framework: ${apiPatterns.framework || 'Not detected'}
- HTTP Methods Used: ${Object.keys(apiPatterns.httpMethods).join(', ') || 'None'}

### Database Schema (if applicable)
- ORM: ${databaseSchema.orm || 'Not detected'}
- Tables: ${databaseSchema.tables.slice(0, 10).join(', ') || 'None'}

### Current Quality Issues
${patternAnalysis.themes.slice(0, 3).map(t => `- ${t.name}: ${t.description}`).join('\n')}

### Opportunities
${patternAnalysis.opportunities.slice(0, 3).map(o => `- ${o.title}: ${o.description}`).join('\n')}

## Requirements

1. **Follow Existing Patterns**: Match the codebase's existing patterns, conventions, and architecture
2. **Maintain Quality**: Ensure generated code meets quality standards (tests, documentation, error handling)
3. **Integration**: Integrate seamlessly with existing codebase structure
4. **Consistency**: Use the same naming conventions, import styles, and code organization

## Output Format

Generate:
1. Complete implementation files
2. Test files (if testing framework exists)
3. Documentation (JSDoc/docstrings)
4. Integration points with existing code
5. Migration/update instructions if needed

## Code Style

- Use ${conventions.naming.functions} for functions
- Use ${conventions.importStyle.style} imports
- Follow existing file structure (${structure.directories[0] || 'src'}/)
- Match indentation and formatting style
- Include error handling patterns used in codebase
- Add type annotations if TypeScript is used

Begin implementation:`;

    return prompt;
  }

  /**
   * Build context summary
   */
  buildContextSummary(fileAnalysis, patternAnalysis, structure, techStack) {
    return {
      qualityScore: fileAnalysis.averageScore,
      fileCount: fileAnalysis.fileCount,
      primaryLanguage: Object.keys(techStack.languages).sort((a, b) => 
        techStack.languages[b] - techStack.languages[a]
      )[0] || 'Unknown',
      frameworks: techStack.frameworks,
      themes: patternAnalysis.themes.length,
      opportunities: patternAnalysis.opportunities.length,
      architecture: patternAnalysis.patterns.architectural.map(p => p.name).join(', ') || 'Not detected',
    };
  }

  /**
   * Calculate max directory depth
   */
  calculateMaxDepth(files) {
    let maxDepth = 0;
    files.forEach(file => {
      const depth = file.path.split('/').length;
      if (depth > maxDepth) maxDepth = depth;
    });
    return maxDepth;
  }
}

module.exports = new CodebaseContextBuilder();

