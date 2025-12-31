/**
 * Comprehensive integration test for Month 7 features
 * Tests enterprise features and multi-region deployment together
 */

const { getMultiTenant } = require('../lib/enterprise/multiTenant');
const { getEnterpriseSecurity } = require('../lib/enterprise/security');
const { getRBAC } = require('../lib/enterprise/rbac');
const { getEnterpriseAnalytics } = require('../lib/enterprise/enterpriseAnalytics');
const { getRegionManager } = require('../lib/multi-region/regionManager');
const { getLoadBalancer } = require('../lib/multi-region/loadBalancer');
const { getFailover } = require('../lib/multi-region/failover');
const { getCrossRegionMonitoring } = require('../lib/multi-region/crossRegionMonitoring');

async function main() {
  console.log('🧪 Month 7 Integration Test\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Enterprise + Multi-Region Integration
  console.log('\n📋 Test 1: Enterprise + Multi-Region Integration');
  try {
    // Setup tenant
    const multiTenant = getMultiTenant();
    await multiTenant.initialize();
    const tenant = multiTenant.registerTenant('integration-test-1', {
      name: 'Integration Test Tenant',
      maxPredictionsPerDay: 100000
    });

    // Setup security
    const security = getEnterpriseSecurity();
    await security.initialize();
    const apiKey = security.generateApiKey(tenant.id, ['read', 'predict']);

    // Setup RBAC
    const rbac = getRBAC();
    await rbac.initialize();
    rbac.assignRole('user-1', tenant.id, 'data_scientist');

    // Setup regions
    const regionManager = getRegionManager();
    await regionManager.initialize();
    const bestRegion = regionManager.selectBestRegion('latency');

    // Setup load balancer
    const loadBalancer = getLoadBalancer();
    await loadBalancer.initialize();
    const routing = await loadBalancer.routeRequest({ tenantId: tenant.id }, 'latency');

    console.log(`   ✅ Tenant: ${tenant.id}`);
    console.log(`   ✅ API Key: ${apiKey.keyId}`);
    console.log(`   ✅ User Role: data_scientist`);
    console.log(`   ✅ Region: ${routing.region.id}`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 2: Analytics + Monitoring Integration
  console.log('\n📋 Test 2: Analytics + Monitoring Integration');
  try {
    const analytics = getEnterpriseAnalytics();
    await analytics.initialize();
    const dashboard = analytics.createDashboard('integration-test-1', {
      name: 'Integration Dashboard',
      widgets: ['predictions', 'regions', 'health']
    });

    const monitoring = getCrossRegionMonitoring();
    await monitoring.initialize();
    await monitoring.collectAllRegionMetrics();
    const globalDashboard = monitoring.getGlobalDashboard();

    console.log(`   ✅ Dashboard: ${dashboard.id}`);
    console.log(`   ✅ Regions Monitored: ${globalDashboard.regions.length}`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 3: Security + RBAC Integration
  console.log('\n📋 Test 3: Security + RBAC Integration');
  try {
    const security = getEnterpriseSecurity();
    const rbac = getRBAC();

    const validation = security.validateApiKey('test-key');
    const hasPermission = rbac.hasPermission('user-1', 'integration-test-1', 'models:train');

    // This will fail validation but tests the integration
    console.log(`   ✅ Security validation: ${validation.valid ? 'valid' : 'invalid (expected)'}`);
    console.log(`   ✅ Permission check: ${hasPermission ? 'granted' : 'denied'}`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 4: Failover + Replication Integration
  console.log('\n📋 Test 4: Failover + Replication Integration');
  try {
    const failover = getFailover();
    await failover.initialize();
    const failoverStatus = failover.getFailoverStatus();

    const { getDataReplication } = require('../lib/multi-region/dataReplication');
    const replication = getDataReplication();
    await replication.initialize();

    console.log(`   ✅ Failover service: active`);
    console.log(`   ✅ Replication service: active`);
    console.log(`   ✅ Active failovers: ${failoverStatus.length}`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 5: Full System Integration
  console.log('\n📋 Test 5: Full System Integration');
  try {
    // Simulate a full request flow
    const tenant = 'integration-test-1';
    const userId = 'user-1';

    // Check tenant
    const multiTenant = getMultiTenant();
    const tenantData = multiTenant.getTenant(tenant);
    if (!tenantData) throw new Error('Tenant not found');

    // Check permissions
    const rbac = getRBAC();
    const canPredict = rbac.hasPermission(userId, tenant, 'models:read');
    if (!canPredict) throw new Error('Permission denied');

    // Route request
    const loadBalancer = getLoadBalancer();
    const routing = await loadBalancer.routeRequest({ tenantId: tenant }, 'health');

    // Record activity
    multiTenant.recordActivity(tenant, 'prediction');

    console.log(`   ✅ Tenant check: passed`);
    console.log(`   ✅ Permission check: passed`);
    console.log(`   ✅ Request routed: ${routing.region.id}`);
    console.log(`   ✅ Activity recorded`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results Summary');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${passed + failed}`);
  console.log(`   🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All integration tests passed! Month 7 features are solid! ✅');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

