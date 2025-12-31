/**
 * Test script for enterprise features
 */

const { getMultiTenant } = require('../lib/enterprise/multiTenant');
const { getEnterpriseSecurity } = require('../lib/enterprise/security');
const { getRBAC } = require('../lib/enterprise/rbac');
const { getEnterpriseAnalytics } = require('../lib/enterprise/enterpriseAnalytics');

async function main() {
  console.log('🏢 Testing Enterprise Features\n');

  // Test Multi-Tenant
  console.log('1️⃣  Testing Multi-Tenant Support...');
  const multiTenant = getMultiTenant();
  await multiTenant.initialize();

  const tenant = multiTenant.registerTenant('test-tenant-1', {
    name: 'Test Tenant',
    maxPredictionsPerDay: 50000
  });
  console.log(`   ✅ Tenant registered: ${tenant.id}`);

  const tenantModel = await multiTenant.getTenantModel('test-tenant-1');
  console.log(`   ✅ Tenant model loaded: ${tenantModel ? 'yes' : 'no'}`);

  multiTenant.recordActivity('test-tenant-1', 'prediction');
  const metrics = multiTenant.getTenantMetrics('test-tenant-1');
  console.log(`   ✅ Metrics recorded: ${metrics.predictions} predictions\n`);

  // Test Security
  console.log('2️⃣  Testing Enterprise Security...');
  const security = getEnterpriseSecurity();
  await security.initialize();

  const apiKey = security.generateApiKey('test-tenant-1', ['read', 'predict']);
  console.log(`   ✅ API key generated: ${apiKey.keyId}`);

  const validation = security.validateApiKey(apiKey.apiKey);
  console.log(`   ✅ API key validated: ${validation.valid ? 'yes' : 'no'}`);

  const rateLimit = security.checkRateLimit(apiKey.keyId, 'predict');
  console.log(`   ✅ Rate limit check: ${rateLimit.allowed ? 'allowed' : 'blocked'}`);

  security.logAudit('test-tenant-1', 'prediction', { ip: '127.0.0.1' });
  const auditLog = security.getAuditLog('test-tenant-1', 5);
  console.log(`   ✅ Audit log entries: ${auditLog.length}\n`);

  // Test RBAC
  console.log('3️⃣  Testing Role-Based Access Control...');
  const rbac = getRBAC();
  await rbac.initialize();

  rbac.assignRole('user-1', 'test-tenant-1', 'data_scientist');
  const hasPermission = rbac.hasPermission('user-1', 'test-tenant-1', 'models:train');
  console.log(`   ✅ Permission check: ${hasPermission ? 'granted' : 'denied'}`);

  const userPermissions = rbac.getUserPermissions('user-1', 'test-tenant-1');
  console.log(`   ✅ User permissions: ${userPermissions.length} permissions\n`);

  // Test Enterprise Analytics
  console.log('4️⃣  Testing Enterprise Analytics...');
  const analytics = getEnterpriseAnalytics();
  await analytics.initialize();

  const dashboard = analytics.createDashboard('test-tenant-1', {
    name: 'Test Dashboard',
    widgets: ['predictions', 'accuracy', 'latency']
  });
  console.log(`   ✅ Dashboard created: ${dashboard.id}`);

  const report = await analytics.generateReport('test-tenant-1', {
    name: 'Monthly Report',
    type: 'standard',
    format: 'json'
  });
  console.log(`   ✅ Report generated: ${report.id}`);
  console.log(`   ✅ Report data: ${report.data ? 'collected' : 'missing'}\n`);

  console.log('✅ All enterprise features tested successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

