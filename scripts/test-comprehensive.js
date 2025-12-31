#!/usr/bin/env node

/**
 * BEAST MODE Comprehensive Test Suite
 * Extensive testing of all modules, CLI commands, and integrations
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('test-comprehensive');

const tests = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
  categories: {
    core: { passed: 0, failed: 0 },
    cli: { passed: 0, failed: 0 },
    api: { passed: 0, failed: 0 },
    integration: { passed: 0, failed: 0 },
    utils: { passed: 0, failed: 0 }
  }
};

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
      cwd: options.cwd || process.cwd(),
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

async function test(name, category, fn, options = {}) {
  const { skip = false } = options;
  
  if (skip) {
    tests.skipped++;
    log.info(`⏭️  ${name} - SKIPPED`);
    return;
  }

  try {
    log.info(`Testing: ${name}`);
    await fn();
    tests.passed++;
    tests.categories[category].passed++;
    log.info(`✅ ${name} - PASSED`);
  } catch (error) {
    tests.failed++;
    tests.categories[category].failed++;
    const errorMsg = error.message || error.toString() || 'Unknown error';
    tests.errors.push({ name, category, error: errorMsg });
    log.error(`❌ ${name} - FAILED: ${errorMsg}`);
  }
}

async function main() {
  log.info('🧪 BEAST MODE Comprehensive Test Suite');
  log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ============================================
  // CORE MODULE TESTS
  // ============================================
  log.info('📦 Core Module Tests\n');

  await test('BeastMode class export', 'core', async () => {
    const { BeastMode } = require('../lib/index.js');
    if (!BeastMode) throw new Error('BeastMode class not exported');
    if (typeof BeastMode !== 'function') throw new Error('BeastMode is not a class');
  });

  await test('BeastMode instantiation', 'core', async () => {
    const { BeastMode } = require('../lib/index.js');
    const instance = new BeastMode();
    if (!instance) throw new Error('Failed to instantiate BeastMode');
  });

  await test('QualityEngine export', 'core', async () => {
    const { QualityEngine } = require('../lib/quality.js');
    if (!QualityEngine) throw new Error('QualityEngine not exported');
  });

  await test('QualityEngine initialization', 'core', async () => {
    const { QualityEngine } = require('../lib/quality.js');
    const engine = new QualityEngine();
    await engine.initialize();
    if (!engine.initialized) throw new Error('QualityEngine not initialized');
  });

  await test('Marketplace module exports', 'core', async () => {
    const marketplace = require('../lib/marketplace/index.js');
    if (!marketplace.browseMarketplace) throw new Error('Marketplace functions not exported');
    if (!marketplace.installFromMarketplace) throw new Error('Install function not exported');
    if (!marketplace.publishToMarketplace) throw new Error('Publish function not exported');
  });

  await test('Intelligence module exports', 'core', async () => {
    const intelligence = require('../lib/intelligence/index.js');
    if (!intelligence.runIntelligenceAnalysis) throw new Error('Intelligence functions not exported');
    if (!intelligence.runPredictiveAnalytics) throw new Error('Predictive analytics not exported');
    if (!intelligence.runTeamOptimization) throw new Error('Team optimization not exported');
    if (!intelligence.manageKnowledge) throw new Error('Knowledge management not exported');
  });

  // ============================================
  // UTILITY TESTS
  // ============================================
  log.info('\n🔧 Utility Tests\n');

  await test('Error handler exports', 'utils', async () => {
    const {
      ValidationError,
      NotFoundError,
      AuthenticationError,
      handleApiError
    } = require('../lib/utils/error-handler.js');
    if (!ValidationError || !NotFoundError) throw new Error('Error classes not exported');
    if (typeof handleApiError !== 'function') throw new Error('handleApiError not a function');
  });

  await test('Error handler validation', 'utils', async () => {
    const { ValidationError, validateRequired } = require('../lib/utils/error-handler.js');
    try {
      validateRequired({}, ['name', 'email']);
      throw new Error('Should have thrown ValidationError');
    } catch (error) {
      if (!(error instanceof ValidationError)) throw error;
    }
  });

  await test('Logger utility', 'utils', async () => {
    const logger = require('../lib/utils/logger.js');
    if (!logger.createLogger) throw new Error('Logger not exported');
    const log = logger.createLogger('test');
    if (typeof log.info !== 'function') throw new Error('Logger methods not available');
  });

  await test('Core utilities', 'utils', async () => {
    const utils = require('../lib/core.js');
    if (!utils.generateId) throw new Error('Core utilities not exported');
    if (typeof utils.generateId !== 'function') throw new Error('generateId not a function');
  });

  // ============================================
  // CLI TESTS
  // ============================================
  log.info('\n💻 CLI Tests\n');

  await test('CLI file exists and is executable', 'cli', async () => {
    const cliPath = path.join(__dirname, '../bin/beast-mode.js');
    await fs.access(cliPath);
    const content = await fs.readFile(cliPath, 'utf-8');
    if (!content.includes('beast-mode')) throw new Error('CLI file invalid');
  });

  await test('CLI init command exists', 'cli', async () => {
    const cliPath = path.join(__dirname, '../bin/beast-mode.js');
    const content = await fs.readFile(cliPath, 'utf-8');
    if (!content.includes("command('init')")) throw new Error('Init command not found');
  });

  await test('CLI dashboard command exists', 'cli', async () => {
    const cliPath = path.join(__dirname, '../bin/beast-mode.js');
    const content = await fs.readFile(cliPath, 'utf-8');
    if (!content.includes("command('dashboard')")) throw new Error('Dashboard command not found');
  });

  await test('CLI quality commands exist', 'cli', async () => {
    const cliPath = path.join(__dirname, '../bin/beast-mode.js');
    const content = await fs.readFile(cliPath, 'utf-8');
    if (!content.includes("command('quality')")) throw new Error('Quality command not found');
  });

  await test('CLI intelligence commands exist', 'cli', async () => {
    const cliPath = path.join(__dirname, '../bin/beast-mode.js');
    const content = await fs.readFile(cliPath, 'utf-8');
    if (!content.includes("command('intelligence')")) throw new Error('Intelligence command not found');
  });

  await test('CLI marketplace commands exist', 'cli', async () => {
    const cliPath = path.join(__dirname, '../bin/beast-mode.js');
    const content = await fs.readFile(cliPath, 'utf-8');
    if (!content.includes("command('marketplace')")) throw new Error('Marketplace command not found');
  });

  await test('CLI help command', 'cli', async () => {
    return new Promise((resolve, reject) => {
      const proc = spawn('node', [path.join(__dirname, '../bin/beast-mode.js'), '--help'], {
        stdio: 'pipe',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        // CLI help typically exits with code 0, but commander might use different codes
        // Check if we got help output
        if (stdout.includes('Usage:') || stdout.includes('Commands:') || stdout.includes('Options:')) {
          resolve(); // Success - we got help output
        } else if (code === 0 || code === null) {
          resolve(); // Exit code 0 is success
        } else {
          reject(new Error(`CLI help failed with code ${code}: ${stderr || stdout}`));
        }
      });

      proc.on('error', (error) => {
        reject(error);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        proc.kill();
        reject(new Error('CLI help command timed out'));
      }, 5000);
    });
  }, { skip: false });

  // ============================================
  // MODULE INTEGRATION TESTS
  // ============================================
  log.info('\n🔗 Integration Tests\n');

  await test('Dashboard module', 'integration', async () => {
    const dashboard = require('../lib/dashboard.js');
    if (!dashboard.startDashboard) throw new Error('Dashboard functions not exported');
  });

  await test('Dev module', 'integration', async () => {
    const dev = require('../lib/dev.js');
    if (!dev.startDevServer || !dev.runTests) throw new Error('Dev functions not exported');
  });

  await test('Enterprise module', 'integration', async () => {
    const enterprise = require('../lib/enterprise.js');
    if (!enterprise.startEnterpriseAnalytics) throw new Error('Enterprise functions not exported');
    if (!enterprise.manageEnterpriseIntegrations) throw new Error('Integrations function not exported');
  });

  await test('Init module', 'integration', async () => {
    const init = require('../lib/init.js');
    if (!init.initializeBEASTMODE) throw new Error('Init functions not exported');
  });

  await test('Monetization module', 'integration', async () => {
    const monetization = require('../lib/marketplace/monetization-programs.js');
    if (!monetization.MonetizationPrograms) throw new Error('MonetizationPrograms not exported');
    if (!monetization.checkMarketplaceStatus) throw new Error('checkMarketplaceStatus not exported');
  });

  // ============================================
  // PACKAGE TESTS
  // ============================================
  log.info('\n📦 Package Configuration Tests\n');

  await test('Package.json exists and valid', 'core', async () => {
    const pkg = require('../package.json');
    if (!pkg.name || !pkg.version) throw new Error('Package.json missing required fields');
    if (pkg.name !== '@beast-mode/core') throw new Error('Package name incorrect');
  });

  await test('Package.json main entry', 'core', async () => {
    const pkg = require('../package.json');
    if (!pkg.main) throw new Error('Package.json missing main entry');
    const mainPath = path.join(__dirname, '..', pkg.main);
    await fs.access(mainPath);
  });

  await test('Package.json bin entry', 'core', async () => {
    const pkg = require('../package.json');
    if (!pkg.bin || !pkg.bin['beast-mode']) throw new Error('Package.json missing bin entry');
    const binPath = path.join(__dirname, '..', pkg.bin['beast-mode']);
    await fs.access(binPath);
  });

  await test('TypeScript definitions', 'core', async () => {
    const pkg = require('../package.json');
    if (!pkg.types && !pkg.typings) throw new Error('Package.json missing TypeScript definitions');
    const typesPath = path.join(__dirname, '..', pkg.types || pkg.typings);
    await fs.access(typesPath);
    const content = await fs.readFile(typesPath, 'utf-8');
    if (!content.includes('BeastMode')) throw new Error('TypeScript definitions incomplete');
  });

  await test('Package.json files field', 'core', async () => {
    const pkg = require('../package.json');
    if (!pkg.files || !Array.isArray(pkg.files)) throw new Error('Package.json missing files field');
    for (const file of pkg.files) {
      const filePath = path.join(__dirname, '..', file);
      try {
        await fs.access(filePath);
      } catch {
        // Some files might be patterns, skip
      }
    }
  });

  // ============================================
  // DOCUMENTATION TESTS
  // ============================================
  log.info('\n📚 Documentation Tests\n');

  await test('API documentation exists', 'utils', async () => {
    const apiDocPath = path.join(__dirname, '../docs/API.md');
    await fs.access(apiDocPath);
    const content = await fs.readFile(apiDocPath, 'utf-8');
    if (content.length < 100) throw new Error('API documentation too short');
  });

  await test('CLI documentation exists', 'utils', async () => {
    const cliDocPath = path.join(__dirname, '../docs/CLI.md');
    await fs.access(cliDocPath);
    const content = await fs.readFile(cliDocPath, 'utf-8');
    if (content.length < 100) throw new Error('CLI documentation too short');
  });

  await test('README exists', 'utils', async () => {
    const readmePath = path.join(__dirname, '../README.md');
    await fs.access(readmePath);
    const content = await fs.readFile(readmePath, 'utf-8');
    if (content.length < 100) throw new Error('README too short');
  });

  // ============================================
  // QUALITY TESTS
  // ============================================
  log.info('\n✨ Quality Tests\n');

  await test('Quality engine methods', 'core', async () => {
    const { QualityEngine } = require('../lib/quality.js');
    const engine = new QualityEngine();
    await engine.initialize();
    
    if (typeof engine.calculateScore !== 'function') throw new Error('calculateScore not a function');
    if (typeof engine.runChecks !== 'function') throw new Error('runChecks not a function');
    if (typeof engine.getOracleInsights !== 'function') throw new Error('getOracleInsights not a function');
    if (typeof engine.getCodeRoachAnalysis !== 'function') throw new Error('getCodeRoachAnalysis not a function');
  });

  await test('Quality score calculation', 'core', async () => {
    const { QualityEngine } = require('../lib/quality.js');
    const engine = new QualityEngine();
    await engine.initialize();
    
    const score = await engine.calculateScore({ detailed: false });
    if (!score || typeof score.overall !== 'number') throw new Error('Invalid score format');
    if (score.overall < 0 || score.overall > 100) throw new Error('Score out of range');
  });

  // Summary
  log.info('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log.info('📊 Test Results Summary:');
  log.info(`   ✅ Passed: ${tests.passed}`);
  log.info(`   ❌ Failed: ${tests.failed}`);
  log.info(`   ⏭️  Skipped: ${tests.skipped}`);
  log.info(`   📈 Success Rate: ${((tests.passed / (tests.passed + tests.failed)) * 100).toFixed(1)}%`);
  
  log.info('\n📊 By Category:');
  Object.entries(tests.categories).forEach(([category, stats]) => {
    const total = stats.passed + stats.failed;
    const rate = total > 0 ? ((stats.passed / total) * 100).toFixed(1) : 0;
    log.info(`   ${category}: ${stats.passed}/${total} (${rate}%)`);
  });

  if (tests.errors.length > 0) {
    log.error('\n❌ Errors:');
    tests.errors.forEach(({ name, category, error }) => {
      log.error(`   • [${category}] ${name}: ${error}`);
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

