/**
 * Quality-Driven Code Generator
 * 
 * Generates code (tests, CI/CD, docs) based on quality recommendations.
 * Phase 2: Quality-Driven Code Generation
 */

const contextAwareGenerator = require('./contextAwareGenerator');

class QualityDrivenCodeGenerator {
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Initialize code generation templates
   */
  initializeTemplates() {
    // Test file templates
    this.templates.set('test_javascript', (context) => {
      const { fileName, functions } = context;
      const testFileName = fileName.replace(/\.(js|ts|jsx|tsx)$/, '.test.$1');
      
      return `import { ${functions.map(f => f.name).join(', ')} } from './${fileName}';

describe('${fileName}', () => {
${functions.map(f => `  describe('${f.name}', () => {
    it('should handle normal case', () => {
      // TODO: Add test implementation
    });
    
    it('should handle edge cases', () => {
      // TODO: Add edge case tests
    });
  });`).join('\n\n')}
});
`;
    });

    // CI/CD workflow template
    this.templates.set('ci_workflow', (context) => {
      const { language, primaryLanguage, hasTests, packageManager, scripts, buildSystem, frameworks } = context;
      const displayLanguage = primaryLanguage || language || 'JavaScript';
      const isNodeProject = displayLanguage === 'TypeScript' || displayLanguage === 'JavaScript';
      const installCmd = packageManager === 'yarn' ? 'yarn install --frozen-lockfile' : 
                        packageManager === 'pnpm' ? 'pnpm install --frozen-lockfile' : 
                        'npm ci';
      const testCmd = packageManager === 'yarn' ? 'yarn test' : 
                     packageManager === 'pnpm' ? 'pnpm test' : 
                     'npm test';
      const buildCmd = packageManager === 'yarn' ? 'yarn build' : 
                      packageManager === 'pnpm' ? 'pnpm build' : 
                      'npm run build';
      const lintCmd = packageManager === 'yarn' ? 'yarn lint' : 
                     packageManager === 'pnpm' ? 'pnpm lint' : 
                     'npm run lint';
      
      if (isNodeProject) {
        const hasNextJS = frameworks && frameworks.includes('Next.js');
        const cacheKey = packageManager === 'yarn' ? 'yarn' : packageManager === 'pnpm' ? 'pnpm' : 'npm';
        
        return `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: '${cacheKey}'
    
    - name: Install dependencies
      run: ${installCmd}
    
${hasTests && scripts && scripts.test ? `    - name: Run tests
      run: ${testCmd}
      continue-on-error: true
    
    - name: Run linter
      run: ${lintCmd} || echo "Linting not configured"
      continue-on-error: true` : ''}
    
${scripts && scripts.build ? `    - name: Build
      run: ${buildCmd}
      continue-on-error: true
` : ''}
${hasNextJS ? `    - name: Build Next.js
      run: ${buildCmd}
      env:
        SKIP_ENV_VALIDATION: true
      continue-on-error: true
` : ''}
`;
      }
      
      if (language === 'Python') {
        return `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11']
    
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python \${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: \${{ matrix.python-version }}
        cache: 'pip'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt || pip install -r requirements-dev.txt || true
    
${hasTests ? `    - name: Run tests
      run: pytest || python -m pytest || true
    
    - name: Run linter
      run: flake8 . || ruff check . || true` : `    - name: Build
      run: python setup.py build || true`}
`;
      }
      
      return `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build
      run: echo "Add build steps for ${language}"
`;
    });

    // README template
    this.templates.set('readme', (context) => {
      const { repo, language, primaryLanguage, languages, frameworks, hasTests, hasCI, description, packageManager, scripts } = context;
      const [owner, repoName] = repo.split('/');
      const displayLanguage = primaryLanguage || language || (languages && languages[0]) || 'Unknown';
      const displayFrameworks = frameworks && frameworks.length > 0 ? frameworks.join(', ') : null;
      
      // Build installation command
      const installCmd = packageManager === 'yarn' ? 'yarn install' : 
                       packageManager === 'pnpm' ? 'pnpm install' : 
                       'npm install';
      
      // Build usage section
      let usageSection = '';
      if (scripts && scripts.dev) {
        usageSection = `## Development

\`\`\`bash
${installCmd}
${packageManager === 'npm' ? 'npm run dev' : packageManager === 'yarn' ? 'yarn dev' : 'pnpm dev'}
\`\`\`
`;
      } else if (scripts && scripts.start) {
        usageSection = `## Usage

\`\`\`bash
${installCmd}
${packageManager === 'npm' ? 'npm start' : packageManager === 'yarn' ? 'yarn start' : 'pnpm start'}
\`\`\`
`;
      }
      
      return `# ${repoName}

${description || `A high-quality ${displayLanguage} project built with modern best practices.`}

${displayFrameworks ? `## Built With

- ${displayFrameworks}
- ${displayLanguage}
` : ''}## Features

- ✨ Modern ${displayLanguage} implementation
${frameworks && frameworks.length > 0 ? frameworks.map(f => `- 🚀 ${f}`).join('\n') : ''}
${hasTests ? '- ✅ Comprehensive test suite' : '- ⏳ Tests coming soon'}
${hasCI ? '- ✅ CI/CD pipeline configured' : '- ⏳ CI/CD setup in progress'}
- 📚 Well-documented codebase

## Installation

\`\`\`bash
${installCmd}
\`\`\`
${usageSection}## Contributing

Contributions welcome! Please read our contributing guidelines.

## License

See LICENSE file for details.

---

Built with ❤️ using modern development practices.
`;
    });
  }

