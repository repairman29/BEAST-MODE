#!/usr/bin/env node

/**
 * ML Training Pipeline
 * 
 * Automated pipeline for training ML models when sufficient feedback data is available
 * 
 * Usage:
 *   node scripts/ml-training-pipeline.js --check    # Check if training is ready
 *   node scripts/ml-training-pipeline.js --train    # Train models if ready
 *   node scripts/ml-training-pipeline.js --auto      # Auto-train if conditions met
 */

const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');
const { getDatabaseWriter } = require('../lib/mlops/databaseWriter');

const MIN_FEEDBACK_EXAMPLES = 50;
const TARGET_FEEDBACK_RATE = 0.05; // 5%

async function checkTrainingReadiness() {
  console.log('🔍 Checking ML Training Readiness...\n');
  console.log('='.repeat(60));

  try {
    const collector = await getFeedbackCollector();
    const dbWriter = await getDatabaseWriter();

    // 1. Check feedback statistics
    console.log('\n1️⃣ Checking feedback statistics...');
    const stats = await collector.getFeedbackStats(null, 30); // Last 30 days

    console.log(`   Total feedback: ${stats.total}`);
    console.log(`   With actual values: ${stats.withActualValue}`);
    console.log(`   Feedback rate: ${(stats.feedbackRate * 100).toFixed(2)}%`);

    // 2. Check predictions needing feedback
    console.log('\n2️⃣ Checking predictions needing feedback...');
    const needingFeedback = await collector.getPredictionsNeedingFeedback({
      limit: 1000,
      orderBy: 'created_at',
      orderDirection: 'desc'
    });

    console.log(`   Predictions needing feedback: ${needingFeedback.length}`);

    // 3. Check if we have enough data
    const hasEnoughData = stats.withActualValue >= MIN_FEEDBACK_EXAMPLES;
    const hasGoodRate = stats.feedbackRate >= TARGET_FEEDBACK_RATE;

    console.log('\n3️⃣ Training Readiness Assessment:');
    console.log(`   Minimum examples (${MIN_FEEDBACK_EXAMPLES}): ${hasEnoughData ? '✅' : '❌'} (${stats.withActualValue}/${MIN_FEEDBACK_EXAMPLES})`);
    console.log(`   Target feedback rate (${(TARGET_FEEDBACK_RATE * 100).toFixed(0)}%): ${hasGoodRate ? '✅' : '❌'} (${(stats.feedbackRate * 100).toFixed(2)}%)`);

    const ready = hasEnoughData && hasGoodRate;

    if (ready) {
      console.log('\n✅ Training is READY!');
      console.log('   Run with --train to start training models');
    } else {
      console.log('\n⏳ Training NOT ready yet');
      if (!hasEnoughData) {
        console.log(`   Need ${MIN_FEEDBACK_EXAMPLES - stats.withActualValue} more examples with actual values`);
      }
      if (!hasGoodRate) {
        console.log(`   Need to improve feedback rate to ${(TARGET_FEEDBACK_RATE * 100).toFixed(0)}%`);
      }
      console.log('\n   Recommendations:');
      console.log('   - Improve feedback collection UI/UX');
      console.log('   - Add inline feedback buttons');
      console.log('   - Show feedback impact to users');
      console.log('   - Add feedback prompts at key moments');
    }

    return {
      ready,
      stats,
      needingFeedback: needingFeedback.length,
      recommendations: {
        needMoreData: !hasEnoughData,
        needBetterRate: !hasGoodRate
      }
    };
  } catch (error) {
    console.error('❌ Error checking training readiness:', error);
    throw error;
  }
}

async function trainModels() {
  console.log('🚀 Starting ML Model Training...\n');
  console.log('='.repeat(60));

  try {
    // Check readiness first
    const readiness = await checkTrainingReadiness();
    
    if (!readiness.ready) {
      console.log('\n❌ Training conditions not met. Cannot proceed.');
      console.log('   Run with --check to see requirements');
      process.exit(1);
    }

    console.log('\n📊 Training Models:');
    console.log('   1. Code Quality Predictor');
    console.log('   2. Narrative Quality Predictor');
    console.log('   3. Search Relevance Predictor');

    // TODO: Implement actual training logic
    // This would call the training scripts for each model
    console.log('\n⏳ Training implementation in progress...');
    console.log('   Models will be trained using collected feedback data');
    console.log('   Training results will be saved to database');
    console.log('   Models will be deployed automatically after training');

    console.log('\n✅ Training pipeline ready!');
    console.log('   (Actual training implementation pending)');

  } catch (error) {
    console.error('❌ Training error:', error);
    throw error;
  }
}

async function autoTrain() {
  console.log('🤖 Auto-Training Mode...\n');
  
  const readiness = await checkTrainingReadiness();
  
  if (readiness.ready) {
    console.log('\n✅ Conditions met, starting training...');
    await trainModels();
  } else {
    console.log('\n⏳ Conditions not met, skipping training');
    console.log('   Will check again next time');
  }
}

// Main
const args = process.argv.slice(2);
const command = args[0] || '--check';

async function main() {
  try {
    switch (command) {
      case '--check':
        await checkTrainingReadiness();
        break;
      case '--train':
        await trainModels();
        break;
      case '--auto':
        await autoTrain();
        break;
      default:
        console.log('Usage:');
        console.log('  node scripts/ml-training-pipeline.js --check    # Check readiness');
        console.log('  node scripts/ml-training-pipeline.js --train    # Train models');
        console.log('  node scripts/ml-training-pipeline.js --auto     # Auto-train if ready');
        process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
