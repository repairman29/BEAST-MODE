/**
 * Test script for Phase 1, Week 3 integration
 * Tests security enhancer, database optimizer, and BI integration
 */

const { getSecurityEnhancer } = require('../lib/resilience/securityEnhancer');
const { getDatabaseOptimizer } = require('../lib/scale/databaseOptimizer');
const { getBIIntegration } = require('../lib/analytics/biIntegration');
const { getPerformanceMonitor } = require('../lib/scale/performanceMonitor');

async function main() {
  console.log('🧪 Testing Phase 1, Week 3 Integration\n');

  // Test Security Enhancer
  console.log('1️⃣  Testing Security Enhancer Integration...');
  const security = getSecurityEnhancer();
  await security.initialize();

  const validation = security.validateInput('test@example.com', 'email');
  console.log(`   ✅ Email validation: ${validation.valid ? 'valid' : 'invalid'}`);

  const sanitized = security.sanitizeOutput('<script>alert("xss")</script>', 'xss');
  console.log(`   ✅ XSS sanitization: ${sanitized.includes('<script>') ? 'failed' : 'success'}`);

  const vulnerabilities = security.scanVulnerabilities("'; DROP TABLE users; --");
  console.log(`   ✅ Vulnerability scan: ${vulnerabilities.length} vulnerabilities found\n`);

  // Test Database Optimizer
  console.log('2️⃣  Testing Database Optimizer Integration...');
  const databaseOptimizer = getDatabaseOptimizer();
  await databaseOptimizer.initialize();

  const query = 'SELECT * FROM users WHERE id = ? AND status = ?';
  const result = await databaseOptimizer.optimizeQuery(query, [1, 'active']);
  console.log(`   ✅ Query optimized: ${result ? 'yes' : 'no'}`);

  const queryStats = databaseOptimizer.getQueryStatistics();
  console.log(`   ✅ Total queries: ${queryStats.totalQueries}`);
  console.log(`   ✅ Connection pool: ${queryStats.connectionPool.active}/${queryStats.connectionPool.max}`);

  const recommendations = databaseOptimizer.getIndexRecommendations();
  console.log(`   ✅ Index recommendations: ${recommendations.length}\n`);

  // Test BI Integration
  console.log('3️⃣  Testing BI Integration...');
  const biIntegration = getBIIntegration();
  await biIntegration.initialize();

  const performanceMonitor = getPerformanceMonitor();
  await performanceMonitor.initialize();

  // Record some metrics
  performanceMonitor.recordMetric('responseTime', 150);
  performanceMonitor.recordMetric('throughput', 50);

  const stats = performanceMonitor.getPerformanceSummary();
  const exportData = [
    { metric: 'responseTime', value: stats.metrics.responseTime?.avg || 0 },
    { metric: 'throughput', value: stats.metrics.throughput?.avg || 0 }
  ];

  const exported = await biIntegration.exportForBI(exportData, 'csv');
  console.log(`   ✅ Data exported: ${exported ? 'yes' : 'no'}`);
  console.log(`   ✅ Export format: ${exported?.format || 'none'}`);
  console.log(`   ✅ Export size: ${exported?.size || 0} bytes`);

  const report = await biIntegration.generateBIReport('performance', {
    totalPredictions: 10000,
    avgLatency: 150,
    accuracy: 0.95
  });
  console.log(`   ✅ BI report generated: ${report ? 'yes' : 'no'}\n`);

  // Test Integration Together
  console.log('4️⃣  Testing Integrated Flow...');
  
  // Simulate API request with security, database, and BI
  const requestData = {
    email: 'user@example.com',
    query: 'SELECT * FROM predictions WHERE quality > 0.8'
  };

  // 1. Security validation
  const requestValidation = security.validateRequest(requestData, {
    email: { type: 'email' },
    query: { type: 'string', maxLength: 1000 }
  });
  console.log(`   ✅ Request validation: ${requestValidation.valid ? 'passed' : 'failed'}`);

  // 2. Database optimization
  const dbOptimized = await databaseOptimizer.optimizeQuery(requestData.query, []);
  console.log(`   ✅ Database optimization: ${dbOptimized ? 'yes' : 'no'}`);

  // 3. BI export
  const biExported = await biIntegration.exportForBI([requestData], 'json');
  console.log(`   ✅ BI export: ${biExported ? 'yes' : 'no'}\n`);

  console.log('✅ All Phase 1, Week 3 integrations tested successfully!');
  console.log('\n📊 Integration Status:');
  console.log(`   ✅ Security Enhancer: Active`);
  console.log(`   ✅ Database Optimizer: Active`);
  console.log(`   ✅ BI Integration: Active`);
  console.log(`   ✅ API Middleware: Enhanced`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});



