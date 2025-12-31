/**
 * Performance benchmark for Month 7 features
 */

const { getMultiTenant } = require('../lib/enterprise/multiTenant');
const { getEnterpriseSecurity } = require('../lib/enterprise/security');
const { getLoadBalancer } = require('../lib/multi-region/loadBalancer');
const { getCrossRegionMonitoring } = require('../lib/multi-region/crossRegionMonitoring');

async function benchmarkOperation(name, operation, iterations = 100) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await operation();
    const end = Date.now();
    times.push(end - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

  return {
    name,
    iterations,
    avg: avg.toFixed(2),
    min,
    max,
    p95,
    opsPerSecond: (1000 / avg).toFixed(2)
  };
}

async function main() {
  console.log('⚡ Month 7 Performance Benchmark\n');
  console.log('='.repeat(60));

  const benchmarks = [];

  // Initialize services
  const multiTenant = getMultiTenant();
  await multiTenant.initialize();
  const tenant = multiTenant.registerTenant('benchmark-tenant', {
    name: 'Benchmark Tenant'
  });

  const security = getEnterpriseSecurity();
  await security.initialize();

  const loadBalancer = getLoadBalancer();
  await loadBalancer.initialize();

  const monitoring = getCrossRegionMonitoring();
  await monitoring.initialize();

  // Benchmark 1: Tenant Operations
  console.log('\n📊 Benchmarking Tenant Operations...');
  const tenantBenchmark = await benchmarkOperation(
    'Tenant Operations',
    () => {
      multiTenant.getTenant('benchmark-tenant');
      multiTenant.recordActivity('benchmark-tenant', 'prediction');
    },
    1000
  );
  benchmarks.push(tenantBenchmark);

  // Benchmark 2: Security Operations
  console.log('📊 Benchmarking Security Operations...');
  const apiKey = security.generateApiKey('benchmark-tenant', ['read']);
  const securityBenchmark = await benchmarkOperation(
    'Security Validation',
    () => security.validateApiKey(apiKey.apiKey),
    1000
  );
  benchmarks.push(securityBenchmark);

  // Benchmark 3: Load Balancing
  console.log('📊 Benchmarking Load Balancing...');
  const loadBalancerBenchmark = await benchmarkOperation(
    'Load Balancing',
    () => loadBalancer.routeRequest({}, 'latency'),
    1000
  );
  benchmarks.push(loadBalancerBenchmark);

  // Benchmark 4: Monitoring
  console.log('📊 Benchmarking Monitoring...');
  const monitoringBenchmark = await benchmarkOperation(
    'Monitoring Collection',
    () => monitoring.collectAllRegionMetrics(),
    100
  );
  benchmarks.push(monitoringBenchmark);

  // Results
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Benchmark Results\n');

  benchmarks.forEach(b => {
    console.log(`${b.name}:`);
    console.log(`   Iterations: ${b.iterations}`);
    console.log(`   Avg Latency: ${b.avg}ms`);
    console.log(`   Min: ${b.min}ms, Max: ${b.max}ms, P95: ${b.p95}ms`);
    console.log(`   Throughput: ${b.opsPerSecond} ops/sec`);
    console.log('');
  });

  // Summary
  const totalAvg = benchmarks.reduce((sum, b) => sum + parseFloat(b.avg), 0) / benchmarks.length;
  console.log(`Overall Average Latency: ${totalAvg.toFixed(2)}ms`);
  console.log('\n✅ Benchmark complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

