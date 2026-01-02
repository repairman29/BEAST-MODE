/**
 * Improve Feedback Rate
 * Proactive system to increase feedback collection
 */

const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');
const { getDatabaseWriter } = require('../lib/mlops/databaseWriter');

async function main() {
  console.log('🚀 Improving Feedback Collection Rate\n');
  console.log('='.repeat(60));

  try {
    const collector = await getFeedbackCollector();
    const dbWriter = await getDatabaseWriter();

    // 1. Get predictions needing feedback
    console.log('\n1️⃣ Finding predictions needing feedback...');
    const needingFeedback = await collector.getPredictionsNeedingFeedback({
      limit: 100,
      orderBy: 'created_at',
      orderDirection: 'desc'
    });

    console.log(`   Found ${needingFeedback.length} predictions needing feedback`);

    // 2. Analyze by service
    console.log('\n2️⃣ Analyzing by service...');
    const byService = {};
    for (const pred of needingFeedback) {
      const service = pred.service_name || 'unknown';
      if (!byService[service]) {
        byService[service] = {
          total: 0,
          recent: 0, // Last 24 hours
          old: 0, // Older than 7 days
          withContext: 0
        };
      }
      byService[service].total++;
      
      const age = Date.now() - new Date(pred.created_at).getTime();
      if (age < 24 * 60 * 60 * 1000) {
        byService[service].recent++;
      } else if (age > 7 * 24 * 60 * 60 * 1000) {
        byService[service].old++;
      }
      
      if (pred.context && Object.keys(pred.context).length > 0) {
        byService[service].withContext++;
      }
    }

    console.log('\n   Service Breakdown:');
    for (const [service, stats] of Object.entries(byService)) {
      console.log(`   ${service}:`);
      console.log(`     Total: ${stats.total}`);
      console.log(`     Recent (24h): ${stats.recent}`);
      console.log(`     Old (>7d): ${stats.old}`);
      console.log(`     With Context: ${stats.withContext}`);
    }

    // 3. Check for predictionId in context
    console.log('\n3️⃣ Checking predictionId flow...');
    let withPredictionId = 0;
    let withoutPredictionId = 0;
    
    for (const pred of needingFeedback) {
      const context = pred.context || {};
      if (context.predictionId || context.prediction_id || pred.id) {
        withPredictionId++;
      } else {
        withoutPredictionId++;
      }
    }

    console.log(`   With predictionId: ${withPredictionId}`);
    console.log(`   Without predictionId: ${withoutPredictionId}`);

    // 4. Recommendations
    console.log('\n4️⃣ Recommendations:');
    const recommendations = [];

    if (withoutPredictionId > 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Missing predictionId in context',
        count: withoutPredictionId,
        fix: 'Ensure services pass predictionId in metadata when creating predictions'
      });
    }

    if (byService['code-roach'] && byService['code-roach'].total > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Code Roach predictions need feedback',
        count: byService['code-roach'].total,
        fix: 'Verify fixApplicationService is calling recordFixOutcome after fixes'
      });
    }

    if (byService['first-mate'] && byService['first-mate'].total > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'First Mate predictions need feedback',
        count: byService['first-mate'].total,
        fix: 'Add feedback collection after dice rolls and game actions'
      });
    }

    if (byService['ai-gm'] && byService['ai-gm'].total > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'AI GM predictions need feedback',
        count: byService['ai-gm'].total,
        fix: 'Verify quality feedback is being recorded'
      });
    }

    for (const rec of recommendations) {
      console.log(`\n   [${rec.priority}] ${rec.issue}`);
      console.log(`      Count: ${rec.count}`);
      console.log(`      Fix: ${rec.fix}`);
    }

    // 5. Generate actionable items
    console.log('\n5️⃣ Actionable Items:');
    console.log('   1. Verify services are passing predictionId');
    console.log('   2. Add feedback collection hooks in services');
    console.log('   3. Create feedback UI for users');
    console.log('   4. Set up automated feedback prompts');
    console.log('   5. Monitor feedback rate daily');

    // 6. Current stats
    console.log('\n6️⃣ Current Statistics:');
    const stats = await collector.getFeedbackStats();
    console.log(`   Total predictions: ${stats.totalPredictions}`);
    console.log(`   With actual values: ${stats.withActuals}`);
    console.log(`   Feedback rate: ${(stats.feedbackRate * 100).toFixed(2)}%`);
    console.log(`   Target rate: 5-10%`);

    if (stats.feedbackRate < 0.05) {
      console.log('\n   ⚠️  Feedback rate is below target!');
      console.log('   Focus on:');
      console.log('     - Ensuring predictionId is passed');
      console.log('     - Adding feedback collection hooks');
      console.log('     - Creating user-facing feedback UI');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Analysis complete!\n');

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

