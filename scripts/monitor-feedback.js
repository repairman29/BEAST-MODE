#!/usr/bin/env node
/**
 * ML Feedback Collection Monitor
 * Monitors feedback collection rates and alerts if low
 */

const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');
const { createLogger } = require('../lib/utils/logger');
const log = createLogger('FeedbackMonitor');

async function main() {
  log.info('🔍 Starting ML Feedback Collection Monitor...');
  
  try {
    const collector = await getFeedbackCollector();
    if (!collector) {
      log.error('❌ Failed to initialize feedback collector');
      process.exit(1);
    }

    // Monitor feedback collection
    const result = await collector.monitorFeedbackCollection(1.0); // Alert if < 1%
    
    if (!result) {
      log.error('❌ Failed to get feedback stats');
      process.exit(1);
    }

    // Get detailed stats by service
    log.info('\n📊 Feedback Statistics by Service:');
    const services = ['code-roach', 'ai-gm', 'oracle', 'first-mate'];
    
    for (const service of services) {
      const serviceStats = await collector.getFeedbackStats(service, 7);
      if (serviceStats) {
        log.info(`\n  ${service}:`);
        log.info(`    Total predictions: ${serviceStats.totalPredictions}`);
        log.info(`    With feedback: ${serviceStats.predictionsWithFeedback}`);
        log.info(`    Feedback rate: ${serviceStats.feedbackRate}%`);
      }
    }

    // Summary
    log.info('\n📈 Summary:');
    log.info(`  Overall feedback rate: ${result.feedbackRate}%`);
    log.info(`  Total predictions (last 7 days): ${result.totalPredictions}`);
    log.info(`  Predictions with feedback: ${result.predictionsWithFeedback}`);
    
    if (result.alert) {
      log.warn('\n⚠️  ALERT: Feedback rate is below threshold!');
      log.warn('   Consider:');
      log.warn('   1. Verify predictionId is being passed correctly');
      log.warn('   2. Check feedback collection integration points');
      log.warn('   3. Review service logs for feedback collection errors');
      process.exit(1);
    } else {
      log.info('\n✅ Feedback collection is healthy!');
      process.exit(0);
    }
  } catch (error) {
    log.error('❌ Error monitoring feedback:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
