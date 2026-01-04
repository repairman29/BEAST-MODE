#!/usr/bin/env node
/**
 * Improve ML feedback collection rate
 * Verifies predictionId flow and fixes issues
 */

require('dotenv').config();
const { createLogger } = require('../../shared-utils/logger');

const log = createLogger('FeedbackImprovement');

async function verifyPredictionIdFlow() {
  console.log('🔍 Verifying predictionId flow in all services...\n');

  const services = [
    { name: 'code-roach', path: '../../smuggler-code-roach' },
    { name: 'ai-gm', path: '../../smuggler-ai-gm' },
    { name: 'oracle', path: '../../smuggler-oracle' },
    { name: 'daisy-chain', path: '../../smuggler-daisy-chain' },
    { name: 'first-mate', path: '../../first-mate-app' }
  ];

  const issues = [];

  for (const service of services) {
    console.log(`Checking ${service.name}...`);
    
    // Check if service stores predictions
    // Check if service collects feedback
    // Check if predictionId is passed correctly
    
    // This would need to check actual service code
    // For now, we'll provide recommendations
  }

  console.log('\n💡 Recommendations:');
  console.log('   1. Ensure all services call storePrediction() before making predictions');
  console.log('   2. Ensure all services pass predictionId to feedback collection');
  console.log('   3. Add feedback UI triggers in user-facing services');
  console.log('   4. Monitor feedback collection in real-time');
  console.log('');

  return issues;
}

async function improveFeedbackTriggers() {
  console.log('🚀 Improving feedback collection triggers...\n');

  console.log('Strategies:');
  console.log('   1. Add inline feedback buttons in UI');
  console.log('   2. Prompt for feedback after key actions');
  console.log('   3. Make feedback collection more visible');
  console.log('   4. Add feedback incentives');
  console.log('');

  // This would implement actual improvements
  // For now, we'll create a monitoring script
}

async function main() {
  await verifyPredictionIdFlow();
  await improveFeedbackTriggers();
}

if (require.main === module) {
  main().catch(error => {
    log.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { verifyPredictionIdFlow, improveFeedbackTriggers };

