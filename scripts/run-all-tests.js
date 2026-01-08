#!/usr/bin/env node

/**
 * Run All Tests
 * 
 * Orchestrates running all test suites:
 * - E2E tests
 * - API tests
 * - Integration tests
 * - Performance tests
 * 
 * Usage:
 *   node scripts/run-all-tests.js [--base-url=http://localhost:3000]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const baseUrlArg = args.find(arg => arg.startsWith('--base-url='));
const baseUrl = baseUrlArg ? baseUrlArg.split('=')[1] : 'http://localhost:3000';

const testSuites = [
  {
    name: 'E2E Test Suite',
    script: 'scripts/e2e-test-suite.js',
    args: [`--base-url=${baseUrl}`]
  },
  {
    name: 'Custom Model Integration Tests',
    script: 'scripts/test-custom-model-integration.js',
    args: []
  },
  {
    name: 'Response Time Tests',
    script: 'scripts/response-time-tracker.js',
    args: ['--endpoint=/api/health', '--duration=10']
  }
];

const results = {
  suites: [],
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now()
};

async function runTestSuite(suite) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running: ${suite.name}`);
    console.log(`   Command: node ${suite.script} ${suite.args.join(' ')}\n`);

    const testProcess = spawn('node', [suite.script, ...suite.args], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });

    testProcess.on('close', (code) => {
      const passed = code === 0;
      results.suites.push({
        name: suite.name,
        passed,
        exitCode: code
      });
      results.total++;
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
      resolve();
    });

    testProcess.on('error', (error) => {
      console.error(`❌ Error running ${suite.name}:`, error.message);
      results.suites.push({
        name: suite.name,
        passed: false,
        error: error.message
      });
      results.total++;
      results.failed++;
      resolve();
    });
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🧪 Running All Test Suites                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n📍 Base URL: ${baseUrl}`);
  console.log(`📦 Test Suites: ${testSuites.length}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);

  for (const suite of testSuites) {
    await runTestSuite(suite);
  }

  const duration = Date.now() - results.startTime;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     📊 All Tests Summary                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n📦 Test Suites: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`📊 Success Rate: ${results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0}%`);

  if (results.failed > 0) {
    console.log(`\n❌ Failed Suites:`);
    results.suites
      .filter(s => !s.passed)
      .forEach(s => {
        console.log(`   - ${s.name}${s.error ? `: ${s.error}` : ''}`);
      });
  }

  // Save results
  const outputDir = path.join(__dirname, '../test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, `all-tests-results-${Date.now()}.json`);
  fs.writeFileSync(outputFile, JSON.stringify({
    ...results,
    duration,
    timestamp: new Date().toISOString()
  }, null, 2));
  console.log(`\n💾 Results saved to: ${outputFile}`);

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
