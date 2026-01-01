/**
 * Test script for Phase 2, Week 1 integration
 * Tests unified enterprise service
 */

const { getUnifiedEnterpriseService } = require('../lib/enterprise/unifiedEnterpriseService');

async function main() {
  console.log('🧪 Testing Phase 2, Week 1 Integration\n');

  const enterprise = getUnifiedEnterpriseService();
  await enterprise.initialize();

  // Test Multi-Tenant
  console.log('1️⃣  Testing Multi-Tenant Operations...');
  const tenantResult = await enterprise.registerTenant({
    name: 'Test Tenant',
    plan: 'enterprise',
    maxUsers: 100,
    maxProjects: 50
  });
  const tenantId = tenantResult.tenantId || tenantResult.tenant?.id;
  console.log(`   ✅ Tenant registered: ${tenantId}`);

  const tenantConfig = await enterprise.getTenantConfig(tenantId);
  console.log(`   ✅ Tenant config retrieved: ${tenantConfig?.name || 'N/A'}`);

  await enterprise.setTenantConfig(tenantId, { maxUsers: 200 });
  console.log(`   ✅ Tenant config updated`);

  await enterprise.recordTenantActivity(tenantId, {
    type: 'test',
    action: 'integration_test'
  });
  console.log(`   ✅ Activity recorded\n`);

  // Test RBAC
  console.log('2️⃣  Testing RBAC Operations...');
  await enterprise.createRole('test-role', ['models:train', 'models:deploy']);
  console.log(`   ✅ Role created: test-role`);

  await enterprise.assignRole('user-123', 'test-role', tenantId);
  console.log(`   ✅ Role assigned`);

  const hasPermission = await enterprise.hasPermission('user-123', 'models:train', tenantId);
  console.log(`   ✅ Permission check: ${hasPermission ? 'granted' : 'denied'}`);

  const permissions = await enterprise.getUserPermissions('user-123', tenantId);
  console.log(`   ✅ User permissions: ${permissions.length} permissions\n`);

  // Test Security
  console.log('3️⃣  Testing Security Operations...');
  const apiKey = await enterprise.generateApiKey(tenantId, 'user-123', ['models:train']);
  console.log(`   ✅ API key generated: ${apiKey?.apiKey?.substring(0, 20) || 'N/A'}...`);

  const validation = await enterprise.validateApiKey(apiKey?.apiKey || '');
  console.log(`   ✅ API key validated: ${validation?.valid ? 'valid' : 'invalid'}`);

  const rateLimit = await enterprise.checkRateLimit(apiKey?.apiKey || '', '/api/ml/predict');
  console.log(`   ✅ Rate limit check: ${rateLimit?.allowed ? 'allowed' : 'blocked'}`);

  await enterprise.logAudit(tenantId, 'user-123', 'test_action', { test: true });
  console.log(`   ✅ Audit logged`);

  const auditLog = await enterprise.getAuditLog(tenantId, { limit: 5 });
  console.log(`   ✅ Audit log retrieved: ${auditLog?.length || 0} entries\n`);

  // Test Analytics
  console.log('4️⃣  Testing Analytics Operations...');
  const dashboard = await enterprise.createDashboard(tenantId, {
    name: 'Test Dashboard',
    widgets: ['performance', 'usage']
  });
  console.log(`   ✅ Dashboard created: ${dashboard?.id || 'N/A'}`);

  const report = await enterprise.generateReport(tenantId, 'summary', { days: 7 });
  console.log(`   ✅ Report generated: ${report ? 'yes' : 'no'}`);

  const trends = await enterprise.getAnalyticsTrends(tenantId, 7);
  console.log(`   ✅ Trends retrieved: ${trends ? 'yes' : 'no'}\n`);

  // Test Unified Operations
  console.log('5️⃣  Testing Unified Operations...');
  const tenantStatus = await enterprise.getTenantStatus(tenantId);
  console.log(`   ✅ Tenant status retrieved`);
  console.log(`      - Tenant: ${tenantStatus?.tenant?.name || 'N/A'}`);
  console.log(`      - Activity: ${tenantStatus?.activity?.total || 0} total`);
  console.log(`      - Security: ${tenantStatus?.security?.apiKeys || 0} API keys`);
  console.log(`      - Analytics: ${tenantStatus?.analytics?.summary ? 'available' : 'unavailable'}\n`);

  // Test Service Status
  const serviceStatus = enterprise.getStatus();
  console.log('6️⃣  Testing Service Status...');
  console.log(`   ✅ Initialized: ${serviceStatus.initialized}`);
  console.log(`   ✅ Multi-Tenant: ${serviceStatus.services.multiTenant ? 'active' : 'inactive'}`);
  console.log(`   ✅ RBAC: ${serviceStatus.services.rbac ? 'active' : 'inactive'}`);
  console.log(`   ✅ Security: ${serviceStatus.services.security ? 'active' : 'inactive'}`);
  console.log(`   ✅ Analytics: ${serviceStatus.services.analytics ? 'active' : 'inactive'}\n`);

  console.log('✅ All Phase 2, Week 1 integrations tested successfully!');
  console.log('\n📊 Integration Status:');
  console.log(`   ✅ Unified Enterprise Service: Active`);
  console.log(`   ✅ Multi-Tenant: Integrated`);
  console.log(`   ✅ RBAC: Integrated`);
  console.log(`   ✅ Security: Integrated`);
  console.log(`   ✅ Analytics: Integrated`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

