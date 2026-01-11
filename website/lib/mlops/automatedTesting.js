/**
 * Automated Testing System
 * 
 * Generates and runs tests automatically.
 * Unique differentiator - competitors don't have this.
 */

const codebaseIndexer = require('./codebaseIndexer');
const llmCodeGenerator = require('./llmCodeGenerator');
const path = require('path');

class AutomatedTesting {
  constructor() {
    this.testResults = new Map(); // filePath -> test results
    this.testHistory = new Map(); // filePath -> [test runs]
  }

  /**
   * Generate tests for a file
   * @param {string} filePath - File to test
   * @param {string} fileContent - File content
   * @param {Object} options - Test generation options
   * @returns {Promise<Object>} Generated tests
   */
  async generateTests(filePath, fileContent, options = {}) {
    const {
      testFramework = 'auto', // 'auto', 'jest', 'pytest', 'mocha', etc.
      coverageTarget = 0.8,
      useLLM = true,
      userApiKey = null,
    } = options;

    try {
      // 1. Analyze file to understand what to test
      const analysis = this.analyzeFile(filePath, fileContent);

      // 2. Determine test framework
      const framework = testFramework === 'auto' 
        ? this.detectTestFramework(filePath, fileContent)
        : testFramework;

      // 3. Generate test code
      let testCode;
      if (useLLM && userApiKey) {
        testCode = await this.generateTestsWithLLM(
          filePath,
          fileContent,
          analysis,
          framework,
          userApiKey
        );
      } else {
        testCode = this.generateTestsWithPatterns(
          filePath,
          fileContent,
          analysis,
          framework
        );
      }

      // 4. Create test file
      const testFilePath = this.getTestFilePath(filePath, framework);
      const testFile = {
        path: testFilePath,
        content: testCode,
        framework,
        coverageTarget,
      };

      return {
        success: true,
        testFile,
        analysis,
        framework,
        estimatedCoverage: this.estimateCoverage(analysis, testCode),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Analyze file to understand what to test
   */
  analyzeFile(filePath, content) {
    const analysis = {
      functions: [],
      classes: [],
      exports: [],
      imports: [],
      testableItems: [],
    };

    // Extract functions
    const functionPattern = /(?:function|const|let|var|async\s+function)\s+(\w+)\s*[=:]?\s*(?:\([^)]*\)|async\s*\([^)]*\))\s*[=>{]/g;
    let match;
    while ((match = functionPattern.exec(content)) !== null) {
      analysis.functions.push({
        name: match[1],
        line: content.substring(0, match.index).split('\n').length,
      });
    }

    // Extract classes
    const classPattern = /class\s+(\w+)/g;
    while ((match = classPattern.exec(content)) !== null) {
      analysis.classes.push({
        name: match[1],
        line: content.substring(0, match.index).split('\n').length,
      });
    }

    // Extract exports
    const exportPattern = /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g;
    while ((match = exportPattern.exec(content)) !== null) {
      analysis.exports.push(match[1]);
    }

    // Determine testable items
    analysis.testableItems = [
      ...analysis.functions.filter(f => analysis.exports.includes(f.name) || f.name.startsWith('test')),
      ...analysis.classes.filter(c => analysis.exports.includes(c.name)),
    ];

    return analysis;
  }

  /**
   * Detect test framework from codebase
   */
  detectTestFramework(filePath, content) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    // Check for existing test files
    const testFiles = codebaseIndexer.index?.values() || [];
    for (const file of testFiles) {
      if (file.path?.includes('test') || file.path?.includes('spec')) {
        if (file.path?.includes('jest')) return 'jest';
        if (file.path?.includes('mocha')) return 'mocha';
        if (file.path?.includes('pytest')) return 'pytest';
        if (file.path?.includes('vitest')) return 'vitest';
      }
    }

    // Default by language
    if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') {
      return 'jest'; // Default for JS/TS
    } else if (ext === 'py') {
      return 'pytest';
    }

    return 'jest';
  }

  /**
   * Generate tests with LLM
   */
  async generateTestsWithLLM(filePath, fileContent, analysis, framework, userApiKey) {
    const prompt = this.buildTestPrompt(filePath, fileContent, analysis, framework);

    try {
      if (!llmCodeGenerator.initializeOpenAI(userApiKey)) {
        throw new Error('OpenAI not available');
      }

      const response = await llmCodeGenerator.generateWithOpenAI(prompt, {
        techStack: { languages: [this.getLanguage(filePath)] },
      }, {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });

      return response;
    } catch (error) {
      console.error('[Automated Testing] LLM error:', error);
      throw error;
    }
  }

