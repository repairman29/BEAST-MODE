#!/usr/bin/env node

/**
 * Test Phase 1 Services
 * Validates all new services can initialize and work correctly
 * 
 * Dog Fooding: Built using BEAST MODE
 */

require('dotenv').config();

const services = {
  ensemble: () => {
    try {
      const { getEnsembleService } = require('../lib/mlops/ensembleService');
      return getEnsembleService();
    } catch (error) {
      return { error: error.message };
    }
  },
  nas: () => {
    try {
      const { getNASService } = require('../lib/mlops/nasService');
      return getNASService();
    } catch (error) {
      return { error: error.message };
    }
  },
  fineTuning: () => {
    try {
      const { getFineTuningService } = require('../lib/mlops/fineTuningService');
      return getFineTuningService();
    } catch (error) {
      return { error: error.message };
    }
  },
  crossDomain: () => {
    try {
      const { getCrossDomainService } = require('../lib/mlops/crossDomainService');
      return getCrossDomainService();
    } catch (error) {
      return { error: error.message };
    }
  },
  advancedCaching: () => {
    try {
      const { getAdvancedCachingService } = require('../lib/mlops/advancedCachingService');
      return getAdvancedCachingService();
    } catch (error) {
      return { error: error.message };
    }
  }
};

async function testService(name, getService) {
  console.log(`\n🔧 Testing ${name} service...`);
  
  try {
    const service = getService();
    
    if (service.error) {
      return { success: false, error: service.error };
    }

    // Test initialization
    if (service.initialize) {
      const initialized = await service.initialize();
      if (!initialized) {
        return { success: false, error: 'Initialization returned false' };
      }
      console.log(`  ✅ Initialized successfully`);
    } else {
      console.log(`  ⚠️  No initialize method (may be optional)`);
    }

    // Test service methods exist
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service))
      .filter(name => name !== 'constructor' && typeof service[name] === 'function');
    
    console.log(`  📋 Methods: ${methods.length} found`);
    if (methods.length > 0) {
      console.log(`     ${methods.slice(0, 5).join(', ')}${methods.length > 5 ? '...' : ''}`);
    }

    return { success: true, methods: methods.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🧪 Testing Phase 1 Services...\n');
  console.log('='.repeat(60));

  const results = {
    passed: [],
    failed: []
  };

  for (const [name, getService] of Object.entries(services)) {
    const result = await testService(name, getService);
    
    if (result.success) {
      results.passed.push(name);
    } else {
      results.failed.push({ name, error: result.error });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:\n');
  console.log(`  ✅ Passed: ${results.passed.length}/${Object.keys(services).length}`);
  console.log(`  ❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Services:');
    results.failed.forEach(f => {
      console.log(`   - ${f.name}: ${f.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  if (results.failed.length === 0) {
    console.log('\n🎉 All services validated successfully!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some services need attention.\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
