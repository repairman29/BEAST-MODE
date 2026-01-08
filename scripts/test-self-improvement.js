#!/usr/bin/env node
/**
 * Test Self-Improvement Service
 * 
 * Tests the self-improvement service to ensure it works correctly
 */

const { getSelfImprovementService } = require('../lib/mlops/selfImprovement');

async function testSelfImprovement() {
  console.log('🧪 Testing Self-Improvement Service...\n');

  try {
    const service = getSelfImprovementService();
    await service.initialize();

    console.log('✅ Service initialized\n');

    // Test 1: Scan for opportunities
    console.log('1️⃣ Testing scan for opportunities...');
    const opportunities = await service.scanForOpportunities({
      repo: 'BEAST-MODE',
      maxFiles: 5, // Limit for testing
      filePatterns: ['lib/mlops/*.js']
    });

    console.log(`   Found ${opportunities.length} opportunities\n`);

    if (opportunities.length > 0) {
      // Test 2: Generate improvement (dry run)
      console.log('2️⃣ Testing improvement generation (dry run)...');
      const opportunity = opportunities[0];
      
      const improvement = await service.generateImprovement(opportunity, {
        model: 'custom:beast-mode-code-model',
        userId: 'test-user',
        useLLM: false // Skip LLM for testing
      });

      if (improvement.success) {
        console.log(`   ✅ Generated improvement with quality gain: ${(improvement.qualityGain * 100).toFixed(1)}%\n`);
      } else {
        console.log(`   ⚠️  Improvement generation failed: ${improvement.error}\n`);
      }
    }

    // Test 3: Get metrics
    console.log('3️⃣ Testing metrics...');
    const metrics = service.getMetrics();
    console.log('   Metrics:', JSON.stringify(metrics, null, 2));
    console.log('');

    console.log('✅ All tests completed!\n');
    console.log('📊 Summary:');
    console.log(`   - Scans: ${metrics.scans}`);
    console.log(`   - Opportunities: ${metrics.opportunities}`);
    console.log(`   - Improvements: ${metrics.improvements}`);
    console.log(`   - Avg Quality Gain: ${(metrics.avgQualityGain * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testSelfImprovement().catch(console.error);
