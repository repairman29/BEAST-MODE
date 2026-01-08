#!/usr/bin/env node

/**
 * Cost Comparison Analysis
 * 
 * Compares costs between custom models and provider models
 * Generates detailed cost analysis reports
 * 
 * Usage:
 *   node scripts/cost-comparison-analysis.js --user-id=YOUR_USER_ID [--timeRange=7d]
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const timeRangeArg = args.find(arg => arg.startsWith('--timeRange='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;
const timeRange = timeRangeArg ? timeRangeArg.split('=')[1] : '7d';

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/cost-comparison-analysis.js --user-id=YOUR_USER_ID [--timeRange=7d]');
  process.exit(1);
}

/**
 * Make HTTP request
 */
async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `github_oauth_user_id=${userId}`,
    ...options.headers
  };
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers
    });
    
    const data = await response.json().catch(() => ({}));
    
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
      data: null
    };
  }
}

/**
 * Get monitoring data
 */
async function getMonitoringData() {
  console.log(`\n📊 Fetching monitoring data (${timeRange})...`);
  
  const response = await request(`/api/models/custom/monitoring?timeRange=${timeRange}`);
  
  if (!response.ok) {
    console.error(`   ❌ Failed: ${response.error || response.data?.error || 'Unknown error'}`);
    return null;
  }
  
  return response.data;
}

/**
 * Calculate cost projections
 */
function calculateProjections(metrics) {
  const customCostPer1K = 0.001; // $0.001 per 1K tokens
  const providerCostPer1K = 0.03; // $0.03 per 1K tokens (GPT-4)
  
  // Project to monthly/yearly
  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
  const multiplier = 30 / days; // Monthly multiplier
  const yearlyMultiplier = 365 / days; // Yearly multiplier
  
  const monthlyCustom = metrics.costs.customModelCost * multiplier;
  const monthlyProvider = metrics.costs.providerModelCost * multiplier;
  const monthlySavings = metrics.costs.savings * multiplier;
  
  const yearlyCustom = metrics.costs.customModelCost * yearlyMultiplier;
  const yearlyProvider = metrics.costs.providerModelCost * yearlyMultiplier;
  const yearlySavings = metrics.costs.savings * yearlyMultiplier;
  
  return {
    monthly: {
      custom: monthlyCustom,
      provider: monthlyProvider,
      savings: monthlySavings,
      savingsPercent: (monthlySavings / monthlyProvider) * 100
    },
    yearly: {
      custom: yearlyCustom,
      provider: yearlyProvider,
      savings: yearlySavings,
      savingsPercent: (yearlySavings / yearlyProvider) * 100
    }
  };
}

/**
 * Generate analysis report
 */
function generateReport(metrics, projections) {
  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     💰 Cost Comparison Analysis                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log(`\n📅 Time Range: ${timeRange}`);
  console.log(`📊 Total Requests: ${metrics.costs.totalRequests.toLocaleString()}`);
  
  // Current Period Costs
  console.log(`\n💰 Current Period Costs (${timeRange}):`);
  console.log(`   Custom Models:  $${metrics.costs.customModelCost.toFixed(4)}`);
  console.log(`   Provider Models: $${metrics.costs.providerModelCost.toFixed(4)}`);
  console.log(`   💵 Savings:      $${metrics.costs.savings.toFixed(4)} (${metrics.costs.savingsPercent.toFixed(1)}%)`);
  
  // Projections
  console.log(`\n📈 Monthly Projections:`);
  console.log(`   Custom Models:  $${projections.monthly.custom.toFixed(2)}`);
  console.log(`   Provider Models: $${projections.monthly.provider.toFixed(2)}`);
  console.log(`   💵 Savings:      $${projections.monthly.savings.toFixed(2)} (${projections.monthly.savingsPercent.toFixed(1)}%)`);
  
  console.log(`\n📈 Yearly Projections:`);
  console.log(`   Custom Models:  $${projections.yearly.custom.toFixed(2)}`);
  console.log(`   Provider Models: $${projections.yearly.provider.toFixed(2)}`);
  console.log(`   💵 Savings:      $${projections.yearly.savings.toFixed(2)} (${projections.yearly.savingsPercent.toFixed(1)}%)`);
  
  // Performance
  console.log(`\n⚡ Performance:`);
  console.log(`   Success Rate: ${metrics.performance.successRate.toFixed(1)}%`);
  console.log(`   Avg Latency: ${metrics.performance.averageLatency.toFixed(0)}ms`);
  console.log(`   P95 Latency: ${metrics.performance.p95Latency.toFixed(0)}ms`);
  
  // ROI
  const roi = (projections.yearly.savings / projections.yearly.custom) * 100;
  console.log(`\n📊 ROI Analysis:`);
  console.log(`   Yearly ROI: ${roi.toFixed(0)}%`);
  console.log(`   Break-even: Immediate (custom models are cheaper from day 1)`);
  
  // Recommendations
  console.log(`\n💡 Recommendations:`);
  if (metrics.costs.savingsPercent > 90) {
    console.log(`   ✅ Excellent! You're saving ${metrics.costs.savingsPercent.toFixed(1)}%`);
    console.log(`   💡 Consider scaling up custom model usage`);
  } else if (metrics.costs.savingsPercent > 70) {
    console.log(`   ✅ Good savings! ${metrics.costs.savingsPercent.toFixed(1)}%`);
    console.log(`   💡 Monitor fallback rate - optimize custom models`);
  } else {
    console.log(`   ⚠️  Savings: ${metrics.costs.savingsPercent.toFixed(1)}%`);
    console.log(`   💡 Review custom model performance - high fallback rate?`);
  }
  
  return {
    timeRange,
    current: metrics.costs,
    projections,
    performance: metrics.performance,
    roi,
    recommendations: metrics.costs.savingsPercent > 90 ? 'excellent' : 
                     metrics.costs.savingsPercent > 70 ? 'good' : 'needs_optimization'
  };
}

/**
 * Main function
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     💰 Cost Comparison Analysis                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n📍 Analyzing costs for: ${timeRange}`);
  console.log(`👤 User ID: ${userId}`);
  
  // Get monitoring data
  const monitoringData = await getMonitoringData();
  
  if (!monitoringData || !monitoringData.metrics) {
    console.error('\n❌ Failed to fetch monitoring data');
    process.exit(1);
  }
  
  const metrics = monitoringData.metrics;
  
  // Calculate projections
  const projections = calculateProjections(metrics);
  
  // Generate report
  const report = generateReport(metrics, projections);
  
  // Save report
  const outputDir = path.join(__dirname, '../test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, `cost-comparison-${Date.now()}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved to: ${outputFile}`);
  
  console.log('\n✅ Cost comparison analysis complete!');
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
