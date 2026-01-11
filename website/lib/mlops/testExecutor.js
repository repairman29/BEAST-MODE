/**
 * Test Executor
 * 
 * Executes generated tests and reports results.
 * Completes the automated testing system.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestExecutor {
  constructor() {
    this.testResults = new Map(); // testFilePath -> results
    this.executionHistory = new Map(); // testFilePath -> [executions]
  }

  /**
   * Execute tests
   * @param {string} testFilePath - Path to test file
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Test results
   */
  async executeTests(testFilePath, options = {}) {
    const {
      framework = 'auto',
      timeout = 30000, // 30 seconds
    } = options;

    try {
      // Detect framework if auto
      const detectedFramework = framework === 'auto' 
        ? this.detectFramework(testFilePath)
        : framework;

      // Execute based on framework
      const result = await this.executeWithFramework(
        testFilePath,
        detectedFramework,
        timeout
      );

      // Store results
      this.testResults.set(testFilePath, result);
      
      // Add to history
      if (!this.executionHistory.has(testFilePath)) {
        this.executionHistory.set(testFilePath, []);
      }
      this.executionHistory.get(testFilePath).push({
        ...result,
        timestamp: new Date(),
      });

      return {
        success: true,
        framework: detectedFramework,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Detect test framework from file
   */
  detectFramework(testFilePath) {
    const ext = path.extname(testFilePath);
    const content = fs.existsSync(testFilePath) 
      ? fs.readFileSync(testFilePath, 'utf8')
      : '';

    // Check content for framework indicators
    if (content.includes('jest') || content.includes('describe') && content.includes('it(')) {
      return 'jest';
    }
    if (content.includes('mocha') || content.includes('describe') && content.includes('it(')) {
      return 'mocha';
    }
    if (content.includes('pytest') || content.includes('def test_')) {
      return 'pytest';
    }
    if (content.includes('vitest')) {
      return 'vitest';
    }

    // Default by extension
    if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
      return 'jest'; // Default for JS/TS
    } else if (ext === '.py') {
      return 'pytest';
    }

    return 'jest';
  }

  /**
   * Execute tests with specific framework
   */
  async executeWithFramework(testFilePath, framework, timeout) {
    return new Promise((resolve, reject) => {
      const testDir = path.dirname(testFilePath);
      const testFile = path.basename(testFilePath);

      let command;
      let args;

      switch (framework) {
        case 'jest':
          command = 'npx';
          args = ['jest', testFile, '--json', '--no-coverage'];
          break;
        case 'mocha':
          command = 'npx';
          args = ['mocha', testFile, '--reporter', 'json'];
          break;
        case 'pytest':
          command = 'pytest';
          args = [testFile, '--json-report', '--json-report-file', '-'];
          break;
        case 'vitest':
          command = 'npx';
          args = ['vitest', 'run', testFile, '--reporter=json'];
          break;
        default:
          reject(new Error(`Unsupported framework: ${framework}`));
          return;
      }

      const startTime = Date.now();
      const process = spawn(command, args, {
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutId = setTimeout(() => {
        process.kill();
        reject(new Error(`Test execution timeout after ${timeout}ms`));
      }, timeout);

      process.on('close', (code) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        try {
          // Parse results based on framework
          const results = this.parseResults(framework, stdout, stderr, code);

          resolve({
            passed: results.passed,
            failed: results.failed,
            total: results.total,
            duration,
            code,
            output: stdout,
            errors: results.errors,
            tests: results.tests,
          });
        } catch (error) {
          reject(new Error(`Failed to parse test results: ${error.message}`));
        }
      });

      process.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to start test process: ${error.message}`));
      });
    });
  }

  /**
   * Parse test results from framework output
   */
  parseResults(framework, stdout, stderr, exitCode) {
    switch (framework) {
      case 'jest':
        return this.parseJestResults(stdout, stderr, exitCode);
      case 'mocha':
        return this.parseMochaResults(stdout, stderr, exitCode);
      case 'pytest':
        return this.parsePytestResults(stdout, stderr, exitCode);
      case 'vitest':
        return this.parseVitestResults(stdout, stderr, exitCode);
      default:
        return {
          passed: 0,
          failed: exitCode === 0 ? 0 : 1,
          total: 1,
          errors: [stderr || 'Unknown error'],
          tests: [],
        };
    }
  }

  /**
   * Parse Jest results
   */
  parseJestResults(stdout, stderr, exitCode) {
    try {
      const json = JSON.parse(stdout);
      return {
        passed: json.numPassedTests || 0,
        failed: json.numFailedTests || 0,
        total: json.numTotalTests || 0,
        errors: json.testResults?.flatMap((r) => r.message || []) || [],
        tests: json.testResults?.flatMap((r) => 
          r.assertionResults?.map((a) => ({
            name: a.title,
            status: a.status,
            duration: a.duration,
          })) || []
        ) || [],
      };
    } catch (error) {
      // Fallback parsing
      const passed = (stdout.match(/PASS/g) || []).length;
      const failed = (stdout.match(/FAIL/g) || []).length;
      return {
        passed,
        failed,
        total: passed + failed,
        errors: stderr ? [stderr] : [],
        tests: [],
      };
    }
  }

  /**
   * Parse Mocha results
   */
  parseMochaResults(stdout, stderr, exitCode) {
    try {
      const json = JSON.parse(stdout);
      return {
        passed: json.stats?.passes || 0,
        failed: json.stats?.failures || 0,
        total: json.stats?.tests || 0,
        errors: json.failures?.map((f: any) => f.err?.message || '') || [],
        tests: json.tests?.map((t: any) => ({
          name: t.title,
          status: t.state,
          duration: t.duration,
        })) || [],
      };
    } catch (error) {
      return {
        passed: exitCode === 0 ? 1 : 0,
        failed: exitCode === 0 ? 0 : 1,
        total: 1,
        errors: stderr ? [stderr] : [],
        tests: [],
      };
    }
  }

  /**
   * Parse Pytest results
   */
  parsePytestResults(stdout, stderr, exitCode) {
    // Pytest JSON output parsing
    const passed = (stdout.match(/PASSED/g) || []).length;
    const failed = (stdout.match(/FAILED/g) || []).length;
    const errors = (stdout.match(/ERROR/g) || []).length;

    return {
      passed,
      failed: failed + errors,
      total: passed + failed + errors,
      errors: stderr ? [stderr] : [],
      tests: [],
    };
  }

  /**
   * Parse Vitest results
   */
  parseVitestResults(stdout, stderr, exitCode) {
    try {
      const json = JSON.parse(stdout);
      return {
        passed: json.numPassedTests || 0,
        failed: json.numFailedTests || 0,
        total: json.numTotalTests || 0,
        errors: json.testResults?.flatMap((r) => r.errors || []) || [],
        tests: json.testResults?.flatMap((r) => 
          r.tests?.map((t) => ({
            name: t.name,
            status: t.status,
            duration: t.duration,
          })) || []
        ) || [],
      };
    } catch (error) {
      return {
        passed: exitCode === 0 ? 1 : 0,
        failed: exitCode === 0 ? 0 : 1,
        total: 1,
        errors: stderr ? [stderr] : [],
        tests: [],
      };
    }
  }

  /**
   * Get test execution history
   */
  getHistory(testFilePath) {
    return this.executionHistory.get(testFilePath) || [];
  }

  /**
   * Get latest test results
   */
  getLatestResults(testFilePath) {
    return this.testResults.get(testFilePath) || null;
  }

  /**
   * Get test statistics
   */
  getStats(testFilePath) {
    const history = this.getHistory(testFilePath);
    if (history.length === 0) {
      return null;
    }

    const totalRuns = history.length;
    const passedRuns = history.filter(r => r.passed > 0 && r.failed === 0).length;
    const avgDuration = history.reduce((sum, r) => sum + r.duration, 0) / totalRuns;
    const avgPassed = history.reduce((sum, r) => sum + r.passed, 0) / totalRuns;
    const avgFailed = history.reduce((sum, r) => sum + r.failed, 0) / totalRuns;

    return {
      totalRuns,
      passedRuns,
      failedRuns: totalRuns - passedRuns,
      successRate: (passedRuns / totalRuns) * 100,
      avgDuration,
      avgPassed,
      avgFailed,
    };
  }
}

module.exports = new TestExecutor();

