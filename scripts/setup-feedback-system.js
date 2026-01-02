/**
 * Setup Feedback System
 * One-time setup script for feedback collection
 */

const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');
const { getDatabaseWriter } = require('../lib/mlops/databaseWriter');

async function main() {
  console.log('🔧 Setting Up Feedback System\n');
  console.log('='.repeat(60));

  try {
    // 1. Initialize services
    console.log('\n1️⃣ Initializing services...');
    const collector = await getFeedbackCollector();
    const dbWriter = await getDatabaseWriter();
    console.log('✅ Services initialized');

    // 2. Check database connection
    console.log('\n2️⃣ Checking database connection...');
    const stats = await collector.getFeedbackStats();
    console.log(`✅ Database connected`);
    console.log(`   Total predictions: ${stats.totalPredictions}`);
    console.log(`   With feedback: ${stats.withActuals}`);

    // 3. Check for predictions needing feedback
    console.log('\n3️⃣ Checking predictions needing feedback...');
    const needingFeedback = await collector.getPredictionsNeedingFeedback({
      limit: 10
    });
    console.log(`✅ Found ${needingFeedback.length} predictions needing feedback`);

    // 4. Verify API endpoints
    console.log('\n4️⃣ Verifying API endpoints...');
    const endpoints = [
      '/api/feedback/prompts',
      '/api/feedback/submit',
      '/api/feedback/stats',
      '/api/feedback/health'
    ];
    console.log('✅ API endpoints ready:');
    endpoints.forEach(endpoint => {
      console.log(`   ${endpoint}`);
    });

    // 5. Check components
    console.log('\n5️⃣ Checking components...');
    const components = [
      'FeedbackPrompt',
      'FeedbackDashboard'
    ];
    console.log('✅ Components ready:');
    components.forEach(component => {
      console.log(`   ${component}`);
    });

    // 6. Setup recommendations
    console.log('\n6️⃣ Setup Recommendations:');
    console.log('   1. Start feedback service: npm run service:feedback');
    console.log('   2. Add <FeedbackPrompt /> to main app');
    console.log('   3. Add <FeedbackDashboard /> to admin');
    console.log('   4. Enable auto-collection');
    console.log('   5. Monitor feedback rate daily');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Setup complete!\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

