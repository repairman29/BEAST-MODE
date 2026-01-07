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
      const { language, hasTests } = context;
      
      if (language === 'TypeScript' || language === 'JavaScript') {
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
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
${hasTests ? `    - name: Run tests
      run: npm test
    
    - name: Run linter
      run: npm run lint || true` : `    - name: Build
      run: npm run build`}
    
    - name: Check code style
      run: npm run format:check || true
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
      const { repo, language, hasTests, hasCI } = context;
      const [owner, repoName] = repo.split('/');
      
      return `# ${repoName}

${context.description || 'A high-quality project built with modern best practices.'}

## Features

- ✨ Modern ${language} implementation
- ${hasTests ? '✅ Comprehensive test coverage' : '⏳ Tests coming soon'}
- ${hasCI ? '🚀 Automated CI/CD pipeline' : '⏳ CI/CD setup in progress'}
- 📚 Well-documented codebase

## Installation

\`\`\`bash
${language === 'TypeScript' || language === 'JavaScript' ? 'npm install' : language === 'Python' ? 'pip install -r requirements.txt' : 'See installation instructions'}
\`\`\`

## Usage

\`\`\`${language === 'TypeScript' || language === 'JavaScript' ? 'typescript' : language.toLowerCase()}
// Example usage
\`\`\`

## Development

\`\`\`bash
${language === 'TypeScript' || language === 'JavaScript' ? 'npm run dev' : language === 'Python' ? 'python -m venv venv && source venv/bin/activate' : 'See development guide'}
\`\`\`

${hasTests ? `## Testing

\`\`\`bash
npm test
\`\`\`` : ''}

## Contributing

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

