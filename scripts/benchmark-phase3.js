/**
 * Performance Benchmark for Phase 3
 * Benchmarks multi-region, circuit breaker, and disaster recovery operations
 */

const { getUnifiedMultiRegionService } = require('../lib/multi-region/unifiedMultiRegionService');
const { getCircuitBreaker } = require('../lib/resilience/circuitBreaker');
const { getDisasterRecovery } = require('../lib/resilience/disasterRecovery');

async function benchmark(name, operation, iterations = 100) {
  const times = [];
  let errors = 0;

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await operation();
      times.push(Date.now() - start);
    } catch (error) {
      errors++;
      times.push(Date.now() - start);
    }
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

  return {
    name,
    iterations,
    avg,
    min,
    max,
    p95,
    errors,
    successRate: ((iterations - errors) / iterations) * 100
  };
}

async function main() {
  console.log('📊 Phase 3 Performance Benchmarking\n');

  // Initialize services
  const multiRegion = getUnifiedMultiRegionService();
  await multiRegion.initialize();

  const circuitBreaker = getCircuitBreaker();
  await circuitBreaker.initialize();

  const disasterRecovery = getDisasterRecovery();
  await disasterRecovery.initialize();

  const results = [];

  // Benchmark 1: Multi-Region Routing
  console.log('1️⃣  Benchmarking Multi-Region Routing...');
  const routingBench = await benchmark(
    'Multi-Region Routing',
    async () => {
      return await multiRegion.routeRequest({
        endpoint: '/api/ml/predict',
        method: 'POST'
      }, 'latency');
    },
    100
  );
  results.push(routingBench);
  console.log(`   ✅ Avg: ${routingBench.avg.toFixed(2)}ms, P95: ${routingBench.p95}ms, Success: ${routingBench.successRate.toFixed(1)}%\n`);

  // Benchmark 2: Circuit Breaker Execution
  console.log('2️⃣  Benchmarking Circuit Breaker Execution...');
  const breakerBench = await benchmark(
    'Circuit Breaker Execution',
    async () => {
      return await circuitBreaker.execute('benchmark-circuit', async () => {
        return { success: true };
      });
    },
    100
  );
  results.push(breakerBench);
  console.log(`   ✅ Avg: ${breakerBench.avg.toFixed(2)}ms, P95: ${breakerBench.p95}ms, Success: ${breakerBench.successRate.toFixed(1)}%\n`);

  // Benchmark 3: Backup Creation
  console.log('3️⃣  Benchmarking Backup Creation...');
  const backupBench = await benchmark(
    'Backup Creation',
    async () => {
      return await disasterRecovery.createBackup('model', {});
    },
    50
  );
  results.push(backupBench);
  console.log(`   ✅ Avg: ${backupBench.avg.toFixed(2)}ms, P95: ${backupBench.p95}ms, Success: ${backupBench.successRate.toFixed(1)}%\n`);

  // Benchmark 4: Integrated Operation
  console.log('4️⃣  Benchmarking Integrated Operation...');
  const integratedBench = await benchmark(
    'Integrated Operation (Routing + Circuit Breaker)',
    async () => {
      return await circuitBreaker.execute('integrated-bench', async () => {
        return await multiRegion.routeRequest({
          endpoint: '/api/ml/predict',
          method: 'POST'
        }, 'latency');
      });
    },
    100
  );
  results.push(integratedBench);
  console.log(`   ✅ Avg: ${integratedBench.avg.toFixed(2)}ms, P95: ${integratedBench.p95}ms, Success: ${integratedBench.successRate.toFixed(1)}%\n`);

  // Summary
  console.log('📊 Benchmark Summary:\n');
  console.log('Operation'.padEnd(40) + 'Avg (ms)'.padEnd(12) + 'P95 (ms)'.padEnd(12) + 'Success %');
  console.log('-'.repeat(80));
  results.forEach(r => {
    console.log(
      r.name.padEnd(40) +
      r.avg.toFixed(2).padEnd(12) +
      r.p95.toString().padEnd(12) +
      r.successRate.toFixed(1) + '%'
    );
  });

  console.log('\n✅ Benchmarking complete!');

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

