/**
 * Integration Test Script for Consolidated Services
 * Tests all unified services created during consolidation
 */

const path = require('path');
const { createLogger } = require('../lib/utils/logger');
const log = createLogger('ConsolidatedServicesTest');

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: [],
};

/**
 * Test a service
 */
function testService(name, testFn) {
  try {
    log.info(`Testing ${name}...`);
    const result = testFn();
    if (result) {
      results.passed++;
      log.info(`✅ ${name} - PASSED`);
      return true;
    } else {
      results.failed++;
      results.errors.push(`${name}: Test returned false`);
      log.error(`❌ ${name} - FAILED`);
      return false;
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`${name}: ${error.message}`);
    log.error(`❌ ${name} - ERROR: ${error.message}`);
    return false;
  }
}

/**
 * Test backend services
 */
async function testBackendServices() {
  log.info('=== Testing Backend Services ===');

  // Test UnifiedQualityService
  testService('UnifiedQualityService - Import', () => {
    try {
      const unifiedQualityService = require('../../smuggler-ai-gm/src/services/unifiedQualityService');
      return !!unifiedQualityService;
    } catch (error) {
      log.error('Failed to import UnifiedQualityService:', error.message);
      return false;
    }
  });

  testService('UnifiedQualityService - Methods', () => {
    try {
      const { getUnifiedQualityService } = require('../../smuggler-ai-gm/src/services/unifiedQualityService');
      const service = getUnifiedQualityService();
      const methods = ['predictQuality', 'analyzeQuality', 'predictCSAT'];
      return methods.every(method => typeof service[method] === 'function');
    } catch (error) {
      log.error('Failed to test UnifiedQualityService methods:', error.message);
      return false;
    }
  });

  // Test UnifiedMemoryService
  testService('UnifiedMemoryService - Import', () => {
    try {
      const unifiedMemoryService = require('../../smuggler-ai-gm/src/services/unifiedMemoryService');
      return !!unifiedMemoryService;
    } catch (error) {
      log.error('Failed to import UnifiedMemoryService:', error.message);
      return false;
    }
  });

  testService('UnifiedMemoryService - Methods', () => {
    try {
      const { getUnifiedMemoryService } = require('../../smuggler-ai-gm/src/services/unifiedMemoryService');
      const service = getUnifiedMemoryService();
      const methods = ['storeMemory', 'retrieveMemories', 'buildMemoryContext', 'searchMemories'];
      return methods.every(method => typeof service[method] === 'function');
    } catch (error) {
      log.error('Failed to test UnifiedMemoryService methods:', error.message);
      return false;
    }
  });

  // Test API Routes use unified services
  testService('API Routes - Unified Services', () => {
    try {
      const fs = require('fs');
      const apiRoutesPath = path.join(__dirname, '..', '..', 'smuggler-ai-gm/src/routes/apiRoutes.js');
      if (!fs.existsSync(apiRoutesPath)) {
        return false;
      }
      const apiRoutesContent = fs.readFileSync(apiRoutesPath, 'utf8');
      // Check that apiRoutes imports unified services
      const hasUnifiedQuality = apiRoutesContent.includes('unifiedQualityService');
      const hasUnifiedMemory = apiRoutesContent.includes('unifiedMemoryService');
      return hasUnifiedQuality && hasUnifiedMemory;
    } catch (error) {
      log.error('Failed to test API routes:', error.message);
      return false;
    }
  });
}

/**
 * Test frontend services (check if files exist)
 */
function testFrontendServices() {
  log.info('=== Testing Frontend Services ===');

  const frontendServices = [
    {
      name: 'ContextOptimizer',
      filePath: 'src/frontend/frontend/mvp-frontend-only/public/js/aiGM/contextOptimizer.js',
    },
    {
      name: 'ContextPredictor',
      filePath: 'src/frontend/frontend/mvp-frontend-only/public/js/aiGM/contextPredictor.js',
    },
    {
      name: 'ContextManager',
      filePath: 'src/frontend/frontend/mvp-frontend-only/public/js/aiGM/contextManager.js',
    },
    {
      name: 'PrimaryNarrativeEngine',
      filePath: 'src/frontend/frontend/mvp-frontend-only/public/js/aiGM/core/primaryNarrativeEngine.js',
    },
    {
      name: 'AdvancedNarrativeEngine',
      filePath: 'src/frontend/frontend/mvp-frontend-only/public/js/aiGM/core/advancedNarrativeEngine.js',
    },
    {
      name: 'UnifiedSystemIntegration',
      filePath: 'src/frontend/frontend/mvp-frontend-only/public/js/core/unifiedSystemIntegration.js',
    },
  ];

  frontendServices.forEach(({ name, filePath }) => {
    testService(`${name} - File Exists`, () => {
      const fs = require('fs');
      const fullPath = path.join(__dirname, '..', '..', filePath);
      return fs.existsSync(fullPath);
    });
  });
}

/**
 * Test service consolidation completeness
 */
function testConsolidationCompleteness() {
  log.info('=== Testing Consolidation Completeness ===');

  // Check that old services are not being imported in new code
  testService('No Old Service Imports in Unified Services', () => {
    const fs = require('fs');
    const unifiedQualityPath = path.join(__dirname, '..', '..', 'smuggler-ai-gm/src/services/unifiedQualityService.js');
    const unifiedMemoryPath = path.join(__dirname, '..', '..', 'smuggler-ai-gm/src/services/unifiedMemoryService.js');

    if (!fs.existsSync(unifiedQualityPath) || !fs.existsSync(unifiedMemoryPath)) {
      return false;
    }

    const qualityContent = fs.readFileSync(unifiedQualityPath, 'utf8');
    const memoryContent = fs.readFileSync(unifiedMemoryPath, 'utf8');

    // Check that unified services don't import old services
    const oldServiceImports = [
      'qualityAnalyzer',
      'aiGMQualityPredictionService',
      'aiGMMemoryService',
      'memoryService',
    ];

    const hasOldImports = oldServiceImports.some(oldService => {
      return qualityContent.includes(`require.*${oldService}`) ||
             memoryContent.includes(`require.*${oldService}`);
    });

    return !hasOldImports;
  });
}

/**
 * Run all tests
 */
async function runTests() {
  log.info('🚀 Starting Consolidated Services Integration Tests...\n');

  try {
    await testBackendServices();
    testFrontendServices();
    testConsolidationCompleteness();

    // Print summary
    log.info('\n=== Test Summary ===');
    log.info(`✅ Passed: ${results.passed}`);
    log.info(`❌ Failed: ${results.failed}`);
    log.info(`📊 Total: ${results.passed + results.failed}`);

    if (results.errors.length > 0) {
      log.info('\n=== Errors ===');
      results.errors.forEach((error, index) => {
        log.error(`${index + 1}. ${error}`);
      });
    }

    const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    log.info(`\n📈 Success Rate: ${successRate}%`);

    if (results.failed === 0) {
      log.info('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      log.error('\n⚠️  Some tests failed. Please review errors above.');
      process.exit(1);
    }
  } catch (error) {
    log.error('Fatal error during testing:', error);
    process.exit(1);
  }
}

// Run tests
runTests();

