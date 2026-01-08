#!/usr/bin/env node

/**
 * Response Time Tracker
 * 
 * Tracks API response times, identifies slow endpoints,
 * and provides optimization recommendations
 * 
 * Usage:
 *   node scripts/response-time-tracker.js [--endpoint=/api/codebase/chat] [--duration=60]
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const endpointArg = args.find(arg => arg.startsWith('--endpoint='));
const durationArg = args.find(arg => arg.startsWith('--duration='));
const userId = process.env.TEST_USER_ID || '35379b45-d966-45d7-8644-1233338c542d';

const endpoint = endpointArg ? endpointArg.split('=')[1] : '/api/health';
const duration = durationArg ? parseInt(durationArg.split('=')[1]) : 60; // seconds

/**
 * Make HTTP request and measure time
 */
async function measureRequest(url, options = {}) {
  const startTime = Date.now();
  const startHrTime = process.hrtime();
  
  try {
    const response = await fetch(url, options);
    const endTime = Date.now();
    const endHrTime = process.hrtime(startHrTime);
    
    const latency = endTime - startTime;
    const hrtimeLatency = endHrTime[0] * 1000 + endHrTime[1] / 1000000; // Convert to ms
    
    const data = await response.json().catch(() => ({}));
    
    return {
      success: response.ok,
      status: response.status,
      latency,
      hrtimeLatency,
      dataSize: JSON.stringify(data).length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      success: false,
      error: error.message,
      latency: endTime - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Track response times
 */
async function trackResponseTimes() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     ⚡ Response Time Tracker                                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n📍 Endpoint: ${endpoint}`);
  console.log(`⏱️  Duration: ${duration} seconds`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  const results = [];
  const startTime = Date.now();
  const endTime = startTime + (duration * 1000);
  
  console.log(`\n📊 Tracking response times...`);
  console.log(`   Starting at ${new Date().toLocaleTimeString()}`);
  console.log(`   Will run until ${new Date(endTime).toLocaleTimeString()}\n`);
  
  let requestCount = 0;
  
  while (Date.now() < endTime) {
    requestCount++;
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `github_oauth_user_id=${userId}`
      }
    };
    
    // For POST endpoints, add body
    if (endpoint.includes('/chat') || endpoint.includes('/generate')) {
      options.method = 'POST';
      options.body = JSON.stringify({
        message: 'Test request for performance tracking',
        repo: 'test-repo'
      });
    }
    
    const result = await measureRequest(fullUrl, options);
    results.push(result);
    
    if (result.success) {
      process.stdout.write(`\r   Request ${requestCount}: ${result.latency}ms ${result.status === 200 ? '✅' : '⚠️'}`);
    } else {
      process.stdout.write(`\r   Request ${requestCount}: ${result.latency}ms ❌ ${result.error || 'Failed'}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n\n✅ Tracking complete! ${requestCount} requests made\n`);
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length === 0) {
    console.log('❌ No successful requests - cannot calculate metrics');
    return;
  }
  
  const latencies = successful.map(r => r.latency).sort((a, b) => a - b);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  
  const successRate = (successful.length / results.length) * 100;
  const requestsPerSecond = successful.length / duration;
  
  // Generate report
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     📊 Response Time Analysis                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log(`\n📈 Summary:`);
  console.log(`   Total Requests: ${results.length}`);
  console.log(`   Successful: ${successful.length} (${successRate.toFixed(1)}%)`);
  console.log(`   Failed: ${failed.length}`);
  console.log(`   Requests/Second: ${requestsPerSecond.toFixed(2)}`);
  
  console.log(`\n⚡ Latency Metrics:`);
  console.log(`   Average: ${avgLatency.toFixed(0)}ms`);
  console.log(`   P50 (Median): ${p50}ms`);
  console.log(`   P95: ${p95}ms`);
  console.log(`   P99: ${p99}ms`);
  console.log(`   Min: ${minLatency}ms`);
  console.log(`   Max: ${maxLatency}ms`);
  
  // Recommendations
  console.log(`\n💡 Recommendations:`);
  if (avgLatency > 2000) {
    console.log(`   ⚠️  High average latency (${avgLatency.toFixed(0)}ms)`);
    console.log(`   💡 Consider: Caching, database optimization, or async processing`);
  } else if (avgLatency > 1000) {
    console.log(`   ⚠️  Moderate latency (${avgLatency.toFixed(0)}ms)`);
    console.log(`   💡 Consider: Response caching or query optimization`);
  } else {
    console.log(`   ✅ Good latency (${avgLatency.toFixed(0)}ms)`);
  }
  
  if (p95 > 3000) {
    console.log(`   ⚠️  High P95 latency (${p95}ms)`);
    console.log(`   💡 Some requests are very slow - investigate outliers`);
  }
  
  if (successRate < 95) {
    console.log(`   ⚠️  Low success rate (${successRate.toFixed(1)}%)`);
    console.log(`   💡 Investigate failures - check error logs`);
  }
  
  // Save results
  const outputDir = path.join(__dirname, '../test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, `response-times-${Date.now()}.json`);
  fs.writeFileSync(outputFile, JSON.stringify({
    endpoint,
    duration,
    summary: {
      totalRequests: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate,
      requestsPerSecond
    },
    latency: {
      average: avgLatency,
      p50,
      p95,
      p99,
      min: minLatency,
      max: maxLatency
    },
    results
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${outputFile}`);
  console.log(`\n✅ Response time tracking complete!`);
}

// Run
trackResponseTimes().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
