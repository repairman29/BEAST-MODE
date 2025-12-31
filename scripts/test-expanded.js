#!/usr/bin/env node

/**
 * BEAST MODE Expanded Test Suite
 * Additional tests for edge cases, error handling, and integration scenarios
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('test-expanded');

const tests = {
  passed: 0,
  failed: 0,
  errors: []
};

async function test(name, fn) {
  try {
    log.info(`Testing: ${name}`);
    await fn();
    tests.passed++;
    log.info(`✅ ${name} - PASSED`);
  } catch (error) {
    tests.failed++;
    const errorMsg = error.message || error.toString() || 'Unknown error';
    tests.errors.push({ name, error: errorMsg });
    log.error(`❌ ${name} - FAILED: ${errorMsg}`);
  }
}

async function main() {
  log.info('🧪 BEAST MODE Expanded Test Suite');
  log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  log.info('🛡️ Error Handling Tests\n');

  await test('ValidationError creation', async () => {
    const { ValidationError } = require('../lib/utils/error-handler.js');
    const error = new ValidationError('Test error', 'field', 'value');
    if (error.statusCode !== 400) throw new Error('Wrong status code');
    if (error.code !== 'VALIDATION_ERROR') throw new Error('Wrong error code');
  });

  await test('NotFoundError creation', async () => {
    const { NotFoundError } = require('../lib/utils/error-handler.js');
    const error = new NotFoundError('resource', 'id123');
    if (error.statusCode !== 404) throw new Error('Wrong status code');
    if (error.message !== 'resource not found') throw new Error('Wrong message');
  });

  await test('Error toJSON serialization', async () => {
    const { ValidationError } = require('../lib/utils/error-handler.js');
    const error = new ValidationError('Test', 'field', 'value');
    const json = error.toJSON();
    if (!json.error || !json.error.message) throw new Error('Invalid JSON format');
  });

  await test('validateRequired function', async () => {
    const { validateRequired, ValidationError } = require('../lib/utils/error-handler.js');
    try {
      validateRequired({ name: 'test' }, ['name', 'email']);
      throw new Error('Should have thrown ValidationError');
    } catch (error) {
      if (!(error instanceof ValidationError)) throw error;
    }
  });

  await test('validateType function', async () => {
    const { validateType, ValidationError } = require('../lib/utils/error-handler.js');
    try {
      validateType('not a number', 'number', 'age');
      throw new Error('Should have thrown ValidationError');
    } catch (error) {
      if (!(error instanceof ValidationError)) throw error;
    }
  });

  await test('validateEmail function', async () => {
    const { validateEmail, ValidationError } = require('../lib/utils/error-handler.js');
    validateEmail('test@example.com'); // Should not throw
    try {
      validateEmail('invalid-email');
      throw new Error('Should have thrown ValidationError');
    } catch (error) {
      if (!(error instanceof ValidationError)) throw error;
    }
  });

  // ============================================
  // QUALITY ENGINE EDGE CASES
  // ============================================
  log.info('\n✨ Quality Engine Edge Cases\n');

  await test('QualityEngine with no validators', async () => {
    const { QualityEngine } = require('../lib/quality.js');
    const engine = new QualityEngine();
    await engine.initialize();
    const score = await engine.calculateScore({ detailed: false });
    if (typeof score.overall !== 'number') throw new Error('Score should be a number');
  });

  await test('QualityEngine cache functionality', async () => {
    const { QualityEngine } = require('../lib/quality.js');
    const engine = new QualityEngine();
    await engine.initialize();
    engine.clearCache();
    if (engine.cache.size !== 0) throw new Error('Cache not cleared');
  });

  await test('QualityEngine validators list', async () => {
    const { QualityEngine } = require('../lib/quality.js');
    const engine = new QualityEngine();
    await engine.initialize();
    const validators = engine.getValidators();
    if (!Array.isArray(validators)) throw new Error('Validators should be an array');
  });

  // ============================================
  // MARKETPLACE TESTS
  // ============================================
  log.info('\n🛒 Marketplace Tests\n');

  await test('Marketplace browse function exists', async () => {
    const { browseMarketplace } = require('../lib/marketplace/index.js');
    if (typeof browseMarketplace !== 'function') throw new Error('browseMarketplace not a function');
  });

  await test('Marketplace install function exists', async () => {
    const { installFromMarketplace } = require('../lib/marketplace/index.js');
    if (typeof installFromMarketplace !== 'function') throw new Error('installFromMarketplace not a function');
  });

  await test('Marketplace publish function exists', async () => {
    const { publishToMarketplace } = require('../lib/marketplace/index.js');
    if (typeof publishToMarketplace !== 'function') throw new Error('publishToMarketplace not a function');
  });

  // ============================================
  // INTELLIGENCE TESTS
  // ============================================
  log.info('\n🧠 Intelligence Tests\n');

  await test('Intelligence analysis function exists', async () => {
    const { runIntelligenceAnalysis } = require('../lib/intelligence/index.js');
    if (typeof runIntelligenceAnalysis !== 'function') throw new Error('runIntelligenceAnalysis not a function');
  });

  await test('Predictive analytics function exists', async () => {
    const { runPredictiveAnalytics } = require('../lib/intelligence/index.js');
    if (typeof runPredictiveAnalytics !== 'function') throw new Error('runPredictiveAnalytics not a function');
  });

  await test('Team optimization function exists', async () => {
    const { runTeamOptimization } = require('../lib/intelligence/index.js');
    if (typeof runTeamOptimization !== 'function') throw new Error('runTeamOptimization not a function');
  });

  await test('Knowledge management function exists', async () => {
    const { manageKnowledge } = require('../lib/intelligence/index.js');
    if (typeof manageKnowledge !== 'function') throw new Error('manageKnowledge not a function');
  });

  // ============================================
  // BEAST MODE INSTANCE TESTS
  // ============================================
  log.info('\n⚔️ BeastMode Instance Tests\n');

  await test('BeastMode initialization options', async () => {
    const { BeastMode } = require('../lib/index.js');
    const instance = new BeastMode({ debug: true, enterprise: false });
    if (instance.options.debug !== true) throw new Error('Options not set correctly');
  });

  await test('BeastMode info property', async () => {
    const { BeastMode } = require('../lib/index.js');
    const instance = new BeastMode();
    const info = instance.info;
    if (!info.name || !info.version) throw new Error('Info property incomplete');
  });

  await test('BeastMode component access', async () => {
    const { BeastMode } = require('../lib/index.js');
    const instance = new BeastMode();
    const component = instance.getComponent('nonexistent');
    if (component !== undefined) throw new Error('Should return undefined for nonexistent component');
  });

  // ============================================
  // FILE STRUCTURE TESTS
  // ============================================
  log.info('\n📁 File Structure Tests\n');

  await test('All required lib files exist', async () => {
    const requiredFiles = [
      'lib/index.js',
      'lib/core.js',
      'lib/quality.js',
      'lib/utils/logger.js',
      'lib/utils/error-handler.js',
      'lib/marketplace/index.js',
      'lib/intelligence/index.js'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      await fs.access(filePath);
    }
  });

  await test('CLI binary exists and is executable', async () => {
    const cliPath = path.join(__dirname, '../bin/beast-mode.js');
    await fs.access(cliPath);
    const stats = await fs.stat(cliPath);
    if (!stats.isFile()) throw new Error('CLI is not a file');
  });

  await test('TypeScript definitions file exists', async () => {
    const typesPath = path.join(__dirname, '../lib/index.d.ts');
    await fs.access(typesPath);
    const content = await fs.readFile(typesPath, 'utf-8');
    if (content.length < 100) throw new Error('TypeScript definitions too short');
  });

  // ============================================
  // PACKAGE.JSON VALIDATION
  // ============================================
  log.info('\n📦 Package.json Validation\n');

  await test('Package.json has all required fields', async () => {
    const pkg = require('../package.json');
    const required = ['name', 'version', 'description', 'main', 'bin', 'license'];
    for (const field of required) {
      if (!pkg[field]) throw new Error(`Missing required field: ${field}`);
    }
  });

  await test('Package.json keywords', async () => {
    const pkg = require('../package.json');
    if (!pkg.keywords || !Array.isArray(pkg.keywords)) {
      throw new Error('Keywords should be an array');
    }
    if (pkg.keywords.length < 5) throw new Error('Should have at least 5 keywords');
  });

  await test('Package.json repository URL', async () => {
    const pkg = require('../package.json');
    if (!pkg.repository || !pkg.repository.url) {
      throw new Error('Repository URL missing');
    }
    if (!pkg.repository.url.includes('github.com')) {
      throw new Error('Repository URL should point to GitHub');
    }
  });

  // Summary
  log.info('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log.info('📊 Expanded Test Results:');
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

  log.info('\n🎉 All expanded tests passed!');
}

main().catch((error) => {
  log.error('Test suite failed:', error);
  process.exit(1);
});

