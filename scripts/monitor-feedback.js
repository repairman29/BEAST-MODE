/**
 * Monitor Feedback Collection
 * Shows current feedback collection status and recommendations
 */

const { getFeedbackMonitor } = require('../lib/mlops/feedbackMonitor');

async function main() {
  console.log('📊 Feedback Collection Monitor\n');
  console.log('='.repeat(60));

  try {
    const monitor = await getFeedbackMonitor();
    const report = await monitor.getReport();

    if (report.status === 'unavailable') {
      console.log(`\n⚠️  ${report.message}\n`);
      return;
    }

    console.log('\n📈 Statistics:');
    console.log(`   Total predictions: ${report.statistics.totalPredictions}`);
    console.log(`   With actual values: ${report.statistics.withActuals}`);
    console.log(`   Without actual values: ${report.statistics.withoutActuals}`);
    console.log(`   Total feedback: ${report.statistics.totalFeedback}`);
    console.log(`   Feedback rate: ${report.statistics.feedbackRate}`);

    console.log('\n🏥 Health Status:');
    if (report.health.needsAttention) {
      console.log(`   ⚠️  Needs Attention (below ${(report.health.threshold * 100)}% threshold)`);
    } else {
      console.log(`   ✅ Healthy (above ${(report.health.threshold * 100)}% threshold)`);
    }

    console.log('\n💡 Recommendation:');
    console.log(`   ${report.recommendation}`);

    console.log('\n🎯 Next Steps:');
    report.nextSteps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Report generated at ${report.timestamp}\n`);

  } catch (error) {
    console.error('\n❌ Monitor failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

