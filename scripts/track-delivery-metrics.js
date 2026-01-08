#!/usr/bin/env node

/**
 * Track Delivery Metrics
 * 
 * Tracks time-to-code, feature completion, bug rates, and productivity metrics
 * for custom model code generation.
 * 
 * Usage:
 *   node scripts/track-delivery-metrics.js --user-id=YOUR_USER_ID [--feature=FEATURE_NAME]
 */

const BASE_URL = process.env.BEAST_MODE_URL || 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const featureArg = args.find(arg => arg.startsWith('--feature='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;
const featureName = featureArg ? featureArg.split('=')[1] : `feature-${Date.now()}`;

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/track-delivery-metrics.js --user-id=YOUR_USER_ID [--feature=FEATURE_NAME]');
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
 * Track feature generation
 */
async function trackFeatureGeneration(featureRequest, modelId = null) {
  console.log(`\n🚀 Generating Feature: ${featureName}`);
  console.log(`   Request: ${featureRequest.substring(0, 100)}...`);
  
  const metrics = {
    featureName,
    startTime: Date.now(),
    modelId: modelId || 'auto',
    stages: []
  };
  
  // Stage 1: Feature generation request
  const genStart = Date.now();
  console.log(`\n📝 Stage 1: Feature Generation...`);
  
  const genResponse = await request('/api/repos/quality/generate-feature', {
    method: 'POST',
    body: JSON.stringify({
      repo: 'BEAST-MODE-PRODUCT',
      featureRequest,
      useLLM: true,
      model: modelId
    })
  });
  
  const genLatency = Date.now() - genStart;
  metrics.stages.push({
    name: 'Generation',
    latency: genLatency,
    success: genResponse.ok
  });
  
  if (!genResponse.ok) {
    console.error(`   ❌ Failed: ${genResponse.error || genResponse.data?.error || 'Unknown error'}`);
    metrics.success = false;
    metrics.endTime = Date.now();
    return metrics;
  }
  
  const generatedFiles = genResponse.data.generatedFiles || [];
  console.log(`   ✅ Generated ${generatedFiles.length} file(s) in ${genLatency}ms`);
  
  // Stage 2: Quality analysis
  const qualityStart = Date.now();
  console.log(`\n🔍 Stage 2: Quality Analysis...`);
  
  // Analyze each generated file
  let totalQuality = 0;
  let analyzedFiles = 0;
  
  for (const file of generatedFiles) {
    if (file.fullCode) {
      // Basic quality heuristics
      const code = file.fullCode;
      const lines = code.split('\n');
      const hasComments = code.includes('//') || code.includes('/*');
      const hasErrorHandling = code.includes('try') || code.includes('catch');
      const hasTests = code.includes('test') || code.includes('spec');
      
      let quality = 0.5;
      if (hasComments) quality += 0.15;
      if (hasErrorHandling) quality += 0.2;
      if (hasTests) quality += 0.15;
      
      totalQuality += quality;
      analyzedFiles++;
    }
  }
  
  const avgQuality = analyzedFiles > 0 ? totalQuality / analyzedFiles : 0;
  const qualityLatency = Date.now() - qualityStart;
  
  metrics.stages.push({
    name: 'Quality Analysis',
    latency: qualityLatency,
    success: true,
    quality: avgQuality
  });
  
  console.log(`   ✅ Average Quality: ${(avgQuality * 100).toFixed(1)}% (${qualityLatency}ms)`);
  
  // Stage 3: Validation
  const validationStart = Date.now();
  console.log(`\n✅ Stage 3: Validation...`);
  
  // Check for common issues
  const issues = [];
  for (const file of generatedFiles) {
    if (file.fullCode) {
      if (!file.fullCode.includes('//') && !file.fullCode.includes('/*')) {
        issues.push(`${file.fileName}: Missing comments`);
      }
      if (!file.fullCode.includes('try') && !file.fullCode.includes('catch')) {
        issues.push(`${file.fileName}: No error handling`);
      }
    }
  }
  
  const validationLatency = Date.now() - validationStart;
  metrics.stages.push({
    name: 'Validation',
    latency: validationLatency,
    success: true,
    issues: issues.length
  });
  
  console.log(`   ✅ Found ${issues.length} issue(s) (${validationLatency}ms)`);
  
  // Calculate totals
  metrics.success = true;
  metrics.endTime = Date.now();
  metrics.totalTime = metrics.endTime - metrics.startTime;
  metrics.filesGenerated = generatedFiles.length;
  metrics.avgQuality = avgQuality;
  metrics.issues = issues.length;
  metrics.iterations = 1; // Could track if regenerations were needed
  
  return metrics;
}

/**
 * Load historical metrics
 */
function loadHistoricalMetrics() {
  const metricsFile = path.join(__dirname, '../test-output/delivery-metrics.json');
  
  if (fs.existsSync(metricsFile)) {
    try {
      return JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
    } catch (error) {
      return { features: [] };
    }
  }
  
  return { features: [] };
}

/**
 * Save metrics
 */
function saveMetrics(metrics) {
  const outputDir = path.join(__dirname, '../test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const historical = loadHistoricalMetrics();
  historical.features.push(metrics);
  
  // Calculate aggregates
  const successful = historical.features.filter(f => f.success);
  if (successful.length > 0) {
    historical.aggregates = {
      totalFeatures: historical.features.length,
      successfulFeatures: successful.length,
      successRate: successful.length / historical.features.length,
      avgTimeToCode: successful.reduce((sum, f) => sum + f.totalTime, 0) / successful.length,
      avgQuality: successful.reduce((sum, f) => sum + (f.avgQuality || 0), 0) / successful.length,
      avgFilesPerFeature: successful.reduce((sum, f) => sum + f.filesGenerated, 0) / successful.length,
      avgIssues: successful.reduce((sum, f) => sum + f.issues, 0) / successful.length
    };
  }
  
  const metricsFile = path.join(outputDir, 'delivery-metrics.json');
  fs.writeFileSync(metricsFile, JSON.stringify(historical, null, 2));
  
  return historical;
}

/**
 * Main function
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     📊 Delivery Metrics Tracking                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n📍 Testing against: ${BASE_URL}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`🎯 Feature: ${featureName}`);
  
  // Example feature request
  const featureRequest = `Create a utility function that validates email addresses. Include:
- TypeScript type annotations
- Comprehensive validation logic
- Error handling
- JSDoc comments
- Unit tests`;

  // Track feature generation
  const metrics = await trackFeatureGeneration(featureRequest);
  
  // Save metrics
  const historical = saveMetrics(metrics);
  
  // Display results
  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     📈 Delivery Metrics Results                             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log(`\n🎯 Feature: ${metrics.featureName}`);
  console.log(`   Status: ${metrics.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Total Time: ${metrics.totalTime}ms (${(metrics.totalTime / 1000).toFixed(2)}s)`);
  console.log(`   Files Generated: ${metrics.filesGenerated}`);
  console.log(`   Average Quality: ${metrics.avgQuality ? (metrics.avgQuality * 100).toFixed(1) + '%' : 'N/A'}`);
  console.log(`   Issues Found: ${metrics.issues}`);
  
  console.log(`\n📊 Stage Breakdown:`);
  for (const stage of metrics.stages) {
    console.log(`   ${stage.name}: ${stage.latency}ms ${stage.success ? '✅' : '❌'}`);
    if (stage.quality !== undefined) {
      console.log(`      Quality: ${(stage.quality * 100).toFixed(1)}%`);
    }
    if (stage.issues !== undefined) {
      console.log(`      Issues: ${stage.issues}`);
    }
  }
  
  // Display aggregates if available
  if (historical.aggregates) {
    console.log(`\n\n╔══════════════════════════════════════════════════════════════╗`);
    console.log('║     📊 Historical Aggregates                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    
    console.log(`\n📈 Overall Metrics:`);
    console.log(`   Total Features: ${historical.aggregates.totalFeatures}`);
    console.log(`   Success Rate: ${(historical.aggregates.successRate * 100).toFixed(1)}%`);
    console.log(`   Avg Time to Code: ${historical.aggregates.avgTimeToCode.toFixed(0)}ms (${(historical.aggregates.avgTimeToCode / 1000).toFixed(2)}s)`);
    console.log(`   Avg Quality: ${(historical.aggregates.avgQuality * 100).toFixed(1)}%`);
    console.log(`   Avg Files per Feature: ${historical.aggregates.avgFilesPerFeature.toFixed(1)}`);
    console.log(`   Avg Issues: ${historical.aggregates.avgIssues.toFixed(1)}`);
  }
  
  console.log(`\n💾 Metrics saved to: test-output/delivery-metrics.json`);
  console.log(`\n✅ Delivery metrics tracking complete!`);
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