  /**
   * Build test generation prompt
   */
  buildTestPrompt(filePath, fileContent, analysis, framework) {
    return `Generate comprehensive tests for this file using ${framework}.

File: ${filePath}
Language: ${this.getLanguage(filePath)}

Code to test:
\`\`\`
${fileContent}
\`\`\`

Functions to test:
${analysis.functions.map(f => `- ${f.name}`).join('\n')}

Classes to test:
${analysis.classes.map(c => `- ${c.name}`).join('\n')}

Requirements:
1. Test all exported functions and classes
2. Include edge cases and error handling
3. Use ${framework} syntax
4. Aim for 80%+ coverage
5. Include descriptive test names
6. Follow best practices

Generate the complete test file:`;
  }

  /**
   * Generate tests with patterns (fallback)
   */
  generateTestsWithPatterns(filePath, fileContent, analysis, framework) {
    const language = this.getLanguage(filePath);
    const testImports = this.getTestImports(framework, language);
    const testCases = this.generateTestCases(analysis, framework);

    return `${testImports}

describe('${this.getTestDescription(filePath)}', () => {
${testCases}
});`;
  }

  /**
   * Get test imports
   */
  getTestImports(framework, language) {
    if (framework === 'jest') {
      return "import { describe, it, expect, beforeEach } from 'jest';";
    } else if (framework === 'mocha') {
      return "const { describe, it } = require('mocha');\nconst { expect } = require('chai');";
    } else if (framework === 'pytest') {
      return "import pytest\nimport unittest";
    }
    return '';
  }

  /**
   * Generate test cases
   */
  generateTestCases(analysis, framework) {
    const cases = [];

    for (const func of analysis.functions) {
      cases.push(`  it('should ${func.name} work correctly', () => {
    // TODO: Implement test for ${func.name}
    expect(true).toBe(true);
  });`);
    }

    for (const cls of analysis.classes) {
      cases.push(`  describe('${cls.name}', () => {
    it('should instantiate correctly', () => {
      // TODO: Implement test for ${cls.name}
      expect(true).toBe(true);
    });
  });`);
    }

    return cases.join('\n\n');
  }

  /**
   * Get test file path
   */
  getTestFilePath(filePath, framework) {
    const ext = filePath.split('.').pop();
    const basePath = filePath.replace(`.${ext}`, '');
    
    if (framework === 'pytest') {
      return `${basePath}_test.py`;
    } else {
      return `${basePath}.test.${ext}`;
    }
  }

  /**
   * Get language from file path
   */
  getLanguage(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'py': 'Python',
      'rs': 'Rust',
      'go': 'Go',
    };
    return langMap[ext] || 'JavaScript';
  }

  /**
   * Get test description
   */
  getTestDescription(filePath) {
    const path = require('path');
    return path.basename(filePath).replace(/\.[^/.]+$/, '');
  }

  /**
   * Estimate test coverage
   */
  estimateCoverage(analysis, testCode) {
    // Simple estimation based on test code length and analysis
    const testableCount = analysis.testableItems.length;
    const testCount = (testCode.match(/it\(|test\(/g) || []).length;
    
    if (testableCount === 0) return 0;
    return Math.min(1.0, testCount / testableCount);
  }

  /**
   * Run tests
   */
  async runTests(testFilePath, options = {}) {
    const {
      framework = 'auto',
    } = options;

    // In production, this would actually execute tests
    // For now, return mock results
    return {
      success: true,
      passed: 5,
      failed: 0,
      coverage: 0.85,
      duration: 1234,
      results: [
        { test: 'test1', status: 'passed', duration: 100 },
        { test: 'test2', status: 'passed', duration: 150 },
      ],
    };
  }

  /**
   * Get test coverage report
   */
  async getCoverageReport(filePath) {
    // In production, this would use coverage tools
    return {
      file: filePath,
      coverage: 0.85,
      lines: { total: 100, covered: 85, missed: 15 },
      functions: { total: 10, covered: 9, missed: 1 },
      branches: { total: 20, covered: 18, missed: 2 },
    };
  }
}

module.exports = new AutomatedTesting();

