/**
 * Test Error Analysis System
 * 
 * Tests the error analysis and learning capabilities
 */

const { getErrorAnalysis } = require('../lib/mlops/errorAnalysis');

async function testErrorAnalysis() {
  console.log('🧪 Testing Error Analysis System...\n');

  try {
    const analysis = getErrorAnalysis();
    await analysis.initialize();

    // Test 1: Analyze errors
    console.log('📊 Analyzing errors from database...');
    const results = await analysis.analyzeErrors({
      days: 7,
      limit: 100
    });

    console.log(`\n✅ Found ${results.totalErrors} errors`);
    console.log(`📈 Identified ${results.patterns.length} error patterns`);
    console.log(`💡 Generated ${results.insights.length} insights`);
    console.log(`🎯 Created ${results.recommendations.length} recommendations\n`);

    // Show top errors
    if (results.topErrors.length > 0) {
      console.log('🔴 Top Errors:');
      results.topErrors.slice(0, 5).forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.message.substring(0, 80)}... (${error.count}x)`);
      });
      console.log('');
    }

    // Show insights
    if (results.insights.length > 0) {
      console.log('💡 Insights:');
      results.insights.forEach((insight, i) => {
        console.log(`  ${i + 1}. [${insight.severity.toUpperCase()}] ${insight.message}`);
      });
      console.log('');
    }

    // Show recommendations
    if (results.recommendations.length > 0) {
      console.log('🎯 Recommendations:');
      results.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
        console.log(`     ${rec.details}`);
      });
      console.log('');
    }

    // Test 2: Generate improved prompt
    console.log('🔧 Testing prompt improvement...');
    const originalPrompt = 'Generate a React component';
    const improvedPrompt = await analysis.generateImprovedPrompt(originalPrompt, {
      test: true
    });

    if (improvedPrompt !== originalPrompt) {
      console.log('✅ Prompt was improved based on error patterns!');
      console.log(`\nOriginal: ${originalPrompt}`);
      console.log(`Improved: ${improvedPrompt.substring(0, 200)}...\n`);
    } else {
      console.log('ℹ️  No improvements needed (no relevant error patterns)\n');
    }

    console.log('✅ Error analysis system is working!');
  } catch (error) {
    console.error('❌ Error testing analysis system:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testErrorAnalysis().catch(console.error);
}

module.exports = { testErrorAnalysis };
