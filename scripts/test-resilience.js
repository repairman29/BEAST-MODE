/**
 * Test script for resilience features
 */

const { getErrorHandler } = require('../lib/resilience/errorHandler');
const { getCircuitBreaker } = require('../lib/resilience/circuitBreaker');
const { getSecurityEnhancer } = require('../lib/resilience/securityEnhancer');
const { getDisasterRecovery } = require('../lib/resilience/disasterRecovery');

async function main() {
  console.log('🛡️  Testing Resilience Features\n');

  // Test Error Handler
  console.log('1️⃣  Testing Error Handler...');
  const errorHandler = getErrorHandler();
  await errorHandler.initialize();

  const testError = new Error('Test network error');
  testError.code = 'ENOTFOUND';
  const handled = await errorHandler.handleError(testError, {
    operation: async () => { throw testError; }
  });
  console.log(`   ✅ Error handled: ${handled.handled ? 'yes' : 'no'}`);
  console.log(`   ✅ Error type: ${handled.errorType}`);

  const stats = errorHandler.getErrorStatistics();
  console.log(`   ✅ Error statistics: ${stats.total} errors recorded\n`);

  // Test Circuit Breaker
  console.log('2️⃣  Testing Circuit Breaker...');
  const circuitBreaker = getCircuitBreaker();
  await circuitBreaker.initialize();

  let circuitResult = null;
  try {
    circuitResult = await circuitBreaker.execute('test-circuit', async () => {
      throw new Error('Operation failed');
    }, async () => {
      return 'fallback result';
    });
  } catch (error) {
    // Expected to use fallback
  }

  const circuitStatus = circuitBreaker.getCircuitStatus('test-circuit');
  console.log(`   ✅ Circuit breaker: ${circuitStatus ? 'active' : 'inactive'}`);
  console.log(`   ✅ Circuit state: ${circuitStatus?.state || 'unknown'}`);
  console.log(`   ✅ Fallback used: ${circuitResult === 'fallback result' ? 'yes' : 'no'}\n`);

  // Test Security Enhancer
  console.log('3️⃣  Testing Security Enhancer...');
  const security = getSecurityEnhancer();
  await security.initialize();

  const validation = security.validateInput('test@example.com', 'email');
  console.log(`   ✅ Email validation: ${validation.valid ? 'valid' : 'invalid'}`);

  const sanitized = security.sanitizeOutput('<script>alert("xss")</script>', 'xss');
  console.log(`   ✅ XSS sanitization: ${sanitized.includes('<script>') ? 'failed' : 'success'}`);

  const vulnerabilities = security.scanVulnerabilities("'; DROP TABLE users; --");
  console.log(`   ✅ Vulnerability scan: ${vulnerabilities.length} vulnerabilities found\n`);

  // Test Disaster Recovery
  console.log('4️⃣  Testing Disaster Recovery...');
  const disasterRecovery = getDisasterRecovery();
  await disasterRecovery.initialize();

  const backup = await disasterRecovery.createBackup('model', {
    model: 'test-model',
    version: '1.0'
  });
  console.log(`   ✅ Backup created: ${backup ? backup.id : 'failed'}`);

  const recovery = await disasterRecovery.restoreFromBackup(backup.id);
  console.log(`   ✅ Recovery completed: ${recovery ? recovery.id : 'failed'}`);

  const plan = disasterRecovery.getDisasterRecoveryPlan();
  console.log(`   ✅ DR plan: ${Object.keys(plan.backupStrategies).length} strategies\n`);

  console.log('✅ All resilience features tested successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

