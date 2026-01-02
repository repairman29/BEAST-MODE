/**
 * Auto Feedback Prompts
 * Automatically prompt for feedback on high-value predictions
 */

const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');

async function main() {
  console.log('📢 Auto Feedback Prompts\n');
  console.log('='.repeat(60));

  try {
    const collector = await getFeedbackCollector();

    // Get predictions needing feedback (prioritize recent, high-confidence)
    const predictions = await collector.getPredictionsNeedingFeedback({
      limit: 50,
      orderBy: 'created_at',
      orderDirection: 'desc'
    });

    console.log(`\n📊 Found ${predictions.length} predictions needing feedback\n`);

    // Filter for high-value predictions
    const highValue = predictions.filter(pred => {
      // High confidence predictions
      if (pred.confidence && pred.confidence > 0.8) return true;
      
      // Recent predictions (last 24 hours)
      const age = Date.now() - new Date(pred.created_at).getTime();
      if (age < 24 * 60 * 60 * 1000) return true;
      
      // Predictions from important services
      const importantServices = ['code-roach', 'ai-gm', 'oracle'];
      if (importantServices.includes(pred.service_name)) return true;
      
      return false;
    });

    console.log(`🎯 High-value predictions: ${highValue.length}\n`);

    // Generate prompts
    const prompts = [];
    for (const pred of highValue.slice(0, 10)) {
      const service = pred.service_name || 'unknown';
      const context = pred.context || {};
      
      let prompt = '';
      
      if (service === 'code-roach') {
        prompt = `Did the fix for ${context.filePath || 'the code issue'} work correctly?`;
      } else if (service === 'ai-gm') {
        prompt = `Was the AI GM's narrative quality good?`;
      } else if (service === 'oracle') {
        prompt = `Was the Oracle's answer helpful?`;
      } else if (service === 'first-mate') {
        prompt = `Did the dice roll outcome match your expectations?`;
      } else {
        prompt = `How accurate was this ${service} prediction?`;
      }

      prompts.push({
        predictionId: pred.id,
        service: service,
        prompt: prompt,
        context: context,
        createdAt: pred.created_at
      });
    }

    console.log('📝 Generated Prompts:\n');
    for (const prompt of prompts) {
      console.log(`   [${prompt.service}] ${prompt.prompt}`);
      console.log(`      ID: ${prompt.predictionId}`);
      console.log(`      Created: ${new Date(prompt.createdAt).toLocaleString()}`);
      console.log('');
    }

    // Export for UI integration
    console.log('💡 Integration Ideas:');
    console.log('   1. Show prompts in dashboard');
    console.log('   2. Send email notifications');
    console.log('   3. Create API endpoint for prompts');
    console.log('   4. Add to user notification system');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Prompts generated!\n');

    return prompts;
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

