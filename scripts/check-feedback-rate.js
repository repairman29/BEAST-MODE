/**
 * Check Feedback Collection Rate
 * Analyzes why feedback rate is low and suggests improvements
 */

const { getFeedbackMonitor } = require('../lib/mlops/feedbackMonitor');

async function main() {
  console.log('📊 Feedback Collection Rate Analysis\n');
  console.log('='.repeat(60));

  try {
    const monitor = await getFeedbackMonitor();
    const status = await monitor.checkStatus();

    if (!status.available) {
      console.log('❌ Feedback monitor not available');
      return;
    }

    console.log('\n📈 Current Status:');
    console.log(`   Total predictions: ${status.stats.totalPredictions}`);
    console.log(`   With actual values: ${status.stats.withActuals}`);
    console.log(`   Feedback rate: ${(status.stats.feedbackRate * 100).toFixed(2)}%`);

    console.log('\n🔍 Analysis:');
    
    if (status.stats.feedbackRate < 0.01) {
      console.log('   ⚠️  CRITICAL: Feedback rate is extremely low (<1%)');
      console.log('   💡 Possible causes:');
      console.log('      1. predictionId not being passed correctly');
      console.log('      2. Feedback collection not being called');
      console.log('      3. Services not integrated with feedback system');
    } else if (status.stats.feedbackRate < 0.05) {
      console.log('   ⚠️  WARNING: Feedback rate is low (<5%)');
      console.log('   💡 Recommendations:');
      console.log('      1. Verify predictionId flow in services');
      console.log('      2. Check feedback collection integration');
      console.log('      3. Monitor service logs for feedback calls');
    } else {
      console.log('   ✅ Feedback rate is acceptable');
    }

    if (status.stats.withActuals < 50) {
      console.log(`\n⚠️  Need ${50 - status.stats.withActuals} more examples for training`);
      console.log('   💡 Recommendations:');
      console.log('      1. Wait for more user feedback');
      console.log('      2. Use GitHub code data (if available)');
      console.log('      3. Lower minExamples threshold (not recommended)');
    } else {
      console.log(`\n✅ Enough data for training (${status.stats.withActuals} examples)`);
    }

    console.log('\n📝 Next Steps:');
    console.log('   1. Verify predictionId is passed in all services');
    console.log('   2. Check feedback collection integration points');
    console.log('   3. Monitor service logs for feedback calls');
    console.log('   4. Consider automated feedback prompts');

  } catch (error) {
    console.error('❌ Error checking feedback rate:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

