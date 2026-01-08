#!/usr/bin/env node

/**
 * Monitor Custom Models
 * 
 * Shows real-time metrics and health status for custom models
 * 
 * Usage:
 *   node scripts/monitor-custom-models.js
 *   node scripts/monitor-custom-models.js --watch (continuous monitoring)
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';

/**
 * Make HTTP request
 */
async function request(url) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  try {
    const response = await fetch(fullUrl);
    const data = await response.json().catch(() => ({}));
    
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

/**
 * Display metrics
 */
function displayMetrics(metrics, health) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Custom Models Monitoring');
  console.log('='.repeat(60));
  
  // Health Status
  console.log('\n🏥 Health Status:');
  const statusIcon = health.status === 'healthy' ? '✅' : 
                     health.status === 'degraded' ? '⚠️' : '❌';
  console.log(`   ${statusIcon} Status: ${health.status.toUpperCase()}`);
  console.log(`   📈 Success Rate: ${health.successRate}`);
  console.log(`   ⚡ Average Latency: ${health.averageLatency}`);
  console.log(`   📊 Total Requests: ${health.totalRequests}`);
  
  if (health.issues.length > 0) {
    console.log('\n   ⚠️  Issues:');
    health.issues.forEach(issue => {
      console.log(`      - ${issue}`);
    });
  }
  
  // Request Metrics
  console.log('\n📋 Request Metrics:');
  console.log(`   Total: ${metrics.requests.total}`);
  console.log(`   ✅ Success: ${metrics.requests.success}`);
  console.log(`   ❌ Failures: ${metrics.requests.failures}`);
  console.log(`   📈 Success Rate: ${metrics.requests.successRate}`);
  
  if (Object.keys(metrics.requests.byModel).length > 0) {
    console.log('\n   📊 By Model:');
    Object.entries(metrics.requests.byModel)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([model, count]) => {
        console.log(`      ${model}: ${count} requests`);
      });
  }
  
  // Performance Metrics
  console.log('\n⚡ Performance Metrics:');
  console.log(`   Average: ${metrics.performance.averageLatency}`);
  console.log(`   P50: ${metrics.performance.p50Latency}`);
  console.log(`   P95: ${metrics.performance.p95Latency}`);
  console.log(`   P99: ${metrics.performance.p99Latency}`);
  
  // Cost Metrics
  console.log('\n💰 Cost Metrics:');
  console.log(`   Custom Model Cost: ${metrics.costs.customModelCost}`);
  console.log(`   Provider Cost (if used GPT-4): ${metrics.costs.providerModelCost}`);
  console.log(`   💵 Savings: ${metrics.costs.savings} (${metrics.costs.savingsPercent})`);
  
  // Recent Errors
  if (metrics.errors.length > 0) {
    console.log('\n❌ Recent Errors:');
    metrics.errors.slice(-5).forEach((error, i) => {
      console.log(`   ${i + 1}. ${error.modelId}: ${error.error.substring(0, 60)}...`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch');
  
  console.log('🔍 Custom Models Monitoring');
  console.log(`📍 Monitoring: ${BASE_URL}`);
  
  if (watch) {
    console.log('👀 Watching (updates every 5 seconds)...\n');
    
    setInterval(async () => {
      try {
        const result = await request('/api/models/custom/monitoring');
        
        if (result.ok && result.data.metrics && result.data.health) {
          // Clear screen
          process.stdout.write('\x1B[2J\x1B[0f');
          console.log(`🕐 ${new Date().toLocaleTimeString()}`);
          displayMetrics(result.data.metrics, result.data.health);
        } else {
          console.log('⚠️  Could not fetch metrics');
        }
      } catch (error) {
        console.error('Error:', error.message);
      }
    }, 5000);
    
    // Initial display
    try {
      const result = await request('/api/models/custom/monitoring');
      if (result.ok && result.data.metrics && result.data.health) {
        displayMetrics(result.data.metrics, result.data.health);
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  } else {
    try {
      const result = await request('/api/models/custom/monitoring');
      
      if (!result.ok) {
        throw new Error(`Monitoring API failed: ${result.status}`);
      }
      
      if (!result.data.metrics || !result.data.health) {
        throw new Error('Invalid response format');
      }
      
      displayMetrics(result.data.metrics, result.data.health);
      
      console.log('\n💡 Tip: Use --watch for continuous monitoring');
      console.log('   node scripts/monitor-custom-models.js --watch\n');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
