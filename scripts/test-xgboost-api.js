#!/usr/bin/env node

/**
 * Test XGBoost API Integration
 * 
 * Tests the /api/repos/quality endpoint with XGBoost model
 */

const { MLModelIntegration } = require('../lib/mlops/mlModelIntegration');

async function testXGBoostAPI() {
  console.log('🧪 Testing XGBoost API Integration\n');
  console.log('='.repeat(60));

  try {
    // Initialize ML integration
    const ml = new MLModelIntegration();
    await ml.initialize();

    if (!ml.isMLModelAvailable()) {
      console.log('❌ Model not available');
      return;
    }

    const info = ml.getModelInfo();
    console.log('✅ Model Loaded:');
    console.log(`   Algorithm: ${info.algorithm}`);
    console.log(`   R²: ${info.metrics?.r2?.toFixed(3) || 'N/A'}`);
    console.log(`   MAE: ${info.metrics?.mae?.toFixed(3) || 'N/A'}`);
    console.log(`   RMSE: ${info.metrics?.rmse?.toFixed(3) || 'N/A'}\n`);

    // Test cases
    const testCases = [
      {
        name: 'High Quality Repo',
        features: {
          stars: 100000,
          forks: 10000,
          openIssues: 100,
          hasTests: 1,
          hasCI: 1,
          hasReadme: 1,
          hasLicense: 1,
          isActive: 1,
          fileCount: 1000,
          codeFileCount: 800
        }
      },
      {
        name: 'Medium Quality Repo',
        features: {
          stars: 1000,
          forks: 100,
          openIssues: 50,
          hasTests: 1,
          hasCI: 0,
          hasReadme: 1,
          hasLicense: 1,
          isActive: 1,
          fileCount: 200,
          codeFileCount: 150
        }
      },
      {
        name: 'Low Quality Repo',
        features: {
          stars: 10,
          forks: 2,
          openIssues: 5,
          hasTests: 0,
          hasCI: 0,
          hasReadme: 0,
          hasLicense: 0,
          isActive: 0,
          fileCount: 10,
          codeFileCount: 5
        }
      }
    ];

    console.log('🧪 Testing Predictions:\n');

    for (const testCase of testCases) {
      console.log(`📦 ${testCase.name}:`);
      console.log(`   Features: stars=${testCase.features.stars}, hasTests=${testCase.features.hasTests}, hasCI=${testCase.features.hasCI}`);
      
      try {
        const result = await ml.predictQuality({ features: testCase.features });
        console.log(`   ✅ Quality: ${(result.predictedQuality * 100).toFixed(1)}%`);
        console.log(`   ✅ Source: ${result.source}`);
        console.log(`   ✅ Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('✅ Testing Complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  testXGBoostAPI().catch(console.error);
}

module.exports = { testXGBoostAPI };

