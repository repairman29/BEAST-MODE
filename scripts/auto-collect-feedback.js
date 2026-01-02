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

      // Try to infer actual value from context and metadata
      let actualValue = null;
      const metadata = pred.metadata || {};

      // Strategy 1: Check metadata for actual value
      if (metadata.actualValue !== undefined && metadata.actualValue !== null) {
        actualValue = typeof metadata.actualValue === 'number' ? metadata.actualValue : parseFloat(metadata.actualValue);
      }

      // Strategy 2: Check validation scores
      if (actualValue === null && metadata.validation) {
        if (metadata.validation.score !== undefined) {
          const score = typeof metadata.validation.score === 'number' ? metadata.validation.score : parseFloat(metadata.validation.score);
          actualValue = score > 1 ? score / 100 : score;
        } else if (metadata.validation.passed === true) {
          actualValue = 1.0;
        } else if (metadata.validation.passed === false) {
          actualValue = 0.0;
        }
      }

      // Strategy 3: Service-specific inference
      if (actualValue === null) {
        // Code Roach: Check if fix was successful
        if (service === 'code-roach') {
          if (context.fixSuccess !== undefined) {
            actualValue = context.fixSuccess ? 1.0 : 0.0;
          } else if (context.fixApplied && !context.fixReverted) {
            actualValue = 1.0;
          } else if (metadata.fixSuccess !== undefined) {
            actualValue = metadata.fixSuccess ? 1.0 : 0.0;
          } else if (metadata.fixApplied && !metadata.fixReverted) {
            actualValue = 1.0;
          }
        }

        // AI GM: Check quality rating
        if (service === 'ai-gm') {
          if (context.qualityRating !== undefined) {
            actualValue = typeof context.qualityRating === 'number' ? context.qualityRating : parseFloat(context.qualityRating);
          } else if (context.userRating !== undefined) {
            const rating = typeof context.userRating === 'number' ? context.userRating : parseFloat(context.userRating);
            actualValue = rating > 1 ? rating / 5.0 : rating;
          } else if (metadata.qualityRating !== undefined) {
            actualValue = typeof metadata.qualityRating === 'number' ? metadata.qualityRating : parseFloat(metadata.qualityRating);
          } else if (metadata.characterScore !== undefined) {
            const score = typeof metadata.characterScore === 'number' ? metadata.characterScore : parseFloat(metadata.characterScore);
            actualValue = score > 1 ? score / 100 : score;
          }
        }

        // Oracle: Check usefulness
        if (service === 'oracle') {
          if (context.usefulnessRating !== undefined) {
            const rating = typeof context.usefulnessRating === 'number' ? context.usefulnessRating : parseFloat(context.usefulnessRating);
            actualValue = rating > 1 ? rating / 5.0 : rating;
          } else if (metadata.usefulnessRating !== undefined) {
            const rating = typeof metadata.usefulnessRating === 'number' ? metadata.usefulnessRating : parseFloat(metadata.usefulnessRating);
            actualValue = rating > 1 ? rating / 5.0 : rating;
          } else {
            const resultCount = context.resultCount || metadata.resultCount || 0;
            if (resultCount > 0) {
              actualValue = Math.min(0.8, 0.5 + (resultCount * 0.1));
            }
          }
        }

        // First Mate: Check dice roll success
        if (service === 'first-mate') {
          if (context.success !== undefined) {
            actualValue = context.success ? 1.0 : 0.0;
          } else if (context.outcome) {
            const outcome = context.outcome.toLowerCase();
            if (outcome === 'success' || outcome === 'critical-success') {
              actualValue = 1.0;
            } else if (outcome === 'failure' || outcome === 'critical-failure') {
              actualValue = 0.0;
            } else if (outcome === 'partial-success') {
              actualValue = 0.5;
            }
          } else if (metadata.outcome) {
            const outcome = metadata.outcome.toLowerCase();
            if (outcome === 'success' || outcome === 'critical-success') {
              actualValue = 1.0;
            } else if (outcome === 'failure' || outcome === 'critical-failure') {
              actualValue = 0.0;
            } else if (outcome === 'partial-success') {
              actualValue = 0.5;
            }
          } else if (context.roll !== undefined && context.statValue !== undefined) {
            const roll = typeof context.roll === 'number' ? context.roll : parseFloat(context.roll);
            const statValue = typeof context.statValue === 'number' ? context.statValue : parseFloat(context.statValue);
            const finalTotal = context.finalTotal || roll;
            actualValue = finalTotal <= statValue ? 1.0 : 0.0;
          }
        }

        // Daisy Chain: Check task completion
        if (service === 'daisy-chain') {
          if (context.taskCompleted !== undefined) {
            actualValue = context.taskCompleted ? 1.0 : 0.0;
          } else if (metadata.taskCompleted !== undefined) {
            actualValue = metadata.taskCompleted ? 1.0 : 0.0;
          } else if (context.status === 'completed' || metadata.status === 'completed') {
            actualValue = 1.0;
          } else if (context.status === 'failed' || metadata.status === 'failed') {
            actualValue = 0.0;
          }
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

