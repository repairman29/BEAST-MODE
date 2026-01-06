#!/usr/bin/env node

/**
 * Test Quality API Endpoints
 * Tests both /api/repos/quality and /api/repos/benchmark
 */

const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_REPOS = [
  'facebook/react',
  'vercel/next.js',
  'microsoft/TypeScript',
];

async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testQualityAPI() {
  console.log('🧪 Testing Quality API\n');
  console.log('='.repeat(60));

  for (const repo of TEST_REPOS) {
    console.log(`\n📦 Testing: ${repo}`);
    try {
      const response = await makeRequest('/api/repos/quality', 'POST', {
        repo: repo,
        platform: 'beast-mode',
      });

      if (response.status === 200) {
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Quality: ${(response.body.predictedQuality * 100).toFixed(1)}%`);
        if (response.body.confidence) {
          console.log(`   🎯 Confidence: ${(response.body.confidence * 100).toFixed(1)}%`);
        }
        if (response.body.source) {
          console.log(`   🔍 Source: ${response.body.source}`);
        }
        if (response.body.modelVersion) {
          console.log(`   🤖 Model: ${response.body.modelVersion}`);
        }
      } else {
        console.log(`   ❌ Status: ${response.status}`);
        console.log(`   Error: ${JSON.stringify(response.body)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        console.log(`   💡 Tip: Make sure dev server is running: cd website && npm run dev`);
      }
    }
  }
}

async function testBenchmarkAPI() {
  console.log('\n\n🧪 Testing Benchmark API\n');
  console.log('='.repeat(60));

  const testRepo = TEST_REPOS[0];
  console.log(`\n📦 Testing: ${testRepo}`);
  try {
    const response = await makeRequest('/api/repos/benchmark', 'POST', {
      repo: testRepo,
    });

    if (response.status === 200) {
      console.log(`   ✅ Status: ${response.status}`);
      if (response.body.targetQuality !== undefined) {
        console.log(`   📊 Quality: ${(response.body.targetQuality * 100).toFixed(1)}%`);
      }
      if (response.body.percentile !== undefined) {
        console.log(`   📈 Percentile: ${parseFloat(response.body.percentile).toFixed(1)}%`);
      }
      if (response.body.comparison) {
        console.log(`   🔝 Top 5: ${response.body.comparison.top5?.length || 0} repos`);
        console.log(`   🔻 Bottom 5: ${response.body.comparison.bottom5?.length || 0} repos`);
      }
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   Error: ${JSON.stringify(response.body)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`   💡 Tip: Make sure dev server is running: cd website && npm run dev`);
    }
  }
}

async function testDirectModel() {
  console.log('\n\n🧪 Testing Direct Model Integration\n');
  console.log('='.repeat(60));

  try {
    const mlModule = require('../lib/mlops/mlModelIntegration');
    // getMLModelIntegration is async - await it!
    const ml = await mlModule.getMLModelIntegration();

    // Wait a bit for full initialization
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!ml || typeof ml.isMLModelAvailable !== 'function' || !ml.isMLModelAvailable()) {
      console.log('   ❌ Model not available');
      console.log(`   Debug: ml exists=${!!ml}, isMLModelAvailable=${typeof ml?.isMLModelAvailable}`);
      if (ml) {
        console.log(`   Initialized: ${ml.initialized}`);
        console.log(`   Model Path: ${ml.modelPath || 'none'}`);
      }
      return;
    }

    console.log('   ✅ Model loaded');

    const info = ml.getModelInfo();
    if (info) {
      console.log(`   🤖 Algorithm: ${info.algorithm || 'Unknown'}`);
      if (info.metrics) {
        console.log(`   📊 R²: ${info.metrics.r2?.toFixed(3) || 'N/A'}`);
        console.log(`   📊 MAE: ${info.metrics.mae?.toFixed(3) || 'N/A'}`);
        console.log(`   📊 RMSE: ${info.metrics.rmse?.toFixed(3) || 'N/A'}`);
      }
      console.log(`   📦 Dataset: ${info.datasetSize || 'N/A'} repos`);
    } else {
      console.log('   ⚠️  Model info not available');
    }
    
    // Try to get info from qualityPredictor directly
    if (ml.qualityPredictor) {
      console.log(`   🤖 Algorithm: ${ml.qualityPredictor.algorithm || 'Random Forest'}`);
      if (ml.qualityPredictor.metrics) {
        console.log(`   📊 R²: ${ml.qualityPredictor.metrics.r2?.toFixed(3) || 'N/A'}`);
        console.log(`   📊 MAE: ${ml.qualityPredictor.metrics.mae?.toFixed(3) || 'N/A'}`);
        console.log(`   📊 RMSE: ${ml.qualityPredictor.metrics.rmse?.toFixed(3) || 'N/A'}`);
      }
      if (ml.qualityPredictor.featureNames) {
        console.log(`   🔧 Features: ${ml.qualityPredictor.featureNames.length} features`);
      }
      if (ml.qualityPredictor.model?.trees) {
        console.log(`   🌳 Trees: ${ml.qualityPredictor.model.trees.length}`);
      }
    }

    // Test prediction
    const testFeatures = {
      stars: 100000,
      forks: 10000,
      openIssues: 100,
      hasTests: 1,
      hasCI: 1,
      hasLicense: 1,
      hasReadme: 1,
      fileCount: 1000,
      codeFileCount: 800,
      repoAgeDays: 2000,
      isActive: 1,
    };

    const prediction = ml.predictQualitySync(testFeatures);
    console.log(`\n   🧪 Test Prediction:`);
    console.log(`      Features: stars=${testFeatures.stars}, forks=${testFeatures.forks}`);
    console.log(`      Predicted Quality: ${(prediction.predictedQuality * 100).toFixed(1)}%`);
    console.log(`      Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    console.log(`      Source: ${prediction.source}`);

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.stack) {
      console.log(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
  }
}

async function main() {
  console.log('🚀 Quality API Test Suite\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  // Test 1: Direct model integration
  await testDirectModel();

  // Test 2: Quality API (requires dev server)
  await testQualityAPI();

  // Test 3: Benchmark API (requires dev server)
  await testBenchmarkAPI();

  console.log('\n' + '='.repeat(60));
  console.log('✅ Testing Complete!\n');
  console.log('💡 Next Steps:');
  console.log('   1. If APIs failed: Start dev server: cd website && npm run dev');
  console.log('   2. If model failed: Check model file exists');
  console.log('   3. Review test results above\n');
}

if (require.main === module) {
  main().catch(console.error);
}

