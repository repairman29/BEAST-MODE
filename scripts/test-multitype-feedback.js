/**
 * Test Multi-Type Feedback Collection
 * Test all feedback types: users, bots, AI systems, surveys, comments
 */

const { getMultiTypeFeedbackCollector } = require('../lib/mlops/multiTypeFeedbackCollector');
const { getDatabaseWriter } = require('../lib/mlops/databaseWriter');

async function main() {
  console.log('🧪 Testing Multi-Type Feedback Collection\n');
  console.log('='.repeat(60));

  try {
    const collector = getMultiTypeFeedbackCollector();
    const dbWriter = await getDatabaseWriter();

    // 1. Create test prediction
    console.log('\n1️⃣ Creating test prediction...');
    const testPrediction = await dbWriter.writePrediction({
      serviceName: 'test-service',
      predictionType: 'test-prediction',
      predictedValue: 0.85,
      confidence: 0.8,
      context: { test: true }
    });
    console.log(`✅ Created: ${testPrediction.id}`);

    await dbWriter.flushQueue();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Test user feedback (rating + comment)
    console.log('\n2️⃣ Testing user feedback...');
    const userResult = await collector.collectUserFeedback(testPrediction.id, {
      rating: 0.9,
      comment: 'This prediction was very helpful!',
      context: { source: 'test' }
    });
    console.log(`✅ User feedback: ${userResult.feedbackType}`);

    // 3. Test bot feedback
    console.log('\n3️⃣ Testing bot feedback...');
    const botResult = await collector.collectBotFeedback(testPrediction.id, {
      outcome: 'success',
      confidence: 0.95,
      reasoning: 'Fix was applied successfully and tests passed',
      metrics: { testPassed: true, buildSuccess: true }
    });
    console.log(`✅ Bot feedback: ${botResult.feedbackType}`);

    // 4. Test survey feedback
    console.log('\n4️⃣ Testing survey feedback...');
    const surveyResult = await collector.collectSurveyFeedback(testPrediction.id, {
      questions: ['How helpful was this?', 'Would you use it again?'],
      responses: {
        'How helpful was this?': 5,
        'Would you use it again?': 4
      },
      context: { source: 'test' }
    });
    console.log(`✅ Survey feedback: ${surveyResult.feedbackType} (rating: ${surveyResult.rating?.toFixed(2)})`);

    // 5. Test comment feedback
    console.log('\n5️⃣ Testing comment feedback...');
    const commentResult = await collector.collectCommentFeedback(testPrediction.id, {
      text: 'The prediction was accurate but could be faster',
      sentiment: 'positive',
      context: { source: 'test' }
    });
    console.log(`✅ Comment feedback: ${commentResult.feedbackType} (rating: ${commentResult.rating?.toFixed(2)})`);

    // 6. Test AI system feedback
    console.log('\n6️⃣ Testing AI system feedback...');
    const aiResult = await collector.collectAISystemFeedback(testPrediction.id, {
      systemName: 'code-roach',
      evaluation: 'good',
      score: 0.85,
      reasoning: 'Prediction matches actual outcome with high confidence',
      metrics: { accuracy: 0.85, latency: 120 }
    });
    console.log(`✅ AI system feedback: ${aiResult.feedbackType} (${aiResult.systemName})`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All feedback types tested!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