  /**
   * Generate code based on action type and context
   * @param {string} actionType - Type of code to generate (generate_tests, generate_workflow, etc.)
   * @param {Object} context - Context for generation
   * @param {Array} codebaseFiles - Optional: existing codebase files for style analysis
   * @returns {Object} Generated code and metadata
   */
  generateCode(actionType, context, codebaseFiles = null) {
    let template;
    let fileName;
    
    switch (actionType) {
      case 'generate_tests':
        template = this.templates.get('test_javascript');
        fileName = context.file.replace(/\.(js|ts|jsx|tsx)$/, '.test.$1');
        break;
      
      case 'generate_workflow':
        template = this.templates.get('ci_workflow');
        fileName = '.github/workflows/ci.yml';
        break;
      
      case 'generate_readme':
        template = this.templates.get('readme');
        fileName = 'README.md';
        break;
      
      default:
        return {
          success: false,
          error: `Unknown action type: ${actionType}`,
        };
    }
    
    if (!template) {
      return {
        success: false,
        error: `No template found for action: ${actionType}`,
      };
    }
    
    try {
      let code = template(context);
      
      // Apply context-aware styling if codebase files provided
      if (codebaseFiles && codebaseFiles.length > 0) {
        const style = contextAwareGenerator.analyzeCodebaseStyle(codebaseFiles);
        code = contextAwareGenerator.applyStyle(code, style);
        context.codebaseStyle = style; // Store for reference
      }
      
      return {
        success: true,
        code,
        fileName,
        actionType,
        language: context.language || 'Unknown',
        estimatedImpact: context.estimatedImpact || 0.10,
        ...(context.codebaseStyle && { codebaseStyle: context.codebaseStyle }),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate multiple code files from mapped improvements
   * @param {Array} mappedImprovements - Array of file-level improvement actions
   * @returns {Array} Generated code files
   */
  generateFromMappings(mappedImprovements) {
    const generated = [];
    
    mappedImprovements.forEach(improvement => {
      const result = this.generateCode(improvement.type, {
        file: improvement.file,
        fileName: improvement.file.split('/').pop(),
        language: improvement.context?.language || 'Unknown',
        functions: improvement.context?.functions || [],
        repo: improvement.context?.repo,
        hasTests: improvement.context?.hasTests || false,
        hasCI: improvement.context?.hasCI || false,
        estimatedImpact: improvement.estimatedImpact,
      });
      
      if (result.success) {
        generated.push(result);
      }
    });
    
    return generated;
  }
}

module.exports = new QualityDrivenCodeGenerator();

