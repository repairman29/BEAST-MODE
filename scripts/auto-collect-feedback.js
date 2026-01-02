/**
 * Auto Collect Feedback
 * Automatically collect feedback from service outcomes
 */

const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');
const { getDatabaseWriter } = require('../lib/mlops/databaseWriter');

async function main() {
  console.log('🤖 Auto Collecting Feedback\n');
  console.log('='.repeat(60));

  try {
    const collector = await getFeedbackCollector();
    const dbWriter = await getDatabaseWriter();

    // Get predictions needing feedback
    const predictions = await collector.getPredictionsNeedingFeedback({
      limit: 50,
      daysOld: 1 // Only recent predictions
    });

    console.log(`\n📊 Found ${predictions.length} predictions needing feedback\n`);

    let collected = 0;
    let skipped = 0;

    for (const pred of predictions) {
      const service = pred.service_name;
      const context = pred.context || {};

      // Try to infer actual value from context
      let actualValue = null;

      // Code Roach: Check if fix was successful
      if (service === 'code-roach') {
        if (context.fixSuccess !== undefined) {
          actualValue = context.fixSuccess ? 1.0 : 0.0;
        } else if (context.fixApplied && !context.fixReverted) {
          actualValue = 1.0; // Assume success if applied and not reverted
        }
      }

      // AI GM: Check quality rating
      if (service === 'ai-gm') {
        if (context.qualityRating !== undefined) {
          actualValue = context.qualityRating; // Already 0-1 scale
        } else if (context.userRating !== undefined) {
          actualValue = context.userRating / 5.0; // Convert 1-5 to 0-1
        }
      }

      // Oracle: Check usefulness
      if (service === 'oracle') {
        if (context.usefulnessRating !== undefined) {
          actualValue = context.usefulnessRating / 5.0; // Convert 1-5 to 0-1
        } else if (context.resultCount > 0) {
          actualValue = 0.7; // Assume moderate usefulness if results found
        }
      }

      // First Mate: Check dice roll success
      if (service === 'first-mate') {
        if (context.success !== undefined) {
          actualValue = context.success ? 1.0 : 0.0;
        } else if (context.outcome === 'success' || context.outcome === 'critical-success') {
          actualValue = 1.0;
        } else if (context.outcome === 'failure' || context.outcome === 'critical-failure') {
          actualValue = 0.0;
        } else if (context.outcome === 'partial-success') {
          actualValue = 0.5;
        }
      }

      if (actualValue !== null) {
        // Record feedback
        const result = await collector.recordOutcome(
          pred.id,
          actualValue,
          {
            ...context,
            source: 'auto-collect',
            inferred: true,
            collectedAt: new Date().toISOString()
          }
        );

        if (result) {
          collected++;
          console.log(`✅ Collected feedback for ${service} prediction: ${pred.id.substring(0, 8)}... (${(actualValue * 100).toFixed(0)}%)`);
        } else {
          skipped++;
        }
      } else {
        skipped++;
        console.log(`⏭️  Skipped ${service} prediction: ${pred.id.substring(0, 8)}... (no inferrable outcome)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Results:`);
    console.log(`   Collected: ${collected}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${predictions.length}`);

    // Get updated stats
    const stats = await collector.getFeedbackStats();
    console.log(`\n📈 Updated Stats:`);
    console.log(`   Total predictions: ${stats.totalPredictions}`);
    console.log(`   With actual values: ${stats.withActuals}`);
    console.log(`   Feedback rate: ${(stats.feedbackRate * 100).toFixed(2)}%`);

    console.log('\n✅ Auto collection complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

