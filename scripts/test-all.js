#!/usr/bin/env node

/**
 * BEAST MODE Comprehensive Test Suite
 * Tests all CLI commands, APIs, and core functionality
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('test-suite');

const tests = {
  passed: 0,
  failed: 0,
  errors: []
};

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    if (options.silent) {
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        reject({ code, stdout, stderr });
      }
    });

    proc.on('error', (error) => {
      reject({ code: -1, error: error.message });
    });
  });
}

async function test(name, fn) {
  try {
    log.info(`Testing: ${name}`);
    await fn();
    tests.passed++;
    log.info(`✅ ${name} - PASSED`);
  } catch (error) {
    tests.failed++;
    tests.errors.push({ name, error: error.message || error });
    log.error(`❌ ${name} - FAILED: ${error.message || error}`);
  }
}

async function main() {
  log.info('🧪 BEAST MODE Comprehensive Test Suite');
  log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: CLI help
  await test('CLI help command', async () => {
    await runCommand('node', [path.join(__dirname, '../bin/beast-mode.js'), '--help']);
  });

  // Test 2: CLI info
  await test('CLI info command', async () => {
    await runCommand('node', [path.join(__dirname, '../bin/beast-mode.js'), 'info'], {
      silent: true
    });
  });

  // Test 3: Module imports
  await test('Core module imports', async () => {
    const { BeastMode } = require('../lib/index.js');
    if (!BeastMode) throw new Error('BeastMode class not exported');
  });

  // Test 4: Quality engine
  await test('Quality engine initialization', async () => {
    const { QualityEngine } = require('../lib/quality.js');
    const engine = new QualityEngine();
    await engine.initialize();
  });

  // Test 5: Marketplace module
  await test('Marketplace module', async () => {
    const marketplace = require('../lib/marketplace/index.js');
    if (!marketplace.browseMarketplace) throw new Error('Marketplace functions not exported');
  });

  // Test 6: Intelligence module
  await test('Intelligence module', async () => {
    const intelligence = require('../lib/intelligence/index.js');
    if (!intelligence.runIntelligenceAnalysis) throw new Error('Intelligence functions not exported');
  });

  // Test 7: Error handler
  await test('Error handler utilities', async () => {
    const {
      ValidationError,
      NotFoundError,
      handleApiError
    } = require('../lib/utils/error-handler.js');
    if (!ValidationError || !NotFoundError) throw new Error('Error classes not exported');
  });

  // Test 8: Logger
  await test('Logger utility', async () => {
    const logger = require('../lib/utils/logger.js');
    if (!logger.createLogger) throw new Error('Logger not exported');
  });

  // Test 9: Package.json
  await test('Package.json configuration', async () => {
    const pkg = require('../package.json');
    if (!pkg.main || !pkg.bin) throw new Error('Package.json missing required fields');
    if (!pkg.types && !pkg.typings) throw new Error('Package.json missing TypeScript definitions');
  });

  // Test 10: TypeScript definitions
  await test('TypeScript definitions exist', async () => {
    const typesPath = path.join(__dirname, '../lib/index.d.ts');
    await fs.access(typesPath);
    const content = await fs.readFile(typesPath, 'utf-8');
    if (!content.includes('BeastMode')) throw new Error('TypeScript definitions incomplete');
  });

  // Test 11: CLI init (dry run)
  await test('CLI init command structure', async () => {
    const cliPath = path.join(__dirname, '../bin/beast-mode.js');
    const content = await fs.readFile(cliPath, 'utf-8');
    if (!content.includes('command(\'init\')')) throw new Error('Init command not found');
  });

  // Test 12: Dashboard module
  await test('Dashboard module', async () => {
    const dashboard = require('../lib/dashboard.js');
    if (!dashboard.startDashboard) throw new Error('Dashboard functions not exported');
  });

  // Test 13: Dev module
  await test('Dev module', async () => {
    const dev = require('../lib/dev.js');
    if (!dev.startDevServer || !dev.runTests) throw new Error('Dev functions not exported');
  });

  // Test 14: Enterprise module
  await test('Enterprise module', async () => {
    const enterprise = require('../lib/enterprise.js');
    if (!enterprise.startEnterpriseAnalytics) throw new Error('Enterprise functions not exported');
  });

  // Test 15: Init module
  await test('Init module', async () => {
    const init = require('../lib/init.js');
    if (!init.initializeBEASTMODE) throw new Error('Init functions not exported');
  });

  // Summary
  log.info('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log.info('📊 Test Results:');
  log.info(`   ✅ Passed: ${tests.passed}`);
  log.info(`   ❌ Failed: ${tests.failed}`);
  log.info(`   📈 Success Rate: ${((tests.passed / (tests.passed + tests.failed)) * 100).toFixed(1)}%`);

  if (tests.errors.length > 0) {
    log.error('\n❌ Errors:');
    tests.errors.forEach(({ name, error }) => {
      log.error(`   • ${name}: ${error}`);
    });
  }

  if (tests.failed > 0) {
    process.exit(1);
  }

  log.info('\n🎉 All tests passed!');
}

main().catch((error) => {
  log.error('Test suite failed:', error);
  process.exit(1);
});

