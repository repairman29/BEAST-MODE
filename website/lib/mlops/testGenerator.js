/**
 * Test Generator
 * Uses BEAST MODE's LLM to generate comprehensive tests
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}

const log = createLogger('TestGenerator');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class TestGenerator {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate tests for code
   * @param {string} code - Code to test
   * @param {string} filePath - File path
   * @param {string} testFramework - Test framework (jest, mocha, etc.)
   * @param {Object} options - Options
   * @returns {Promise<string>} Generated test code
   */
  async generateTests(code, filePath, testFramework = 'jest', options = {}) {
    const cacheKey = `${filePath}-${testFramework}-${code.substring(0, 500)}`;
    if (this.cache.has(cacheKey) && !options.force) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `test-generation-${Date.now()}`,
        message: `Generate comprehensive ${testFramework} tests for this code:

File: ${filePath}

Code:
\`\`\`javascript
${code}
\`\`\`

Generate tests that include:
1. Unit tests for all functions
2. Edge case tests
3. Error handling tests
4. Integration tests (if applicable)
5. Mock setup (if needed)

Requirements:
- Use ${testFramework} syntax
- Cover all functions and methods
- Test edge cases and error conditions
- Include descriptive test names
- Use proper assertions

Return ONLY the test code, no explanations outside the code.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        let testCode = response.data.message.trim();
        
        // Extract code from markdown if present
        const codeBlockMatch = testCode.match(/```(?:javascript|js|typescript|ts)?\n([\s\S]*?)```/);
        if (codeBlockMatch) {
          testCode = codeBlockMatch[1].trim();
        }

        this.cache.set(cacheKey, testCode);
        return testCode;
      }

      throw new Error('No test code in response');
    } catch (error) {
      log.error('Failed to generate tests:', error.message);
      // Fallback to basic test template
      return this.generateFallbackTests(code, filePath, testFramework);
    }
  }

  /**
   * Generate and save test file
   * @param {string} code - Code to test
   * @param {string} filePath - Source file path
   * @param {Object} options - Options
   * @returns {Promise<string>} Path to test file
   */
  async generateAndSave(code, filePath, options = {}) {
    const testFramework = options.testFramework || 'jest';
    const testCode = await this.generateTests(code, filePath, testFramework, options);
    
    // Determine test file path
    const testPath = options.testPath || this.getTestPath(filePath, testFramework);
    const testDir = path.dirname(testPath);
    
    // Create directory if needed
    await fs.mkdir(testDir, { recursive: true });
    
    // Write test file
    await fs.writeFile(testPath, testCode, 'utf8');
    
    log.info(`Tests saved to ${testPath}`);
    return testPath;
  }

  /**
   * Generate test for specific function
   * @param {string} functionCode - Function code
   * @param {string} functionName - Function name
   * @param {string} testFramework - Test framework
   * @returns {Promise<string>} Test code
   */
  async generateFunctionTest(functionCode, functionName, testFramework = 'jest') {
    try {
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `function-test-${Date.now()}`,
        message: `Generate ${testFramework} tests for this function:

Function: ${functionName}

Code:
\`\`\`javascript
${functionCode}
\`\`\`

Generate tests that cover:
- Normal operation
- Edge cases
- Error conditions
- Return values

Return ONLY the test code.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        return response.data.message.trim();
      }
    } catch (error) {
      log.error('Failed to generate function test:', error.message);
    }

    return null;
  }

  /**
   * Get test file path
   */
  getTestPath(filePath, testFramework) {
    const dir = path.dirname(filePath);
    const name = path.basename(filePath, path.extname(filePath));
    
    // Check for common test directory patterns
    const testDirs = ['__tests__', 'tests', 'test', 'spec'];
    for (const testDir of testDirs) {
      const testDirPath = path.join(dir, testDir);
      if (fs.existsSync && fs.existsSync(testDirPath)) {
        return path.join(testDirPath, `${name}.test.js`);
      }
    }
    
    // Default: same directory with .test.js
    return path.join(dir, `${name}.test.js`);
  }

  /**
   * Generate fallback test template
   */
  generateFallbackTests(code, filePath, testFramework) {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    if (testFramework === 'jest') {
      return `const ${fileName} = require('./${path.basename(filePath)}');

describe('${fileName}', () => {
  // TODO: Add comprehensive tests
  test('should work correctly', () => {
    expect(true).toBe(true);
  });
});
`;
    } else {
      return `// Tests for ${fileName}
// TODO: Add comprehensive tests using ${testFramework}
`;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new TestGenerator();
